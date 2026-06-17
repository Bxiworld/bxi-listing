import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  getVoucherJourneyLabel,
  getVoucherJourneyType,
  getVoucherJourneyTypeFromStorage,
} from '../../utils/voucherType';
import {
  VOUCHER_DELIVERY_TYPE,
  deliveryToRedemptionType,
  normalizeVoucherDeliveryTypeFromProduct,
} from '../../utils/voucherDelivery';
import {
  VOUCHER_LOCATION_ADDRESS_MODE,
  VOUCHER_MULTIPLE_LOCATION_INPUT,
  EMPTY_STORE_ADDRESS,
  isCompleteStoreAddress,
  isCompleteStoreAddressWithPincode,
  inferVoucherLocationModesFromProduct,
  normalizeManualStoreLocations,
  buildOfflineAddressListForSubmit,
  hasValidDigitalLocation,
} from '../../utils/voucherLocation';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, Upload, FileText, X, Download, Plus, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { toast } from 'sonner';
import api, { productApi } from '../../utils/api';
import StateData from '../../utils/StateCityArray.json';
import {
  buildCitySelectOptions,
  getCitiesForState,
} from '../../utils/stateCityOptions';
import { resolveLocationFromPincode } from '../../utils/pincodeLookup';
import { getPrevNextStepPaths } from '../../config/categoryFormConfig';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '../../components/ui/tooltip';
import { Info } from 'lucide-react';
import { Stepper } from '../AddProduct/AddProductSteps';
import { useScrollToTopOnStepEnter } from '../../hooks/useScrollToTopOnStepEnter';

// Validation aligned with bxi-dashboard TechInfoTemplate: all text fields max 500 characters
const schema = z.object({
  inclusions: z.string().min(1, 'This field is required').max(500, 'This field cannot exceed 500 characters'),
  exclusions: z.string().min(1, 'This field is required').max(500, 'This field cannot exceed 500 characters'),
  termsAndConditions: z.string().min(1, 'This field is required').max(8000, 'This field cannot exceed 8000 characters'),
  redemptionSteps: z.string().min(1, 'This field is required').max(500, 'This field cannot exceed 500 characters'),
  voucherDeliveryType: z.enum([VOUCHER_DELIVERY_TYPE.DIGITAL, VOUCHER_DELIVERY_TYPE.PHYSICAL]),
  // voucherJourneyType: z.enum([VOUCHER_JOURNEY_TYPE.OFFER_SPECIFIC, VOUCHER_JOURNEY_TYPE.VALUE_GIFT]),
  codeGenerationType: z.enum(['bxi', 'self']),
  onlineRedemptionUrl: z.string().optional().or(z.literal('')),
});

function redemptionStepsToString(rs) {
  if (Array.isArray(rs)) return rs.filter(Boolean).join('\n');
  return rs != null ? String(rs) : '';
}

/** Utility function to count letters/characters in a string */
function countLetters(text) {
  if (!text || typeof text !== 'string') return 0;
  return text.length;
}

function offlineAddressFromProduct(p) {
  const empty = { address: '', area: '', landmark: '', city: '', state: '' };
  if (!p) return empty;
  if (p.OfflineAddress) {
    try {
      const o =
        typeof p.OfflineAddress === 'string' ? JSON.parse(p.OfflineAddress) : p.OfflineAddress;
      return {
        address: o?.address ?? '',
        area: o?.area ?? '',
        landmark: o?.landmark ?? '',
        city: o?.city ?? '',
        state: o?.state ?? '',
      };
    } catch {
      return empty;
    }
  }
  return {
    address: p.Address ?? '',
    area: p.Area ?? '',
    landmark: p.Landmark ?? '',
    city: p.City ?? '',
    state: p.State ?? '',
    pincode: p.Pincode ?? '',
  };
}

function normalizeStoreLocationRow(row = {}) {
  const read = (keys = []) => {
    for (const key of keys) {
      const value = row?.[key];
      if (value != null && String(value).trim() !== '') return String(value).trim();
    }
    return '';
  };
  return {
    address: read(['address', 'Address', 'ADDRESS']),
    area: read(['area', 'Area', 'AREA']),
    landmark: read(['landmark', 'Landmark', 'LANDMARK']),
    city: read(['city', 'City', 'CITY']),
    state: read(['state', 'State', 'STATE']),
  };
}

function parseStoreLocationsFromWorkbook(workbook) {
  if (!workbook?.SheetNames?.length) return [];
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return [];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  return rows
    .map(normalizeStoreLocationRow)
    .filter((row) =>
      [row.area, row.landmark, row.city, row.state].some(
        (v) => String(v || '').trim() !== ''
      )
    );
}

function parseVoucherCodesFromWorkbook(workbook) {
  if (!workbook?.SheetNames?.length) {
    throw new Error('Excel file has no sheets');
  }
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) throw new Error('Excel sheet is missing');
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
  const firstCol = rows.map((r) => (Array.isArray(r) ? r[0] : null));
  const header = firstCol[0] != null ? String(firstCol[0]).trim() : '';
  if (header !== 'UniqueVoucherCodes') {
    throw new Error('Invalid voucher file: cell A1 must be exactly UniqueVoucherCodes');
  }
  const codes = firstCol
    .slice(1)
    .map((c) => (c == null ? '' : String(c).trim()))
    .filter((c) => c.length > 0);
  if (!codes.length) {
    throw new Error('No voucher codes found under UniqueVoucherCodes header');
  }
  const seen = new Set();
  const duplicates = [];
  for (const code of codes) {
    const key = code.toLowerCase();
    if (seen.has(key)) duplicates.push(code);
    else seen.add(key);
  }
  if (duplicates.length) {
    throw new Error(`Duplicate codes found in file: ${duplicates.slice(0, 5).join(', ')}`);
  }
  return codes;
}

function normalizePreviewText(value) {
  const lines = String(value ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim());

  while (lines.length > 0 && lines[0] === '') lines.shift();
  while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();

  const collapsed = [];
  let prevBlank = false;
  for (const line of lines) {
    const isBlank = line === '';
    if (isBlank && prevBlank) continue;
    collapsed.push(line);
    prevBlank = isBlank;
  }

  return collapsed.join('\n').trim();
}

function getVariantDescriptor(variant = {}) {
  const parts = [];
  const push = (label, value) => {
    if (value == null) return;
    const text = String(value).trim();
    if (!text) return;
    parts.push(`${label}: ${text}`);
  };
  push('Offering type', variant?.OfferingType || variant?.ProductSubType);
  push('Validity', variant?.validityOfVoucherValue);
  push('Price', variant?.PricePerUnit);
  push('HSN', variant?.HSN);
  return parts.join(' | ');
}

function CompactRadioOption({ id, value, label }) {
  return (
    <div className="inline-flex items-center gap-2.5">
      <RadioGroupItem id={id} value={value} />
      <Label htmlFor={id} className="cursor-pointer text-sm font-medium text-[#1F2A44] leading-none mb-0">
        {label}
      </Label>
    </div>
  );
}

function StackedRadioOption({ id, value, label, description }) {
  return (
    <div className="flex items-start gap-2.5 max-w-md">
      <RadioGroupItem id={id} value={value} className="mt-0.5" />
      <div className="space-y-1">
        <Label htmlFor={id} className="cursor-pointer text-sm font-medium text-[#1F2A44] leading-snug">
          {label}
        </Label>
        {description ? (
          <p className="text-xs text-[#6B7A99] font-normal leading-snug">{description}</p>
        ) : null}
      </div>
    </div>
  );
}

function StoreAddressFields({
  address,
  onChange,
  cities,
  StateData,
  addressLetters,
  areaLetters,
  onAddressLetters,
  onAreaLetters,
  idPrefix = 'store',
  onPincodeLookup,
  pincodeLoading = false,
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor={`${idPrefix}-pincode`}>
          Pincode <span className="text-red-500">*</span>
        </Label>
        <div className="relative max-w-[220px]">
          <Input
            id={`${idPrefix}-pincode`}
            placeholder="Enter 6-digit pincode"
            maxLength={6}
            inputMode="numeric"
            value={address.pincode || ''}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '');
              onChange({ ...address, pincode: v });
              if (v.length === 6 && onPincodeLookup) onPincodeLookup(v);
            }}
            className={pincodeLoading ? 'pr-10' : ''}
          />
          {pincodeLoading && (
            <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-[#C64091]" />
          )}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-state`}>
          State <span className="text-red-500">*</span>
        </Label>
        <Select
          value={address.state}
          onValueChange={(v) => onChange({ ...address, state: v, city: '' })}
        >
          <SelectTrigger id={`${idPrefix}-state`}>
            <SelectValue placeholder="Select state" />
          </SelectTrigger>
          <SelectContent>
            {StateData.map((s) => (
              <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-city`}>
          City <span className="text-red-500">*</span>
        </Label>
        <Select
          value={address.city}
          onValueChange={(v) => onChange({ ...address, city: v })}
          disabled={!address.state}
        >
          <SelectTrigger id={`${idPrefix}-city`}>
            <SelectValue placeholder="Select city" />
          </SelectTrigger>
          <SelectContent>
            {cities.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-area`}>
          Area <span className="text-red-500">*</span>
        </Label>
        <Input
          id={`${idPrefix}-area`}
          placeholder="Area / locality"
          value={address.area}
          maxLength={500}
          onChange={(e) => {
            const val = e.target.value;
            onChange({ ...address, area: val });
            onAreaLetters?.(countLetters(val));
          }}
        />
        {onAreaLetters != null && (
          <p className="text-xs text-gray-500 text-right mt-1">{areaLetters} / 500</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-landmark`}>
          Landmark <span className="text-red-500">*</span>
        </Label>
        <Input
          id={`${idPrefix}-landmark`}
          placeholder="Eg. Near Metro Station"
          value={address.landmark}
          maxLength={500}
          onChange={(e) => onChange({ ...address, landmark: e.target.value })}
        />
      </div>
      {/* Street address not required for voucher store locations
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor={`${idPrefix}-address`}>
          Street address <span className="text-red-500">*</span>
        </Label>
        <Input
          id={`${idPrefix}-address`}
          placeholder="Building, street, shop number"
          value={address.address}
          maxLength={500}
          onChange={(e) => {
            const val = e.target.value;
            onChange({ ...address, address: val });
            onAddressLetters?.(countLetters(val));
          }}
        />
        {onAddressLetters != null && (
          <p className="text-xs text-gray-500 text-right mt-1">{addressLetters} / 500</p>
        )}
      </div>
      */}
    </div>
  );
}

function AddressSectionCard({ title, description, children }) {
  return (
    <div className="rounded-lg border border-[#E5E8EB] bg-[#FAFBFC] p-4 space-y-4">
      {(title || description) && (
        <div className="space-y-1">
          {title && <p className="text-sm font-semibold text-[#1F2A44]">{title}</p>}
          {description && <p className="text-xs text-[#6B7A99]">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

function ManualStoreLocationsEditor({
  rows,
  onChangeRow,
  onAddRow,
  onRemoveRow,
  StateData,
  onPincodeLookup,
  pincodeLoadingIndex = null,
}) {
  return (
    <div className="space-y-4">
      {rows.map((row, idx) => {
        const rowCities = row.state
          ? buildCitySelectOptions(getCitiesForState(row.state, StateData), row.city)
          : [];
        return (
          <div
            key={`manual-loc-${idx}`}
            className="rounded-lg border border-[#E5E8EB] bg-white p-4 space-y-3 shadow-sm"
          >
            <div className="flex items-center justify-between gap-2 border-b border-[#E5E8EB] pb-2">
              <p className="text-sm font-semibold text-[#1F2A44]">Location {idx + 1}</p>
              {rows.length > 2 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveRow(idx)}
                  className="text-[#6B7A99] hover:text-[#C64091] h-8"
                >
                  <X className="w-4 h-4 mr-1" />
                  Remove
                </Button>
              )}
            </div>
            <StoreAddressFields
              address={row}
              onChange={(next) => onChangeRow(idx, next)}
              cities={rowCities}
              StateData={StateData}
              idPrefix={`manual-${idx}`}
              onPincodeLookup={(pincode) => onPincodeLookup?.(idx, pincode)}
              pincodeLoading={pincodeLoadingIndex === idx}
            />
          </div>
        );
      })}
      <Button
        type="button"
        variant="outline"
        onClick={onAddRow}
        className="border-[#C64091] text-[#C64091]"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add another location
      </Button>
    </div>
  );
}

function StoreListUploadSection({
  storeListFile,
  parsedStoreLocations,
  storeFileRef,
  onPickFile,
  onClearFile,
  onFileChange,
  onDownloadSample,
}) {
  return (
    <div className="space-y-2">
      <Label>Upload Store List</Label>
      <p className="text-xs text-[#6B7A99]">Upload Excel with store locations when you have multiple outlets.</p>
      <div className="flex gap-4 items-center flex-wrap">
        <Button
          type="button"
          variant="outline"
          onClick={onPickFile}
          className="border-[#C64091] text-[#C64091]"
        >
          <Upload className="w-4 h-4 mr-2" />
          {storeListFile ? 'Change File' : 'Upload Store List'}
        </Button>
        {storeListFile && (
          <div className="flex items-center gap-2 text-sm">
            <FileText className="w-4 h-4 text-[#C64091]" />
            <span>{storeListFile.name}</span>
            <button
              type="button"
              onClick={onClearFile}
              className="text-[#6B7A99] hover:text-[#C64091]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={onDownloadSample}
          className="border-[#C64091] text-[#C64091]"
        >
          <Download className="w-4 h-4 mr-2" />
          Download Store List Sample
        </Button>
      </div>
      {parsedStoreLocations.length > 0 && (
        <p className="text-xs text-[#6B7A99]">
          Parsed {parsedStoreLocations.length} location{parsedStoreLocations.length > 1 ? 's' : ''} from uploaded file.
        </p>
      )}
      <input
        ref={storeFileRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={onFileChange}
        className="hidden"
      />
    </div>
  );
}

export default function VoucherTechInfo({ category }) {
  useScrollToTopOnStepEnter();
  const navigate = useNavigate();
  const { id } = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productData, setProductData] = useState(null);
  const [codeFile, setCodeFile] = useState(null);
  const [variantCodeFiles, setVariantCodeFiles] = useState({});
  const [variantCodeMeta, setVariantCodeMeta] = useState({});
  const [storeListFile, setStoreListFile] = useState(null);
  const [parsedStoreLocations, setParsedStoreLocations] = useState([]);
  const [voucherLocationAddressMode, setVoucherLocationAddressMode] = useState(
    VOUCHER_LOCATION_ADDRESS_MODE.SINGLE
  );
  const [voucherMultipleLocationInput, setVoucherMultipleLocationInput] = useState(
    VOUCHER_MULTIPLE_LOCATION_INPUT.EXCEL
  );
  const [manualStoreLocations, setManualStoreLocations] = useState([
    EMPTY_STORE_ADDRESS(),
    EMPTY_STORE_ADDRESS(),
  ]);
  const [offlineAddress, setOfflineAddress] = useState({
    address: '',
    area: '',
    landmark: '',
    pincode: '',
    city: '',
    state: '',
  });
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [manualPincodeLoadingIdx, setManualPincodeLoadingIdx] = useState(null);
  const [cities, setCities] = useState([]);
  const codeFileRef = useRef(null);
  const storeFileRef = useRef(null);
  const hydratedProductIdRef = useRef(null);

  // Letter count states
  const [inclusionsLetters, setInclusionsLetters] = useState(0);
  const [exclusionsLetters, setExclusionsLetters] = useState(0);
  const [termsLetters, setTermsLetters] = useState(0);
  const [redemptionStepsLetters, setRedemptionStepsLetters] = useState(0);
  const [onlineUrlLetters, setOnlineUrlLetters] = useState(0);
  const [addressLetters, setAddressLetters] = useState(0);
  const [areaLetters, setAreaLetters] = useState(0);

  const { prev: prevStepPath, next: nextStepPath } = getPrevNextStepPaths(category, 'techInfo');
  const prevPath = prevStepPath || 'hotelsproductinfo';
  const nextPath = 'voucherdesign';

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      inclusions: '',
      exclusions: '',
      termsAndConditions: '',
      redemptionSteps: '',
      voucherDeliveryType: VOUCHER_DELIVERY_TYPE.DIGITAL,
      voucherJourneyType: getVoucherJourneyTypeFromStorage(),
      codeGenerationType: 'bxi',
      onlineRedemptionUrl: '',
    },
  });

  const voucherDeliveryType = watch('voucherDeliveryType');
  const voucherJourneyType = watch('voucherJourneyType');
  const codeGenerationType = watch('codeGenerationType');
  const inclusions = watch('inclusions');
  const exclusions = watch('exclusions');
  const termsAndConditions = watch('termsAndConditions');
  const redemptionSteps = watch('redemptionSteps');
  const onlineRedemptionUrl = watch('onlineRedemptionUrl');
  const voucherVariants = Array.isArray(productData?.ProductsVariantions)
    ? productData.ProductsVariantions
    : [];
  const hasMultipleVariants = voucherVariants.length > 1;

  const getExpectedVariantQty = (variant) => {
    const qty = Number(variant?.TotalAvailableQty ?? variant?.MaxOrderQuantity ?? 0);
    return Number.isFinite(qty) ? qty : 0;
  };

  const urlRegex = /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/g;
  const hasRequiredText =
    (inclusions ?? '').trim().length > 0 &&
    (exclusions ?? '').trim().length > 0 &&
    (termsAndConditions ?? '').trim().length > 0 &&
    (redemptionSteps ?? '').trim().length > 0;
  const redemptionTypeValue = deliveryToRedemptionType(
    voucherDeliveryType || VOUCHER_DELIVERY_TYPE.DIGITAL
  );
  const onlineOk =
    redemptionTypeValue === 'offline' ||
    (() => {
      const url = (onlineRedemptionUrl ?? '').trim();
      return url.length > 0 && !!url.match(urlRegex) && !url.toLowerCase().includes('bxiworld');
    })();
  const hasOfflineOk =
    redemptionTypeValue === 'online' ||
    (() => {
      const hasAddress = isCompleteStoreAddressWithPincode(offlineAddress);
      return hasAddress || !!storeListFile || parsedStoreLocations.length > 0;
    })();
  const hasDigitalLocationOk =
    redemptionTypeValue !== 'online' ||
    hasValidDigitalLocation({
      mode: voucherLocationAddressMode,
      input: voucherMultipleLocationInput,
      singleAddress: offlineAddress,
      parsedExcel: parsedStoreLocations,
      manualRows: manualStoreLocations,
      storeListFile,
    });
  const codeGenOk =
    voucherDeliveryType === VOUCHER_DELIVERY_TYPE.PHYSICAL ||
    (codeGenerationType || 'bxi') !== 'self' ||
    (hasMultipleVariants
      ? voucherVariants.every((variant) => !!variantCodeFiles[String(variant?._id || '')])
      : !!codeFile);
  const canSubmit = hasRequiredText && onlineOk && hasOfflineOk && hasDigitalLocationOk && codeGenOk;

  // Fetch product data
  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      try {
        const res = await productApi.getProductById(id);
        setProductData(res?.data);
      } catch (error) {
        console.error('Error fetching product:', error);
      }
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    hydratedProductIdRef.current = null;
  }, [id]);

  useEffect(() => {
    if (!id || !productData?._id || String(productData._id) !== String(id)) return;
    if (hydratedProductIdRef.current === id) return;
    hydratedProductIdRef.current = id;

    setValue('voucherDeliveryType', normalizeVoucherDeliveryTypeFromProduct(productData));
    setValue(
      'voucherJourneyType',
      productData.VoucherType
        ? getVoucherJourneyType(productData.VoucherType)
        : getVoucherJourneyTypeFromStorage()
    );
    setValue('inclusions', productData.Inclusions ?? '');
    setInclusionsLetters(countLetters(productData.Inclusions));
    setValue('exclusions', productData.Exclusions ?? '');
    setExclusionsLetters(countLetters(productData.Exclusions));
    setValue('termsAndConditions', productData.TermConditions ?? productData.TermsAndConditions ?? '');
    setTermsLetters(countLetters(productData.TermConditions ?? productData.TermsAndConditions));
    const rs = redemptionStepsToString(productData.RedemptionSteps);
    setValue('redemptionSteps', rs);
    setRedemptionStepsLetters(countLetters(rs));
    const link = (productData.Link ?? productData.OnlineRedemptionURL ?? '').trim();
    setValue('onlineRedemptionUrl', link);
    setOnlineUrlLetters(countLetters(link));
    const addr = offlineAddressFromProduct(productData);
    setOfflineAddress({ ...EMPTY_STORE_ADDRESS(), ...addr, pincode: productData.Pincode ?? '' });
    setAddressLetters(countLetters(addr.address));
    setAreaLetters(countLetters(addr.area));

    const inferredLocation = inferVoucherLocationModesFromProduct(productData);
    setVoucherLocationAddressMode(inferredLocation.voucherLocationAddressMode);
    setVoucherMultipleLocationInput(inferredLocation.voucherMultipleLocationInput);

    let offlineList = [];
    if (Array.isArray(productData?.OfflineAddressList)) {
      offlineList = productData.OfflineAddressList;
    } else if (typeof productData?.OfflineAddressList === 'string') {
      try {
        const parsed = JSON.parse(productData.OfflineAddressList);
        offlineList = Array.isArray(parsed) ? parsed : [];
      } catch {
        offlineList = [];
      }
    }

    if (inferredLocation.voucherLocationAddressMode === VOUCHER_LOCATION_ADDRESS_MODE.MULTIPLE) {
      if (inferredLocation.voucherMultipleLocationInput === VOUCHER_MULTIPLE_LOCATION_INPUT.MANUAL) {
        const manualRows = normalizeManualStoreLocations(offlineList);
        setManualStoreLocations(
          manualRows.length >= 2
            ? manualRows
            : [EMPTY_STORE_ADDRESS(), EMPTY_STORE_ADDRESS()]
        );
        setParsedStoreLocations([]);
      } else {
        setParsedStoreLocations(offlineList);
        setManualStoreLocations([EMPTY_STORE_ADDRESS(), EMPTY_STORE_ADDRESS()]);
      }
    } else {
      setParsedStoreLocations([]);
      setManualStoreLocations([EMPTY_STORE_ADDRESS(), EMPTY_STORE_ADDRESS()]);
    }

    const cg = String(productData.CodeGenerationType ?? productData.codeGenerationType ?? 'bxi')
      .toLowerCase();
    setValue('codeGenerationType', cg === 'self' ? 'self' : 'bxi');
  }, [id, productData, setValue]);

  // Update cities when state changes
  useEffect(() => {
    if (offlineAddress.state) {
      const baseCities = getCitiesForState(offlineAddress.state, StateData);
      setCities(buildCitySelectOptions(baseCities, offlineAddress.city));
    } else {
      setCities([]);
    }
  }, [offlineAddress.state, offlineAddress.city]);

  // Pincode auto-lookup — same flow as AddProductSteps product pickup location
  const applyResolvedPincode = useCallback((resolved, pincode, prev = {}) => {
    if (resolved.unmatchedState) {
      toast.warning(`State "${resolved.unmatchedState}" not found in list. Please select manually.`);
      return { ...prev, pincode: String(pincode) };
    }
    return {
      ...prev,
      pincode: String(pincode),
      state: resolved.state || prev.state,
      city: resolved.city || prev.city,
      landmark: resolved.landmark || '',
      area: resolved.landmark || '',
    };
  }, []);

  const handleOfflinePincodeLookup = useCallback(async (pincode) => {
    if (String(pincode).length !== 6) return;
    setPincodeLoading(true);
    try {
      const resolved = await resolveLocationFromPincode(pincode, { StateData });
      if (!resolved) {
        toast.error('Invalid pincode or no data found');
        return;
      }
      setOfflineAddress((prev) => applyResolvedPincode(resolved, pincode, prev));
      toast.success('Location auto-filled from pincode!');
    } catch {
      toast.error('Failed to fetch pincode data');
    } finally {
      setPincodeLoading(false);
    }
  }, [applyResolvedPincode]);

  const handleManualPincodeLookup = useCallback(async (index, pincode) => {
    if (String(pincode).length !== 6) return;
    setManualPincodeLoadingIdx(index);
    try {
      const resolved = await resolveLocationFromPincode(pincode, { StateData });
      if (!resolved) {
        toast.error('Invalid pincode or no data found');
        return;
      }
      setManualStoreLocations((prev) =>
        prev.map((row, i) =>
          i === index ? applyResolvedPincode(resolved, pincode, row) : row
        )
      );
      toast.success('Location auto-filled from pincode!');
    } catch {
      toast.error('Failed to fetch pincode data');
    } finally {
      setManualPincodeLoadingIdx(null);
    }
  }, [applyResolvedPincode]);

  useEffect(() => {
    if (voucherDeliveryType === VOUCHER_DELIVERY_TYPE.PHYSICAL) {
      setValue('codeGenerationType', 'bxi');
      setCodeFile(null);
      setVariantCodeFiles({});
      setVariantCodeMeta({});
    }
  }, [voucherDeliveryType, setValue]);

  const handleCodeFileChange = (e, variationId = null) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt?.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const parsedCodes = parseVoucherCodesFromWorkbook(workbook);

        if (variationId) {
          setVariantCodeFiles((prev) => ({
            ...prev,
            [variationId]: file,
          }));
          setVariantCodeMeta((prev) => ({
            ...prev,
            [variationId]: {
              count: parsedCodes.length,
              codes: parsedCodes,
            },
          }));
          toast.success('Variant code file added');
        } else {
          setCodeFile(file);
          setVariantCodeMeta((prev) => ({
            ...prev,
            single: {
              count: parsedCodes.length,
              codes: parsedCodes,
            },
          }));
          toast.success('Code file added');
        }
      } catch (err) {
        toast.error(err?.message || 'Invalid voucher code file format');
      } finally {
        // Allow selecting the same filename again after edits.
        e.target.value = '';
      }
    };
    reader.onerror = () => {
      toast.error('Unable to read voucher code file');
      e.target.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  const handleStoreListChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt?.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const locations = parseStoreLocationsFromWorkbook(workbook);
        if (!locations.length) {
          toast.error('Store list is empty. Please use the sample format.');
          return;
        }
        setParsedStoreLocations(locations);
        setStoreListFile(file);
        toast.success('Store list file added');
        // Allow selecting the same filename again after edits.
        e.target.value = '';
      } catch {
        toast.error('Invalid store list format. Please use the sample file format.');
        e.target.value = '';
      }
    };
    reader.onerror = () => {
      toast.error('Unable to read store list file');
      e.target.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  const downloadSampleStoreLocations = () => {
    const data = [
      ['Address', 'Area', 'Landmark', 'City', 'State'],
      ['Shop 12, High Street Plaza', 'Andheri East', 'Near Metro Station', 'Mumbai', 'Maharashtra'],
      ['Unit 5, Central Mall', 'MG Road', 'Opp City Square', 'Bengaluru', 'Karnataka'],
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Store Locations');
    XLSX.writeFile(wb, 'sample_store_locations.xlsx');
    toast.success('Store list sample downloaded');
  };

  const downloadSampleVoucherCodes = () => {
    const data = [
      ['UniqueVoucherCodes'],
      ['VOUCHER001'],
      ['VOUCHER002'],
      ['VOUCHER003'],
      ['VOUCHER004'],
      ['VOUCHER005'],
      ['VOUCHER006'],
      ['VOUCHER007'],
      ['VOUCHER008'],
      ['VOUCHER009'],
      ['VOUCHER0010'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Voucher Codes');

    XLSX.writeFile(wb, 'sample_voucher_codes.xlsx');
    toast.success('Sample file downloaded');
  };

  const appendVoucherLocationFields = (formData, { mode, input }) => {
    formData.append('voucherLocationAddressMode', mode);
    formData.append(
      'voucherMultipleLocationInput',
      mode === VOUCHER_LOCATION_ADDRESS_MODE.MULTIPLE ? input : ''
    );

    if (mode === VOUCHER_LOCATION_ADDRESS_MODE.SINGLE) {
      formData.append('OfflineAddressList', JSON.stringify([]));
      formData.append('Address', offlineAddress.address || '');
      formData.append('Area', offlineAddress.area || '');
      formData.append('Landmark', offlineAddress.landmark || '');
      formData.append('Pincode', offlineAddress.pincode || '');
      formData.append('City', offlineAddress.city || '');
      formData.append('State', offlineAddress.state || '');
      return;
    }

    const list = buildOfflineAddressListForSubmit({
      mode,
      input,
      parsedExcel: parsedStoreLocations,
      manualRows: manualStoreLocations,
    });
    formData.append('OfflineAddressList', JSON.stringify(list));
    if (input === VOUCHER_MULTIPLE_LOCATION_INPUT.EXCEL && storeListFile) {
      formData.append('HotelLocations', storeListFile);
    }
  };

  const updateManualStoreRow = (index, nextRow) => {
    setManualStoreLocations((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...nextRow } : row))
    );
  };

  const addManualStoreRow = () => {
    setManualStoreLocations((prev) => [...prev, EMPTY_STORE_ADDRESS()]);
  };

  const removeManualStoreRow = (index) => {
    setManualStoreLocations((prev) =>
      prev.length <= 2 ? prev : prev.filter((_, i) => i !== index)
    );
  };

  const onSubmit = async (data) => {
    if (!id) {
      toast.error('Product ID missing');
      return;
    }

    const delivery = (data.voucherDeliveryType || voucherDeliveryType || VOUCHER_DELIVERY_TYPE.DIGITAL).toLowerCase();
    const redemptionTypeValue = deliveryToRedemptionType(delivery);

    // bxi TechInfoTemplate: URL must not contain bxiworld
    const url = (data.onlineRedemptionUrl || '').trim();
    if (url && url.toLowerCase().includes('bxiworld')) {
      toast.error('You can not use BXI world in Website Link');
      return;
    }

    // bxi: online delivery requires valid Link (URL)
    if (redemptionTypeValue === 'online') {
      if (!url) {
        toast.error('This field is required');
        return;
      }
      const urlRegex = /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/g;
      if (!url.match(urlRegex)) {
        toast.error('Please enter valid URL.');
        return;
      }
    }

    // bxi: physical delivery requires complete store address or store list
    if (redemptionTypeValue === 'offline') {
      const hasAddress = isCompleteStoreAddressWithPincode(offlineAddress);
      if (!hasAddress && !storeListFile && parsedStoreLocations.length === 0) {
        toast.error('Complete store location with pincode or upload a store list.');
        return;
      }
      const hasPartialSingle =
        offlineAddress.pincode?.trim() ||
        offlineAddress.area?.trim() ||
        offlineAddress.landmark?.trim() ||
        offlineAddress.city?.trim() ||
        offlineAddress.state?.trim();
      if (hasPartialSingle && !isCompleteStoreAddressWithPincode(offlineAddress)) {
        toast.error('Complete store location with a valid 6-digit pincode.');
        return;
      }
    }

    // Ecodes delivery requires location (single or multiple)
    if (redemptionTypeValue === 'online') {
      if (
        !hasValidDigitalLocation({
          mode: voucherLocationAddressMode,
          input: voucherMultipleLocationInput,
          singleAddress: offlineAddress,
          parsedExcel: parsedStoreLocations,
          manualRows: manualStoreLocations,
          storeListFile,
        })
      ) {
        if (voucherLocationAddressMode === VOUCHER_LOCATION_ADDRESS_MODE.SINGLE) {
          toast.error('Complete store address with a valid 6-digit pincode.');
        } else if (voucherMultipleLocationInput === VOUCHER_MULTIPLE_LOCATION_INPUT.MANUAL) {
          toast.error('Enter at least two complete store locations (pincode + address fields).');
        } else {
          toast.error('Upload a store list Excel file with at least one location.');
        }
        return;
      }
    }

    // bxi: CodeGenerationType 'self' requires voucher files (Ecodes / digital delivery only)
    if (
      redemptionTypeValue === 'online' &&
      (data.codeGenerationType || codeGenerationType) === 'self' &&
      !(
        hasMultipleVariants
          ? voucherVariants.every((variant) => !!variantCodeFiles[String(variant?._id || '')])
          : codeFile
      )
    ) {
      toast.error(
        hasMultipleVariants
          ? 'Please upload voucher codes file for each variant'
          : 'Please upload voucher codes Excel file'
      );
      return;
    }

    if (redemptionTypeValue === 'online' && (data.codeGenerationType || codeGenerationType) === 'self') {
      const allCodes = [];
      if (hasMultipleVariants) {
        for (const variant of voucherVariants) {
          const variationId = String(variant?._id || '');
          const meta = variantCodeMeta[variationId];
          if (meta?.codes?.length) allCodes.push(...meta.codes);
        }
      } else if (variantCodeMeta?.single?.codes?.length) {
        allCodes.push(...variantCodeMeta.single.codes);
      }
      const seen = new Set();
      const duplicates = [];
      for (const code of allCodes) {
        const key = String(code).trim().toLowerCase();
        if (seen.has(key)) duplicates.push(code);
        else seen.add(key);
      }
      if (duplicates.length) {
        toast.error(
          `Duplicate voucher codes found across variants: ${duplicates
            .slice(0, 5)
            .join(', ')}`
        );
        return;
      }
    }

    if (hasMultipleVariants && (data.codeGenerationType || codeGenerationType) === 'self') {
      for (const variant of voucherVariants) {
        const variationId = String(variant?._id || '');
        const expectedQty = getExpectedVariantQty(variant);
        const parsedCount = Number(variantCodeMeta?.[variationId]?.count || 0);
        if (expectedQty > 0 && parsedCount !== expectedQty) {
          toast.error(
            `Variant ${variationId.slice(-6)} requires ${expectedQty} codes, found ${parsedCount}.`
          );
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      const normalizedInclusions = normalizePreviewText(data.inclusions);
      const normalizedExclusions = normalizePreviewText(data.exclusions);
      const normalizedTermsAndConditions = normalizePreviewText(data.termsAndConditions);
      const normalizedRedemptionSteps = normalizePreviewText(data.redemptionSteps);

      const formData = new FormData();
      formData.append('_id', id);
      formData.append('ProductUploadStatus', 'voucherdesign');
      formData.append('Inclusions', normalizedInclusions);
      formData.append('Exclusions', normalizedExclusions);
      formData.append('TermConditions', normalizedTermsAndConditions);
      formData.append('RedemptionSteps', normalizedRedemptionSteps);
      formData.append('voucherDeliveryType', delivery);
      formData.append('redemptionType', redemptionTypeValue);
      formData.append('VoucherType', getVoucherJourneyLabel(data.voucherJourneyType));
      formData.append('CodeGenerationType', data.codeGenerationType === 'self' ? 'self' : 'bxi');

      if (url) formData.append('Link', url);

      if (redemptionTypeValue === 'offline') {
        const physicalMode =
          storeListFile || parsedStoreLocations.length > 0
            ? VOUCHER_LOCATION_ADDRESS_MODE.MULTIPLE
            : VOUCHER_LOCATION_ADDRESS_MODE.SINGLE;
        const physicalInput = VOUCHER_MULTIPLE_LOCATION_INPUT.EXCEL;
        appendVoucherLocationFields(formData, {
          mode: physicalMode,
          input: physicalInput,
        });
      } else {
        appendVoucherLocationFields(formData, {
          mode: voucherLocationAddressMode,
          input: voucherMultipleLocationInput,
        });
      }

      if ((data.codeGenerationType || codeGenerationType) === 'self') {
        if (hasMultipleVariants) {
          const manifest = [];
          let fileIndex = 0;
          for (const variant of voucherVariants) {
            const variationId = String(variant?._id || '');
            const file = variantCodeFiles[variationId];
            if (!file) continue;
            formData.append('voucherCodesByVariant', file);
            manifest.push({
              variationId,
              fileIndex,
              expectedQty: getExpectedVariantQty(variant),
            });
            fileIndex += 1;
          }
          formData.append('voucherCodeManifest', JSON.stringify(manifest));
        } else if (codeFile) {
          // Backward-compatible single variant payload.
          formData.append('voucherCodes', codeFile);
        }
      }

      await api.post('/product/product_mutation', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Voucher technical information saved!');
      navigate(`/${category}/${nextPath}/${id}`);
    } catch (error) {
      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.body?.message ||
        error?.response?.data?.body ||
        error?.response?.data?.error ||
        '';
      toast.error(backendMessage || 'Failed to save. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-8">
      <div className="form-container">
        <div className="stepper-layout">
          <aside className="stepper-rail">
            <Stepper currentStep={3} completedSteps={[1, 2]} category={category} />
          </aside>
          <main className="stepper-content">
            <div className="form-section">
              <div className="flex items-center gap-2">
                <h2 className="form-section-title">Technical Information - {category.replace(/voucher$/i, '').charAt(0).toUpperCase() + category.replace(/voucher$/i, '').slice(1)}</h2>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <button type="button" className="text-[#6B7A99] hover:text-[#C64091]">
                        <Info className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Voucher delivery (Ecodes vs physical) is saved as voucherDeliveryType on the product.
                        redemptionType is kept in sync for older flows. Also set voucher type, copy, redemption steps, link or store details, and codes when applicable.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Voucher delivery — stored as product.voucherDeliveryType (digital | physical) */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Voucher delivery type <span className="text-red-500">*</span></Label>
                    <p className="text-xs text-[#6B7A99]">
                      How the voucher is delivered or fulfilled: Ecodes (code / link after payment) or physically (shipping / in-store handoff).
                      This is separate from redemption instructions below; URL and address fields follow your choice here.
                    </p>
                    <RadioGroup
                      value={voucherDeliveryType || VOUCHER_DELIVERY_TYPE.DIGITAL}
                      onValueChange={(value) => setValue('voucherDeliveryType', value)}
                      className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:gap-8"
                    >
                      <StackedRadioOption
                        id="delivery-digital"
                        value={VOUCHER_DELIVERY_TYPE.DIGITAL}
                        label="Ecodes Delivery"
                        description="Online voucher — buyer gets digital fulfilment (URL after payment)."
                      />
                      <StackedRadioOption
                        id="delivery-physical"
                        value={VOUCHER_DELIVERY_TYPE.PHYSICAL}
                        label="Physical delivery"
                        description="Physical voucher — store list or address; PI / logistics may apply."
                      />
                    </RadioGroup>
                  </div>

                  {voucherDeliveryType === VOUCHER_DELIVERY_TYPE.DIGITAL && (
                    <div className="space-y-4">
                      <AddressSectionCard
                        title="Redemption URL"
                        description="Link where buyers redeem or access the Ecodes voucher after purchase."
                      >
                        <div className="space-y-2">
                          <Label htmlFor="onlineRedemptionUrl">
                            Add URL <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="onlineRedemptionUrl"
                            type="text"
                            placeholder="https://..."
                            {...register('onlineRedemptionUrl')}
                            maxLength={500}
                            onChange={(e) => setOnlineUrlLetters(countLetters(e.target.value))}
                            className={errors.onlineRedemptionUrl ? 'border-red-500' : ''}
                          />
                          <div className="flex items-center justify-between mt-1">
                            {errors.onlineRedemptionUrl && (
                              <p className="text-sm text-red-500">{errors.onlineRedemptionUrl.message}</p>
                            )}
                            <p className="text-xs text-gray-500 ml-auto">{onlineUrlLetters} / 500</p>
                          </div>
                        </div>
                      </AddressSectionCard>

                      <AddressSectionCard
                        title="Location coverage"
                        description="Where can this Ecodes voucher be redeemed? Required for marketplace location filters."
                      >
                        <RadioGroup
                          value={voucherLocationAddressMode}
                          onValueChange={setVoucherLocationAddressMode}
                          className="flex flex-wrap gap-6"
                        >
                          <CompactRadioOption
                            id="ecodes-loc-single"
                            value={VOUCHER_LOCATION_ADDRESS_MODE.SINGLE}
                            label="Single address"
                          />
                          <CompactRadioOption
                            id="ecodes-loc-multiple"
                            value={VOUCHER_LOCATION_ADDRESS_MODE.MULTIPLE}
                            label="Multiple address"
                          />
                        </RadioGroup>

                        {voucherLocationAddressMode === VOUCHER_LOCATION_ADDRESS_MODE.SINGLE && (
                          <div className="pt-2">
                            <StoreAddressFields
                              address={offlineAddress}
                              onChange={setOfflineAddress}
                              cities={cities}
                              StateData={StateData}
                              addressLetters={addressLetters}
                              areaLetters={areaLetters}
                              onAddressLetters={setAddressLetters}
                              onAreaLetters={setAreaLetters}
                              idPrefix="ecodes-single"
                              onPincodeLookup={handleOfflinePincodeLookup}
                              pincodeLoading={pincodeLoading}
                            />
                          </div>
                        )}

                        {voucherLocationAddressMode === VOUCHER_LOCATION_ADDRESS_MODE.MULTIPLE && (
                          <div className="space-y-4 pt-2">
                            <div className="space-y-2">
                              <Label>How do you want to add locations? <span className="text-red-500">*</span></Label>
                              <RadioGroup
                                value={voucherMultipleLocationInput}
                                onValueChange={setVoucherMultipleLocationInput}
                                className="flex flex-wrap gap-6"
                              >
                                <CompactRadioOption
                                  id="ecodes-multi-excel"
                                  value={VOUCHER_MULTIPLE_LOCATION_INPUT.EXCEL}
                                  label="Excel upload"
                                />
                                <CompactRadioOption
                                  id="ecodes-multi-manual"
                                  value={VOUCHER_MULTIPLE_LOCATION_INPUT.MANUAL}
                                  label="Enter multiple addresses"
                                />
                              </RadioGroup>
                            </div>

                            {voucherMultipleLocationInput === VOUCHER_MULTIPLE_LOCATION_INPUT.EXCEL && (
                              <StoreListUploadSection
                                storeListFile={storeListFile}
                                parsedStoreLocations={parsedStoreLocations}
                                storeFileRef={storeFileRef}
                                onPickFile={() => {
                                  if (storeFileRef.current) {
                                    storeFileRef.current.value = '';
                                    storeFileRef.current.click();
                                  }
                                }}
                                onClearFile={() => {
                                  setStoreListFile(null);
                                  setParsedStoreLocations([]);
                                }}
                                onFileChange={handleStoreListChange}
                                onDownloadSample={downloadSampleStoreLocations}
                              />
                            )}

                            {voucherMultipleLocationInput === VOUCHER_MULTIPLE_LOCATION_INPUT.MANUAL && (
                              <ManualStoreLocationsEditor
                                rows={manualStoreLocations}
                                onChangeRow={updateManualStoreRow}
                                onAddRow={addManualStoreRow}
                                onRemoveRow={removeManualStoreRow}
                                StateData={StateData}
                                onPincodeLookup={handleManualPincodeLookup}
                                pincodeLoadingIndex={manualPincodeLoadingIdx}
                              />
                            )}
                          </div>
                        )}
                      </AddressSectionCard>
                    </div>
                  )}
                  {voucherDeliveryType === VOUCHER_DELIVERY_TYPE.PHYSICAL && (
                    <div className="space-y-4">
                      <AddressSectionCard
                        title="Store address"
                      >
                        <StoreAddressFields
                          address={offlineAddress}
                          onChange={setOfflineAddress}
                          cities={cities}
                          StateData={StateData}
                          addressLetters={addressLetters}
                          areaLetters={areaLetters}
                          onAddressLetters={setAddressLetters}
                          onAreaLetters={setAreaLetters}
                          idPrefix="physical-single"
                          onPincodeLookup={handleOfflinePincodeLookup}
                          pincodeLoading={pincodeLoading}
                        />
                      </AddressSectionCard>
                      <AddressSectionCard title="Redemption URL">
                        <div className="space-y-2">
                          <Label htmlFor="physical-onlineRedemptionUrl">
                            Add URL <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="physical-onlineRedemptionUrl"
                            type="text"
                            placeholder="https://..."
                            {...register('onlineRedemptionUrl')}
                            maxLength={500}
                            onChange={(e) => setOnlineUrlLetters(countLetters(e.target.value))}
                            className={errors.onlineRedemptionUrl ? 'border-red-500' : ''}
                          />
                          <div className="flex items-center justify-between mt-1">
                            {errors.onlineRedemptionUrl && (
                              <p className="text-sm text-red-500">{errors.onlineRedemptionUrl.message}</p>
                            )}
                            <p className="text-xs text-gray-500 ml-auto">{onlineUrlLetters} / 500</p>
                          </div>
                        </div>
                      </AddressSectionCard>
                      <AddressSectionCard
                        title="Multiple store locations (optional)"
                        description="Upload an Excel file if the voucher is valid at more than one outlet."
                      >
                        <StoreListUploadSection
                          storeListFile={storeListFile}
                          parsedStoreLocations={parsedStoreLocations}
                          storeFileRef={storeFileRef}
                          onPickFile={() => {
                            if (storeFileRef.current) {
                              storeFileRef.current.value = '';
                              storeFileRef.current.click();
                            }
                          }}
                          onClearFile={() => {
                            setStoreListFile(null);
                            setParsedStoreLocations([]);
                          }}
                          onFileChange={handleStoreListChange}
                          onDownloadSample={downloadSampleStoreLocations}
                        />
                      </AddressSectionCard>
                    </div>
                  )}
                </div>
                {/* 
                <div className="space-y-4 pb-4 border-b border-[#E5E8EB]">
                  <div className="space-y-2">
                    <Label>Voucher type <span className="text-red-500">*</span></Label>
                    <p className="text-xs text-[#6B7A99]">
                      Same categories as general information: offer-specific deals vs value / gift-card style vouchers.
                    </p>
                    <RadioGroup
                      value={voucherJourneyType || VOUCHER_JOURNEY_TYPE.OFFER_SPECIFIC}
                      onValueChange={(value) => setValue('voucherJourneyType', value)}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-6">
                        <div className="flex items-start space-x-2">
                          <RadioGroupItem value={VOUCHER_JOURNEY_TYPE.OFFER_SPECIFIC} id="vtype-offer" className="mt-1" />
                          <div>
                            <Label htmlFor="vtype-offer" className="cursor-pointer font-medium">
                              Offer specific
                            </Label>
                            <p className="text-xs text-[#6B7A99] font-normal">Fixed offer or package (default).</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-2">
                          <RadioGroupItem value={VOUCHER_JOURNEY_TYPE.VALUE_GIFT} id="vtype-value" className="mt-1" />
                          <div>
                            <Label htmlFor="vtype-value" className="cursor-pointer font-medium">
                              Value voucher / gift cards
                            </Label>
                            <p className="text-xs text-[#6B7A99] font-normal">Denomination-style or gift-card listing.</p>
                          </div>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                </div> */}

                {/* Inclusions */}
                <div className="space-y-2">
                  <Label htmlFor="inclusions">
                    Inclusions <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="inclusions"
                    placeholder="Inclusions"
                    rows={4}
                    maxLength={500}
                    {...register('inclusions')}
                    onChange={(e) => setInclusionsLetters(countLetters(e.target.value))}
                    className={errors.inclusions ? 'border-red-500' : ''}
                  />
                  <div className="flex items-center justify-between mt-1">
                    {errors.inclusions && (
                      <p className="text-sm text-red-500">{errors.inclusions.message}</p>
                    )}
                    <p className="text-xs text-gray-500 ml-auto">{inclusionsLetters} / 500</p>
                  </div>
                </div>

                {/* Exclusions */}
                <div className="space-y-2">
                  <Label htmlFor="exclusions">
                    Exclusions <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="exclusions"
                    placeholder="Exclusions"
                    rows={4}
                    maxLength={500}
                    {...register('exclusions')}
                    onChange={(e) => setExclusionsLetters(countLetters(e.target.value))}
                    className={errors.exclusions ? 'border-red-500' : ''}
                  />
                  <div className="flex items-center justify-between mt-1">
                    {errors.exclusions && (
                      <p className="text-sm text-red-500">{errors.exclusions.message}</p>
                    )}
                    <p className="text-xs text-gray-500 ml-auto">{exclusionsLetters} / 500</p>
                  </div>
                </div>

                {/* Terms & Conditions – bxi TermConditions */}
                <div className="space-y-2">
                  <Label htmlFor="termsAndConditions">
                    Terms & Conditions <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="termsAndConditions"
                    placeholder="Terms & Conditions"
                    rows={4}
                    maxLength={8000}
                    {...register('termsAndConditions')}
                    onChange={(e) => setTermsLetters(countLetters(e.target.value))}
                    className={errors.termsAndConditions ? 'border-red-500' : ''}
                  />
                  <div className="flex items-center justify-between mt-1">
                    {errors.termsAndConditions && (
                      <p className="text-sm text-red-500">{errors.termsAndConditions.message}</p>
                    )}
                    <p className="text-xs text-gray-500 ml-auto">{termsLetters} / 8000</p>
                  </div>
                </div>

                {/* Redemption Steps */}
                <div className="space-y-2">
                  <Label htmlFor="redemptionSteps">
                    Redemption Steps <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="redemptionSteps"
                    placeholder="Redemption Steps"
                    rows={4}
                    maxLength={500}
                    {...register('redemptionSteps')}
                    onChange={(e) => setRedemptionStepsLetters(countLetters(e.target.value))}
                    className={errors.redemptionSteps ? 'border-red-500' : ''}
                  />
                  <div className="flex items-center justify-between mt-1">
                    {errors.redemptionSteps && (
                      <p className="text-sm text-red-500">{errors.redemptionSteps.message}</p>
                    )}
                    <p className="text-xs text-gray-500 ml-auto">{redemptionStepsLetters} / 500</p>
                  </div>
                </div>

                {voucherDeliveryType === VOUCHER_DELIVERY_TYPE.DIGITAL && (
                  <div className="space-y-2">
                    <Label>
                      How do you want to upload your voucher codes? (Bxi will generate them for you or you can upload them) <span className="text-red-500">*</span>
                    </Label>
                    <RadioGroup
                      value={codeGenerationType || 'bxi'}
                      onValueChange={(value) => setValue('codeGenerationType', value)}
                      className="flex flex-wrap gap-6"
                    >
                      <CompactRadioOption id="codegen-bxi" value="bxi" label="BXI" />
                      <CompactRadioOption id="codegen-self" value="self" label="Upload Now" />
                    </RadioGroup>
                  </div>
                )}

                {codeGenerationType === 'self' && (
                  <div className="space-y-2">
                    <Label>Voucher Codes File <span className="text-red-500">*</span></Label>
                    <p className="text-xs text-[#6B7A99]">
                      {hasMultipleVariants
                        ? 'Upload separate Excel files for each variant.'
                        : 'Upload Excel with voucher codes.'}
                    </p>
                    <div className="flex gap-4 items-center flex-wrap">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={downloadSampleVoucherCodes}
                              className="border-[#C64091] text-[#C64091]"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download Sample
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Cell A1 in the Excel should exactly be <strong>UniqueVoucherCodes</strong></p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    {hasMultipleVariants ? (
                      <div className="space-y-3">
                        {voucherVariants.map((variant, idx) => {
                          const variationId = String(variant?._id || '');
                          const selectedFile = variantCodeFiles[variationId];
                          const expectedQty = getExpectedVariantQty(variant);
                          const parsedCount = variantCodeMeta?.[variationId]?.count;
                          const inputId = `voucher-code-file-${variationId}`;
                          return (
                            <div
                              key={variationId}
                              className="rounded-md border border-[#E5E8EB] p-3 space-y-2"
                            >
                              <div className="text-sm font-medium text-[#1F2A44]">
                                Variant {idx + 1}
                                {expectedQty > 0 ? ` (Expected codes: ${expectedQty})` : ''}
                              </div>
                              {getVariantDescriptor(variant) ? (
                                <p className="text-xs text-[#6B7A99] break-words">
                                  {getVariantDescriptor(variant)}
                                </p>
                              ) : null}
                              <p className="text-[11px] text-[#8A94A6] break-all">
                                Variant ID: {variationId}
                              </p>
                              <div className="flex items-center gap-3 flex-wrap">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => {
                                    const inputEl = document.getElementById(inputId);
                                    if (inputEl) {
                                      inputEl.value = '';
                                      inputEl.click();
                                    }
                                  }}
                                  className="border-[#C64091] text-[#C64091]"
                                >
                                  <Upload className="w-4 h-4 mr-2" />
                                  {selectedFile ? 'Change File' : 'Upload Codes'}
                                </Button>
                                {selectedFile && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <FileText className="w-4 h-4 text-[#C64091]" />
                                    <span>{selectedFile.name}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setVariantCodeFiles((prev) => {
                                          const next = { ...prev };
                                          delete next[variationId];
                                          return next;
                                        });
                                        setVariantCodeMeta((prev) => {
                                          const next = { ...prev };
                                          delete next[variationId];
                                          return next;
                                        });
                                      }}
                                      className="text-[#6B7A99] hover:text-[#C64091]"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}
                                {typeof parsedCount === 'number' ? (
                                  <span className="text-xs text-[#6B7A99]">
                                    Parsed codes: {parsedCount}
                                  </span>
                                ) : null}
                              </div>
                              <input
                                id={inputId}
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={(e) => handleCodeFileChange(e, variationId)}
                                className="hidden"
                              />
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 flex-wrap">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              if (codeFileRef.current) {
                                codeFileRef.current.value = '';
                                codeFileRef.current.click();
                              }
                            }}
                            className="border-[#C64091] text-[#C64091]"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            {codeFile ? 'Change File' : 'Upload Codes'}
                          </Button>
                          {codeFile && (
                            <div className="flex items-center gap-2 text-sm">
                              <FileText className="w-4 h-4 text-[#C64091]" />
                              <span>{codeFile.name}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setCodeFile(null);
                                  setVariantCodeMeta((prev) => {
                                    const next = { ...prev };
                                    delete next.single;
                                    return next;
                                  });
                                }}
                                className="text-[#6B7A99] hover:text-[#C64091]"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                          {typeof variantCodeMeta?.single?.count === 'number' ? (
                            <span className="text-xs text-[#6B7A99]">
                              Parsed codes: {variantCodeMeta.single.count}
                            </span>
                          ) : null}
                        </div>
                        <input
                          ref={codeFileRef}
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={handleCodeFileChange}
                          className="hidden"
                        />
                      </>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-between pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(`/${category}/${prevPath}/${id}`)}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !canSubmit}
                    className="bg-[#C64091] hover:bg-[#A03375] disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {isSubmitting ? 'Saving...' : 'Save & Next'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>


              </form>
            </div>
          </main>
        </div>
      </div >
    </div >
  );
}
