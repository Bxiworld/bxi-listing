import React, { useState, useEffect, useRef } from 'react';
import {
  VOUCHER_JOURNEY_TYPE,
  getVoucherJourneyLabel,
  getVoucherJourneyType,
  getVoucherJourneyTypeFromStorage,
} from '../../utils/voucherType';
import {
  VOUCHER_DELIVERY_TYPE,
  deliveryToRedemptionType,
  normalizeVoucherDeliveryTypeFromProduct,
} from '../../utils/voucherDelivery';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, Upload, FileText, X, Download } from 'lucide-react';
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
import { getPrevNextStepPaths } from '../../config/categoryFormConfig';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '../../components/ui/tooltip';
import { Info } from 'lucide-react';
import { Stepper } from '../AddProduct/AddProductSteps';
import { useScrollToTopOnStepEnter } from '../../hooks/useScrollToTopOnStepEnter';

// Validation aligned with bxi-dashboard TechInfoTemplate: all text fields max 500 characters
const schema = z.object({
  inclusions: z.string().min(1, 'This field is required').max(500, 'This field cannot exceed 500 characters'),
  exclusions: z.string().min(1, 'This field is required').max(500, 'This field cannot exceed 500 characters'),
  termsAndConditions: z.string().min(1, 'This field is required').max(500, 'This field cannot exceed 500 characters'),
  redemptionSteps: z.string().min(1, 'This field is required').max(500, 'This field cannot exceed 500 characters'),
  voucherDeliveryType: z.enum([
    VOUCHER_DELIVERY_TYPE.DIGITAL,
    VOUCHER_DELIVERY_TYPE.PHYSICAL,
    VOUCHER_DELIVERY_TYPE.BOTH,
  ]),
  voucherJourneyType: z.enum([VOUCHER_JOURNEY_TYPE.OFFER_SPECIFIC, VOUCHER_JOURNEY_TYPE.VALUE_GIFT]),
  codeGenerationType: z.enum(['bxi', 'self']),
  onlineRedemptionUrl: z.string().optional().or(z.literal('')),
});

function redemptionStepsToString(rs) {
  if (Array.isArray(rs)) return rs.filter(Boolean).join('\n');
  return rs != null ? String(rs) : '';
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
  };
}

export default function VoucherTechInfo({ category }) {
  useScrollToTopOnStepEnter();
  const navigate = useNavigate();
  const { id } = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productData, setProductData] = useState(null);
  const [codeFile, setCodeFile] = useState(null);
  const [storeListFile, setStoreListFile] = useState(null);
  const [offlineAddress, setOfflineAddress] = useState({
    address: '',
    area: '',
    landmark: '',
    city: '',
    state: '',
  });
  const [cities, setCities] = useState([]);
  const codeFileRef = useRef(null);
  const storeFileRef = useRef(null);
  const hydratedProductIdRef = useRef(null);

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
      const hasAddress =
        offlineAddress.address?.trim() &&
        offlineAddress.area?.trim() &&
        offlineAddress.landmark?.trim() &&
        offlineAddress.city?.trim() &&
        offlineAddress.state?.trim();
      return !!hasAddress || !!storeListFile;
    })();
  const codeGenOk =
    (codeGenerationType || 'bxi') !== 'self' || !!codeFile;
  const canSubmit = hasRequiredText && onlineOk && hasOfflineOk && codeGenOk;

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
    setValue('exclusions', productData.Exclusions ?? '');
    setValue('termsAndConditions', productData.TermConditions ?? productData.TermsAndConditions ?? '');
    setValue('redemptionSteps', redemptionStepsToString(productData.RedemptionSteps));
    const link = (productData.Link ?? productData.OnlineRedemptionURL ?? '').trim();
    setValue('onlineRedemptionUrl', link);
    setOfflineAddress(offlineAddressFromProduct(productData));

    const cg = String(productData.CodeGenerationType ?? productData.codeGenerationType ?? 'bxi')
      .toLowerCase();
    setValue('codeGenerationType', cg === 'self' ? 'self' : 'bxi');
  }, [id, productData, setValue]);

  // Update cities when state changes
  useEffect(() => {
    if (offlineAddress.state) {
      const stateObj = StateData.find((s) => s.name === offlineAddress.state);
      setCities(stateObj?.data || []);
    } else {
      setCities([]);
    }
  }, [offlineAddress.state]);

  const handleCodeFileChange = (e) => {
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
    
    setCodeFile(file);
    toast.success('Code file added');
  };

  const handleStoreListChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Please upload an Excel file (.xlsx or .xls)');
      return;
    }
    
    setStoreListFile(file);
    toast.success('Store list file added');
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

    // bxi: online/both require valid Link (URL)
    if (redemptionTypeValue === 'online' || redemptionTypeValue === 'both') {
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

    // bxi: offline/both require "Complete store address or Store list is required"
    if (redemptionTypeValue === 'offline' || redemptionTypeValue === 'both') {
      const hasAddress = offlineAddress.address?.trim() && offlineAddress.area?.trim() && offlineAddress.landmark?.trim() && offlineAddress.city?.trim() && offlineAddress.state?.trim();
      if (!hasAddress && !storeListFile) {
        toast.error('Complete store address or Store list is required.');
        return;
      }
      if (offlineAddress.address?.trim() && (!offlineAddress.area?.trim() || !offlineAddress.landmark?.trim() || !offlineAddress.city?.trim() || !offlineAddress.state?.trim())) {
        toast.error('Complete store address is required.');
        return;
      }
    }

    // bxi: CodeGenerationType 'self' requires voucher files
    if ((data.codeGenerationType || codeGenerationType) === 'self' && !codeFile) {
      toast.error('Please upload voucher codes Excel file');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('_id', id);
      formData.append('ProductUploadStatus', 'voucherdesign');
      formData.append('Inclusions', data.inclusions);
      formData.append('Exclusions', data.exclusions);
      formData.append('TermConditions', data.termsAndConditions);
      formData.append('RedemptionSteps', data.redemptionSteps);
      formData.append('voucherDeliveryType', delivery);
      formData.append('redemptionType', redemptionTypeValue);
      formData.append('VoucherType', getVoucherJourneyLabel(data.voucherJourneyType));
      formData.append('CodeGenerationType', data.codeGenerationType === 'self' ? 'self' : 'bxi');

      if (url) formData.append('Link', url);

      if (redemptionTypeValue === 'offline' || redemptionTypeValue === 'both') {
        formData.append('Address', offlineAddress.address || '');
        formData.append('Area', offlineAddress.area || '');
        formData.append('Landmark', offlineAddress.landmark || '');
        formData.append('City', offlineAddress.city || '');
        formData.append('State', offlineAddress.state || '');
        if (storeListFile) formData.append('HotelLocations', storeListFile);
      }

      if ((data.codeGenerationType || codeGenerationType) === 'self' && codeFile) {
        formData.append('voucherCodes', codeFile);
      }

      await api.post('/product/product_mutation', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Voucher technical information saved!');
      navigate(`/${category}/${nextPath}/${id}`);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to save. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-8">
      <div className="form-container">
        <div className="stepper-layout">
          <aside className="stepper-rail">
            <Stepper currentStep={3} completedSteps={[1, 2]} />
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
                  Voucher delivery (digital vs physical vs both) is saved as voucherDeliveryType on the product.
                  redemptionType is kept in sync for older flows. Also set voucher type, copy, redemption steps, link or store details, and codes.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Voucher delivery — stored as product.voucherDeliveryType (digital | physical | both) */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Voucher delivery type <span className="text-red-500">*</span></Label>
                <p className="text-xs text-[#6B7A99]">
                  How the voucher is delivered or fulfilled: digitally (e.g. code / link after payment), physically (shipping / in-store handoff),
                  or both. This is separate from redemption instructions below, but URL and address fields follow your choice here.
                </p>
                <RadioGroup
                  value={voucherDeliveryType || VOUCHER_DELIVERY_TYPE.DIGITAL}
                  onValueChange={(value) => setValue('voucherDeliveryType', value)}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-6">
                    <div className="flex items-start space-x-2">
                      <RadioGroupItem value={VOUCHER_DELIVERY_TYPE.DIGITAL} id="delivery-digital" className="mt-1" />
                      <div>
                        <Label htmlFor="delivery-digital" className="cursor-pointer font-medium">
                          Digital delivery
                        </Label>
                        <p className="text-xs text-[#6B7A99] font-normal">Online voucher — buyer gets digital fulfilment (URL after payment).</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <RadioGroupItem value={VOUCHER_DELIVERY_TYPE.PHYSICAL} id="delivery-physical" className="mt-1" />
                      <div>
                        <Label htmlFor="delivery-physical" className="cursor-pointer font-medium">
                          Physical delivery
                        </Label>
                        <p className="text-xs text-[#6B7A99] font-normal">Physical voucher — store list or address; PI / logistics may apply.</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <RadioGroupItem value={VOUCHER_DELIVERY_TYPE.BOTH} id="delivery-both" className="mt-1" />
                      <div>
                        <Label htmlFor="delivery-both" className="cursor-pointer font-medium">
                          Digital and physical
                        </Label>
                        <p className="text-xs text-[#6B7A99] font-normal">Both channels — URL plus offline location details.</p>
                      </div>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {(voucherDeliveryType === VOUCHER_DELIVERY_TYPE.DIGITAL ||
                voucherDeliveryType === VOUCHER_DELIVERY_TYPE.BOTH) && (
                <div className="space-y-2">
                  <Label htmlFor="onlineRedemptionUrl">
                    Add URL <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="onlineRedemptionUrl"
                    type="text"
                    placeholder="https://..."
                    {...register('onlineRedemptionUrl')}
                    className={errors.onlineRedemptionUrl ? 'border-red-500' : ''}
                  />
                  {errors.onlineRedemptionUrl && (
                    <p className="text-sm text-red-500">{errors.onlineRedemptionUrl.message}</p>
                  )}
                </div>
              )}

              {(voucherDeliveryType === VOUCHER_DELIVERY_TYPE.PHYSICAL ||
                voucherDeliveryType === VOUCHER_DELIVERY_TYPE.BOTH) && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Address ( If Single ) Type Below <span className="text-red-500">*</span></Label>
                      <Input
                        placeholder="Address ( If Single ) Type Below"
                        value={offlineAddress.address}
                        onChange={(e) => setOfflineAddress({ ...offlineAddress, address: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Area <span className="text-red-500">*</span></Label>
                      <Input
                        placeholder="Area"
                        value={offlineAddress.area}
                        onChange={(e) => setOfflineAddress({ ...offlineAddress, area: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Landmark <span className="text-red-500">*</span></Label>
                      <Input
                        placeholder="Landmark"
                        value={offlineAddress.landmark}
                        onChange={(e) => setOfflineAddress({ ...offlineAddress, landmark: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>State <span className="text-red-500">*</span></Label>
                      <Select
                        value={offlineAddress.state}
                        onValueChange={(v) => {
                          setOfflineAddress({ ...offlineAddress, state: v, city: '' });
                        }}
                      >
                        <SelectTrigger>
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
                      <Label>City <span className="text-red-500">*</span></Label>
                      <Select
                        value={offlineAddress.city}
                        onValueChange={(v) => setOfflineAddress({ ...offlineAddress, city: v })}
                        disabled={!offlineAddress.state}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select city" />
                        </SelectTrigger>
                        <SelectContent>
                          {cities.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Upload Store List ( If Multiple Locations) </Label>
                    <p className="text-xs text-[#6B7A99]">Optional when both. Upload Excel with store locations.</p>
                    <div className="flex gap-4 items-center">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => storeFileRef.current?.click()}
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
                            onClick={() => setStoreListFile(null)}
                            className="text-[#6B7A99] hover:text-[#C64091]"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <input
                      ref={storeFileRef}
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleStoreListChange}
                      className="hidden"
                    />
                  </div>
                </div>
              )}
            </div>

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
            </div>

            {/* Inclusions */}
            <div className="space-y-2">
              <Label htmlFor="inclusions">
                Inclusions <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="inclusions"
                placeholder="Inclusions"
                rows={4}
                maxLength={501}
                {...register('inclusions')}
                className={errors.inclusions ? 'border-red-500' : ''}
              />
              {errors.inclusions && (
                <p className="text-sm text-red-500">{errors.inclusions.message}</p>
              )}
              <p className="text-xs text-[#6B7A99]">Maximum 500 characters</p>
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
                maxLength={501}
                {...register('exclusions')}
                className={errors.exclusions ? 'border-red-500' : ''}
              />
              {errors.exclusions && (
                <p className="text-sm text-red-500">{errors.exclusions.message}</p>
              )}
              <p className="text-xs text-[#6B7A99]">Maximum 500 characters</p>
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
                maxLength={501}
                {...register('termsAndConditions')}
                className={errors.termsAndConditions ? 'border-red-500' : ''}
              />
              {errors.termsAndConditions && (
                <p className="text-sm text-red-500">{errors.termsAndConditions.message}</p>
              )}
              <p className="text-xs text-[#6B7A99]">Maximum 500 characters</p>
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
                maxLength={501}
                {...register('redemptionSteps')}
                className={errors.redemptionSteps ? 'border-red-500' : ''}
              />
              {errors.redemptionSteps && (
                <p className="text-sm text-red-500">{errors.redemptionSteps.message}</p>
              )}
              <p className="text-xs text-[#6B7A99]">Maximum 500 characters</p>
            </div>

            {/* Code Generation – bxi: "How do you want to upload your voucher codes? (Bxi will generate them for you or you can upload them)" */}
            <div className="space-y-4 pt-4 border-t border-[#E5E8EB]">
              <div className="space-y-2">
                <Label>How do you want to upload your voucher codes? (Bxi will generate them for you or you can upload them) <span className="text-red-500">*</span></Label>
                <RadioGroup
                  value={codeGenerationType || 'bxi'}
                  onValueChange={(value) => setValue('codeGenerationType', value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="bxi" id="bxi-generate" />
                    <Label htmlFor="bxi-generate" className="cursor-pointer font-normal">BXI</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="self" id="upload-codes" />
                    <Label htmlFor="upload-codes" className="cursor-pointer font-normal">Upload Now</Label>
                  </div>
                </RadioGroup>
              </div>

              {codeGenerationType === 'self' && (
                <div className="space-y-2">
                  <Label>Voucher Codes File <span className="text-red-500">*</span></Label>
                  <p className="text-xs text-[#6B7A99]">
                    Upload Excel with voucher codes.
                  </p>
                  <div className="flex gap-4 items-center flex-wrap">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => codeFileRef.current?.click()}
                      className="border-[#C64091] text-[#C64091]"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {codeFile ? 'Change File' : 'Upload Codes'}
                    </Button>
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
                    {codeFile && (
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="w-4 h-4 text-[#C64091]" />
                        <span>{codeFile.name}</span>
                        <button
                          type="button"
                          onClick={() => setCodeFile(null)}
                          className="text-[#6B7A99] hover:text-[#C64091]"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <input
                    ref={codeFileRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleCodeFileChange}
                    className="hidden"
                  />
                </div>
              )}
            </div>

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
      </div>
    </div>
  );
}
