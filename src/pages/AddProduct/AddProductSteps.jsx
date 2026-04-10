import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { ArrowLeft, ArrowRight, Save, CheckCircle2, Info, X, CloudUpload, ImageIcon, Trash2, Tag, Calendar as CalendarIcon } from 'lucide-react';
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
import { ToggleGroup, ToggleGroupItem } from '../../components/ui/toggle-group';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { productApi } from '../../utils/api';
import api from '../../utils/api';
import {
  PRODUCT_TYPE_BY_CATEGORY,
  getGeneralInfoConfig,
  getProductInfoConfig,
  getTechInfoConfig,
  getSubcategoryEndpoint,
  getFeatureEndpoint,
  getPrevNextStepPaths,
  getVoucherProductInfoConfig,
  getValidationSchema,
  QSR_HARDCODED_FEATURES,
} from '../../config/categoryFormConfig';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../components/ui/popover';
import { Calendar } from '../../components/ui/calendar';
import { Checkbox } from '../../components/ui/checkbox';
import StateData from '../../utils/StateCityArray.json';
import { supportsBulkUpload, downloadBulkUploadTemplate } from '../../utils/excelTemplates';
import { Divider } from '@mui/material';
import { InfoIcon } from 'lucide-react';
import bxitoken from '../../assets/bxi-token.svg';
import {
  getVoucherJourneyTypeFromStorage,
  getVoucherJourneyLabel,
  VOUCHER_JOURNEY_TYPE,
} from '../../utils/voucherType';
import { useScrollToTopOnStepEnter } from '../../hooks/useScrollToTopOnStepEnter';

/** Label for dimension option buttons: keeps values as-is for form state, splits camelCase for display. */
function formatSizeOptionButtonLabel(opt) {
  if (typeof opt !== 'string') return opt;
  if (opt.includes(' ')) return opt;
  return opt.replace(/([a-z])([A-Z])/g, '$1 $2');
}

const STATE_REGION_MAP = {
  'Delhi': 'North', 'Haryana': 'North', 'Punjab': 'North', 'Uttar Pradesh': 'North',
  'Rajasthan': 'North', 'Himachal Pradesh': 'North', 'Uttarakhand': 'North',
  'Jammu Kashmir': 'North', 'Chandigarh': 'North', 'Ladakh': 'North',
  'Maharashtra': 'West', 'Gujarat': 'West', 'Goa': 'West', 'Madhya Pradesh': 'Central',
  'Chhattisgarh': 'Central', 'West Bengal': 'East', 'Bihar': 'East', 'Jharkhand': 'East',
  'Odisha': 'East', 'Assam': 'East', 'Sikkim': 'East', 'Meghalaya': 'East',
  'Tripura': 'East', 'Mizoram': 'East', 'Manipur': 'East', 'Nagaland': 'East',
  'Arunachal Pradesh': 'East', 'Tamil Nadu': 'South', 'Karnataka': 'South',
  'Kerala': 'South', 'Andhra Pradesh': 'South', 'Telangana': 'South',
  'Puducherry': 'South', 'Andaman Nicobar Islands': 'South', 'Lakshadweep': 'South',
};

const getSubcategoryOptions = (responseData) => {
  // Most BXI endpoints return data[0].SubcategoryValue
  const root = responseData?.data ?? responseData;
  const nestedList =
    root?.[0]?.SubcategoryValue ??
    root?.SubcategoryValue ??
    root?.subcategories;

  // FMCG / Mobility return flat rows, not nested SubcategoryValue arrays.
  const list = Array.isArray(nestedList)
    ? nestedList
    : Array.isArray(root)
      ? root
      : [];

  if (!Array.isArray(list)) {
    return [];
  }

  return list
    .map((item) => {
      if (typeof item === 'string') {
        return { label: item, value: item };
      }
      if (item?.SubcategoryType) {
        return { label: item.SubcategoryType, value: item.SubcategoryType };
      }
      if (item?.name) {
        return { label: item.name, value: item.name };
      }
      if (item?.value) {
        return { label: item.value, value: item.value };
      }
      if (item?.SampleFmcgCategoryType) {
        return {
          label: item.SampleFmcgCategoryType,
          value: item.SampleFmcgCategoryType,
        };
      }
      if (item?.SampleMobilityCategoryType) {
        return {
          label: item.SampleMobilityCategoryType,
          value: item.SampleMobilityCategoryType,
        };
      }
      if (item?.RestuarantQsrCategoryType) {
        return { label: item.RestuarantQsrCategoryType, value: item.RestuarantQsrCategoryType };
      }
      if (item?.EntertainmentFeature || item?.entertainmentSubcategory) {
        const v = item.EntertainmentFeature || item.entertainmentSubcategory;
        return { label: v, value: v };
      }
      if (item?.OtherSub) {
        return { label: item.OtherSub, value: item.OtherSub };
      }
      if (item?.SampleAirlineFeature) {
        return { label: item.SampleAirlineFeature, value: item.SampleAirlineFeature };
      }
      if (item?.Mediaonlinecategorysingle) {
        return { label: item.Mediaonlinecategorysingle, value: item._id };
      }
      if (item?.Mediaofflinecategory) {
        return { label: item.Mediaofflinecategory, value: item._id };
      }
      if (item?.SubcategoryName) {
        return { label: item.SubcategoryName, value: item.SubcategoryName };
      }
      // Final fallback: first non-id string field in object
      if (item && typeof item === 'object') {
        const candidate = Object.entries(item).find(
          ([key, val]) =>
            typeof val === 'string' &&
            val.trim() &&
            key !== '_id' &&
            key !== 'id'
        );
        if (candidate) {
          return { label: candidate[1], value: candidate[1] };
        }
      }
      return null;
    })
    .filter(Boolean);
};

const STEPS = [
  { id: 1, name: 'General Information', path: 'general-info' },
  { id: 2, name: 'Product Information', path: 'product-info' },
  { id: 3, name: 'Technical Information', path: 'tech-info' },
  { id: 4, name: 'Go Live', path: 'go-live' },
];

// Helper to get step name based on category type
const getStepName = (stepId, category) => {
  if (stepId !== 2) return STEPS[stepId - 1].name;
  const isVoucherCategory = category?.endsWith?.('Voucher');
  if (isVoucherCategory) return 'Voucher Information';
  const isMediaCategory =
    category === 'mediaonline' || category === 'mediaoffline' || category === 'media';
  if (isMediaCategory) return 'Media Information';
  return 'Product Information';
};

// Stepper Component – exported for use in voucher pages (HotelsProductInfo, VoucherTechInfo, VoucherGoLive, VoucherDesign)
export const Stepper = ({ currentStep, completedSteps = [], category = '' }) => {
  return (
    <div className="stepper vertical" data-testid="add-product-stepper">
      {STEPS.map((step, index) => {
        const isActive = currentStep === step.id;
        const isCompleted = completedSteps.includes(step.id) || currentStep > step.id;
        const stepName = getStepName(step.id, category);
        
        return (
          <div key={step.id} className="stepper-step">
            <div className="stepper-step-row">
              <div
                className={cn(
                  'stepper-circle',
                  isActive && 'active',
                  isCompleted && 'completed'
                )}
              >
                {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : step.id}
              </div>
              <span
                className={cn(
                  'stepper-label',
                  isActive && 'active',
                  isCompleted && 'completed'
                )}
              >
                {stepName}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div className={cn('stepper-line-vertical', isCompleted && 'completed')} />
            )}
          </div>
        );
      })}
    </div>
  );
};

// General Information Step
export const GeneralInformation = ({ category }) => {
  useScrollToTopOnStepEnter();
  const navigate = useNavigate();
  const { id } = useParams();
  const [pendingTextileGenderHydrate, setPendingTextileGenderHydrate] = useState(null);
  const [pendingTextileSubcategoryHydrate, setPendingTextileSubcategoryHydrate] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subcategoryOptions, setSubcategoryOptions] = useState([]);
  const [subcategoriesLoading, setSubcategoriesLoading] = useState(false);
  const [genderCategoryData, setGenderCategoryData] = useState([]);
  const [selectedGenderId, setSelectedGenderId] = useState(null);
  const [selectedGender, setSelectedGender] = useState('Unisex');

  const giConfig = getGeneralInfoConfig(category);
  const valSchema = getValidationSchema(category, 'generalInfo');
  const isVoucherCategory = category?.endsWith?.('Voucher');
  const voucherJourneyType = isVoucherCategory ? getVoucherJourneyTypeFromStorage() : null;
  const isOfferSpecificVoucher = voucherJourneyType === VOUCHER_JOURNEY_TYPE.OFFER_SPECIFIC;
  const nextStepPath = isVoucherCategory
    ? (category === 'hotelsVoucher' ? 'hotelsproductinfo' : 'techinfo')
    : 'product-info';

  const { register, handleSubmit, formState: { errors, isValid }, setValue, watch } = useForm({
    defaultValues: {
      productName: '',
      productSubtitle: '',
      subcategory: '',
      description: '',
      hasRegistrationProcess: 'Yes',
      HotelStars: '5',
      gender: '',
    }
  });

  // Hydrate draft / edit when URL includes product id (parity with ProductInfo / TechInfo / GoLive)
  useEffect(() => {
    if (!id) {
      setPendingTextileGenderHydrate(null);
      setPendingTextileSubcategoryHydrate(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await productApi.getProductById(id);
        const raw = res?.data ?? res;
        const data = raw?.body ?? raw?.data ?? raw;
        if (cancelled || !data) return;

        setValue('productName', data.ProductName || '', { shouldDirty: false });
        setValue('description', data.ProductDescription || '', { shouldDirty: false });
        if (giConfig.hasSubtitle) {
          setValue('productSubtitle', data.ProductSubtitle || '', { shouldDirty: false });
        }
        if (giConfig.hasRadioButtons && !isVoucherCategory) {
          const v = data.HasRegistrationProcess;
          if (v === 'Yes' || v === 'No') {
            setValue('hasRegistrationProcess', v, { shouldDirty: false });
          }
        }
        if (giConfig.hasStarRating && data.HotelStars != null && String(data.HotelStars).trim() !== '') {
          setValue('HotelStars', String(data.HotelStars), { shouldDirty: false });
        }

        const subVal = data.ProductSubCategory ?? data.productSubCategory;
        const subStr = subVal != null && subVal !== '' ? String(subVal) : '';

        if (giConfig.hasGenderSelection && data.Gender) {
          setPendingTextileGenderHydrate(String(data.Gender));
          setPendingTextileSubcategoryHydrate(subStr || null);
          setValue('gender', data.Gender, { shouldDirty: false });
        } else {
          setPendingTextileGenderHydrate(null);
          setPendingTextileSubcategoryHydrate(null);
          if (category !== 'airlineVoucher' && subStr) {
            setValue('subcategory', subStr, { shouldDirty: false });
          }
        }
      } catch {
        toast.error('Failed to load product details.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    id,
    category,
    isVoucherCategory,
    setValue,
    giConfig.hasSubtitle,
    giConfig.hasRadioButtons,
    giConfig.hasStarRating,
    giConfig.hasGenderSelection,
  ]);

  const normalizeCategoryLabel = (cat) => {
    if (!cat) return 'Product';
    const cleaned = cat.replace(/voucher$/i, '');
    if (!cleaned) return 'Product';
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  };

  const categoryLabel = normalizeCategoryLabel(category);
  const selectedSubcategory = watch('subcategory');
  const textileGenderDisplayOrder = ['kids', 'female', 'male', 'unisex', 'others'];
  const orderedGenderCategoryData =
    giConfig.hasGenderSelection && Array.isArray(genderCategoryData)
      ? [...genderCategoryData].sort((a, b) => {
          const aLabel = String(a?.SubcategoryName || '').toLowerCase();
          const bLabel = String(b?.SubcategoryName || '').toLowerCase();
          const aIdx = textileGenderDisplayOrder.indexOf(aLabel);
          const bIdx = textileGenderDisplayOrder.indexOf(bLabel);
          const safeA = aIdx === -1 ? textileGenderDisplayOrder.length : aIdx;
          const safeB = bIdx === -1 ? textileGenderDisplayOrder.length : bIdx;
          if (safeA !== safeB) return safeA - safeB;
          return aLabel.localeCompare(bLabel);
        })
      : genderCategoryData;

  useEffect(() => {
    if (category === 'airlineVoucher') {
      setSubcategoryOptions([]);
      setGenderCategoryData([]);
      setSelectedGenderId(null);
      setSelectedGender('Unisex');
      setSubcategoriesLoading(false);
      if (!id) setValue('subcategory', '');
      return;
    }
    if (isVoucherCategory) {
      const currentVoucherJourneyType = getVoucherJourneyTypeFromStorage();

      if (currentVoucherJourneyType === VOUCHER_JOURNEY_TYPE.VALUE_GIFT) {
        const defaultVoucherSubcategories =
          category === 'hotelsVoucher'
            ? [
                'Value Voucher',
                'Gift Cards',
                'Valid on All',
                'Valid on Limited',
                'Others',
              ]
            : [
                'Value Voucher',
                'Gift Cards',
                'Specific Voucher',
              ];
        const options = defaultVoucherSubcategories
          .map((s) => ({ value: s, label: s }))
          .sort((a, b) => String(a.label).localeCompare(String(b.label)));
        setSubcategoryOptions(options);
        setGenderCategoryData([]);
        setSelectedGenderId(null);
        setSelectedGender('Unisex');
        if (!id) setValue('subcategory', '');
        return;
      }

      if (category === 'hotelsVoucher') {
        setSubcategoriesLoading(true);
        setGenderCategoryData([]);
        setSelectedGenderId(null);
        setSelectedGender('Unisex');
        const endpoint = getSubcategoryEndpoint(category);
        api.get(endpoint || 'hotelsub/Get_hotel_subcategory')
          .then((res) => {
            const raw = res?.data?.data ?? res?.data;
            const list = Array.isArray(raw) ? raw : (raw?.data ? [].concat(raw.data) : []);
            const options = list.map((el) => ({
              value: el?._id ?? el?.SubcategoryType ?? el,
              label: el?.SampleCategoryType ?? el?.SubcategoryType ?? (typeof el === 'string' ? el : String(el?._id ?? '')),
            })).filter((o) => o.value != null && o.label != null);
            options.sort((a, b) => String(a.label).localeCompare(String(b.label)));
            setSubcategoryOptions(options);
            if (!id) setValue('subcategory', '');
          })
          .catch(() => {
            setSubcategoryOptions([]);
            toast.error('Unable to load hotel subcategories.');
          })
          .finally(() => setSubcategoriesLoading(false));
        return;
      }
    }

    const endpoint = getSubcategoryEndpoint(category);
    if (!endpoint) {
      setSubcategoryOptions([]);
      setGenderCategoryData([]);
      setSelectedGenderId(null);
      setSelectedGender('Unisex');
      if (!id) setValue('subcategory', '');
      return;
    }

    const fetchSubcategories = async () => {
      setSubcategoriesLoading(true);
      try {
        const res = await api.get(endpoint);
        const root = res?.data?.data ?? res?.data;

        // Textile-specific shape: [{ SubcategoryName, SubcategoryValue: [...] }, ...]
        if (
          category === 'textile' &&
          Array.isArray(root) &&
          root.length > 0 &&
          Array.isArray(root[0]?.SubcategoryValue)
        ) {
          setGenderCategoryData(root);
          if (id) {
            // Editing: hydrate effect + textileGenderHydrateRef apply saved gender/subcategory
          } else {
            const defaultGenderGroup =
              root.find(
                (item) =>
                  String(item?.SubcategoryName || '').toLowerCase() === 'unisex'
              ) || root[0];
            const defaultGenderName = defaultGenderGroup?.SubcategoryName || 'Unisex';
            setSelectedGenderId(defaultGenderGroup?._id || null);
            setSelectedGender(defaultGenderName);
            setValue('gender', defaultGenderName);
            const options = getSubcategoryOptions({
              data: [{ SubcategoryValue: defaultGenderGroup?.SubcategoryValue || [] }],
            });
            options.sort((a, b) => String(a.label).localeCompare(String(b.label)));
            setSubcategoryOptions(options);
            setValue('subcategory', '');
          }
        } else {
          setGenderCategoryData([]);
          setSelectedGenderId(null);
          setSelectedGender('Unisex');
          const root = res?.data?.body ?? res?.data?.data ?? res?.data;
          const options = getSubcategoryOptions({ data: root });
          options.sort((a, b) => String(a.label).localeCompare(String(b.label)));
          setSubcategoryOptions(options);
        }
      } catch (error) {
        setSubcategoryOptions([]);
        toast.error('Unable to load subcategories for this category.');
      } finally {
        setSubcategoriesLoading(false);
      }
    };

    fetchSubcategories();
  }, [category, isVoucherCategory, id, setValue]);

  const handleTextileGenderSelect = useCallback((genderGroup) => {
    setSelectedGenderId(genderGroup?._id || null);
    const name = genderGroup?.SubcategoryName || 'Unisex';
    setSelectedGender(name);
    setValue('gender', name, { shouldValidate: true });
    const options = getSubcategoryOptions({
      data: [{ SubcategoryValue: genderGroup?.SubcategoryValue || [] }],
    });
    options.sort((a, b) => String(a.label).localeCompare(String(b.label)));
    setSubcategoryOptions(options);
    setValue('subcategory', '', { shouldValidate: true });
  }, [setValue]);

  useEffect(() => {
    if (!giConfig.hasGenderSelection || !genderCategoryData.length || !pendingTextileGenderHydrate) {
      return;
    }
    const g = pendingTextileGenderHydrate;
    const match = genderCategoryData.find(
      (item) => String(item?.SubcategoryName || '').toLowerCase() === g.toLowerCase()
    );
    if (!match) {
      setPendingTextileGenderHydrate(null);
      setPendingTextileSubcategoryHydrate(null);
      return;
    }
    handleTextileGenderSelect(match);
    const pend = pendingTextileSubcategoryHydrate;
    setPendingTextileGenderHydrate(null);
    setPendingTextileSubcategoryHydrate(null);
    if (pend) {
      setValue('subcategory', pend, { shouldDirty: false });
    }
  }, [
    genderCategoryData,
    giConfig.hasGenderSelection,
    pendingTextileGenderHydrate,
    pendingTextileSubcategoryHydrate,
    setValue,
    handleTextileGenderSelect,
  ]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      let productId = id;
      const normalizedSubcategory = data.subcategory || '';
      const subcategoryName = subcategoryOptions.find((o) => o.value === normalizedSubcategory)?.label || normalizedSubcategory;
      const airlineSubcategoryValue =
        PRODUCT_TYPE_BY_CATEGORY[category] || 'Airline Tickets';

      const isMediaOnline = category === 'mediaonline';
      const isMediaOffline = category === 'mediaoffline';
      const isMedia = isMediaOnline || isMediaOffline;

      let payload;
      if (isMedia) {
        payload = {
          ProductName: data.productName,
          ProductDescription: data.description,
          ProductSubtitle: data.productSubtitle,
          ProductSubCategory: normalizedSubcategory,
          ProductSubCategoryName: subcategoryName,
          ProductUploadStatus: 'productinformation',
          ListingType: 'Media',
          ProductType: isMediaOnline ? 'MediaOnline' : 'MediaOffline',
          ProductCategoryName:
            isMediaOnline
              ? subcategoryName === 'Multiplex ADs' ? 'Multiplex ADs' : 'MediaOnline'
              : subcategoryName === 'Hoardings' ? 'MediaOffline' : subcategoryName,
          ...(id && { id }),
        };
      } else {
        const resolvedVerticalType =
          PRODUCT_TYPE_BY_CATEGORY[category] || categoryLabel || 'Others';
        payload = {
          ProductName: data.productName,
          ProductDescription: data.description,
          ProductUploadStatus: 'productinformation',
          ListingType: isVoucherCategory ? 'Voucher' : 'Product',
          ProductType: resolvedVerticalType,
          // API defaults ProductCategoryName to "Others" when omitted; Seller Hub and filters use it first.
          ...(isVoucherCategory && { ProductCategoryName: resolvedVerticalType }),
          ProductSubCategory:
            category === 'airlineVoucher' ? airlineSubcategoryValue : normalizedSubcategory,
          ProductSubCategoryName:
            category === 'airlineVoucher' ? airlineSubcategoryValue : normalizedSubcategory,
          Gender: giConfig.hasGenderSelection ? selectedGender : undefined,
          gender: giConfig.hasGenderSelection ? selectedGender : undefined,
          ProductSubtitle: giConfig.hasSubtitle ? data.productSubtitle : undefined,
          HasRegistrationProcess: giConfig.hasRadioButtons ? data.hasRegistrationProcess : undefined,
          HotelStars: giConfig.hasStarRating ? data.HotelStars : undefined,
        };
        // bxi-dashboard GeneralInfoTemplate: VoucherType from localStorage (Offer Specific | Value Voucher / Gift Cards )
        if (isVoucherCategory && typeof localStorage !== 'undefined') {
          payload.VoucherType = getVoucherJourneyLabel(getVoucherJourneyTypeFromStorage());
        }
      }

      // bxi-dashboard uses product_mutation for all voucher steps (AddVoucherPages/TextileVoucher ProductHooksQuery)
      if (id && isVoucherCategory) {
        await productApi.productMutation({ _id: id, ...payload });
        toast.success('General information updated!');
      } else if (!id && isVoucherCategory) {
        const res = await productApi.productMutation(payload);
        const created = res?.data?.body ?? res?.data?.data ?? res?.data?.product ?? res?.data;
        if (created?.name === 'ValidationError' || created?.errors) {
          const firstError = created?.errors ? Object.values(created.errors)?.[0]?.message : null;
          throw new Error(firstError || created?.message || 'Validation failed');
        }
        productId = created?._id ?? created?.id ?? created?.product?._id ?? created?.ProductData?._id;
        if (!productId) {
          const draftRes = await productApi.getDraftProducts(1);
          const draftData = draftRes?.data?.products ?? draftRes?.data?.body?.products ?? draftRes?.data?.data?.products ?? [];
          if (Array.isArray(draftData) && draftData.length > 0) {
            productId = draftData[0]?._id;
          }
        }
        if (!productId) {
          throw new Error('Product was not created. Please check required fields and try again.');
        }
        toast.success('General information saved!');
      } else if (id && !isMedia) {
        await productApi.updateProduct({ _id: id, ...payload });
        toast.success('General information updated!');
      } else if (isMedia) {
        const res = await productApi.productMutation(payload);
        const created = res?.data?.body ?? res?.data?.data ?? res?.data?.product ?? res?.data;
        if (created?.name === 'ValidationError' || created?.errors) {
          const firstError = created?.errors ? Object.values(created.errors)?.[0]?.message : null;
          throw new Error(firstError || created?.message || 'Validation failed');
        }
        productId = created?._id ?? created?.id ?? created?.product?._id ?? created?.ProductData?._id;
        if (id) {
          toast.success('General information updated!');
        } else {
          if (!productId) {
            const draftRes = await productApi.getDraftProducts(1);
            const draftData = draftRes?.data?.products ?? draftRes?.data?.body?.products ?? draftRes?.data?.data?.products ?? [];
            if (Array.isArray(draftData) && draftData.length > 0) {
              productId = draftData[0]?._id;
            }
          }
          if (!productId) {
            throw new Error('Product was not created. Please check required fields and try again.');
          }
          toast.success('General information saved!');
        }
      } else {
        const res = await productApi.createProduct(payload);
        const created =
          res?.data?.body ||
          res?.data?.data ||
          res?.data?.product ||
          res?.data;
        if (created?.name === 'ValidationError' || created?.errors) {
          const firstError = created?.errors ? Object.values(created.errors)?.[0]?.message : null;
          throw new Error(firstError || created?.message || 'Validation failed');
        }
        productId =
          created?._id ||
          created?.id ||
          created?.product?._id ||
          created?.ProductData?._id;
        if (!productId) {
          const draftRes = await productApi.getDraftProducts(1);
          const draftData =
            draftRes?.data?.products ||
            draftRes?.data?.body?.products ||
            draftRes?.data?.data?.products ||
            [];
          if (Array.isArray(draftData) && draftData.length > 0) {
            productId = draftData[0]?._id;
          }
        }
        if (!productId) {
          throw new Error('Product was not created. Please check required fields and try again.');
        }
        toast.success('General information saved!');
      }

      let targetPath;
      if (isMediaOnline) {
        const storedJourney =
          (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('mediaJourney')) ||
          (typeof localStorage !== 'undefined' && localStorage.getItem('mediaJourney')) ||
          '';
        const storedMediaCategory =
          (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('mediaCategory')) ||
          (typeof localStorage !== 'undefined' && localStorage.getItem('mediaCategory')) ||
          '';
        const isTelevisionListing =
          storedJourney === 'television-ads' ||
          (storedMediaCategory === 'television' && storedJourney === 'digital-ads');
        if (subcategoryName === 'Digital ADs' && !isTelevisionListing) {
          targetPath = `/mediaonline/mediaonlinedigitalscreensinfo/${productId}`;
        } else if (subcategoryName === 'Multiplex ADs') {
          targetPath = `/mediaonline/mediaonlinemultiplexproductinfo/${productId}`;
        } else {
          targetPath = `/mediaonline/product-info/${productId}`;
        }
      } else if (isMediaOffline) {
        if (subcategoryName === 'Hoardings') {
          targetPath = `/mediaoffline/mediaofflinehoardinginfo/${productId}`;
        } else {
          targetPath = `/mediaoffline/mediaofflineproductinfo/${productId}`;
        }
      } else {
        targetPath = `/${category}/${nextStepPath}/${productId}`;
      }
      navigate(targetPath);
    } catch (error) {
      const errorText =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to save. Please try again.';
      if (String(errorText).includes('SellerCompanyId') || String(errorText).includes('PostedBy')) {
        toast.error('Your session is missing. Please login from dashboard again and retry.');
      } else {
        toast.error(errorText);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-8" data-testid="general-info-page">
      <div className="form-container">
        <div className="stepper-layout">
          <aside className="stepper-rail">
            <Stepper currentStep={1} category={category} />
          </aside>

          <main className="stepper-content">
            <div className="form-section">
              <h2 className="form-section-title">
                General Information - {categoryLabel}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="w-4 h-4 ml-2" />
                    </TooltipTrigger>
                    <TooltipContent className="w-48 text-white rounded-md padding-1">
                      <p >General Information refers to broad and fundamental knowledge or facts about a particular Product OR Vouchers.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* Subcategory */}
            <div className="space-y-2">
              {giConfig.hasGenderSelection && genderCategoryData.length > 0 && (
                <div className="space-y-4">
                  <Label>Gender (Textile) <span className="text-red-500">*</span></Label>
                  <input type="hidden" {...register('gender', { required: valSchema?.gender?.required ? 'Please select gender' : false })} />
                  <div className="grid grid-cols-5 gap-3 mb-6">
                    {orderedGenderCategoryData.map((item) => {
                      const rawLabel = item?.SubcategoryName || 'Unisex';
                      const normalizedLabelMap = {
                        kids: 'Kids',
                        female: 'Female',
                        male: 'Male',
                        unisex: 'Unisex',
                        others: 'Others',
                      };
                      const label =
                        normalizedLabelMap[String(rawLabel).toLowerCase()] ||
                        String(rawLabel).charAt(0).toUpperCase() +
                          String(rawLabel).slice(1).toLowerCase();
                      const isActive = selectedGenderId === item?._id;
                      return (
                        <Button
                          key={item?._id || label}
                          type="button"
                          variant="outline"
                          className={cn(
                            'justify-center',
                            isActive
                              ? 'border-[#C64091] bg-[#FCE7F3] text-[#C64091]'
                              : ''
                          )}
                          onClick={() => handleTextileGenderSelect(item)}
                          data-testid={`textile-gender-${String(label).toLowerCase()}`}
                        >
                          {label}
                        </Button>
                      );
                    })}
                  </div>
                  {errors.gender && <p className="text-sm text-red-500">{errors.gender.message}</p>}
                </div>
              )}

              <input
                type="hidden"
                {...register('subcategory', (() => {
                  const p = valSchema?.subcategory;
                  if (!p) return { required: 'Subcategory is required' };
                  return { required: p.required ? 'Please select a subcategory' : false };
                })())}
              />
              {category !== 'airlineVoucher' && (
                <>
                  <Label htmlFor="subcategory">{isVoucherCategory ? 'Voucher Subcategory' : 'Subcategory'} <span className="text-red-500">*</span></Label>
                  <Select
                    value={selectedSubcategory || ''}
                    onValueChange={(value) => setValue('subcategory', value, { shouldValidate: true })}
                  >
                    <SelectTrigger id="subcategory" data-testid="select-subcategory">
                      <SelectValue
                        placeholder={
                          subcategoriesLoading
                            ? 'Loading subcategories...'
                            : 'Select subcategory'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {subcategoryOptions.length > 0 ? (
                        subcategoryOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="__no_subcategory__" disabled>
                          No subcategories found
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {errors.subcategory && (
                    <p className="text-sm text-red-500">{errors.subcategory.message}</p>
                  )}
                </>
              )}
            </div>
            {/* Product Name – validation from getValidationSchema (bxi parity) */}
            <div className="space-y-2">
              <Label htmlFor="productName">
                {isVoucherCategory ? 'Voucher Name' : 'Product Name'} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="productName"
                placeholder={isVoucherCategory ? 'Enter Voucher Name' : 'Enter Product Name'}
                {...register('productName', (() => {
                  const p = valSchema?.productname;
                  if (!p) return { required: 'Product name is required' };
                  const r = {};
                  if (p.required) r.required = p.min ? `Product name must be at least ${p.min} characters` : 'Product name is required';
                  if (p.min) r.minLength = { value: p.min, message: `Product name must be at least ${p.min} characters` };
                  if (p.max) r.maxLength = { value: p.max, message: `Product name must be at most ${p.max} characters` };
                  return r;
                })())}
                className={errors.productName ? 'border-red-500' : ''}
                data-testid="input-product-name"
              />
              {errors.productName && (
                <p className="text-sm text-red-500">{errors.productName.message}</p>
              )}
            </div>

            {/* Subtitle – shown when config.hasSubtitle; validation from getValidationSchema */}
            {giConfig.hasSubtitle &&  (
              <div className="space-y-2 mt-4">
                <Label htmlFor="productSubtitle">{isVoucherCategory ? 'Voucher Subtitle' : 'Product Subtitle'} <span className="text-red-500">*</span></Label>
                <Input
                  id="productSubtitle"
                  placeholder={isVoucherCategory ? 'Enter Voucher Subtitle' : 'Enter Product Subtitle'}
                  {...register('productSubtitle', (() => {
                    const p = valSchema?.productsubtitle;
                    if (!p) return { required: 'Product subtitle is required', minLength: 10, maxLength: 75 };
                    const r = {};
                    if (p.required) r.required = p.min ? `Product subtitle must be at least ${p.min} characters` : 'Product subtitle is required';
                    if (p.min) r.minLength = { value: p.min, message: `Product subtitle must be at least ${p.min} characters` };
                    if (p.max) r.maxLength = { value: p.max, message: `Product subtitle must be at most ${p.max} characters` };
                    return r;
                  })())}
                  className={errors.productSubtitle ? 'border-red-500' : ''}
                />
                {errors.productSubtitle && (
                  <p className="text-sm text-red-500">{errors.productSubtitle.message}</p>
                )}
              </div>
            )}

            {/* Listing Type – only for product categories */}


            {/* Description – validation from getValidationSchema (bxi productdescription min/max) */}
            <div className="space-y-2">
              <Label htmlFor="description">
                {isVoucherCategory ? 'Voucher Description' : 'Description'} <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Describe your product..."
                rows={5}
                {...register('description', (() => {
                  const p = valSchema?.productdescription;
                  if (!p) return { required: 'Description is required', maxLength: { value: 1000, message: 'Description cannot exceed 1000 characters' } };
                  const r = {};
                  if (p.required) r.required = p.min ? `Description must be at least ${p.min} characters` : 'Description is required';
                  if (p.min) r.minLength = { value: p.min, message: `Description must be at least ${p.min} characters` };
                  if (p.max) r.maxLength = { value: p.max, message: `Description cannot exceed ${p.max} characters` };
                  return r;
                })())}
                className={errors.description ? 'border-red-500' : ''}
                data-testid="input-description"
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>

            {/* Mobility: Registration process radio */}
            {giConfig.hasRadioButtons && !isVoucherCategory && (
              <div className="space-y-2">
                <Label>{giConfig.radioButtonLabel} <span className="text-red-500">*</span></Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value="Yes" {...register(giConfig.radioButtonField, { required: valSchema?.hasRegistrationProcess?.required ? 'Please select an option' : false })} className="text-[#C64091]" />
                    <span>Yes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value="No" {...register(giConfig.radioButtonField, { required: valSchema?.hasRegistrationProcess?.required ? 'Please select an option' : false })} className="text-[#C64091]" />
                    <span>No</span>
                  </label>
                </div>
                {errors[giConfig.radioButtonField] && (
                  <p className="text-sm text-red-500">{errors[giConfig.radioButtonField].message}</p>
                )}
              </div>
            )}

            {/* Hotels: Star rating – validation from schema when HotelStars required */}
            {giConfig.hasStarRating && (
              <div className="space-y-2">
                <Label>{giConfig.starRatingLabel} <span className="text-red-500">*</span></Label>
                <input type="hidden" {...register(giConfig.starRatingField, { required: valSchema?.HotelStars?.required ? 'Please select hotel star rating' : false })} />
                <Select
                  value={watch(giConfig.starRatingField) || '5'}
                  onValueChange={(value) => setValue(giConfig.starRatingField, value, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select rating" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <SelectItem key={n} value={String(n)}>{n} Star{n > 1 ? 's' : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors[giConfig.starRatingField] && (
                  <p className="text-sm text-red-500">{errors[giConfig.starRatingField].message}</p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(category === 'eeVoucher' ? '/eephysical' : '/sellerhub')}
                data-testid="btn-back"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Seller Hub
              </Button>
              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  !watch('productName') ||
                  !watch('description') ||
                  (category !== 'airlineVoucher' && !watch('subcategory'))
                }
                className="bg-[#C64091] hover:bg-[#A03375]"
                data-testid="btn-save-next"
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
};

// Product Information Step – category-specific fields via config
const PRODUCT_FEATURE_MIN = 5;
const PRODUCT_FEATURE_MAX = 20;

const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL'];
const US_SHOE_SIZES = [30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50];
const UK_SHOE_SIZES = [2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5];
const EU_SHOE_SIZES = [35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48];
const inferSelectedSizeFromVariation = (row, options = []) => {
  if (!row) return '';
  if (row.ShoeSize) return 'Shoes Size';

  const rawSize = String(row.ProductSize || '').trim();
  const normalized = rawSize.toLowerCase();

  // Priority 1: direct match of ProductSize against known options (e.g. "GSM", "Weight")
  if (rawSize) {
    const directMatch = options.find((opt) => String(opt).toLowerCase() === normalized);
    if (directMatch) return directMatch;
  }

  // Priority 2: infer from L/W/H/Weight fields only when no ProductSize option matched,
  // so stale dimension fields from legacy variants don't override the actual dimension.
  if (row.Length && row.Height && row.Width) return 'Length x Height x Width';
  if (row.Length && row.Height) return 'Length x Height';
  if (row.Length) return 'Length';
  if (row.Weight) return 'Weight';

  if (!rawSize) return '';

  // Priority 3: heuristic inference from ProductSize string
  if (options.includes('Custom Size') && !row.ShoeSize && !(row.Length || row.Height || row.Width || row.Weight)) {
    const mu = String(row.MeasurementUnit || '').trim();
    const parts = rawSize.split(/\s+/).filter(Boolean);
    if (mu && parts.length >= 2 && parts[parts.length - 1] === mu) {
      return 'Custom Size';
    }
  }
  if (normalized.includes('ml') || normalized.includes('cl') || normalized.endsWith('l')) return 'Volume';
  if (normalized.includes('kg') || normalized.includes(' g') || normalized.includes('lb')) return 'Weight';
  return '';
};

const formatVariationSize = (row) => {
  if (!row) return '—';
  // `MeasurementUnit` is shared across size types. For shoe sizes, default to US.
  // For length-based sizes, default to cm.
  const defaultUnit = row.ShoeSize ? 'US' : 'cm';
  const unit = String(row.MeasurementUnit || defaultUnit).trim();
  if (row.ShoeSize) return `${row.ShoeSize} (${unit || 'US'})`;
  if (row.Length && row.Height && row.Width) return `${row.Length} x ${row.Height} x ${row.Width} ${unit}`.trim();
  if (row.Length && row.Height) return `${row.Length} x ${row.Height} ${unit}`.trim();
  if (row.Length) return `${row.Length} ${unit}`.trim();
  if (row.Weight) return `${row.Weight} ${unit || 'kg'}`.trim();
  return row.ProductSize || '—';
};

export const ProductInfo = ({ category }) => {
  useScrollToTopOnStepEnter();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [featureOptions, setFeatureOptions] = useState([]);
  const [featuresLoading, setFeaturesLoading] = useState(false);
  const [featureList, setFeatureList] = useState([]);
  const [selectedFeature, setSelectedFeature] = useState('');
  const [featureDescription, setFeatureDescription] = useState('');
  const [locationDetails, setLocationDetails] = useState({ region: '', state: '', city: '', landmark: '', pincode: '' });
  const [cityArray, setCityArray] = useState([]);
  const [otherCosts, setOtherCosts] = useState([]);
  const [otherCostForm, setOtherCostForm] = useState({ AdCostApplicableOn: 'All', CostPrice: '', currencyType: '₹', AdCostHSN: '', AdCostGST: 18, ReasonOfCost: '' });
  const [productsVariations, setProductsVariations] = useState([]);
  const [productData, setProductData] = useState(null);
  const descriptionRef = useRef(null);
  const isVoucherCategory = category?.endsWith?.('Voucher');
  const voucherJourneyType = isVoucherCategory ? getVoucherJourneyTypeFromStorage() : null;
  const isOfferSpecificVoucher = voucherJourneyType === VOUCHER_JOURNEY_TYPE.OFFER_SPECIFIC;
  const shouldUseDiscountedPrice = !isVoucherCategory;
  
  // Manufacturing & Expiry Dates
  const [manufacturingDate, setManufacturingDate] = useState(null);
  const [hasExpiryDate, setHasExpiryDate] = useState(false);
  const [expiryDate, setExpiryDate] = useState(null);

  // Variation edit state
  const [editVariationIndex, setEditVariationIndex] = useState(null);

  // Tags (voucher categories)
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

  // Airline voucher fields
  const [fromLocation, setFromLocation] = useState('');
  const [destinationLocation, setDestinationLocation] = useState('');
  const [redeemedValue, setRedeemedValue] = useState('');
  
  // Mobility Registration Details (managed by react-hook-form)

  const piConfig = getProductInfoConfig(category);
  const voucherPiConfig = isVoucherCategory ? getVoucherProductInfoConfig(category) : null;
  const activeVoucherConfig = isVoucherCategory && isOfferSpecificVoucher ? voucherPiConfig : null;
  // EE: Date of the Event only when user chose "Events" on eephysical (bxi-dashboard parity)
  const showDateOfEvent = activeVoucherConfig?.extraVariantColumn === 'dateOfEvent' && (category !== 'eeVoucher' || (typeof localStorage !== 'undefined' && localStorage.getItem('eevoucherdata') === 'event'));
  const { prev: prevStepPath, next: nextStepPath } = getPrevNextStepPaths(category, 'productInfo', location?.pathname);
  const prevPath = prevStepPath || 'general-info';
  const nextPath = nextStepPath || 'tech-info';

  const effectiveSizeOptions = isVoucherCategory
    ? (activeVoucherConfig?.sizeOptions || [])
    : (piConfig.sizeOptions || []);
  const hasSizeOptions = effectiveSizeOptions.length > 0 && category !== 'restaurant';

  const getSizeUnitOptions = (sizeType) => {
    if (!sizeType) return ['in', 'cm', 'mm', 'm', 'km', 'ft', 'yd', 'mi', 'nmi'];

    const normalized = sizeType.toLowerCase();
    if (normalized.includes('weight')) {
      return ['oz', 'g', 'kg', 'lb', 'l', 'ml', 'cu ft'];
    }
    if (sizeType === 'GSM') {
      return ['gsm'];
    }
    if (normalized.includes('battery')) {
      return ['mAh', 'Ah', 'Kwh'];
    }
    if (normalized.includes('power')) {
      return ['W', 'KW', 'HP', 'V', 'A'];
    }
    if (normalized.includes('volume') || normalized.includes('capacity')) {
      return ['in', 'cm', 'oz', 'g', 'gb', 'tb', 'lb', 'kg', 'mah', 'w', 'pixels', 'hz', 'db'];
    }
    if (normalized.includes('calorie')) {
      return ['kcal', 'kJ', 'cal'];
    }
    if (normalized.includes('nutritional')) {
      return ['g', 'mg', 'kcal'];
    }
    if (normalized.includes('shelf life') || normalized.includes('shelflife')) {
      return ['Days', 'Months', 'Years'];
    }
    if (normalized.includes('temprature') || normalized.includes('temperature') || normalized.includes('temp')) {
      return ['°C', '°F', 'K'];
    }
    // Default for length/style dimensions
    return ['in', 'cm', 'mm', 'm', 'km', 'ft', 'yd', 'mi', 'nmi'];
  };
  const formatIndianCurrencyInput = (rawValue) => {
    const cleaned = String(rawValue || '')
      .replace(/,/g, '')
      .replace(/[^\d.]/g, '');
    const [integerPartRaw, ...rest] = cleaned.split('.');
    const decimalPart = rest.join('').slice(0, 2);
    const normalizedInt = integerPartRaw
      ? integerPartRaw.replace(/^0+(?=\d)/, '')
      : '';
    const formattedInt = normalizedInt
      ? new Intl.NumberFormat('en-IN').format(Number(normalizedInt))
      : '';
    if (decimalPart.length > 0) return `${formattedInt || '0'}.${decimalPart}`;
    return formattedInt;
  };
  const handleIndianCurrencyChange = (field, value) => {
    setValue(field, formatIndianCurrencyInput(value), {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const hasHsn = piConfig.commonFields?.includes?.('hsn') ?? true;

  const hasSampleCheckbox = !isVoucherCategory;
  const hasGenderInProductInfo = isVoucherCategory
    ? (voucherPiConfig?.hasGender || false)
    : [ 'lifestyle', 'others', 'lifestyleVoucher'].includes(category);
  const hasFeatures = isVoucherCategory ? !!getFeatureEndpoint(category) : true;
  const hasOtherCosts = true;
  const hasLocationDetails = !isVoucherCategory;
  const hasManufacturingDates = !isVoucherCategory;
  const hasVariationButton = true;
  const featureEndpoint = getFeatureEndpoint(category);
  const tiConfig = getTechInfoConfig(category);
  const featureNameField = tiConfig?.featureNameField || 'SampleLifestyleFeature';

  useEffect(() => {
    if (!hasFeatures || !featureEndpoint) return;
    const fetchFeatures = async () => {
      setFeaturesLoading(true);
      try {
        const res = await api.get(featureEndpoint);
        const root = res?.data?.data ?? res?.data?.body ?? res?.data ;
        const list = Array.isArray(root) ? root : root?.data ? root.data : [];
        let opts = list
          .map((item) => {
            const label = item?.[featureNameField] || item?.name || item?.value || item?.FmcgproductinfoType || item?.OtherFeature || item?.OfficesupplyFeature  || item?.TextileFeature;
            return label ? { label, value: label } : null;
          })
          .filter(Boolean);
        if (category === 'qsrVoucher') {
          const hardcoded = QSR_HARDCODED_FEATURES.map((f) => ({ label: f, value: f }));
          const existing = new Set(opts.map((o) => o.value)); 
          opts = [...opts, ...hardcoded.filter((h) => !existing.has(h.value))];
        }
        opts.sort((a, b) => a.label.localeCompare(b.label));
        setFeatureOptions(opts);
      } catch {
        if (category === 'qsrVoucher') {
          setFeatureOptions(QSR_HARDCODED_FEATURES.map((f) => ({ label: f, value: f })));
        } else {
          setFeatureOptions([]);
        }
      } finally {
        setFeaturesLoading(false);
      }
    };
    fetchFeatures();
  }, [category, hasFeatures, featureEndpoint, featureNameField]);

  useEffect(() => {
    if (locationDetails.state && StateData?.length) {
      const stateObj = StateData.find((s) => s.name === locationDetails.state);
      const baseCities = stateObj?.data || [];
      const normalize = (s) => (s || '').toLowerCase().replace(/\s+/g, '') || '';
      const currentCity = locationDetails.city || '';
      if (currentCity && !baseCities.some((c) => normalize(c) === normalize(currentCity))) {
        setCityArray([currentCity, ...baseCities]);
      } else {
        setCityArray(baseCities);
      }
    } else {
      setCityArray([]);
    }
  }, [locationDetails.state, locationDetails.city]);

  useEffect(() => {
    if (selectedFeature) {
      descriptionRef.current.focus();
    }
  }, []);
  
  const handlePincodeLookup = async (pincode) => {
    if (String(pincode).length !== 6) return;
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await res.json();
      if (data?.[0]?.Status === 'Success' && data?.[0]?.PostOffice?.length > 0) {
        const postOffices = data?.[0]?.PostOffice || [];
        const firstPo = postOffices?.[0];
        const normalize = (s) => (s || '').toLowerCase().replace(/\s+/g, '') || '';

        const apiStateName = firstPo?.State;
        const apiDistrict = firstPo?.District || firstPo?.Block;
        const apiLandmark = firstPo?.Name;

        const matchedState = StateData.find((s) => normalize(s.name) === normalize(apiStateName));
        if (matchedState) {
          const cities = matchedState.data || [];

          const findMatchingCity = (candidate) => {
            const candNorm = normalize(candidate);
            if (!candNorm) return null;

            const exact = cities.find((c) => normalize(c) === candNorm);
            if (exact) return exact;

            const partial = cities.find(
              (c) =>
                normalize(c).includes(candNorm) ||
                candNorm.includes(normalize(c))
            );
            return partial || null;
          };

          // Use all PostOffice entries for city selection because the API can return
          // multiple records for the same pincode.
          const candidateStrings = Array.from(
            new Set(
              postOffices
                .flatMap((po) => [po?.District, po?.Block, po?.Region])
                .filter(Boolean)
            )
          );

          const matchedCity =
            candidateStrings.map((c) => findMatchingCity(c)).find(Boolean) || null;

          const fallbackCity =
            apiDistrict || apiStateName || candidateStrings[0] || '';

          // Prefer exact/partial matched city, otherwise use fallback, then first city in state.
          const nextCity = matchedCity || fallbackCity || cities?.[0] || '';
          const nextCityStr = String(nextCity || '').trim();


          // Ensure the selected `nextCity` is present in the dropdown options.
          const nextCityArray = (() => {
            const arr = [nextCityStr, ...(Array.isArray(cities) ? cities : [])].filter(Boolean);
            const seen = new Set();
            return arr.filter((c) => {
              const key = normalize(c);
              if (!key || seen.has(key)) return false;
              seen.add(key);
              return true;
            });
          })();

          setLocationDetails((prev) => ({
            ...prev,
            pincode: String(pincode),
            region: STATE_REGION_MAP[matchedState.name] || 'North',
            state: matchedState.name,
            city: nextCityStr,
            landmark: apiLandmark || prev.landmark,
          }));
          setCityArray(nextCityArray);
          toast.success('Location auto-filled!');
        } else {
          toast.warning(`State "${apiStateName}" not found. Please select manually.`);
        }
      } else {
        toast.error('Invalid pincode or no data found');
      }
    } catch {
      toast.error('Failed to fetch location data');
    }
  };

  const handleAddFeature = () => {
    const featureToAdd = selectedFeature || featureDescription?.trim();
    if (!featureToAdd) {
      toast.error('Please select a feature or enter a custom feature name');
      return;
    }
    if (featureList.length >= PRODUCT_FEATURE_MAX) {
      toast.error(`Maximum ${PRODUCT_FEATURE_MAX} features allowed`);
      return;
    }
    if (featureList.some((f) => f.name === featureToAdd)) {
      toast.error('This feature is already added');
      return;
    }
    const desc = featureDescription?.trim() || featureToAdd;
    if (desc.length > 75) {
      toast.error('Feature description cannot exceed 75 characters');
      return;
    }
    setFeatureList((prev) => [...prev, { name: featureToAdd, description: desc }]);
    setSelectedFeature('');
    setFeatureDescription('');
  };

  const handleRemoveFeature = (idx) => {
    setFeatureList((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddOtherCost = () => {
    const cp = parseFloat(String(otherCostForm.CostPrice).replace(/,/g, '')) || 0;
    if (cp <= 0) {
      toast.error('Cost price must be greater than 0');
      return;
    }
    if (!otherCostForm.ReasonOfCost?.trim()) {
      toast.error('Reason of cost is required');
      return;
    }
    const reason = otherCostForm.ReasonOfCost?.trim() || '';
    if (reason.length > 75) {
      toast.error('Reason of cost cannot exceed 75 characters');
      return;
    }
    const hs = String(otherCostForm.AdCostHSN || '').trim();
    if (!hs) {
      toast.error('HSN is required');
      return;
    }
    if (!/^\d{4}$|^\d{6}$|^\d{8}$/.test(hs)) {
      toast.error('HSN must be 4, 6, or 8 digits');
      return;
    }
    if (hs.startsWith('0')) {
      toast.error('HSN cannot start with 0');
      return;
    }
    if (/^0+$/.test(hs)) {
      toast.error('HSN cannot be all zeros');
      return;
    }
    setOtherCosts((prev) => [...prev, {
      AdCostApplicableOn: otherCostForm.AdCostApplicableOn || 'All',
      CostPrice: cp,
      currencyType: otherCostForm.currencyType || '₹',
      AdCostHSN: hs || '',
      AdCostGST: Number(otherCostForm.AdCostGST) || 18,
      ReasonOfCost: otherCostForm.ReasonOfCost?.trim() || '',
    }]);
    setOtherCostForm({ AdCostApplicableOn: 'All', CostPrice: '', currencyType: '₹', AdCostHSN: '', AdCostGST: 18, ReasonOfCost: '' });
  };

  const handleRemoveOtherCost = (idx) => {
    setOtherCosts((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddVariation = () => {
    const d = getValues();
    const price = parseFloat(String(d.price || 0).replace(/,/g, '')) || 0;
    const discountedPrice = shouldUseDiscountedPrice
      ? (parseFloat(String(d.discountedPrice || 0).replace(/,/g, '')) || 0)
      : price;
    if (hasSizeOptions && !d.selectedSize) {
      setError('selectedSize', {
        type: 'required',
        message: 'Please select at least one dimension/description option.',
      });
      toast.error('Please select at least one dimension/description option.');
      return;
    }
    if (price <= 0) {
      toast.error('MRP is required and must be greater than 0');
      return;
    }
    if (shouldUseDiscountedPrice && discountedPrice <= 0) {
      toast.error('Discounted MRP is required and must be greater than 0');
      return;
    }
    if (!d.hsn?.trim() && hasHsn) {
      toast.error('HSN is required');
      return;
    }
    if (d.hsn && !/^\d{4}$|^\d{6}$|^\d{8}$/.test(d.hsn)) {
      toast.error('HSN must be 4, 6, or 8 digits');
      return;
    }
    if (d.hsn && d.hsn.startsWith('0')) {
      toast.error('HSN cannot start with 0');
      return;
    }
    if (d.hsn && /^0+$/.test(d.hsn)) {
      toast.error('HSN cannot be all zeros');
      return;
    }
    if (d.selectedSize === 'Shoes Size' && !d.shoeSize) {
      toast.error('Please select a shoe size');
      return;
    }
    if (d.selectedSize === 'Volume' && !d.volume) {
      toast.error('Please enter volume');
      return;
    }
    if (d.selectedSize === 'Custom Size' && !String(d.sizeValue || '').trim()) {
      toast.error('Please enter a custom size or description');
      return;
    }
    let productSize = d.selectedSize || '';
    let measurementUnit = d.sizeUnit || 'cm';
    let shoeSize = '';
    if (d.selectedSize === 'Shoes Size' && d.shoeSize) {
      shoeSize = String(d.shoeSize);
      measurementUnit = d.shoeMeasurementUnit || 'US';
      productSize = shoeSize;
    } else if (CLOTHING_SIZES.includes(d.selectedSize)) {
      productSize = d.selectedSize;
    } else if (d.selectedSize === 'Volume' && d.volume) {
      productSize = `${d.volume}${d.sizeUnit || 'L'}`;
    } else if (d.selectedSize === 'Custom Size') {
      const v = String(d.sizeValue || '').trim();
      const u = String(d.sizeUnit || '').trim();
      productSize = u ? `${v} ${u}` : v;
      measurementUnit = u || 'cm';
    } else if (d.selectedSize && d.sizeValue) {
      productSize = `${d.sizeValue}${d.sizeUnit || 'cm'}`;
    } else if (d.selectedSize) {
      productSize = d.selectedSize;
    }
    
    if (shouldUseDiscountedPrice && discountedPrice > price) {
      toast.error('Discounted MRP cannot be greater than MRP');
      return;
    }
    const minQty = parseInt(d.minOrderQty, 10);
    const maxQty = parseInt(d.maxOrderQty, 10);
    const totalAvailableQty = isVoucherCategory
      ? parseInt(d.totalAvailableQty, 10)
      : null;
    if (!Number.isFinite(minQty) || minQty < 1) {
      toast.error('Minimum Order Quantity must be greater than 0');
      return;
    }
    if (!Number.isFinite(maxQty) || maxQty < 1) {
      toast.error('Maximum Order Quantity must be greater than 0');
      return;
    }
    if (minQty > maxQty) {
      toast.error('Min Order Quantity cannot be greater than Max Order Quantity');
      return;
    }
    if (
      isVoucherCategory &&
      Number.isFinite(totalAvailableQty) &&
      maxQty > totalAvailableQty
    ) {
      toast.error(
        'Maximum Order Quantity cannot be greater than Total Available Quantity'
      );
      return;
    }
    const wantsSample = !!d.isSample;
    const sampleQty = wantsSample ? parseInt(d.sampleAvailability, 10) : 0;
    const samplePrice = wantsSample
      ? parseFloat(String(d.priceOfSample || 0).replace(/,/g, ''))
      : 0;
    if (wantsSample) {
      if (!Number.isFinite(sampleQty) || sampleQty <= 0) {
        toast.error('Sample quantity must be greater than 0');
        return;
      }
      if (!Number.isFinite(samplePrice) || samplePrice <= 0) {
        toast.error('Sample price must be greater than 0');
        return;
      }
    }
    const extraCol = activeVoucherConfig?.extraVariantColumn;
    const variation = {
      PricePerUnit: price,
      ...(shouldUseDiscountedPrice ? { DiscountedPrice: discountedPrice } : {}),
      MinOrderQuantity: minQty,
      MaxOrderQuantity: maxQty,
      GST: String(d.gst || '18'),
      HSN: d.hsn || '',
      ProductSize: productSize,

      ProductIdType: d.productIdType || `SKU-${Date.now()}`,
      Length: ['Length', 'Length x Height', 'Length x Height x Width'].includes(d.selectedSize) ? (d.length || '') : '',
      Width: d.selectedSize === 'Length x Height x Width' ? (d.width || '') : '',
      Height: ['Length x Height', 'Length x Height x Width'].includes(d.selectedSize) ? (d.height || '') : '',
      Weight: d.selectedSize === 'Weight' ? (d.weight || '') : '',
      MeasurementUnit: measurementUnit,
      TotalAvailableQty: parseInt(d.totalAvailableQty, 10) || 1,
      ...(wantsSample && {
        SampleQty: sampleQty,
        SamplePrice: samplePrice,
      }),
      ...(shoeSize && { ShoeSize: shoeSize }),
      ...(isVoucherCategory && {
        validityOfVoucherValue: d.validityOfVoucherValue ?? 12,
        validityOfVoucherUnit: d.validityOfVoucherUnit || 'Months',
      }),
      ...(extraCol === 'flavor' && { Flavor: d.flavor || '' }),
      ...(extraCol === 'offeringType' && { OfferingType: d.offeringType || '' }),
      ...(extraCol === 'dateOfEvent' && (category !== 'eeVoucher' || (typeof localStorage !== 'undefined' && localStorage.getItem('eevoucherdata') === 'event')) && { DateOfTheEvent: d.dateOfEvent || '' }),
    };
    if (editVariationIndex !== null) {
      setProductsVariations((prev) => prev.map((row, i) => (i === editVariationIndex ? variation : row)));
      setEditVariationIndex(null);
      toast.success('Variation updated');
    } else {
      setProductsVariations((prev) => [...prev, variation]);
      toast.success('Variation added');
    }
    setValue('price', '');
    setValue('discountedPrice', '');
    setValue('productIdType', '');
    setValue('length', '');
    setValue('width', '');
    setValue('height', '');
    setValue('weight', '');
    setValue('sizeValue', '');
    setValue('volume', '');
    setValue('shoeSize', '');
    setValue('minOrderQty', '');
    // Voucher: max must not exceed total (form still validates on Save & Next); keep defaults consistent.
    if (isVoucherCategory) {
      setValue('maxOrderQty', '');
      setValue('totalAvailableQty', '');
      clearErrors(['maxOrderQty', 'totalAvailableQty']);
    } else {
      setValue('maxOrderQty', '');
      setValue('totalAvailableQty', '');
    }
    setValue('gst', '');
    setValue('hsn', '');
    setValue('productSize', '');
    setValue('measurementUnit', '');
    setValue('flavor', '');
    setValue('offeringType', '');
    setValue('dateOfEvent', '');
    // Keep size selection & unit fixed once variants exist (BXI Frontend parity).
    // Don't reset sizeUnit to 'cm' unconditionally — re-derive from the locked dimension
    // so subsequent variants keep the correct unit (e.g. 'gsm' for GSM, 'kg' for Weight).
    const lockedSize = (getValues('selectedSize') || '').toLowerCase();
    if (lockedSize.includes('weight') || lockedSize === 'gsm') {
      setValue('sizeUnit', lockedSize === 'gsm' ? 'gsm' : 'kg');
    } else if (lockedSize.includes('battery') || lockedSize.includes('power')) {
      setValue('sizeUnit', lockedSize.includes('battery') ? 'mAh' : 'W');
    } else if (lockedSize.includes('volume') || lockedSize.includes('capacity')) {
      setValue('sizeUnit', 'ml');
    } else if (lockedSize.includes('calorie')) {
      setValue('sizeUnit', 'kcal');
    } else if (lockedSize.includes('nutritional')) {
      setValue('sizeUnit', 'g');
    } else if (lockedSize.includes('shelf life') || lockedSize.includes('shelflife')) {
      setValue('sizeUnit', 'Months');
    } else if (lockedSize.includes('temprature') || lockedSize.includes('temperature') || lockedSize.includes('temp')) {
      setValue('sizeUnit', '°C');
    } else {
      setValue('sizeUnit', 'cm');
    }
    setValue('shoeMeasurementUnit', 'US');
    setValue('isSample', false);
    setValue('sampleAvailability', '');
    setValue('priceOfSample', '');
  };

  const handleEditVariation = (idx) => {
    const row = productsVariations[idx];
    if (!row) return;
    setEditVariationIndex(idx);

    setValue('price', row.PricePerUnit ?? '');
    setValue('discountedPrice', shouldUseDiscountedPrice ? (row.DiscountedPrice ?? '') : '');
    setValue('gst', String(row.GST ?? '18'));
    setValue('hsn', row.HSN ?? '');
    setValue('minOrderQty', String(row.MinOrderQuantity ?? '1'));
    setValue('maxOrderQty', String(row.MaxOrderQuantity ?? '100'));
    setValue('totalAvailableQty', String(row.TotalAvailableQty ?? '1'));
    setValue('productIdType', row.ProductIdType ?? '');

    setValue('isSample', !!(row.SampleQty || row.SamplePrice));
    setValue('sampleAvailability', row.SampleQty ? String(row.SampleQty) : '');
    setValue('priceOfSample', row.SamplePrice ? String(row.SamplePrice) : '');

    // Size/dimensions — use the currently locked dimension if variants exist,
    // so editing doesn't flip the dimension to a wrong type from stale L/W/H/Weight fields.
    const currentLockedSize = getValues('selectedSize');
    const derivedSelectedSize = (isDimensionSelectionLocked && currentLockedSize)
      ? currentLockedSize
      : (inferSelectedSizeFromVariation(row, effectiveSizeOptions) || row.ProductSize || '');
    setValue('selectedSize', derivedSelectedSize);

    setValue('length', row.Length ?? '');
    setValue('width', row.Width ?? '');
    setValue('height', row.Height ?? '');
    setValue('weight', row.Weight ?? '');

    if (derivedSelectedSize === 'Custom Size') {
      const rawPs = String(row.ProductSize || '').trim();
      const mu = String(row.MeasurementUnit || '').trim();
      const parts = rawPs.split(/\s+/).filter(Boolean);
      if (mu && parts.length >= 2 && parts[parts.length - 1] === mu) {
        setValue('sizeValue', parts.slice(0, -1).join(' '));
        setValue('sizeUnit', mu);
      } else {
        setValue('sizeValue', rawPs);
        setValue('sizeUnit', mu || 'cm');
      }
    } else if (!['Length', 'Length x Height', 'Length x Height x Width', 'Weight', 'Shoes Size'].includes(derivedSelectedSize)) {
      // For non-L/W/H/Weight dimensions (e.g. GSM, Battery Capacity), populate sizeValue
      // from ProductSize by stripping the unit suffix if present.
      const rawPs = String(row.ProductSize || '').trim();
      const mu = String(row.MeasurementUnit || '').trim();
      if (mu && rawPs.endsWith(mu)) {
        setValue('sizeValue', rawPs.slice(0, -mu.length).trim());
      } else {
        setValue('sizeValue', rawPs);
      }
      setValue('sizeUnit', mu || 'cm');
    }
    if (row.ShoeSize) {
      setValue('shoeSize', String(row.ShoeSize));
      setValue('shoeMeasurementUnit', row.MeasurementUnit || 'US');
    }

    // Voucher fields
    if (isVoucherCategory) {
      setValue('validityOfVoucherValue', String(row.validityOfVoucherValue ?? '12'));
      setValue('validityOfVoucherUnit', row.validityOfVoucherUnit || 'Months');
    }
    if (activeVoucherConfig?.extraVariantColumn === 'flavor') setValue('flavor', row.Flavor ?? '');
    if (activeVoucherConfig?.extraVariantColumn === 'offeringType') setValue('offeringType', row.OfferingType ?? '');
    if (activeVoucherConfig?.extraVariantColumn === 'dateOfEvent') setValue('dateOfEvent', row.DateOfTheEvent ?? '');
  };

  const handleCancelEdit = () => {
    setEditVariationIndex(null);
    setValue('price', '');
    setValue('discountedPrice', '');
    setValue('productIdType', '');
    setValue('length', '');
    setValue('width', '');
    setValue('height', '');
    setValue('weight', '');
    setValue('sizeValue', '');
    setValue('volume', '');
    setValue('shoeSize', '');
    setValue('minOrderQty', '1');
    if (isVoucherCategory) {
      setValue('maxOrderQty', '1');
      setValue('totalAvailableQty', '1');
      clearErrors(['maxOrderQty', 'totalAvailableQty']);
    } else {
      setValue('maxOrderQty', '100');
      setValue('totalAvailableQty', '1');
    }
    setValue('gst', '');
    setValue('hsn', '');
    setValue('productSize', '');
    setValue('measurementUnit', '');
    setValue('flavor', '');
    setValue('offeringType', '');
    setValue('dateOfEvent', '');
    const lockedSize = (getValues('selectedSize') || '').toLowerCase();
    if (lockedSize.includes('weight') || lockedSize === 'gsm') {
      setValue('sizeUnit', lockedSize === 'gsm' ? 'gsm' : 'kg');
    } else if (lockedSize.includes('battery') || lockedSize.includes('power')) {
      setValue('sizeUnit', lockedSize.includes('battery') ? 'mAh' : 'W');
    } else if (lockedSize.includes('volume') || lockedSize.includes('capacity')) {
      setValue('sizeUnit', 'ml');
    } else if (lockedSize.includes('calorie')) {
      setValue('sizeUnit', 'kcal');
    } else if (lockedSize.includes('nutritional')) {
      setValue('sizeUnit', 'g');
    } else if (lockedSize.includes('shelf life') || lockedSize.includes('shelflife')) {
      setValue('sizeUnit', 'Months');
    } else if (lockedSize.includes('temprature') || lockedSize.includes('temperature') || lockedSize.includes('temp')) {
      setValue('sizeUnit', '°C');
    } else {
      setValue('sizeUnit', 'cm');
    }
    setValue('shoeMeasurementUnit', 'US');
    setValue('isSample', false);
    setValue('sampleAvailability', '');
    setValue('priceOfSample', '');
  };

  const handleRemoveVariation = (idx) => {
    setProductsVariations((prev) => prev.filter((_, i) => i !== idx));
  };

  // Date requirements per category
  const dateRequirements = {
    electronics: { manufacturing: 'mandatory', expiry: 'optional' },
    fmcg: { manufacturing: 'mandatory', expiry: 'mandatory' },
    officesupply: { manufacturing: 'optional', expiry: 'optional' },
    mobility: { manufacturing: 'optional', expiry: 'optional' },
    restaurant: { manufacturing: 'optional', expiry: 'optional' },
    others: { manufacturing: 'mandatory', expiry: 'optional' },
    lifestyle: { manufacturing: 'mandatory', expiry: 'optional' },
  };
  const currentDateReqs = dateRequirements[category] || { manufacturing: 'optional', expiry: 'optional' };

  const { register, handleSubmit, formState: { errors }, setValue, watch, getValues, setError, clearErrors } = useForm({
    defaultValues: {
      price: '',
      discountedPrice: '',
      minOrderQty: '',
      gst: '18',
      hsn: '',
      selectedSize: '',
      sizeValue: '',
      sizeUnit: 'cm',
      productForm: 'Dry',

      productIdType: '',
      length: '',
      width: '',
      height: '',
      weight: '',
      isSample: '',
      gender: 'Unisex',
      shoeSize: '',
      shoeMeasurementUnit: 'US',
      sampleAvailability: '',
      priceOfSample: '',
      volume: '',
      registrationDetails: '',
      insuranceDetails: '',
      taxesDetails: '',
      validityOfVoucherValue: '12',
      validityOfVoucherUnit: 'Months',
      flavor: '',
      offeringType: '',
      dateOfEvent: '',
    }
  });

  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      try {
        const res = await productApi.getProductById(id);
        const data = res?.data;
        if (!data) return;

        setProductData(data);

        // Sync local states
        if (data.ProductFeatures && Array.isArray(data.ProductFeatures)) {
          setFeatureList(data.ProductFeatures);
        }
        if (data.OtherCost && Array.isArray(data.OtherCost)) {
          setOtherCosts(data.OtherCost.map(oc => ({
            AdCostApplicableOn: oc.AdCostApplicableOn || 'All',
            CostPrice: oc.CostPrice || 0,
            currencyType: oc.currencyType || '₹',
            AdCostHSN: oc.AdCostHSN || '',
            AdCostGST: oc.AdCostGST || 18,
            ReasonOfCost: oc.ReasonOfCost || ''
          })));
        }
        if (data.LocationDetails) {
          setLocationDetails(prev => ({
            ...prev,
            ...data.LocationDetails
          }));
        }
        if (data.ProductsVariantions && Array.isArray(data.ProductsVariantions)) {
          setProductsVariations(data.ProductsVariantions);
        }
        if (data.ManufacturingDate) {
          setManufacturingDate(new Date(data.ManufacturingDate));
        }
        if (data.ExpiryDate) {
          setExpiryDate(new Date(data.ExpiryDate));
          setHasExpiryDate(true);
        }
        
        // Populate registration details from existing data
        if (data.RegistrationDetails || data.InsuranceDetails || data.TaxesDetails) {
          setValue('registrationDetails', data.RegistrationDetails || '');
          setValue('insuranceDetails', data.InsuranceDetails || '');
          setValue('taxesDetails', data.TaxesDetails || '');
        }

        if (data.ProductTags && Array.isArray(data.ProductTags)) {
          setTags(data.ProductTags);
        }
        if (data.fromLocation) setFromLocation(data.fromLocation);
        if (data.destinationLocation) setDestinationLocation(data.destinationLocation);
        if (data.redeemedValue) setRedeemedValue(data.redeemedValue);

        if (data.Gender) {
          setValue('gender', data.Gender);
        }
        if (data.ProductForm) {
          setValue('productForm', data.ProductForm);
        }
        
      } catch (error) {
        GlobalToast('Error fetching product in ProductInfo:', error);
      }
    };
    fetchProduct();
  }, [id, category, setValue]);

  const selectedSize = watch('selectedSize');
  const isDimensionSelectionLocked = hasSizeOptions && productsVariations.length > 0;

  useEffect(() => {
    // BXI Frontend parity: once one variant exists, keep the selected dimension fixed.
    if (!isDimensionSelectionLocked || selectedSize) return;
    const inferred = inferSelectedSizeFromVariation(productsVariations[0], effectiveSizeOptions);
    if (inferred) setValue('selectedSize', inferred);
  }, [isDimensionSelectionLocked, selectedSize, productsVariations, effectiveSizeOptions, setValue]);

  useEffect(() => {
    if (!selectedSize) return;
    const s = selectedSize.toLowerCase();
    if (s.includes('weight') || s === 'gsm') {
      setValue('sizeUnit', s === 'gsm' ? 'gsm' : 'kg');
    } else if (s.includes('battery') || s.includes('power')) {
      setValue('sizeUnit', s.includes('battery') ? 'mAh' : 'W');
    } else if (s.includes('volume') || s.includes('capacity')) {
      setValue('sizeUnit', 'ml');
    } else if (s.includes('calorie')) {
      setValue('sizeUnit', 'kcal');
    } else if (s.includes('nutritional')) {
      setValue('sizeUnit', 'g');
    } else if (s.includes('shelf life') || s.includes('shelflife')) {
      setValue('sizeUnit', 'Months');
    } else if (s.includes('temprature') || s.includes('temperature') || s.includes('temp')) {
      setValue('sizeUnit', '°C');
    } else {
      setValue('sizeUnit', 'cm');
    }
  }, [selectedSize, setValue]);

  const onSubmit = async (data) => {
    if (!id) {
      toast.error('Product ID missing. Please start from General Information.');
      return;
    }
    if (productsVariations.length === 0) {
      toast.error('Please add at least one variation using "Proceed to Add"');
      return;
    }
    if (hasFeatures && featureList.length < PRODUCT_FEATURE_MIN) {
      toast.error(`Minimum ${PRODUCT_FEATURE_MIN} features required. Add ${PRODUCT_FEATURE_MIN - featureList.length} more.`);
      return;
    }
    if (hasFeatures && featureList.length > PRODUCT_FEATURE_MAX) {
      toast.error(`Maximum ${PRODUCT_FEATURE_MAX} features allowed.`);
      return;
    }

    if (hasSizeOptions && !watch('selectedSize')) {
      setError('selectedSize', { type: 'required', message: 'Please select at least one dimension/description option.' });
      toast.error('Please select at least one dimension/description option.');
      return;
    }
    
    // Validate Manufacturing Date (mandatory for electronics, fmcg, others)
    if (currentDateReqs.manufacturing === 'mandatory' && !manufacturingDate) {
      toast.error('Manufacturing date is required for this category');
      return;
    }
    
    // Validate Expiry Date (mandatory for FMCG, optional for others if checkbox checked)
    if (category === 'fmcg' && !expiryDate) {
      toast.error('Expiry date is required for FMCG products');
      return;
    }
    if (hasExpiryDate && !expiryDate && category !== 'fmcg') {
      toast.error('Please select an expiry date or uncheck the expiry date option');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const variants = productsVariations;
      const sampleVariant = variants.find(v => v.SampleQty || v.SamplePrice);
      const anySample = !!sampleVariant;
      const payload = {
        _id: id,
        ProductUploadStatus: isVoucherCategory ? 'technicalinformation' : 'productinformation',
        ProductsVariantions: variants,
        IsSample: anySample,
        ...(anySample && {
          SampleAvailability: sampleVariant.SampleQty || 0,
          PriceOfSample: sampleVariant.SamplePrice || 0,
        }),
        ...(hasGenderInProductInfo && { Gender: data.gender, gender: data.gender }),
        ...(hasFeatures && { ProductFeatures: featureList }),
        ...(hasOtherCosts && { OtherCost: otherCosts }),
        ...(hasLocationDetails && { LocationDetails: locationDetails }),
        ...(isVoucherCategory && tags.length > 0 && { ProductTags: tags }),
        ...(category === 'airlineVoucher' && {
          fromLocation,
          destinationLocation,
          redeemedValue,
        }),
        ...(manufacturingDate && { ManufacturingDate: format(manufacturingDate, 'yyyy-MM-dd') }),
        ...(expiryDate && { ExpiryDate: format(expiryDate, 'yyyy-MM-dd') }),
        ...(category === 'fmcg' && data.productForm && { ProductForm: data.productForm }),
        ...(category === 'mobility' && productData?.HasRegistrationProcess === 'Yes' && {
          RegistrationDetails: data.registrationDetails || '',
          InsuranceDetails: data.insuranceDetails || '',
          TaxesDetails: data.taxesDetails || '',
        }),
      };

      if (isVoucherCategory) {
        const voucherPayload = {
          ...payload,
          id: id,
          ProductUploadStatus: 'productinformation',
        };
        await productApi.productMutation(voucherPayload);
      } else {
        await productApi.updateProduct(payload);
      }
      toast.success('Product information saved!');
      navigate(`/${category}/${nextPath}/${id}`);
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to save. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-8" data-testid="product-info-page">
      <div className="form-container">
        <div className="stepper-layout">
          <aside className="stepper-rail">
            <Stepper currentStep={2} category={category} completedSteps={[1]} />
          </aside>

          <main className="stepper-content">
            <div className="form-section">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-semibold">{isVoucherCategory ? 'Voucher Information' : 'Product Information'} - {category.replace(/voucher$/i, '').charAt(0).toUpperCase() + category.replace(/voucher$/i, '').slice(1)}</h2>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <button type="button" className="text-[#6B7A99] hover:text-[#C64091]">
                        <Info className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="w-48 text-white rounded-md padding-1">
                      <p>Product Information encompasses essential details and specifications about a specific product/vouchers, including its name, description, features, pricing, and other relevant data.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
          
          {/* Template Download for Bulk Upload Categories */}
          {supportsBulkUpload(category) && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-blue-900 mb-1">
                    Bulk Upload Available
                  </h3>
                  <p className="text-xs text-blue-700 mb-3">
                    Upload multiple products at once using our Excel template. Download the template, fill in your product details, and upload.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const success = downloadBulkUploadTemplate(category);
                    if (success) {
                      toast.success('Template downloaded successfully!');
                    } else {
                      toast.error('Failed to download template');
                    }
                  }}
                  className="border-blue-500 text-blue-700 hover:bg-blue-100 whitespace-nowrap ml-4"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Template
                </Button>
              </div>
            </div>
          )}
          
          <form noValidate onSubmit={handleSubmit(onSubmit, (formErrors) => {
            const firstKey = Object.keys(formErrors)[0];
            const firstError = formErrors[firstKey];
            toast.error(firstError?.message || `Please fix the "${firstKey}" field before submitting.`);
          })} className="space-y-6">
            {/* Gender selection – for textile */}
            {hasGenderInProductInfo && (
              <div className="space-y-2">
                <Label>Gender (Which gender is your product designed for?)</Label>
                <div className="flex flex-wrap gap-2">
                  {['Male', 'Female', 'Kids', 'Unisex', 'Other'].map((g) => (
                    <Button
                      key={g}
                      type="button"
                      variant="outline"
                      className={cn(
                        watch('gender') === g && 'border-[#C64091] bg-[#FCE7F3] text-[#C64091]'
                      )}
                      onClick={() => setValue('gender', g)}
                    >
                      {g}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Dimensions/Description – as clickable cards */}
            {hasSizeOptions && (
              <div className="space-y-2 mb-2">
                <Label>Select what best suits your {isVoucherCategory ? 'voucher' : 'product'} Dimensions/Description?</Label>
                <div className="flex flex-wrap gap-2">
                  {effectiveSizeOptions.map((opt) => (
                    <Button
                      key={opt}
                      type="button"
                      variant="outline"
                      disabled={isDimensionSelectionLocked}
                      className={cn(
                        selectedSize === opt && 'border-[#C64091] bg-[#FCE7F3] text-[#C64091]',
                        isDimensionSelectionLocked && 'opacity-50 cursor-not-allowed'
                      )}
                      onClick={() => {
                        if (isDimensionSelectionLocked) return;
                        setValue('selectedSize', opt);
                        setValue('length', '');
                        setValue('width', '');
                        setValue('height', '');
                        setValue('weight', '');
                        setValue('sizeValue', '');
                        setValue('volume', '');
                        setValue('shoeSize', '');
                        if (errors.selectedSize) {
                          setError('selectedSize', { type: 'manual', message: '' });
                        }
                      }}
                    >
                      {opt === 'Length x Height'
                        ? 'L x H'
                        : opt === 'Length x Height x Width'
                          ? 'L x H x W'
                          : formatSizeOptionButtonLabel(opt)}
                    </Button>
                  ))}
                </div>
                {errors.selectedSize && (
                  <p className="text-sm text-red-500">{errors.selectedSize.message}</p>
                )}
              </div>
            )}

            {/* Shoes size – ShoeSize dropdown + MeasurementUnit (US/UK/EU) */}
            {hasSizeOptions && selectedSize === 'Shoes Size' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Shoe Size <span className="text-red-500">*</span></Label>
                  <div className="flex gap-2">
                    <Select
                      value={watch('shoeMeasurementUnit')}
                      onValueChange={(v) => {
                        setValue('shoeMeasurementUnit', v);
                        setValue('shoeSize', '');
                      }}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue placeholder="Unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="US">US</SelectItem>
                        <SelectItem value="UK">UK</SelectItem>
                        <SelectItem value="EU">EU</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={watch('shoeSize')}
                      onValueChange={(v) => setValue('shoeSize', v)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        {((watch('shoeMeasurementUnit') || 'US') === 'US' ? US_SHOE_SIZES : (watch('shoeMeasurementUnit') || 'US') === 'UK' ? UK_SHOE_SIZES : EU_SHOE_SIZES).map((s) => (
                          <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Generic size value + unit – For any size option not caught by specialized blocks (incl. Custom Size: free-text value + unit) */}
            {hasSizeOptions && selectedSize && !CLOTHING_SIZES.includes(selectedSize) && selectedSize !== 'Shoes Size' && 
             !['Length', 'Length x Height', 'Length x Height x Width', 'Weight', 'Volume'].includes(selectedSize) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    {selectedSize === 'Custom Size' ? 'Custom size / description' : selectedSize}{' '}
                    <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex gap-2 items-end">
                    <Input
                      type={selectedSize === 'Custom Size' ? 'text' : 'number'}
                      placeholder={selectedSize === 'Custom Size' ? 'e.g. 10 x 12, Large, As per spec' : 'e.g. 10'}
                      {...register('sizeValue')}
                      className="flex-1"
                    />
                    <div className={selectedSize === 'Custom Size' ? 'w-40' : 'w-28'}>
                      <Label htmlFor="sizeUnit" className="text-xs font-medium text-slate-700">Unit</Label>
                      {selectedSize === 'Custom Size' ? (
                        <Input
                          id="sizeUnit"
                          type="text"
                          placeholder="e.g. cm, pcs"
                          className="mt-1"
                          {...register('sizeUnit')}
                        />
                      ) : (
                        <Select
                          value={watch('sizeUnit')}
                          onValueChange={(v) => setValue('sizeUnit', v)}
                        >
                          <SelectTrigger className="w-full mt-1">
                            <SelectValue placeholder="Unit" />
                          </SelectTrigger>
                          <SelectContent>
                            {getSizeUnitOptions(selectedSize).map((unit) => (
                              <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Clothing sizes (XS, S, M, L, etc.) – ProductSize = selectedSize, no extra input */}
            {hasSizeOptions && selectedSize && CLOTHING_SIZES.includes(selectedSize) && (
              <div className="space-y-2">
                <Label>Selected Size</Label>
                <p className="text-sm text-[#6B7A99]">Size: <span className="font-medium text-[#111827]">{selectedSize}</span></p>
              </div>
            )}

            {/* Dimension fields – Length / L×H / L×H×W / Weight (Custom Size uses free-text value + unit above) */}
            {hasSizeOptions && selectedSize && ['Length', 'Length x Height', 'Length x Height x Width', 'Weight'].includes(selectedSize) && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {(selectedSize === 'Length' || selectedSize === 'Length x Height' || selectedSize === 'Length x Height x Width') && (
                  <div className="space-y-2">
                    <Label>Length ({watch('sizeUnit') || 'cm'})</Label>
                    <Input type="number" step="0.01" placeholder="0" {...register('length')} />
                  </div>
                )}

                {/* Height should appear for both LxH and LxHxW */}
                {(selectedSize === 'Length x Height' || selectedSize === 'Length x Height x Width') && (
                  <div className="space-y-2">
                    <Label>Height ({watch('sizeUnit') || 'cm'})</Label>
                    <Input type="number" step="0.01" placeholder="0" {...register('height')} />
                  </div>
                )}

                {selectedSize === 'Length x Height x Width' && (
                  <div className="space-y-2">
                    <Label>Width ({watch('sizeUnit') || 'cm'})</Label>
                    <Input type="number" step="0.01" placeholder="0" {...register('width')} />
                  </div>
                )}

                {selectedSize === 'Weight' && (
                  <div className="space-y-2">
                    <Label>Weight </Label>
                    <Input type="number" step="0.01" placeholder="0" {...register('weight')} />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="sizeUnit" className="text-xs font-medium text-slate-700">Unit</Label>
                  <Select
                    value={watch('sizeUnit')}
                    onValueChange={(v) => setValue('sizeUnit', v)}
                  >
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getSizeUnitOptions(selectedSize).map((unit) => (
                        <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Volume – for lifestyle, others, fmcg, restaurant, mobility */}
            {hasSizeOptions && selectedSize === 'Volume' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Volume <span className="text-red-500">*</span></Label>
                  <div className="flex gap-2 items-end">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 500"
                      {...register('volume')}
                      className="flex-1"
                    />
                    <div className="w-24 space-y-1">
                      <Label htmlFor="sizeUnit" className="text-xs font-medium text-slate-700">Unit</Label>
                      <Select
                        value={watch('sizeUnit')}
                        onValueChange={(v) => setValue('sizeUnit', v)}
                      >
                        <SelectTrigger className="w-full mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getSizeUnitOptions(selectedSize).map((unit) => (
                            <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Product ID */}
            {piConfig.hasProductId && !isVoucherCategory && (
              <div className="space-y-2">
                <Label htmlFor="productIdType">Product Id <span className="text-red-500">*</span></Label>
                <Input
                  id="productIdType"
                  placeholder="e.g. 1910WH23"
                  {...register('productIdType')}
                />
              </div>
            )}

            {/* HSN + GST (same row) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* HSN – when config has HSN */}
              {hasHsn && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="hsn">HSN <span className="text-red-500">*</span></Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type="button" className="text-[#6B7A99] hover:text-[#C64091]">
                            <Info className="w-3.5 h-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Harmonized System Nomenclature code for tax classification (4-8 digits)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="hsn"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="e.g. 998346"
                    {...register('hsn', {
                      setValueAs: (v) => String(v ?? '').replace(/\D/g, ''),
                      onChange: (e) => {
                        const next = String(e?.target?.value ?? '').replace(/\D/g, '');
                        setValue('hsn', next, { shouldValidate: true, shouldDirty: true });
                      },
                    })}
                  />
                </div>
              )}

              {/* GST */}
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
                        <p>Collecting maximum GST of the entire product range is recommended</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Select
                  defaultValue="18"
                  onValueChange={(value) => setValue('gst', value)}
                >
                  <SelectTrigger data-testid="select-gst">
                    <SelectValue placeholder="Select GST rate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0%</SelectItem>
                    <SelectItem value="5">5%</SelectItem>
                    <SelectItem value="12">12%</SelectItem>
                    <SelectItem value="18">18%</SelectItem>
                    <SelectItem value="28">28%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* FMCG: Dry/Wet form selection (not for vouchers) */}
            {piConfig.hasFormSelection && !isVoucherCategory && (
              <div className="space-y-1 pt-3">
                <Label>Product Form</Label>
                <ToggleGroup
                  type="single"
                  value={watch('productForm') || 'Dry'}
                  onValueChange={(value) => setValue('productForm', value)}
                  className="w-max"
                  aria-label="Product form"
                >
                  <ToggleGroupItem value="Dry">Dry</ToggleGroupItem>
                  <ToggleGroupItem value="Wet">Wet</ToggleGroupItem>
                </ToggleGroup>
              </div>
            )}

            {/* GST moved next to HSN above */}

            {/* Pricing */}
            <div className={cn('grid grid-cols-1 gap-6', shouldUseDiscountedPrice && 'md:grid-cols-2')}>
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label htmlFor="price">
                    {isVoucherCategory ? 'Price / Voucher' : 'MRP'} <span className="text-red-500">*</span> {isVoucherCategory ? '' : '(Incl of GST)'}
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" className="text-[#6B7A99] hover:text-[#C64091]">
                          <Info className="w-3.5 h-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Maximum Retail Price including GST</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="price"
                  type="text"
                  inputMode="decimal"
                  placeholder="1000"
                  {...register('price', { min: 0 })}
                  value={watch('price') || ''}
                  onChange={(e) => handleIndianCurrencyChange('price', e.target.value)}
                  className={errors.price ? 'border-red-500' : ''}
                  data-testid="input-price"
                />
              </div>

              {shouldUseDiscountedPrice && (
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label htmlFor="discountedPrice">Discounted MRP <span className="text-red-500">*</span></Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" className="text-[#6B7A99] hover:text-[#C64091]">
                          <Info className="w-3.5 h-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Discounted price after any offers</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="discountedPrice"
                  type="text"
                  inputMode="decimal"
                  placeholder="900"
                  {...register('discountedPrice', { min: 0 })}
                  value={watch('discountedPrice') || ''}
                  onChange={(e) =>
                    handleIndianCurrencyChange('discountedPrice', e.target.value)
                  }
                  data-testid="input-discounted-price"
                />
              </div>
              )}
            </div>

            {/* Quantity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="minOrderQty">Minimum Order Quantity</Label>
                <Input
                  id="minOrderQty"
                  type="number"
                  placeholder="1"
                  min={1}
                  {...register('minOrderQty', { min: 1 })}
                  onWheel={(e) => e.target.blur()}
                  data-testid="input-min-qty"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxOrderQty">Maximum Order Quantity</Label>
                <Input
                  id="maxOrderQty"
                  type="number"
                  placeholder="100"
                  min={1}
                  {...register('maxOrderQty', {
                    min: 1,
                    validate: (value) => {
                      if (!isVoucherCategory) return true;
                      const maxQty = parseInt(value, 10);
                      const totalQty = parseInt(getValues('totalAvailableQty'), 10);
                      if (!Number.isFinite(maxQty) || !Number.isFinite(totalQty)) {
                        return true;
                      }
                      return maxQty <= totalQty
                        ? true
                        : 'Maximum Order Quantity cannot be greater than Total Available Quantity';
                    },
                  })}
                  onWheel={(e) => e.target.blur()}
                  data-testid="input-max-qty"
                />
                {errors.maxOrderQty && (
                  <p className="text-sm text-red-500">{errors.maxOrderQty.message}</p>
                )}
              </div>
            </div>

            {/* Sample provision */}
            {hasSampleCheckbox && (
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isSample"
                    {...register('isSample')}
                    className="w-4 h-4 rounded border-gray-300 text-[#C64091] focus:ring-[#C64091]"
                  />
                  <Label htmlFor="isSample" className="cursor-pointer font-normal">
                    Do you wish to provide a Sample?
                  </Label>
                </div>
                {watch('isSample') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                    <div className="space-y-2">
                      <Label htmlFor="sampleAvailability">Sample Availability (Quantity)</Label>
                      <Input
                        id="sampleAvailability"
                        type="number"
                        placeholder="e.g. 5"
                        min={1}
                        {...register('sampleAvailability', {
                          validate: (value) => {
                            if (!watch('isSample')) return true;
                            const qty = parseInt(value, 10);
                            return Number.isFinite(qty) && qty > 0
                              ? true
                              : 'Sample quantity must be greater than 0';
                          },
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priceOfSample" className="flex items-center ">Price of Sample (<img src={bxitoken} alt="BXI Token" className="w-4 h-4" />)</Label>
                      <Input
                        id="priceOfSample"
                        type="text"
                        inputMode="decimal"
                        placeholder="e.g. 100"
                        min={0.01}
                        step="0.01"
                        {...register('priceOfSample', {
                          validate: (value) => {
                            if (!watch('isSample')) return true;
                            const amount = parseFloat(String(value || '').replace(/,/g, ''));
                            return Number.isFinite(amount) && amount > 0
                              ? true
                              : 'Sample price must be greater than 0';
                          },
                        })}
                        value={watch('priceOfSample') || ''}
                        onChange={(e) =>
                          handleIndianCurrencyChange('priceOfSample', e.target.value)
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Voucher extra fields: Total Available Qty + Validity */}
            {isVoucherCategory  && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="totalAvailableQty">Total Available Quantity <span className="text-red-500">*</span></Label>
                  <Input
                    id="totalAvailableQty"
                    type="number"
                    placeholder="100"
                    {...register('totalAvailableQty', { min: 1 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Validity of Voucher</Label>
                  <Select
                    value={watch('validityOfVoucherValue')}
                    onValueChange={(v) => setValue('validityOfVoucherValue', v)}
                  >
                    <SelectTrigger><SelectValue placeholder="Select validity" /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 18 }, (_, i) => i + 1).map((n) => (
                        <SelectItem key={n} value={String(n)}>{n} Month{n > 1 ? 's' : ''}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className='text-gray-600 text-xs'>Should start from the date buyer activate the voucher after purchase.</p>
                </div>
              </div>
            )}

            {/* Voucher extra variant column: Flavor (FMCG) */}
            {activeVoucherConfig?.extraVariantColumn === 'flavor' && (
              <div className="space-y-2">
                <Label htmlFor="flavor">Flavor</Label>
                <Input id="flavor" placeholder="e.g. Chocolate" {...register('flavor')} />
              </div>
            )}

            {/* Voucher extra variant column: Offering Type (QSR) */}
            {activeVoucherConfig?.extraVariantColumn === 'offeringType' && (
              <div className="space-y-2">
                <Label htmlFor="offeringType">Offering Type</Label>
                <Input id="offeringType" placeholder="e.g. Single Room, Buffet" {...register('offeringType')} />
              </div>
            )}

            {/* Voucher extra variant column: Date of Event (EE Events only, per bxi) */}
            {showDateOfEvent && (
              <div className="space-y-2">
                <Label htmlFor="dateOfEvent">Date of the Event</Label>
                <Input id="dateOfEvent" type="date" {...register('dateOfEvent')} />
              </div>
            )}

            {/* Airline Voucher: Airport selectors */}
            {voucherPiConfig?.hasAirportSelectors && (
              <div className="space-y-4 pt-2">
                <h3 className="text-base font-semibold text-[#111827]">Route Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>From (Origin) <span className="text-red-500">*</span></Label>
                    <Input
                      placeholder="e.g. Mumbai (BOM)"
                      value={fromLocation}
                      onChange={(e) => setFromLocation(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Destination <span className="text-red-500">*</span></Label>
                    <Input
                      placeholder="e.g. Delhi (DEL)"
                      value={destinationLocation}
                      onChange={(e) => setDestinationLocation(e.target.value)}
                    />
                  </div>
                </div>
                {voucherPiConfig?.hasRedeemedValue && (
                  <div className="space-y-2">
                    <Label>Redeemed Value</Label>
                    <div className="flex gap-4">
                      {['Domestic', 'International', 'Both'].map((opt) => (
                        <label key={opt} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="redeemedValue"
                            value={opt}
                            checked={redeemedValue === opt}
                            onChange={() => setRedeemedValue(opt)}
                            className="w-4 h-4 text-[#C64091] focus:ring-[#C64091]"
                          />
                          <span className="text-sm">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Add Variation */}
            <div className="space-y-4 pt-4">
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleAddVariation}
                  className="w-full"
                  data-testid="btn-add-variation"
                >
                  {editVariationIndex !== null ? 'Update variation' : 'Proceed to Add'}
                </Button>
                {editVariationIndex !== null && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
                    className="shrink-0"
                  >
                    Cancel
                  </Button>
                )}
              </div>
              {productsVariations.length === 0 && (
                <p className="text-sm text-gray-500 mt-3">No variations added yet</p>
              )}
              {productsVariations.length > 0 && (
                <div className="mt-4 overflow-x-auto rounded-md border border-[#E5E8EB]">
                  <table className="w-full border-collapse bg-white text-sm">
                    <thead className="bg-[#F9FAFB] text-[#374151]">
                      <tr>
                        {(!isVoucherCategory || hasSizeOptions) && <th className="px-3 py-2 text-center font-medium">Size</th>}
                        {activeVoucherConfig?.extraVariantColumn === 'color' && <th className="px-3 py-2 text-center font-medium">Color</th>}
                        {activeVoucherConfig?.extraVariantColumn === 'flavor' && <th className="px-3 py-2 text-center font-medium">Flavor</th>}
                        {activeVoucherConfig?.extraVariantColumn === 'offeringType' && <th className="px-3 py-2 text-center font-medium">Offering Type</th>}
                        {showDateOfEvent && <th className="px-3 py-2 text-center font-medium">Event Date</th>}

                        <th className="px-3 py-2 text-center font-medium">HSN</th>
                        <th className="px-3 py-2 text-center font-medium">GST</th>
                        <th className="px-3 py-2 text-center font-medium">{isVoucherCategory ? 'Price / Voucher' : 'MRP'}</th>
                        {shouldUseDiscountedPrice && <th className="px-3 py-2 text-center font-medium">Disc. MRP</th>}
                        {isVoucherCategory && <th className="px-3 py-2 text-center font-medium">Qty</th>}
                        <th className="px-3 py-2 text-center font-medium">Min</th>
                        <th className="px-3 py-2 text-center font-medium">Max</th>
                        {isVoucherCategory && <th className="px-3 py-2 text-center font-medium">Validity</th>}
                        {!isVoucherCategory && <th className="px-3 py-2 text-center font-medium">Product ID</th>}
                        {hasSampleCheckbox && <th className="px-3 py-2 text-center font-medium">Sample Price</th>}
                        {hasSampleCheckbox && <th className="px-3 py-2 text-center font-medium">Sample Qty</th>}
                        <th className="px-3 py-2 text-center font-medium">Action</th>
                      </tr>
                    </thead>

                    <tbody className="text-center">
                      {productsVariations.map((v, idx) => (
                        <tr
                          key={v.ProductIdType || idx}
                          className="border-t border-[#E5E8EB] hover:bg-[#F9FAFB]"
                        >
                          {(!isVoucherCategory || hasSizeOptions) && (
                            <td className="px-3 py-2">
                              {formatVariationSize(v)}
                            </td>
                          )}
                          {activeVoucherConfig?.extraVariantColumn === 'color' && (
                            <td className="px-3 py-2">
                              {v.ProductColor ? (
                                <div className="flex items-center justify-center gap-2">
                                  <span className="w-3 h-3 rounded-full border border-[#E5E8EB]" style={{ backgroundColor: v.ProductColor }} />
                                  <span>{v.ProductColor}</span>
                                </div>
                              ) : '—'}
                            </td>
                          )}
                          {activeVoucherConfig?.extraVariantColumn === 'flavor' && (
                            <td className="px-3 py-2">{v.Flavor || '—'}</td>
                          )}
                          {activeVoucherConfig?.extraVariantColumn === 'offeringType' && (
                            <td className="px-3 py-2">{v.OfferingType || '—'}</td>
                          )}
                          {showDateOfEvent && (
                            <td className="px-3 py-2">{v.DateOfTheEvent || '—'}</td>
                          )}

                          <td className="px-3 py-2">{v.HSN || '—'}</td>
                          <td className="px-3 py-2">{v.GST ? `${v.GST}%` : '—'}</td>
                          <td className="px-3 py-2 font-medium">{v.PricePerUnit ? `${Number(v.PricePerUnit).toLocaleString('en-IN')}` : '—'}</td>
                          {shouldUseDiscountedPrice && <td className="px-3 py-2 font-medium">{v.DiscountedPrice ? `${Number(v.DiscountedPrice).toLocaleString('en-IN')}` : '—'}</td>}
                          {isVoucherCategory && <td className="px-3 py-2">{v.TotalAvailableQty ?? '—'}</td>}
                          <td className="px-3 py-2">{v.MinOrderQuantity ?? '—'}</td>
                          <td className="px-3 py-2">{v.MaxOrderQuantity ?? '—'}</td>
                          {isVoucherCategory && <td className="px-3 py-2">{v.validityOfVoucherValue ? `${v.validityOfVoucherValue} Month${v.validityOfVoucherValue > 1 ? 's' : ''}` : '—'}</td>}
                          {!isVoucherCategory && <td className="px-3 py-2">{v.ProductIdType || '—'}</td>}
                          {hasSampleCheckbox && <td className="px-3 py-2">{v.SamplePrice ? `${Number(v.SamplePrice).toLocaleString('en-IN')}` : '—'}</td>}
                          {hasSampleCheckbox && <td className="px-3 py-2">{v.SampleQty ? `${Number(v.SampleQty).toLocaleString('en-IN')}` : '—'}</td>}
                          <td className="px-3 py-2 text-center">
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleEditVariation(idx)}
                                className="text-[#6B7A99] hover:text-[#C64091] px-2 py-1 text-xs font-medium rounded border border-[#E5E8EB] hover:border-[#C64091]"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveVariation(idx)}
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

            {/* Mobility Registration & Compliance Details – only when hasRegistrationProcess === 'Yes' */}
            {category === 'mobility' && productData?.HasRegistrationProcess === 'Yes' && (
              <>
              <Divider/>
              <div className="space-y-4 pt-4 pb-4">
                <h3 className="text-base font-semibold text-[#111827]">Registration & Compliance Details</h3>
                <p className="text-sm text-[#6B7A99]">
                  Provide registration, insurance, and tax details for this mobility product
                </p>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="registrationDetails">Registration Details <span className="text-red-500">*</span></Label>
                    <Textarea
                      id="registrationDetails"
                      placeholder="Enter registration requirements and process details..."
                      rows={3}
                      {...register('registrationDetails', {
                        validate: (value) => {
                          if (
                            category === 'mobility' &&
                            productData?.HasRegistrationProcess === 'Yes' &&
                            !value?.trim()
                          ) {
                            return 'Registration details are required';
                          }
                          return true;
                        }
                      })}
                      
                    />
                    {errors.registrationDetails && (
                        <p className="text-sm text-red-500">{errors.registrationDetails.message}</p>
                      )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="insuranceDetails">Insurance Details <span className="text-red-500">*</span></Label>
                    <Textarea
                      id="insuranceDetails"
                      placeholder="Enter insurance requirements and coverage details..."
                      rows={3}
                      {...register('insuranceDetails', {
                        validate: (value) => {
                          if (
                            category === 'mobility' &&
                            productData?.HasRegistrationProcess === 'Yes' &&
                            !value?.trim()
                          ) {
                            return 'Insurance details are required';
                          }
                          return true;
                        }
                      })}
                    />
                    {errors.insuranceDetails && (
                        <p className="text-sm text-red-500">{errors.insuranceDetails.message}</p>
                      )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="taxesDetails">Taxes Details <span className="text-red-500">*</span></Label>
                    <Textarea
                      id="taxesDetails"
                      placeholder="Enter applicable taxes and related information..."
                      rows={3}
                      {...register('taxesDetails', {
                        validate: (value) => {
                          if (
                            category === 'mobility' &&
                            productData?.HasRegistrationProcess === 'Yes' &&
                            !value?.trim()
                          ) {
                            return 'Taxes details are required';
                          }
                          return true;
                        }
                      })}
                    />
                    {errors.taxesDetails && (
                      <p className="text-sm text-red-500">{errors.taxesDetails.message}</p>
                    )}
                  </div>
                </div>
              </div>
              </>
            )}

            {/* Product Pickup Location */}
            {hasLocationDetails && (
            <>
            <Divider/>
              <div className="space-y-4 pt-4">
                <h3 className="text-base font-semibold text-[#111827]">Product Pickup Location</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Pincode <span className="text-red-500">*</span></Label>
                    <Input
                      placeholder="Enter 6-digit pincode"
                      maxLength={6}
                      value={locationDetails.pincode}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, '');
                        setLocationDetails((prev) => ({ ...prev, pincode: v }));
                        if (v.length === 6) handlePincodeLookup(v);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Region</Label>
                    <Select
                      value={locationDetails.region}
                      onValueChange={(v) => setLocationDetails((prev) => ({ ...prev, region: v }))}
                    >
                      <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="North">North</SelectItem>
                        <SelectItem value="South">South</SelectItem>
                        <SelectItem value="East">East</SelectItem>
                        <SelectItem value="West">West</SelectItem>
                        <SelectItem value="Central">Central</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Select
                      value={locationDetails.state}
                      onValueChange={(v) => setLocationDetails((prev) => ({ ...prev, state: v }))}
                    >
                      <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                      <SelectContent>
                        {StateData?.map((s, i) => (
                          <SelectItem key={i} value={s.name}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Select
                      value={locationDetails.city}
                      onValueChange={(v) => setLocationDetails((prev) => ({ ...prev, city: v }))}
                    >
                      <SelectTrigger>
                        {locationDetails.city ? (
                          <span className="text-sm text-foreground">{String(locationDetails.city)}</span>
                        ) : (
                          <SelectValue placeholder="Select city" />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        {(() => {
                          const normalize = (s) => String(s || '').toLowerCase().replace(/\s+/g, '');
                          const base = Array.isArray(cityArray) ? cityArray : [];
                          // Always include the currently selected city string first.
                          // This guarantees the Select can match `value={locationDetails.city}`
                          // to an existing `SelectItem` even if the cityArray contains a
                          // slightly differently-formatted duplicate.
                          const merged = [locationDetails.city, ...base].filter((c) => String(c || '').trim() !== '');
                          const seen = new Set();
                          const unique = [];
                          for (const c of merged) {
                            const key = normalize(c);
                            if (!key || seen.has(key)) continue;
                            seen.add(key);
                            unique.push(c);
                          }
                          return unique.map((c, i) => (
                            <SelectItem key={`${String(c)}-${i}`} value={String(c)}>
                              {String(c)}
                            </SelectItem>
                          ));
                        })()}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Landmark</Label>
                    <Input
                      placeholder="Eg. Near Metro Station"
                      value={locationDetails.landmark}
                      onChange={(e) => setLocationDetails((prev) => ({ ...prev, landmark: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              </>
            )}

            
            {/* Manufacturing & Expiry Dates – for electronics, fmcg, officesupply, mobility, restaurant, others */}
            {hasManufacturingDates && ['electronics', 'fmcg', 'officesupply', 'mobility', 'restaurant', 'others', 'lifestyle'].includes(category) && (
              <div className="space-y-4 pt-4">
                <h3 className="text-base font-semibold text-[#111827]">Product Dates</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                  {/* Row 1 / mobile: manufacturing label */}
                  <div className="md:col-start-1 md:row-start-1">
                    <Label>
                      Manufacturing Date{' '}
                      {currentDateReqs.manufacturing === 'mandatory' && <span className="text-red-500">*</span>}
                    </Label>
                  </div>
                  {/* Row 2 / mobile: manufacturing picker */}
                  <div className="md:col-start-1 md:row-start-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !manufacturingDate && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {manufacturingDate ? format(manufacturingDate, 'PPP') : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={manufacturingDate}
                          onSelect={setManufacturingDate}
                          disabled={(date) => date > new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Row 1 col 2 / mobile: expiry label or checkbox */}
                  <div className="md:col-start-2 md:row-start-1">
                    {category === 'fmcg' ? (
                      <Label>
                        Expiry Date <span className="text-red-500">*</span>
                      </Label>
                    ) : (
                      <div className="h-6 flex items-center gap-2">
                        <Checkbox
                          id="has-expiry"
                          checked={hasExpiryDate}
                          onCheckedChange={setHasExpiryDate}
                        />
                        <Label htmlFor="has-expiry" className="cursor-pointer leading-none">
                          This product has an expiry date
                        </Label>
                      </div>
                    )}
                  </div>
                  {/* Row 2 col 2 / mobile: expiry picker */}
                  <div className="md:col-start-2 md:row-start-2">
                    {(category === 'fmcg' || hasExpiryDate) && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !expiryDate && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {expiryDate ? format(expiryDate, 'PPP') : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={expiryDate}
                            onSelect={setExpiryDate}
                            disabled={(date) => {
                              if (date < new Date()) return true;
                              if (manufacturingDate && date <= manufacturingDate) return true;
                              return false;
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </div>
              </div>
            )}

            <Divider/>
            {/* Additional Cost */}
            {hasOtherCosts && (
              <div className="space-y-4 pt-4 ">
                <h3 className="text-base font-semibold text-[#111827]">
                  Additional Cost <span className="text-sm font-normal text-[#6B7A99]">(Additional cost is not mandatory)</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Applicable On</Label>
                    <Select
                      value={otherCostForm.AdCostApplicableOn}
                      onValueChange={(v) => setOtherCostForm((prev) => ({ ...prev, AdCostApplicableOn: v }))}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">One Time Cost</SelectItem>
                        <SelectItem value="PerUnit">Per Unit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Cost Price</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={otherCostForm.CostPrice}
                      onChange={(e) => setOtherCostForm((prev) => ({ ...prev, CostPrice: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select
                      value={otherCostForm.currencyType}
                      onValueChange={(v) => setOtherCostForm((prev) => ({ ...prev, currencyType: v }))}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="₹">INR (₹)</SelectItem>
                        <SelectItem value="BXITokens">BXI Tokens <img src={bxitoken} alt="BXI Token" className="w-4 h-4 inline-block ml-1" /></SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>HSN (4/6/8 digits)</Label>
                    <Input
                      placeholder="e.g. 9983"
                      maxLength={8}
                      value={otherCostForm.AdCostHSN}
                      onChange={(e) => setOtherCostForm((prev) => ({ ...prev, AdCostHSN: e.target.value.replace(/\D/g, '') }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>GST %</Label>
                    <Select
                      value={String(otherCostForm.AdCostGST)}
                      onValueChange={(v) => setOtherCostForm((prev) => ({ ...prev, AdCostGST: Number(v) }))}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[5, 12, 18, 28].map((n) => (
                          <SelectItem key={n} value={String(n)}>{n}%</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Reason of Cost</Label>
                    <Input
                      placeholder="Describe the cost"
                      value={otherCostForm.ReasonOfCost}
                      onChange={(e) => setOtherCostForm((prev) => ({ ...prev, ReasonOfCost: e.target.value }))}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      onClick={handleAddOtherCost}
                      className="w-full"
                    >
                      Add Additional Cost
                    </Button>
                  </div>
                </div>
                {otherCosts.length === 0 && (
                  <p className="text-sm text-gray-500 mt-3">
                    No additional costs added yet.
                  </p>
                )}
                {otherCosts.length > 0 && (
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
                      {otherCosts.map((oc, idx) => (
                        <tr
                          key={idx}
                          className="border-t border-[#E5E8EB] hover:bg-[#F9FAFB]"
                        >
                          <td className="px-3 py-2">
                            {oc.AdCostApplicableOn === 'All' ? 'One Time' : 'Per Unit'}
                          </td>

                          <td className="px-3 py-2 font-medium">
                            {oc.CostPrice}
                          </td>

                          <td className="px-3 py-2">
                            {oc.currencyType === 'BXITokens' ? <img src={bxitoken} alt="BXI Token" className="w-4 h-4 inline-block ml-1" /> : '₹'}
                          </td>

                          <td className="px-3 py-2">
                            {oc.AdCostHSN}
                          </td>

                          <td className="px-3 py-2">
                            {oc.AdCostGST}%
                          </td>

                          <td className="px-3 py-2 max-w-[250px] truncate">
                            {oc.ReasonOfCost}
                          </td>

                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveOtherCost(idx)}
                              className="text-[#6B7A99] hover:text-[#C64091] p-1"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              </div>
            )}

            <Divider/>
            {/* Product Features */}
            {hasFeatures && (
            <div className="space-y-4 pt-4">
              {/* Header */}
              <div>
                <h3 className="text-base font-semibold text-[#111827]">
                  {isVoucherCategory ? 'Voucher Features' : 'Product Features'}
                </h3>
                <p className="text-sm font-normal text-[#6B7A99]">
                  Select the best features that describe your brand/product.
                  <span className="block">
                    (The more features you write, the more you are discovered)
                  </span>
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {featureOptions.length > 0 ? (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Select Best Features
                    </Label>
                    <Select
                      value={selectedFeature}
                      onValueChange={setSelectedFeature}
                      disabled={featuresLoading}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={featuresLoading ? 'Loading...' : 'Select a feature'}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {featureOptions
                          .filter((o) => !featureList.some((f) => f.name === o.value))
                          .map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Feature Name
                    </Label>
                    <Input
                      placeholder="e.g. Water Resistant"
                      value={selectedFeature}
                      onChange={(e) => setSelectedFeature(e.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Feature Description *
                  </Label>
                  <Input
                    ref={descriptionRef}
                    placeholder="Eg. Smart watch (max 75 characters)"
                    maxLength={75}
                    value={featureDescription}
                    onChange={(e) => setFeatureDescription(e.target.value)}
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={handleAddFeature}
                    disabled={
                      featureList.length >= PRODUCT_FEATURE_MAX ||
                      !selectedFeature ||
                      !featureDescription?.trim()
                    }
                    className="w-full"
                  >
                    Add Feature
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-[#6B7A99]">
                  Minimum {PRODUCT_FEATURE_MIN} required • Max {PRODUCT_FEATURE_MAX}
                </p>

                <span className={`px-3 py-1 text-xs font-medium rounded-full 
                  ${featureList.length >= PRODUCT_FEATURE_MIN 
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {featureList.length}/{PRODUCT_FEATURE_MAX}
                </span>
              </div>

              {featureList.length > 0 ? (
                <div className="space-y-3">
                  {featureList.map((f, idx) => (
                    <div
                      key={idx}
                      className="flex items-start justify-between gap-3 rounded-lg border border-[#E5E8EB] bg-[#F9FAFB] px-4 py-3 hover:shadow-sm transition"
                    >
                      <div>
                        <p className="font-medium text-[#111827]">
                          {f.name}
                        </p>
                        {f.description && f.description !== f.name && (
                          <p className="text-sm text-[#6B7A99] mt-1">
                            {f.description}
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
                  No features added yet. Add at least {PRODUCT_FEATURE_MIN} features.
                </div>
              )}
            </div>
          )}

          {/* Tags – voucher categories */}
          {isVoucherCategory && (
              <>
              <Divider/>
              <div className="space-y-4 pt-4">
                <h3 className="text-base font-semibold text-[#111827]">
                  Tags <span className="text-sm font-normal text-[#6B7A99]">(Keywords that improve search visibility)</span> <span className="text-red-500">*</span>
                </h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter a tag (max 15 chars)"
                    maxLength={15}
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const t = tagInput.trim();
                        if (t && !tags.includes(t)) {
                          setTags((prev) => [...prev, t]);
                          setTagInput('');
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      const t = tagInput.trim();
                      if (t && !tags.includes(t)) {
                        setTags((prev) => [...prev, t]);
                        setTagInput('');
                      }
                    }}
                    disabled={!tagInput.trim() || tags.includes(tagInput.trim())}
                  >
                    <Tag className="w-4 h-4 mr-1" /> Add
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((t, i) => (
                    <div
                      key={i}
                      className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#FCE7F3] to-[#FDE2F2] text-[#9D174D] text-sm font-medium border border-[#F9A8D4] shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.03]" >
                      <span className="truncate max-w-[140px]">{t}</span>
                
                      <button
                        type="button"
                        onClick={() =>
                          setTags((prev) => prev.filter((_, idx) => idx !== i))
                        }
                        className="flex items-center justify-center w-5 h-5 rounded-full bg-white/60 text-[#C64091] transition-all duration-200 hover:bg-red-100 hover:text-red-600" >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                )}
              </div>
              </>
            )}
            {/* Actions */}
            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/${category}/${prevPath}${id ? `/${id}` : ''}`)}
                data-testid="btn-back"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                type="submit"
                disabled={
                  isSubmitting || 
                  productsVariations.length === 0 || 
                  (hasFeatures && featureList.length < PRODUCT_FEATURE_MIN) ||
                  (category === 'mobility' && productData?.HasRegistrationProcess === 'Yes' && (
                    !watch('registrationDetails')?.trim() || 
                    !watch('insuranceDetails')?.trim() || 
                    !watch('taxesDetails')?.trim()
                  ))
                }
                className="bg-[#C64091] hover:bg-[#A03375]"
                data-testid="btn-save-next"
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
};

// Technical Information Step – weight, dimensions, warranty, additional info
export const TechInfo = ({ category }) => {
  useScrollToTopOnStepEnter();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productData, setProductData] = useState(null);
  const [tags, setTags] = useState([]);
  const [currentTag, setCurrentTag] = useState('');

  const { prev: prevPath, next: nextPath } = getPrevNextStepPaths(category, 'techInfo', location?.pathname);
  const prevStepPath = prevPath || 'product-info';
  const nextStepPath = nextPath || 'go-live';

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    defaultValues: {
      warrantyValue: '',
      warrantyPeriod: 'Year',
      guaranteeValue: '',
      guaranteePeriod: 'Year',
      weightBeforePacking: '',
      weightUnit: 'Grams',
      packagingInstructions: '',
      usageInstructions: '',
    }
  });

  // Fetch product data
  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      try {
        const res = await productApi.getProductById(id);
        const raw = res?.data ?? res;
        const data = raw?.body ?? raw?.data ?? raw;
        setProductData(data);

        // Pre-fill if data exists
        const techInfo = data?.ProductTechInfo || {};
        if (techInfo) {
          if (techInfo.Warranty != null) setValue('warrantyValue', String(techInfo.Warranty));
          if (data?.WarrantyPeriod) setValue('warrantyPeriod', data.WarrantyPeriod);
          if (techInfo.Guarantee != null) setValue('guaranteeValue', String(techInfo.Guarantee));
          if (data?.GuaranteePeriod) setValue('guaranteePeriod', data.GuaranteePeriod);
          if (techInfo.WeightBeforePackingPerUnit != null) setValue('weightBeforePacking', String(techInfo.WeightBeforePackingPerUnit));
          if (data?.WeightBeforePackingPerUnitMeasurUnit) setValue('weightUnit', data.WeightBeforePackingPerUnitMeasurUnit);
          setValue('packagingInstructions', techInfo.PackagingAndDeliveryInstructionsIfAny || '');
          setValue('usageInstructions', techInfo.InstructionsToUseProduct || '');
          if (Array.isArray(techInfo.Tags) && techInfo.Tags.length > 0) setTags(techInfo.Tags);
        }
      } catch (error) {
        GlobalToast('Error fetching product:', error);
      }
    };
    fetchProduct();
  }, [id, setValue]);

  const onSubmit = async (data) => {
    if (!id) {
      toast.error('Product ID missing. Please start from General Information.');
      return;
    }
    if (!tags || tags.length < 1) {
      toast.error('Please add at least one tag');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        _id: id,
        // Save the last completed step as "Technical Information" so "Edit" routes correctly.
        ProductUploadStatus: 'technicalinformation',
        WarrantyPeriod: data.warrantyPeriod,
        GuaranteePeriod: data.guaranteePeriod,
        WeightBeforePackingPerUnitMeasurUnit: data.weightUnit,
        ProductTechInfo: {
          Warranty: Number(data.warrantyValue),
          Guarantee: Number(data.guaranteeValue),
          WeightBeforePackingPerUnit: Number(data.weightBeforePacking),
          PackagingAndDeliveryInstructionsIfAny: data.packagingInstructions,
          InstructionsToUseProduct: data.usageInstructions,
          Tags: tags,
          // Keep nested status aligned with root so Seller Hub routing does not read "golive" before Go Live is saved.
          ProductUploadStatus: 'technicalinformation',
        },
      };
      await productApi.updateProduct(payload);
      toast.success('Technical information saved!');
      const targetPath = `/${category}/${nextStepPath}/${id}`;
      navigate(targetPath);
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to save. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-4" data-testid="tech-info-page">
      <div className="form-container">
        <div className="stepper-layout">
          <aside className="stepper-rail">
            <Stepper currentStep={3} category={category} completedSteps={[1, 2]} />
          </aside>

          <main className="stepper-content">
            <div className="form-section">
              <h2 className="form-section-title">
                Technical Information - {category.replace(/voucher$/i, '').charAt(0).toUpperCase() + category.replace(/voucher$/i, '').slice(1)}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="w-4 h-4 ml-2" />
                    </TooltipTrigger>
                    <TooltipContent className="w-48 text-white rounded-md p-2 text-xs leading-relaxed">
                      Technical Information refers to specific details and specifications about a product's technical aspects, packaging material, packaging size, Dimensions, logistics, go live information for your offered product, This is Crucial Information from Logistics and Buying Perspective for making Informed Decisions.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </h2>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Warranty & Guarantee */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-[#111827]">Warranty & Guarantee</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Warranty <span className="text-red-500">*</span></Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min={1}
                      placeholder="1"
                      {...register('warrantyValue', { required: 'Warranty is required', min: 1 })}
                      className={errors.warrantyValue ? 'border-red-500' : ''}
                    />
                    <Select value={watch('warrantyPeriod')} onValueChange={(v) => setValue('warrantyPeriod', v)}>
                      <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Year">Year</SelectItem>
                        <SelectItem value="Month">Month</SelectItem>
                        <SelectItem value="Days">Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {errors.warrantyValue && <p className="text-sm text-red-500">{errors.warrantyValue.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Guarantee <span className="text-red-500">*</span></Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min={1}
                      placeholder="1"
                      {...register('guaranteeValue', { required: 'Guarantee is required', min: 1 })}
                      className={errors.guaranteeValue ? 'border-red-500' : ''}
                    />
                    <Select value={watch('guaranteePeriod')} onValueChange={(v) => setValue('guaranteePeriod', v)}>
                      <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Year">Year</SelectItem>
                        <SelectItem value="Month">Month</SelectItem>
                        <SelectItem value="Days">Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {errors.guaranteeValue && <p className="text-sm text-red-500">{errors.guaranteeValue.message}</p>}
                </div>
              </div>
            </div>

            {/* Weight before packing */}
            <div className="space-y-4 pt-4 border-t border-[#E5E8EB]">
              <h3 className="text-base font-semibold text-[#111827]">Weight Before Packing (per unit)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Weight <span className="text-red-500">*</span></Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min={1}
                      placeholder="1"
                      {...register('weightBeforePacking', { required: 'Weight is required', min: 1 })}
                      className={errors.weightBeforePacking ? 'border-red-500' : ''}
                    />
                    <Select value={watch('weightUnit')} onValueChange={(v) => setValue('weightUnit', v)}>
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Grams">Grams</SelectItem>
                        <SelectItem value="KiloGrams">KiloGrams</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {errors.weightBeforePacking && <p className="text-sm text-red-500">{errors.weightBeforePacking.message}</p>}
                </div>
              </div>
            </div>

            {/* Packaging instructions */}
            <div className="space-y-2 pt-4 border-t border-[#E5E8EB]">
              <Label>
                Packaging instructions <span className="text-red-500">*</span>
              </Label>
              <Textarea
                rows={4}
                placeholder="Add packaging and delivery instructions..."
                {...register('packagingInstructions', { required: 'Packaging instructions are required' })}
                className={errors.packagingInstructions ? 'border-red-500' : ''}
              />
              {errors.packagingInstructions && <p className="text-sm text-red-500">{errors.packagingInstructions.message}</p>}
            </div>

            {/* Usage instructions */}
            <div className="space-y-2">
              <Label>
                Instructions to use product <span className="text-red-500">*</span>
              </Label>
              <Textarea
                rows={4}
                placeholder="Add instructions to use this product..."
                {...register('usageInstructions', { required: 'Instructions are required' })}
                className={errors.usageInstructions ? 'border-red-500' : ''}
              />
              {errors.usageInstructions && <p className="text-sm text-red-500">{errors.usageInstructions.message}</p>}
            </div>

            {/* Tags (min 1) */}
            <div className="space-y-3 pt-4 border-t border-[#E5E8EB]">
              <Label>Tags <span className="text-red-500">*</span></Label>
              <div className="flex gap-2">
                <Input
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value.slice(0, 20))}
                  onKeyDown={(e) => {
                    if (e.key === ' ' && e.target.selectionStart === 0) e.preventDefault();
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const v = currentTag.trim();
                      if (!v) return;
                      if (tags.includes(v)) return;
                      setTags((p) => [...p, v]);
                      setCurrentTag('');
                    }
                  }}
                  placeholder="Type a tag and press Enter"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="border-[#C64091] text-[#C64091]"
                  onClick={() => {
                    const v = currentTag.trim();
                    if (!v) return;
                    if (tags.includes(v)) return;
                    setTags((p) => [...p, v]);
                    setCurrentTag('');
                  }}
                >
                  Add
                </Button>
              </div>
              {tags.length === 0 && (
                <p className="text-sm text-[#6B7A99]">Add at least one tag to continue.</p>
              )}
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center px-3 py-1 rounded-full 
                              bg-[#FCE7F3] text-[#C64091] text-sm font-medium"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => setTags((p) => p.filter((x) => x !== t))}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/${category}/${prevStepPath}${id ? `/${id}` : ''}`)}
                data-testid="btn-back"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  !watch('warrantyValue') ||
                  !watch('guaranteeValue') ||
                  !watch('weightBeforePacking') ||
                  !watch('packagingInstructions')?.trim() ||
                  !watch('usageInstructions')?.trim() ||
                  tags.length < 1
                }
                className="bg-[#C64091] hover:bg-[#A03375]"
                data-testid="btn-save-next"
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
};

// Go Live Step – Product Images, Size Chart, Listing Period (from bxi-dashboard GoLive)
const MEDIA_CATEGORIES = ['mediaonline', 'mediaoffline'];
const RESTRICTED_ASPECT_CATEGORIES = ['textile', 'officesupply', 'lifestyle', 'others'];

export const GoLive = ({ category, mediaOnlinePreviewPath }) => {
  useScrollToTopOnStepEnter();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [files, setFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [sizechart, setSizechart] = useState(null);
  const [sizeChartPreview, setSizeChartPreview] = useState(null);
  const [productData, setProductData] = useState(null);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState(null);
  const [failedPreviewSources, setFailedPreviewSources] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const inputRef = React.useRef(null);
  const sizechartRef = React.useRef(null);

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      listPeriod: '',
    },
  });

  const isMediaCategory = MEDIA_CATEGORIES.includes(category);
  const requiresListingPeriod = !isMediaCategory;
  const hasRestrictedAspect = RESTRICTED_ASPECT_CATEGORIES.includes(category);
  const totalGoLiveImageCount = files.length + (productData?.ProductImages?.length || 0);
  const goLiveImagesStillNeeded = Math.max(0, 3 - totalGoLiveImageCount);

  const isVoucherDesignStep = location.pathname.includes('voucherdesign');
  const stepKey = isVoucherDesignStep ? 'voucherDesign' : 'goLive';
  const { prev: prevStepPath } = getPrevNextStepPaths(category, stepKey, location?.pathname);
  const goLiveBackPath = prevStepPath || 'tech-info';

  useEffect(() => {
    if (!id) return;
    productApi.getProductById(id)
      .then((res) => {
        const data = res?.data?.body ?? res?.data ?? res;
        setProductData(data);
        if (data?.listperiod) setValue('listPeriod', String(data.listperiod));
        if (data?.ProductImages?.[0]?.url && !selectedPreviewImage) setSelectedPreviewImage(data.ProductImages[0].url);
        const existingSizeChartUrl = data?.SizeChart?.[0]?.url;
        if (existingSizeChartUrl) {
          setSizeChartPreview(existingSizeChartUrl);
        }
      })
      .catch(() => setProductData(null));
  }, [id]);

  useEffect(() => {
    if (isMediaCategory) setValue('listPeriod', '1');
  }, [isMediaCategory]);

  const processFiles = (newFiles) => {
    const valid = Array.from(newFiles).filter((f) => f.type?.startsWith('image/'));
    if (valid.length === 0) return;

    const toAdd = valid.filter((f) => !files.some((p) => p.name === f.name));
    if (toAdd.length < valid.length) {
      toast.error('Duplicate files are not allowed');
      return;
    }
    const nextFiles = [...files, ...toAdd];
    if (nextFiles.length > 6) {
      toast.error('Maximum 6 images allowed');
      return;
    }

    setFiles(nextFiles);
    const added = toAdd.map((f) => ({ file: f, preview: URL.createObjectURL(f) }));
    setImagePreviews((p) => [...p, ...added]);
    if (!selectedPreviewImage && added[0]) setSelectedPreviewImage(added[0].preview);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer?.files;
    if (dropped?.length) processFiles(Array.from(dropped));
  };

  const handleFileChange = (e) => {
    const selected = e.target.files;
    if (selected?.length) processFiles(Array.from(selected));
  };

  const handleDeleteFile = (idx) => {
    const prev = imagePreviews[idx];
    if (prev?.preview?.startsWith('blob:')) URL.revokeObjectURL(prev.preview);
    setFiles((f) => f.filter((_, i) => i !== idx));
    setImagePreviews((p) => p.filter((_, i) => i !== idx));
    if (selectedPreviewImage === prev?.preview && imagePreviews.length > 1) {
      const next = imagePreviews[idx === 0 ? 1 : 0];
      setSelectedPreviewImage(next?.preview || productData?.ProductImages?.[0]?.url);
    } else if (imagePreviews.length === 1) {
      setSelectedPreviewImage(productData?.ProductImages?.[0]?.url || null);
    }
  };

  const handleSizeChartChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Size chart max 5MB');
      return;
    }
    setSizechart(file);
    const reader = new FileReader();
    reader.onloadend = () => setSizeChartPreview(reader.result);
    reader.readAsDataURL(file);
    if (sizechartRef.current) sizechartRef.current.value = '';
  };

  const handleSizeChartDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer?.files?.[0];
    if (f) handleSizeChartChange({ target: { files: [f] } });
  };

  const previewImagesArray = [
    ...imagePreviews.map((p) => p.preview),
    ...(productData?.ProductImages || []).map((img) => img.url).filter(Boolean),
  ].filter((v, i, a) => a.indexOf(v) === i);
  const marketplacePreviewImage = [
    selectedPreviewImage,
    productData?.ProductImages?.[0]?.url,
  ]
    .filter(Boolean)
    .find((src) => !failedPreviewSources.includes(src));
  const previewPrice = productData?.ProductsVariantions?.[0]?.DiscountedPrice ?? productData?.ProductsVariantions?.[0]?.PricePerUnit ?? 0;

  const handleGoToPreview = async (data) => {
    setUploadError(null);
    const totalImages = files.length + (productData?.ProductImages?.length || 0);
    if (totalImages < 3) {
      toast.error('Please upload at least 3 images');
      return;
    }
    if (files.length > 6) {
      toast.error('Maximum 6 images allowed');
      return;
    }
    if (requiresListingPeriod) {
      const val = data.listPeriod?.toString()?.trim();
      if (!val && !productData?.listperiod) {
        toast.error('Please enter the listing period (days)');
        return;
      }
      const num = parseInt(val || productData?.listperiod || '0', 10);
      if (num < 1 || num > 365) {
        toast.error('Listing period must be between 1 and 365 days');
        return;
      }
      if (productData?.ManufacturingData && productData?.ExpiryDate) {
        const mfg = new Date(productData.ManufacturingData);
        const exp = new Date(productData.ExpiryDate);
        const maxDays = Math.round((exp - mfg) / (1000 * 3600 * 24));
        if (num > maxDays) {
          toast.error(`Listing period cannot exceed ${maxDays} days (manufacturing to expiry)`);
          return;
        }
      }
    }
    for (const f of files) {
      if (!f.type?.startsWith('image/')) {
        toast.error('Only image files are allowed');
        return;
      }
    }
    const formData = new FormData();
    formData.append('id', id);
    formData.append('ProductUploadStatus', 'golive');
    formData.append('listperiod', data.listPeriod || (isMediaCategory ? '1' : '') || productData?.listperiod || '70');
    formData.append('ListingType', productData?.ListingType || 'Product');
    formData.append('productName', productData?.ProductName || '');
    formData.append('productSubCategory', productData?.ProductSubCategory || '');
    formData.append('productDescription', productData?.ProductDescription || '');
    files.forEach((f) => formData.append('files', f));
    if (sizechart) formData.append('sizechart', sizechart);
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const response = await productApi.productMutationFormData(formData, (ev) => {
        if (ev.total) setUploadProgress(Math.round((ev.loaded * 100) / ev.total));
      });
      toast.success('Images uploaded! Redirecting to preview.');
      if (isMediaCategory) {
        const base = (mediaOnlinePreviewPath || '/mediaonlineproductpreview').replace(/\/$/, '');
        navigate(`${base}/${id}`);
      } else {
        navigate(`/allproductpreview/${id}`);
      }
    } catch (err) {
      setUploadError(err?.response?.data?.message || err?.message || 'Upload failed. Please try again.');
      toast.error('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-8" data-testid="go-live-page">
      <div className="form-container">
        <div className="stepper-layout">
          <aside className="stepper-rail">
            <Stepper currentStep={4} category={category} completedSteps={[1, 2, 3]} />
          </aside>

          <main className="stepper-content">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="form-section">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="form-section-title text-[#C64091]">Go Live - Product Images</h2>
                  <p className="text-sm text-[#6B7A99] mt-1">Upload high-quality product images to showcase your product</p>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="text-[#6B7A99] hover:text-[#C64091]">
                        <Info className="w-5 h-5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="w-48 text-white rounded-md p-2 text-xs leading-relaxed">
                      <p>Go to preview at which something becomes available to use and purchased by other members on the platform.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <form onSubmit={handleSubmit(handleGoToPreview)} className="space-y-6">
                <div>
                  <Label className="text-base font-semibold flex items-center gap-1">
                    Product Images <span className="text-red-500">*</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type="button" className="text-[#6B7A99] hover:text-[#C64091]">
                            <Info className="w-4 h-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="w-48 text-white rounded-md p-2 text-xs leading-relaxed">
                          Mandatory Photos: Please upload 3 clear product photos with a white background, high resolution, including both close and distant views. If the product is on display or shown in use, kindly include those views as well.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => !isProcessing && inputRef.current?.click()}
                    className={cn(
                      'mt-2 border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
                      'border-[#C64091] bg-white hover:bg-[#FCE7F3]',
                      isProcessing && 'opacity-70 pointer-events-none'
                    )}
                  >
                    <CloudUpload className="w-16 h-16 mx-auto text-[#C64091] mb-3" />
                    <p className="font-semibold text-[#C64091]">Drag & Drop images here</p>
                    <p className="text-sm text-[#6B7A99] mt-1">or <span className="text-[#C64091] font-semibold underline">browse files</span> (Select multiple)</p>
                    <div className="flex flex-wrap justify-center gap-2 mt-3">
                      <span className="px-2 py-1 rounded bg-[#FCE7F3] text-[#C64091] text-xs font-semibold">Min. 3 images</span>
                      <span className="px-2 py-1 rounded bg-[#FCE7F3] text-[#C64091] text-xs">JPEG, PNG, GIF</span>
                      <span className="px-2 py-1 rounded bg-[#FCE7F3] text-[#C64091] text-xs">Max 10MB</span>
                      <span className="px-2 py-1 rounded bg-[#FCE7F3] text-[#C64091] text-xs">
                        {hasRestrictedAspect ? '4:3, 3:2, 16:9' : '4:3, 3:2, 16:9 or 32:9'}
                      </span>
                    </div>
                    <input
                      ref={inputRef}
                      type="file"
                      multiple
                      accept="image/png,image/jpeg,image/gif,image/webp,image/jpg"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>

                  {uploadError && (
                    <div className="mt-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                      {uploadError}
                    </div>
                  )}

                  {(files.length > 0 || imagePreviews.length > 0) && (
                    <div className="mt-6">
                      <Label className="text-base font-semibold flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <span>Uploaded Images ({totalGoLiveImageCount})</span>
                        {goLiveImagesStillNeeded > 0 && (
                          <span className="text-sm font-normal text-amber-800">
                            — {goLiveImagesStillNeeded} more required
                          </span>
                        )}
                      </Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-3">
                        {imagePreviews.map((item, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              'relative rounded-lg overflow-hidden border-2 transition-all',
                              selectedPreviewImage === item.preview ? 'border-[#C64091]' : 'border-gray-200'
                            )}
                          >
                            <div className="aspect-[3/4] bg-gray-100 flex items-center justify-center">
                              <img src={item.preview} alt={`Preview ${idx + 1}`} className="w-full h-full object-contain" />
                            </div>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleDeleteFile(idx); }}
                              className="absolute top-2 right-2 p-1.5 rounded bg-white/90 text-red-500 hover:bg-red-500 hover:text-white z-20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            {selectedPreviewImage === item.preview && (
                              <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-[#C64091] text-white text-xs font-medium z-10">Preview</span>
                            )}
                            <div
                              className="absolute inset-0 cursor-pointer"
                              onClick={() => setSelectedPreviewImage(item.preview)}
                            />
                            <p className="text-xs truncate px-2 py-1 bg-white">{item.file?.name}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!isMediaCategory && (
                    <>
                      <div className="mt-8">
                        <div className="flex items-center gap-1">
                          <Label className="text-base font-semibold">Size Chart & Additional Documents</Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button type="button" className="text-[#6B7A99] hover:text-[#C64091]">
                                  <Info className="w-4 h-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent className="w-48 text-white rounded-md p-2 text-xs leading-relaxed">
                                Size Chart & Additional Documents: upload clear dimension/size chart files and any product packing or logistics documents. Include details on dimensions, material, and assembly instructions for accurate listing and buyer confidence.
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <div
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={handleSizeChartDrop}
                          onClick={() => sizechartRef.current?.click()}
                          className="mt-2 border-2 border-dashed border-[#C64091] rounded-xl p-6 text-center cursor-pointer hover:bg-[#FCE7F3] transition-all"
                        >
                          {sizechart ? (
                            <div className="flex items-center justify-center gap-2">
                              <ImageIcon className="w-10 h-10 text-[#C64091]" />
                              <span className="font-semibold text-[#C64091]">{sizechart.name}</span>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setSizechart(null); setSizeChartPreview(null); }}
                                className="p-1 text-red-500 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <ImageIcon className="w-12 h-12 mx-auto text-[#C64091] mb-2" />
                              <p className="font-semibold text-[#C64091]">Upload Size Chart / Dimensions</p>
                              <p className="text-xs text-[#6B7A99] mt-1">JPG, PNG, JPEG, WEBP, SVG (Max 5 MB)</p>
                            </>
                          )}
                          <input ref={sizechartRef} type="file" accept=".png,.jpeg,.jpg,.webp,.svg" onChange={handleSizeChartChange} className="hidden" />
                        </div>
                      </div>

                      {requiresListingPeriod && (
                        <div className="mt-6">
                          <Label className="text-base font-semibold">
                            Listing Period <span className="text-red-500">*</span>
                          </Label>
                          <div className="flex items-center gap-2 mt-2 max-w-[300px]">
                            <Input
                              type="number"
                              min={1}
                              max={365}
                              placeholder="70"
                              {...register('listPeriod', {
                                required: requiresListingPeriod ? 'Listing period is required' : false,
                                min: 1,
                                max: 365
                              })}
                              className="text-center font-semibold text-[#C64091]"
                            />
                            <span className="text-sm text-[#6B7A99] py-2 px-3 bg-gray-100 rounded">Days</span>
                          </div>
                          <p className="text-xs text-[#6B7A99] mt-1">Maximum 365 days</p>
                        </div>
                      )}
                    </>
                  )}

                  {isUploading && (
                    <div className="mt-4">
                      <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                        <div className="h-full bg-[#C64091] transition-all" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between pt-6 border-t border-gray-200">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate(`/${category}/${goLiveBackPath}${id ? `/${id}` : ''}`)}
                      data-testid="btn-back"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={
                        isUploading || 
                        (requiresListingPeriod && !watch('listPeriod')) ||
                        (files.length + (productData?.ProductImages?.length || 0)) < 3
                      }
                      className="bg-[#C64091] hover:bg-[#A03375]"
                      data-testid="btn-go-preview"
                    >
                      {isUploading ? `Uploading ${uploadProgress}%...` : 'Go to Preview'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="form-section sticky top-6">
              <h3 className="font-semibold text-[#111827] mb-4">Marketplace Preview</h3>
              <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
                <div className="aspect-square bg-gray-100 flex items-center justify-center">
                  {marketplacePreviewImage ? (
                    <img
                      src={marketplacePreviewImage}
                      alt="Preview"
                      className="w-full h-full object-contain"
                      onError={() => {
                        setFailedPreviewSources((prev) =>
                          prev.includes(marketplacePreviewImage)
                            ? prev
                            : [...prev, marketplacePreviewImage]
                        );
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm text-[#6B7A99]">
                      No preview image
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="font-semibold text-[#111827] truncate">{productData?.ProductName || 'Product Name'}</p>
                  <p className="text-[#C64091] font-bold mt-1"><img src={bxitoken} alt="BXI Token" className="w-4 h-4 inline-block ml-1" /> {previewPrice || 0}</p>
                </div>
              </div>
              <div className="mt-4 p-4 rounded-lg bg-[#F8F9FA]">
                <p className="text-sm font-semibold text-[#6B7A99] mb-1">Tip</p>
                <p className="text-xs text-[#6B7A99]">
                  Upload multiple images to see them in a carousel. Click any uploaded image to set it as the preview.
                </p>
              </div>
            </div>
              </div>
            </div>

            {(productData?.ProductImages?.length > 0 || sizeChartPreview) && (
              <div className="mt-8 form-section">
                <h3 className="font-semibold text-[#111827] mb-4">Previously Uploaded</h3>
                {productData?.ProductImages?.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                    {productData.ProductImages.map((img, i) => (
                      <div
                        key={i}
                        className="rounded-lg overflow-hidden border cursor-pointer hover:border-[#C64091]"
                        onClick={() => setSelectedPreviewImage(img.url)}
                      >
                        <img src={img.url} alt={`Previous ${i + 1}`} className="w-full aspect-square object-contain bg-gray-50" />
                      </div>
                    ))}
                  </div>
                )}
                {sizeChartPreview && (
                  <div className="mt-4">
                    <Label className="text-sm font-semibold">Size Chart</Label>
                    <img src={sizeChartPreview} alt="Size chart" className="mt-2 max-w-xs rounded border" />
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div> 
    </div>
  );
};

export { STEPS };
export default { GeneralInformation, ProductInfo, TechInfo, GoLive, Stepper };
