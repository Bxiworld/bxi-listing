import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { ArrowLeft, ArrowRight, Info, Tag, X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { toast } from 'sonner';
import bxitoken from '../../assets/bxi-token.svg';
import api, { productApi } from '../../utils/api';
import { Stepper } from '../AddProduct/AddProductSteps';
import { getVoucherJourneyTypeFromStorage, VOUCHER_JOURNEY_TYPE } from '../../utils/voucherType';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../components/ui/tooltip';

const VALIDITY_OPTIONS = Array.from({ length: 18 }, (_, i) => {
  const n = i + 1;
  return { value: `${n}`, label: `${n} Month${n > 1 ? 's' : ''}` };
});

const GST_OPTIONS = [3, 5, 12, 18, 28];

const FEATURE_MIN = 5;
const FEATURE_MAX = 20;

const OTHER_COST_APPLICABLE = [
  { value: 'All', label: 'One Time Cost' },
  { value: 'PerUnit', label: 'Per Unit' },
];

const isOfferSpecific = () => getVoucherJourneyTypeFromStorage() === VOUCHER_JOURNEY_TYPE.OFFER_SPECIFIC;

// Validation helpers (aligned with bxi-dashboard SizeChartTemplate & OthercostsTemplate)
const HSN_VALID = /^\d{4}$|^\d{6}$|^\d{8}$/;
const validateVariant = (v, isOffer) => {
  const err = {};
  const price = parseFloat(String(v.PricePerUnit || '').replace(/,/g, ''));
  if (!v.PricePerUnit || isNaN(price) || price <= 0) err.PricePerUnit = 'Price must be greater than 0';
  else if (String(v.PricePerUnit).length > 10) err.PricePerUnit = 'Price must be at most 10 characters';

  const totalQty = parseFloat(String(v.TotalAvailableQty || '').replace(/,/g, ''));
  if (!v.TotalAvailableQty || isNaN(totalQty) || totalQty <= 0) err.TotalAvailableQty = 'Value must be greater than 0';
  else if (String(v.TotalAvailableQty).length > 10) err.TotalAvailableQty = 'Value must be at most 10 characters';

  const hsnStr = String(v.HSN || '').trim();
  if (!hsnStr) err.HSN = 'HSN is required';
  else if (!HSN_VALID.test(hsnStr) || /^0+$/.test(hsnStr)) err.HSN = 'HSN must be 4, 6, or 8 digits (not all zeros)';

  const gstVal = v.GST === '' || v.GST == null ? null : Number(v.GST);
  const allowedGST = [0, 3, 5, 12, 18, 28];
  if (gstVal === null || gstVal === undefined) err.GST = 'GST is required';
  else if (!allowedGST.includes(gstVal)) err.GST = 'GST must be 0, 3, 5, 12, 18, or 28';

  const minQty = parseFloat(String(v.MinOrderQuantity || '1').replace(/,/g, ''));
  if (isNaN(minQty) || minQty <= 0) err.MinOrderQuantity = 'Minimum Quantity must be greater than 0';
  else if (String(v.MinOrderQuantity || '').length > 10) err.MinOrderQuantity = 'Min must be at most 10 characters';

  if (v.MaxOrderQuantity) {
    const maxQty = parseFloat(String(v.MaxOrderQuantity).replace(/,/g, ''));
    if (isNaN(maxQty) || maxQty <= 0) err.MaxOrderQuantity = 'Maximum Quantity must be greater than 0';
    else if (maxQty < minQty) err.MaxOrderQuantity = 'Max Order Quantity cannot be less than Min Order Quantity';
    else if (!isNaN(totalQty) && maxQty > totalQty) err.MaxOrderQuantity = 'Max Order Quantity cannot be greater than Total Quantity';
  }

  if (!v.validityOfVoucherValue) err.validityOfVoucherValue = 'Validity is required';

  if (isOffer) {
    const ot = String(v.OfferingType || '').trim();
    if (!ot) err.OfferingType = 'Offering Type is required';
    else if (ot.length > 25) err.OfferingType = 'Offering Type must be at most 25 characters';
  }
  return err;
};

const validateOtherCost = (o) => {
  const err = {};
  const cost = parseFloat(String(o.CostPrice || '').replace(/,/g, ''));
  if (!o.CostPrice || isNaN(cost) || cost <= 0) err.CostPrice = 'Cost price is required and cannot be zero';
  const hsnStr = String(o.AdCostHSN || '').trim();
  if (!hsnStr) err.AdCostHSN = 'HSN is required';
  else if (!HSN_VALID.test(hsnStr) || /^0+$/.test(hsnStr)) err.AdCostHSN = 'HSN must be 4, 6, or 8 digits (not all zeros)';
  const gst = Number(o.AdCostGST);
  if (![3, 5, 12, 18, 28].includes(gst)) err.AdCostGST = 'Please enter GST value (3, 5, 12, 18, or 28)';
  const reason = String(o.ReasonOfCost || '').trim();
  if (!reason) err.ReasonOfCost = 'Reason of cost is required';
  else if (reason.length > 75) err.ReasonOfCost = 'Reason must be at most 75 characters';
  return err;
};

export default function HotelsProductInfo({ category }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productData, setProductData] = useState(null);
  const [HSNStore, setHSNStore] = useState([]);
  const [allFeatures, setAllFeatures] = useState([]);
  const [tags, setTags] = useState([]);
  const [currentTag, setCurrentTag] = useState('');
  const [featureItems, setFeatureItems] = useState([]);
  const [featureName, setFeatureName] = useState('');
  const [featureDescription, setFeatureDescription] = useState('');
  const [featureNameDuplicate, setFeatureNameDuplicate] = useState(false);
  const [addFeatureClicked, setAddFeatureClicked] = useState(false);
  const [variantErrors, setVariantErrors] = useState({});
  const [otherCostErrors, setOtherCostErrors] = useState({});
  const [submitSectionErrors, setSubmitSectionErrors] = useState(null);

  const prevPath = 'generalinformation';
  const nextPath = 'hotelstechinfo';

  const { register, handleSubmit, setValue, getValues, watch, control, formState: { errors } } = useForm({
    defaultValues: {
      ProductsVariantions: [],
      OtherCost: [],
    },
  });

  const { fields: variantFields, append: appendVariant, remove: removeVariant, update: updateVariant, replace: replaceVariants } = useFieldArray({
    control,
    name: 'ProductsVariantions',
  });

  const { fields: otherCostFields, append: appendOtherCost, remove: removeOtherCost, update: updateOtherCost, replace: replaceOtherCosts } = useFieldArray({
    control,
    name: 'OtherCost',
  });

  // New variant row form state (for "Add" before appending)
  const [newVariant, setNewVariant] = useState({
    PricePerUnit: '',
    TotalAvailableQty: '',
    HSN: '',
    GST: '',
    MinOrderQuantity: '1',
    MaxOrderQuantity: '',
    TotalValueUploaded: '',
    validityOfVoucherValue: '12',
    validityOfVoucherUnit: 'Months',
    OfferingType: '',
  });
  const [editVariantIndex, setEditVariantIndex] = useState(null);

  // Other cost row form state
  const [newOtherCost, setNewOtherCost] = useState({
    AdCostApplicableOn: 'All',
    CostPrice: '',
    currencyType: 'INR',
    AdCostHSN: '',
    AdCostGST: 18,
    ReasonOfCost: '',
  });
  const [editOtherCostIndex, setEditOtherCostIndex] = useState(null);

  const isGSTZeroSelected = variantFields.some((row) => String(row?.GST) === '0');
  const canProceed = variantFields.length > 0 && featureItems.length >= FEATURE_MIN && tags.length > 0;

  // Fetch product, HSN, hotel features
  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      try {
        const res = await productApi.getProductById(id);
        const data = res?.data;
        setProductData(data);
        if (data?.ProductsVariantions?.length) {
          replaceVariants(data.ProductsVariantions);
        }
        if (data?.OtherCost?.length) {
          replaceOtherCosts(data.OtherCost);
        }
        if (data?.ProductFeatures?.length) {
          setFeatureItems(data.ProductFeatures.map((f) => ({ name: f.name || f.featureName, description: f.description || '' })));
        }
        if (data?.Tags?.length) {
          setTags(Array.isArray(data.Tags) ? data.Tags : []);
        }
      } catch (e) {
        toast.error('Failed to load product');
      }
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (!productData?.ProductSubCategory) return;
    const subCatId = productData.ProductSubCategory;
    api.post('hsn/Get_HSNCode', { SubCatId: subCatId }, { withCredentials: true })
      .then((res) => {
        if (res?.data && res.data !== 'No Data Found') {
          const list = Array.isArray(res.data) ? res.data : (res.data?.data ? [].concat(res.data.data) : []);
          setHSNStore(list);
        }
      })
      .catch(() => {});
  }, [productData?.ProductSubCategory]);

  useEffect(() => {
    api.get('hotelfeature/Get_hotel_feature', { withCredentials: true })
      .then((res) => {
        const raw = res?.data?.data ?? res?.data;
        const list = Array.isArray(raw) ? raw : [];
        const sorted = [...list].sort((a, b) => (a?.SampleCategoryFeature || '').localeCompare(b?.SampleCategoryFeature || ''));
        setAllFeatures(sorted);
      })
      .catch(() => {});
  }, []);

  const handleAddVariant = () => {
    const v = newVariant;
    const err = validateVariant(v, isOfferSpecific());
    setVariantErrors(err);
    if (Object.keys(err).length > 0) {
      toast.error('Please fix variant errors before adding.');
      return;
    }
    const totalUploadedValue =
      Number(v.PricePerUnit || 0) * Number(v.TotalAvailableQty || 0);
    const payload = {
      PricePerUnit: String(v.PricePerUnit).trim(),
      TotalAvailableQty: String(v.TotalAvailableQty).trim(),
      HSN: String(v.HSN).trim(),
      GST: String(v.GST),
      MinOrderQuantity: String(v.MinOrderQuantity || '1').trim(),
      MaxOrderQuantity: v.MaxOrderQuantity ? String(v.MaxOrderQuantity).trim() : '',
      TotalValueUploaded: Number.isFinite(totalUploadedValue)
        ? String(totalUploadedValue.toFixed(2))
        : '',
      validityOfVoucherValue: String(v.validityOfVoucherValue),
      validityOfVoucherUnit: v.validityOfVoucherUnit || 'Months',
      ...(isOfferSpecific() ? { OfferingType: String(v.OfferingType || '').trim().slice(0, 25) } : {}),
    };
    const wasEdit = editVariantIndex !== null;
    if (wasEdit) {
      updateVariant(editVariantIndex, payload);
      setEditVariantIndex(null);
    } else {
      appendVariant(payload);
    }
    setNewVariant({
      PricePerUnit: '',
      TotalAvailableQty: '',
      HSN: '',
      GST: '',
      MinOrderQuantity: '1',
      MaxOrderQuantity: '',
      TotalValueUploaded: '',
      validityOfVoucherValue: '12',
      validityOfVoucherUnit: 'Months',
      OfferingType: '',
    });
    setVariantErrors({});
    toast.success(wasEdit ? 'Variant updated' : 'Variant added');
  };

  const handleEditVariant = (index) => {
    const row = variantFields[index];
    if (row) {
      setNewVariant({
        PricePerUnit: row.PricePerUnit ?? '',
        TotalAvailableQty: row.TotalAvailableQty ?? '',
        HSN: row.HSN ?? '',
        GST: row.GST ?? '',
        MinOrderQuantity: row.MinOrderQuantity ?? '1',
        MaxOrderQuantity: row.MaxOrderQuantity ?? '',
        TotalValueUploaded: row.TotalValueUploaded ?? '',
        validityOfVoucherValue: row.validityOfVoucherValue ?? '12',
        validityOfVoucherUnit: row.validityOfVoucherUnit ?? 'Months',
        OfferingType: row.OfferingType ?? '',
      });
      setEditVariantIndex(index);
    }
  };

  const handleAddOtherCost = () => {
    const o = newOtherCost;
    const err = validateOtherCost(o);
    setOtherCostErrors(err);
    if (Object.keys(err).length > 0) {
      toast.error('Please fix additional cost errors before adding.');
      return;
    }
    const payload = {
      AdCostApplicableOn: o.AdCostApplicableOn || 'All',
      CostPrice: String(o.CostPrice).trim(),
      currencyType: o.currencyType || 'INR',
      AdCostHSN: String(o.AdCostHSN).trim(),
      AdCostGST: Number(o.AdCostGST),
      ReasonOfCost: String(o.ReasonOfCost).trim().slice(0, 75),
    };
    const wasEdit = editOtherCostIndex !== null;
    if (wasEdit) {
      updateOtherCost(editOtherCostIndex, payload);
      setEditOtherCostIndex(null);
    } else {
      appendOtherCost(payload);
    }
    setNewOtherCost({
      AdCostApplicableOn: 'All',
      CostPrice: '',
      currencyType: 'INR',
      AdCostHSN: '',
      AdCostGST: 18,
      ReasonOfCost: '',
    });
    setOtherCostErrors({});
    toast.success(wasEdit ? 'Other cost updated' : 'Other cost added');
  };

  const handleEditOtherCost = (index) => {
    const row = otherCostFields[index];
    if (row) {
      setNewOtherCost({
        AdCostApplicableOn: row.AdCostApplicableOn ?? 'All',
        CostPrice: row.CostPrice ?? '',
        currencyType: row.currencyType ?? 'INR',
        AdCostHSN: row.AdCostHSN ?? '',
        AdCostGST: row.AdCostGST ?? 18,
        ReasonOfCost: row.ReasonOfCost ?? '',
      });
      setEditOtherCostIndex(index);
    }
  };

  const handleAddFeature = (e) => {
    e.preventDefault();
    setAddFeatureClicked(true);
    const name = featureName?.trim() || '';
    const description = featureDescription?.trim() || '';
    if (!name || !description) {
      toast.error('Feature name and description are required');
      return;
    }
    if (description.length > 75) {
      toast.error('Feature description must be at most 75 characters');
      return;
    }
    if (featureItems.length >= FEATURE_MAX) {
      toast.error(`Features cannot be more than ${FEATURE_MAX}`);
      return;
    }
    const nameLower = name.toLowerCase();
    if (nameLower !== 'other' && nameLower !== 'others') {
      const exists = featureItems.some((item) => item.name === name);
      if (exists) {
        setFeatureNameDuplicate(true);
        return;
      }
    }
    setFeatureNameDuplicate(false);
    setFeatureItems((prev) => [...prev, { name, description }]);
    setFeatureName('');
    setFeatureDescription('');
  };

  const handleRemoveFeature = (index) => {
    setFeatureItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter') e.preventDefault();
    const val = (e.key === 'Enter' ? currentTag : currentTag).trim().slice(0, 15);
    if (!val) return;
    if (tags.includes(val)) return;
    setTags((prev) => [...prev, val]);
    setCurrentTag('');
  };

  const handleDeleteTag = (tag) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const onSubmit = async () => {
    if (!id) {
      toast.error('Product ID missing');
      return;
    }
    setSubmitSectionErrors(null);
    if (variantFields.length === 0) {
      setSubmitSectionErrors('Add at least one variant.');
      toast.error('Add at least one variant.');
      return;
    }
    if (featureItems.length < FEATURE_MIN) {
      setSubmitSectionErrors(`Add at least ${FEATURE_MIN} product features.`);
      toast.error(`Add at least ${FEATURE_MIN} product features.`);
      return;
    }
    if (featureItems.length > FEATURE_MAX) {
      setSubmitSectionErrors(`Product features cannot exceed ${FEATURE_MAX}.`);
      toast.error(`Product features cannot exceed ${FEATURE_MAX}.`);
      return;
    }
    if (tags.length === 0) {
      setSubmitSectionErrors('Add at least one tag.');
      toast.error('Add at least one tag.');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        _id: id,
        ProductsVariantions: getValues('ProductsVariantions') || variantFields.map((f) => ({ ...f })),
        OtherCost: isGSTZeroSelected ? [] : (getValues('OtherCost') || otherCostFields.map((f) => ({ ...f }))),
        ProductFeatures: featureItems,
        Tags: tags,
        ProductUploadStatus: 'productinformation',
      };
      await productApi.productMutation(payload);
      toast.success('Saved. Proceeding to Technical Information.');
      navigate(`/${category}/${nextPath}/${id}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tableColumnDefs = isOfferSpecific()
    ? [
        { label: 'Price/Voucher', key: 'PricePerUnit' },
        { label: 'Total QTY', key: 'TotalAvailableQty' },
        { label: 'HSN', key: 'HSN' },
        { label: 'GST', key: 'GST' },
        { label: 'Min', key: 'MinOrderQuantity' },
        { label: 'Max', key: 'MaxOrderQuantity' },
        { label: 'Total Uploaded Value', key: 'TotalValueUploaded' },
        { label: 'Offering Type', key: 'OfferingType' },
        { label: 'Validity', key: 'validityOfVoucherValue' },
      ]
    : [
        { label: 'Price/Voucher', key: 'PricePerUnit' },
        { label: 'Total QTY', key: 'TotalAvailableQty' },
        { label: 'HSN', key: 'HSN' },
        { label: 'GST', key: 'GST' },
        { label: 'Min', key: 'MinOrderQuantity' },
        { label: 'Max', key: 'MaxOrderQuantity' },
        { label: 'Total Uploaded Value', key: 'TotalValueUploaded' },
        { label: 'Validity', key: 'validityOfVoucherValue' },
      ];

  const hsnOptions = HSNStore.map((h) => {
    const code = h?.HSNCode ?? h?.hsn ?? h;
    const val = typeof code === 'object' ? code?.code ?? code?.value : code;
    return { value: String(val), label: String(val) };
  });
  const selectedFeatureNames = new Set(
    featureItems.map((item) => String(item?.name || '').trim().toLowerCase())
  );
  const availableFeatures = allFeatures.filter((f) => {
    const name = String(f?.SampleCategoryFeature ?? f?.name ?? f).trim();
    return !selectedFeatureNames.has(name.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-8">
      <div className="form-container">
        <div className="stepper-layout">
          <aside className="stepper-rail">
            <Stepper currentStep={2} completedSteps={[1]} />
          </aside>
          <main className="stepper-content">
        <div className="form-section">
          <h2 className="text-lg font-semibold">Voucher Information - Hotel</h2>
          <p className="text-xs mb-2 text-gray-500 font-medium">
            Complete your product details to make it discoverable.
          </p>

          {/* Variants: add form + table */}
          <div className="space-y-4 pt-2">
            <h3 className="text-base font-semibold text-[#111827]">Variants</h3>
            {submitSectionErrors && (
              <p className="text-sm text-red-500 bg-red-50 p-2 rounded">{submitSectionErrors}</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Price/Voucher <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    value={newVariant.PricePerUnit}
                    onChange={(e) => { setNewVariant((p) => ({ ...p, PricePerUnit: e.target.value })); setVariantErrors((prev) => ({ ...prev, PricePerUnit: undefined })); }}
                    placeholder="e.g. 1000"
                    className={`pr-10 ${variantErrors.PricePerUnit ? 'border-red-500' : ''}`}
                  />
                  <img
                    src={bxitoken}
                    alt="Barter coin"
                    className="pointer-events-none absolute right-3 top-1/2 h-6 w-6 -translate-y-1/2"
                  />
                </div>
                {variantErrors.PricePerUnit && <p className="text-xs text-red-500 mt-0.5">{variantErrors.PricePerUnit}</p>}
              </div>
              <div className="space-y-2">
                <Label>Total Available QTY <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  min={0}
                  step="any"
                  value={newVariant.TotalAvailableQty}
                  onChange={(e) => { setNewVariant((p) => ({ ...p, TotalAvailableQty: e.target.value })); setVariantErrors((prev) => ({ ...prev, TotalAvailableQty: undefined })); }}
                  placeholder="e.g. 10"
                  className={variantErrors.TotalAvailableQty ? 'border-red-500' : ''}
                />
                {variantErrors.TotalAvailableQty && <p className="text-xs text-red-500 mt-0.5">{variantErrors.TotalAvailableQty}</p>}
              </div>
              <div className="space-y-2">
                <Label>HSN <span className="text-red-500">*</span></Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={8}
                  value={newVariant.HSN}
                  onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); setNewVariant((p) => ({ ...p, HSN: v })); setVariantErrors((prev) => ({ ...prev, HSN: undefined })); }}
                  placeholder="4, 6 or 8 digits"
                  className={variantErrors.HSN ? 'border-red-500' : ''}
                />
                {variantErrors.HSN && <p className="text-xs text-red-500 mt-0.5">{variantErrors.HSN}</p>}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label>GST <span className="text-red-500">*</span></Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" className="text-[#6B7A99] hover:text-[#C64091]">
                          <Info className="w-3.5 h-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Collecting maximum GST of the entire product range is recommended.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Select
                  value={String(newVariant.GST)}
                  onValueChange={(val) => { setNewVariant((p) => ({ ...p, GST: val })); setVariantErrors((prev) => ({ ...prev, GST: undefined })); }}
                >
                  <SelectTrigger className={variantErrors.GST ? 'border-red-500' : ''}><SelectValue placeholder="GST" /></SelectTrigger>
                  <SelectContent>
                    {GST_OPTIONS.map((g) => (
                      <SelectItem key={g} value={String(g)}>{g}%</SelectItem>
                    ))}
                    <SelectItem value="0">P.I.</SelectItem>
                  </SelectContent>
                </Select>
                {variantErrors.GST && <p className="text-xs text-red-500 mt-0.5">{variantErrors.GST}</p>}
              </div>
              <div className="space-y-2">
                <Label>Min Order Quantity</Label>
                <Input
                  type="number"
                  min={1}
                  value={newVariant.MinOrderQuantity}
                  onChange={(e) => { setNewVariant((p) => ({ ...p, MinOrderQuantity: e.target.value })); setVariantErrors((prev) => ({ ...prev, MinOrderQuantity: undefined, MaxOrderQuantity: undefined })); }}
                  placeholder="1"
                  className={variantErrors.MinOrderQuantity ? 'border-red-500' : ''}
                />
                {variantErrors.MinOrderQuantity && <p className="text-xs text-red-500 mt-0.5">{variantErrors.MinOrderQuantity}</p>}
              </div>
              <div className="space-y-2">
                <Label>Max Order Quantity</Label>
                <Input
                  type="number"
                  min={1}
                  value={newVariant.MaxOrderQuantity}
                  onChange={(e) => { setNewVariant((p) => ({ ...p, MaxOrderQuantity: e.target.value })); setVariantErrors((prev) => ({ ...prev, MaxOrderQuantity: undefined })); }}
                  placeholder="Optional"
                  className={variantErrors.MaxOrderQuantity ? 'border-red-500' : ''}
                />
                {variantErrors.MaxOrderQuantity && <p className="text-xs text-red-500 mt-0.5">{variantErrors.MaxOrderQuantity}</p>}
              </div>
              <div className="space-y-2">
                <Label>Total Uploaded Value</Label>
                <Input
                  type="number"
                  value={
                    
                    (Number(newVariant.PricePerUnit || 0) *
                      Number(newVariant.TotalAvailableQty || 0)).toFixed(2)
                  }
                  readOnly
                  className="bg-gray-100 cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <Label>Validity of Voucher <span className="text-red-500">*</span></Label>
                <Select
                  value={newVariant.validityOfVoucherValue}
                  onValueChange={(val) => { setNewVariant((p) => ({ ...p, validityOfVoucherValue: val })); setVariantErrors((prev) => ({ ...prev, validityOfVoucherValue: undefined })); }}
                >
                  <SelectTrigger className={variantErrors.validityOfVoucherValue ? 'border-red-500' : ''}><SelectValue placeholder="Validity" /></SelectTrigger>
                  <SelectContent>
                    {VALIDITY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {variantErrors.validityOfVoucherValue && <p className="text-xs text-red-500 mt-0.5">{variantErrors.validityOfVoucherValue}</p>}
              </div>
              {isOfferSpecific() && (
                <div className="space-y-2">
                  <Label>Offering Type <span className="text-red-500">*</span></Label>
                  <Input
                    value={newVariant.OfferingType}
                    onChange={(e) => setNewVariant((p) => ({ ...p, OfferingType: e.target.value.slice(0, 25) }))}
                    placeholder="e.g. Deluxe Room"
                    maxLength={25}
                    className={variantErrors.OfferingType ? 'border-red-500' : ''}
                  />
                  {variantErrors.OfferingType && <p className="text-xs text-red-500 mt-0.5">{variantErrors.OfferingType}</p>}
                </div>
              )}
            </div>

            <div className="space-y-4 pt-4">
              <Button
                type="button"
                onClick={handleAddVariant}
                className="w-full"
                data-testid="btn-add-variation"
              >
                {editVariantIndex !== null ? 'Update variation' : 'Proceed to Add'}
              </Button>
              {variantFields.length === 0 && (
                <p className="text-sm text-gray-500 mt-3">No variations added yet</p>
              )}
              {variantFields.length > 0 && (
                <div className="mt-4 overflow-x-auto rounded-md border border-[#E5E8EB]">
                  <table className="w-full border-collapse bg-white text-sm">
                    <thead className="bg-[#F9FAFB] text-[#374151]">
                      <tr>
                        {tableColumnDefs.map((col) => (
                          <th key={col.key} className="px-3 py-2 text-center font-medium">
                            {col.label}
                          </th>
                        ))}
                        <th className="px-3 py-2 text-center font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody className="text-center">
                      {variantFields.map((row, idx) => (
                        <tr
                          key={row.id}
                          className="border-t border-[#E5E8EB] hover:bg-[#F9FAFB]"
                        >
                          {tableColumnDefs.map((col) => {
                            let cell = row[col.key];
                            if (col.key === 'validityOfVoucherValue') {
                              cell = row.validityOfVoucherValue
                                ? `${row.validityOfVoucherValue} ${row.validityOfVoucherUnit || 'Months'}`.trim()
                                : '—';
                            } else if (col.key === 'PricePerUnit') {
                              cell = row.PricePerUnit
                                ? `${Number(row.PricePerUnit).toLocaleString('en-IN')}`
                                : '—';
                            } else if (col.key === 'TotalValueUploaded') {
                              const totalN = Number(row.TotalValueUploaded);
                              cell =
                                row.TotalValueUploaded !== '' &&
                                row.TotalValueUploaded != null &&
                                Number.isFinite(totalN)
                                  ? totalN.toLocaleString('en-IN')
                                  : '—';
                            } else if (col.key === 'GST') {
                              cell = row.GST !== '' && row.GST != null ? `${row.GST}%` : '—';
                            } else if (cell === '' || cell == null) {
                              cell = '—';
                            }
                            return (
                              <td key={col.key} className="px-3 py-2 text-[#111827]">
                                {cell}
                              </td>
                            );
                          })}
                          <td className="px-3 py-2 text-center">
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleEditVariant(idx)}
                                className="text-[#6B7A99] hover:text-[#C64091] px-2 py-1 text-xs font-medium rounded border border-[#E5E8EB] hover:border-[#C64091]"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => removeVariant(idx)}
                                className="text-[#6B7A99] hover:text-[#C64091] p-1"
                                aria-label="Remove variation"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Other costs (only when no variant has GST 0) */}
          {!isGSTZeroSelected && (
            <div className="space-y-4 pt-4">
              <h3 className="text-base font-semibold text-[#111827]">
                Additional Cost <span className="text-sm font-normal text-[#6B7A99]">(Additional cost is not mandatory)</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Applicable On</Label>
                  <Select
                    value={newOtherCost.AdCostApplicableOn}
                    onValueChange={(val) => setNewOtherCost((p) => ({ ...p, AdCostApplicableOn: val }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {OTHER_COST_APPLICABLE.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Cost Price</Label>
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    placeholder="0"
                    value={newOtherCost.CostPrice}
                    onChange={(e) => { setNewOtherCost((p) => ({ ...p, CostPrice: e.target.value })); setOtherCostErrors((prev) => ({ ...prev, CostPrice: undefined })); }}
                    className={otherCostErrors.CostPrice ? 'border-red-500' : ''}
                  />
                  {otherCostErrors.CostPrice && <p className="text-xs text-red-500 mt-0.5">{otherCostErrors.CostPrice}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select
                    value={newOtherCost.currencyType}
                    onValueChange={(val) => setNewOtherCost((p) => ({ ...p, currencyType: val }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                      <SelectItem value="BXITokens">
                        BXI Tokens{' '}
                        <img src={bxitoken} alt="BXI Token" className="w-4 h-4 inline-block ml-1 align-middle" />
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>HSN (4/6/8 digits)</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={8}
                    placeholder="e.g. 9983"
                    value={newOtherCost.AdCostHSN}
                    onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); setNewOtherCost((p) => ({ ...p, AdCostHSN: v })); setOtherCostErrors((prev) => ({ ...prev, AdCostHSN: undefined })); }}
                    className={otherCostErrors.AdCostHSN ? 'border-red-500' : ''}
                  />
                  {otherCostErrors.AdCostHSN && <p className="text-xs text-red-500 mt-0.5">{otherCostErrors.AdCostHSN}</p>}
                </div>
                <div className="space-y-2">
                  <Label>GST %</Label>
                  <Select
                    value={String(newOtherCost.AdCostGST)}
                    onValueChange={(val) => { setNewOtherCost((p) => ({ ...p, AdCostGST: Number(val) })); setOtherCostErrors((prev) => ({ ...prev, AdCostGST: undefined })); }}
                  >
                    <SelectTrigger className={otherCostErrors.AdCostGST ? 'border-red-500' : ''}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {GST_OPTIONS.map((g) => (
                        <SelectItem key={g} value={String(g)}>{g}%</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {otherCostErrors.AdCostGST && <p className="text-xs text-red-500 mt-0.5">{otherCostErrors.AdCostGST}</p>}
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Reason of Cost</Label>
                  <Input
                    placeholder="Describe the cost"
                    value={newOtherCost.ReasonOfCost}
                    onChange={(e) => { setNewOtherCost((p) => ({ ...p, ReasonOfCost: e.target.value.slice(0, 75) })); setOtherCostErrors((prev) => ({ ...prev, ReasonOfCost: undefined })); }}
                    maxLength={75}
                    className={otherCostErrors.ReasonOfCost ? 'border-red-500' : ''}
                  />
                  {otherCostErrors.ReasonOfCost && <p className="text-xs text-red-500 mt-0.5">{otherCostErrors.ReasonOfCost}</p>}
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={handleAddOtherCost}
                    className="w-full"
                  >
                    {editOtherCostIndex !== null ? 'Update Additional Cost' : 'Add Additional Cost'}
                  </Button>
                </div>
              </div>
              {otherCostFields.length === 0 && (
                <p className="text-sm text-gray-500 mt-3">No additional costs added yet.</p>
              )}
              {otherCostFields.length > 0 && (
                <div className="mt-4 overflow-x-auto rounded-md border border-[#E5E8EB]">
                  <table className="w-full border-collapse bg-white text-sm">
                    <thead className="bg-[#F9FAFB] text-[#374151]">
                      <tr>
                        <th className="px-3 py-2 text-center font-medium">Applicable On</th>
                        <th className="px-3 py-2 text-center font-medium">Cost Price</th>
                        <th className="px-3 py-2 text-center font-medium">Currency</th>
                        <th className="px-3 py-2 text-center font-medium">HSN</th>
                        <th className="px-3 py-2 text-center font-medium">GST</th>
                        <th className="px-3 py-2 text-center font-medium">Reason</th>
                        <th className="px-3 py-2 text-center font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody className="text-center">
                      {otherCostFields.map((row, idx) => (
                        <tr
                          key={row.id}
                          className="border-t border-[#E5E8EB] hover:bg-[#F9FAFB]"
                        >
                          <td className="px-3 py-2">
                            {row.AdCostApplicableOn === 'All' ? 'One Time' : 'Per Unit'}
                          </td>
                          <td className="px-3 py-2 font-medium">{row.CostPrice}</td>
                          <td className="px-3 py-2">
                            {row.currencyType === 'BXITokens' ? (
                              <img src={bxitoken} alt="BXI Token" className="w-4 h-4 inline-block mx-auto" />
                            ) : (
                              '₹'
                            )}
                          </td>
                          <td className="px-3 py-2">{row.AdCostHSN}</td>
                          <td className="px-3 py-2">{row.AdCostGST}%</td>
                          <td className="px-3 py-2 max-w-[250px] truncate">{row.ReasonOfCost}</td>
                          <td className="px-3 py-2 text-center">
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleEditOtherCost(idx)}
                                className="text-[#6B7A99] hover:text-[#C64091] px-2 py-1 text-xs font-medium rounded border border-[#E5E8EB] hover:border-[#C64091]"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => removeOtherCost(idx)}
                                className="text-[#6B7A99] hover:text-[#C64091] p-1"
                                aria-label="Remove additional cost"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Product features (aligned with AddProductSteps ProductInfo) */}
          <div className="space-y-4 pt-4">
          <div>
            <h3 className="text-base font-semibold text-[#111827]">
              Voucher Features
            </h3>
            <p className="text-sm font-normal text-[#6B7A99]">
              Select the best features that describe your brand/product.
              <span className="block">
                (The more features you write, the more you are discovered)
              </span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Select Best Features <span className="text-red-500">*</span>
              </Label>
              <Select
                value={featureName}
                onValueChange={(val) => {
                  setFeatureName(val);
                  setFeatureNameDuplicate(false);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a feature" />
                </SelectTrigger>
                <SelectContent>
                  {availableFeatures.map((f) => {
                    const name = f?.SampleCategoryFeature ?? f?.name ?? f;
                    return (
                      <SelectItem key={name} value={String(name)}>
                        {String(name)}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Feature Description <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Eg. Smart watch (max 75 characters)"
                maxLength={75}
                value={featureDescription}
                onChange={(e) =>
                  setFeatureDescription(e.target.value.slice(0, 75))
                }
              />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                onClick={handleAddFeature}
                disabled={
                  featureItems.length >= FEATURE_MAX ||
                  !featureName?.trim() ||
                  !featureDescription?.trim()
                }
                className="w-full"
              >
                Add Feature
              </Button>
            </div>
          </div>

          {addFeatureClicked && featureItems.length < FEATURE_MIN && (
            <p className="text-sm text-red-500">
              Add at least {FEATURE_MIN - featureItems.length} more feature(s).
            </p>
          )}

          {featureNameDuplicate && (
            <p className="text-sm text-red-500">
              This feature is already added.
            </p>
          )}

          <div className="flex items-center justify-between">
            <p className="text-sm text-[#6B7A99]">
              Minimum {FEATURE_MIN} required • Max {FEATURE_MAX}
            </p>
            <span
              className={`px-3 py-1 text-xs font-medium rounded-full ${
                featureItems.length >= FEATURE_MIN
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}
            >
              {featureItems.length}/{FEATURE_MAX}
            </span>
          </div>

          {featureItems.length > 0 ? (
            <div className="space-y-3">
              {featureItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between gap-3 rounded-lg border border-[#E5E8EB] bg-[#F9FAFB] px-4 py-3 hover:shadow-sm transition"
                >
                  <div>
                    <p className="font-medium text-[#111827]">
                      {item.name}
                    </p>
                    {item.description && item.description !== item.name && (
                      <p className="text-sm text-[#6B7A99] mt-1">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFeature(idx)}
                    className="text-[#6B7A99] hover:text-[#C64091]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-gray-300 p-4 text-center text-sm text-gray-500">
              No features added yet. Add at least {FEATURE_MIN} features.
            </div>
          )}
        </div>

          {/* Tags (min 1, max 15 chars per tag) */}
          <div className="space-y-3 pt-6 border-t border-[#E5E8EB]">
            <Label>Tags <span className="text-red-500">*</span> </Label>
            <div className="flex gap-2">
              <Input
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value.slice(0, 15))}
                onKeyDown={(e) => {
                  if (e.key === ' ' && e.target.selectionStart === 0) e.preventDefault();
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag(e);
                  }
                }}
                placeholder="Type and press Enter or click Add"
              />
              <Button
                type="button"
                onClick={() => handleAddTag({ key: '' })}
                disabled={!currentTag.trim() || tags.includes(currentTag.trim())}
                className="shrink-0"
              >
                <Tag className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#F3F4F6] text-sm text-[#6B7A99]"
                >
                  {t}
                  <button type="button" onClick={() => handleDeleteTag(t)} className="text-red-500 hover:text-red-700"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-6 border-t border-[#E5E8EB]">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/${category}/${prevPath}/${id}`)}
              className="border-[#6B7280] text-[#374151] hover:bg-[#F9FAFB]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              type="button"
              disabled={!canProceed || isSubmitting}
              onClick={onSubmit}
              className="bg-[#C64091] hover:bg-[#A03375] disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSubmitting ? 'Saving...' : 'Save & Next'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
          </main>
        </div>
      </div>
    </div>
  );
}
