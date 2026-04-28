import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, Info } from 'lucide-react';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../components/ui/tooltip';
import { toast } from 'sonner';
import api from '../../utils/api';
import {
  getMediaSubcategories,
  MEDIA_OFFLINE_PRINT_PRODUCT_SUBCATEGORY_ID_BY_LABEL,
  resolveMediaOfflinePrintSubcategoryId,
} from '../../config/mediaSubcategories';
import {
  normalizeListingPayload,
  buildOfflineResolvedOptionsFromListing,
  filterFlatRowsForOfflineMediaCategory,
} from '../../utils/mediaSubcategoryListing';
import { Stepper } from '../AddProduct/AddProductSteps';

/** Utility function to count letters/characters in a string */
function countLetters(text) {
  if (!text || typeof text !== 'string') return 0;
  return text.length;
}

/**
 * Journey type determines the flow after general info:
 * - hoarding → Hoarding flow
 * - newspaper → News Papers / Magazines flow (product-info)
 * - btl (Car wrap/Bus wrap/Train wrap) → Generic product info flow
 */
const getJourneyRoute = (journey, productId) => {
  switch (journey) {
    case 'hoarding':
      return `/mediaoffline/mediaofflinehoardinginfo/${productId}`;
    case 'newspaper':
    case 'btl':
    default:
      return `/mediaoffline/product-info/${productId}`;
  }
};

const schema = z.object({
  subcategory: z.string().min(1, 'Subcategory is required'),
  productname: z.string().min(5, 'Minimum 5 characters').max(50, 'Maximum 50 characters'),
  productsubtitle: z.string().min(10, 'Minimum 10 characters').max(75, 'Maximum 75 characters'),
  productdescription: z.string().min(20, 'Minimum 20 characters').max(1000, 'Maximum 1000 characters'),
});

const OID_HEX = /^[a-f0-9]{24}$/i;

export default function MediaOfflineGeneralInfo() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productData, setProductData] = useState(null);
  const [resolvedStaticOptions, setResolvedStaticOptions] = useState([]);
  const [productNameLetters, setProductNameLetters] = useState(0);
  const [productSubtitleLetters, setProductSubtitleLetters] = useState(0);
  const [descriptionLetters, setDescriptionLetters] = useState(0);

  // Get journey and media category from URL params or storage
  const journey = useMemo(() => {
    return searchParams.get('journey') ||
      sessionStorage.getItem('mediaJourney') ||
      localStorage.getItem('mediaJourney') ||
      '';
  }, [searchParams]);

  const mediaCategory = useMemo(() => {
    return searchParams.get('mediaCategory') ||
      sessionStorage.getItem('mediaCategory') ||
      localStorage.getItem('mediaCategory') ||
      '';
  }, [searchParams]);

  const staticSubcategories = useMemo(
    () => getMediaSubcategories(mediaCategory),
    [mediaCategory]
  );
  // Use static subcategories when we have them for this category (including Print Media)
  const useStaticSubcategories = staticSubcategories.length > 0;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      subcategory: '',
      productname: '',
      productsubtitle: '',
      productdescription: '',
    },
  });

  const selectedSubcategory = watch('subcategory');

  // Non-static: load subcategories from /mediasubcategory/for_listing (scoped by offline media key)
  useEffect(() => {
    if (useStaticSubcategories) {
      return;
    }
    const fetchSubcategories = async () => {
      try {
        const res = await api.get('/mediasubcategory/for_listing');
        const flat = normalizeListingPayload(res?.data);
        const scoped = filterFlatRowsForOfflineMediaCategory(flat, mediaCategory);
        setSubcategories(
          scoped.map((r) => ({
            _id: r._id,
            Mediaofflinecategory: r.subCategoryName,
          })),
        );
      } catch (error) {
        toast.error('Failed to load subcategories');
      } finally {
        setLoading(false);
      }
    };
    fetchSubcategories();
  }, [useStaticSubcategories, mediaCategory]);

  // Static list: map each label to subcategory _id from /mediasubcategory/for_listing
  useEffect(() => {
    if (!useStaticSubcategories) {
      setResolvedStaticOptions([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/mediasubcategory/for_listing');
        const flat = filterFlatRowsForOfflineMediaCategory(
          normalizeListingPayload(res?.data),
          mediaCategory,
        );
        const opts = buildOfflineResolvedOptionsFromListing(
          staticSubcategories,
          flat,
          mediaCategory,
          MEDIA_OFFLINE_PRINT_PRODUCT_SUBCATEGORY_ID_BY_LABEL,
        );
        if (!cancelled) setResolvedStaticOptions(opts);
      } catch {
        if (!cancelled) {
          const isPrint = mediaCategory.toLowerCase().trim() === 'print';
          setResolvedStaticOptions(
            staticSubcategories.map((name) => ({
              label: name,
              value:
                isPrint && MEDIA_OFFLINE_PRINT_PRODUCT_SUBCATEGORY_ID_BY_LABEL[name]
                  ? MEDIA_OFFLINE_PRINT_PRODUCT_SUBCATEGORY_ID_BY_LABEL[name]
                  : name,
            })),
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [useStaticSubcategories, staticSubcategories, mediaCategory]);

  // Fetch existing product data if editing
  useEffect(() => {
    const fetchProduct = async () => {
      const productId = id || location?.state?.id;
      if (!productId) return;
      
      try {
        const res = await api.get(`/product/get_product_byId/${productId}`);
        const data = res?.data;
        setProductData(data);
        if (data) {
          setValue('productname', data.ProductName || '');
          setValue('productsubtitle', data.ProductSubtitle || '');
          setValue('productdescription', data.ProductDescription || '');
          if (!useStaticSubcategories) {
            setValue('subcategory', data.ProductSubCategory || '');
          }
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      }
    };
    fetchProduct();
  }, [id, location?.state?.id, setValue, useStaticSubcategories]);

  // Static path: after options + product load, set subcategory to Mongo id (or legacy name → id)
  useEffect(() => {
    if (!useStaticSubcategories || !productData) return;
    if (resolvedStaticOptions.length === 0) return;

    const raw = productData.ProductSubCategory;
    const rawStr = raw != null ? String(raw) : '';

    if (OID_HEX.test(rawStr)) {
      setValue('subcategory', rawStr);
      return;
    }

    const byNameFromDb =
      productData.ProductSubCategoryName &&
      resolvedStaticOptions.find((o) => o.label === productData.ProductSubCategoryName);
    if (byNameFromDb) {
      setValue('subcategory', byNameFromDb.value);
      return;
    }

    const legacyName = rawStr && staticSubcategories.includes(rawStr);
    if (legacyName) {
      const opt = resolvedStaticOptions.find((o) => o.label === rawStr);
      setValue('subcategory', opt ? opt.value : rawStr);
      return;
    }

    setValue('subcategory', '');
  }, [
    useStaticSubcategories,
    productData,
    resolvedStaticOptions,
    staticSubcategories,
    setValue,
  ]);

  const getSubcategoryName = (subcategoryValue) => {
    if (!subcategoryValue) return '';
    const v = String(subcategoryValue);
    if (useStaticSubcategories) {
      const fromResolved = resolvedStaticOptions.find((o) => String(o.value) === v);
      if (fromResolved) return fromResolved.label;
      if (staticSubcategories.includes(v)) return v;
    }
    if (productData?.ProductSubCategory === v && productData?.ProductSubCategoryName) {
      return productData.ProductSubCategoryName;
    }
    const found = subcategories.find((item) => String(item._id) === v);
    return found?.Mediaofflinecategory || v;
  };

  const onSubmit = async (data) => {
    if (!data.subcategory) {
      toast.error('Please select a subcategory');
      return;
    }

    setIsSubmitting(true);
    try {
      const subcategoryId =
        mediaCategory.toLowerCase().trim() === 'print'
          ? resolveMediaOfflinePrintSubcategoryId(data.subcategory)
          : data.subcategory;
      const subcategoryName = getSubcategoryName(subcategoryId);
      const productId = id || location?.state?.id;

      const payload = {
        ProductName: data.productname,
        ProductSubtitle: data.productsubtitle,
        ProductDescription: data.productdescription,
        ProductSubCategory: subcategoryId,
        ProductType: 'MediaOffline',
        id: productId,
        ProductUploadStatus: 'productinformation',
        ListingType: 'Media',
        ProductCategoryName:
          journey === 'hoarding'
            ? 'MediaOffline'
            : journey === 'newspaper' ||
                subcategoryName === 'News Papers / Magazines' ||
                subcategoryName === 'Newspaper'
              ? 'News Papers / Magazines'
              : subcategoryName === 'Hoardings'
                ? 'MediaOffline'
                : subcategoryName,
        ProductSubCategoryName: subcategoryName,
        // Store media category for downstream pages
        mediaCategory: mediaCategory,
        mediaJourney: journey,
      };

      const res = await api.post('/product/product_mutation', payload);
      const responseData = res?.data;
      // Product id: from response (top level or .body / .data) or use existing id when updating
      const savedProductId =
        responseData?._id ||
        responseData?.body?._id ||
        responseData?.data?._id ||
        productId;

      if (!savedProductId) {
        toast.error('Save succeeded but product ID was not returned. Please try again or contact support.');
        return;
      }

      toast.success('General information saved!');

      // Route based on journey type (priority) or fallback to subcategory
      if (journey) {
        const nextRoute = getJourneyRoute(journey, savedProductId);
        navigate(nextRoute);
      } else if (subcategoryName === 'Hoardings') {
        navigate(`/mediaoffline/mediaofflinehoardinginfo/${savedProductId}`);
      } else {
        navigate(`/mediaoffline/product-info/${savedProductId}`);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to save. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel?')) {
      navigate('/sellerhub');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] py-8 flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-8">
      <div className="form-container">
        <div className="stepper-layout">
          <aside className="stepper-rail">
            <Stepper currentStep={1} category="mediaoffline" />
          </aside>
          <main className="stepper-content">
        <div className="form-section">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="form-section-title">
              General Information - {({ hoarding: 'Hoarding', print: 'Print Media', offlinebtl: 'Offline BTL' })[mediaCategory] || 'Media Offline'}
            </h2>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-[#6B7A99] hover:text-[#C64091]">
                    <Info className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>General Information refers to broad and fundamental knowledge or facts about a particular Media. It includes Basic details, features, or descriptions that will provide overview to the Buyer.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
            {/* Subcategory */}
            <div className="space-y-2">
              <Label htmlFor="subcategory">
                Subcategory <span className="text-red-500">*</span>
              </Label>
              {productData?.ProductSubCategory && (
                <p className="text-sm text-[#6B7A99]">
                  Selected: <span className="text-[#C64091] font-medium">{getSubcategoryName(productData.ProductSubCategory)}</span>
                </p>
              )}
              <Select
                value={selectedSubcategory}
                onValueChange={(value) => setValue('subcategory', value, { shouldValidate: true })}
              >
                <SelectTrigger id="subcategory" className={errors.subcategory ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select subcategory" />
                </SelectTrigger>
                <SelectContent>
                  {useStaticSubcategories
                    ? resolvedStaticOptions
                        .slice()
                        .sort((a, b) =>
                          a.label.toLowerCase().localeCompare(b.label.toLowerCase()),
                        )
                        .map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))
                    : subcategories
                        .sort((a, b) =>
                          (a.Mediaofflinecategory || '')
                            .toLowerCase()
                            .localeCompare((b.Mediaofflinecategory || '').toLowerCase())
                        )
                        .map((item) => (
                          <SelectItem key={item._id} value={item._id}>
                            {item.Mediaofflinecategory}
                          </SelectItem>
                        ))}
                </SelectContent>
              </Select>
              {errors.subcategory && (
                <p className="text-sm text-red-500">{errors.subcategory.message}</p>
              )}
            </div>

            {/* Product Name */}
            <div className="space-y-2">
              <Label htmlFor="productname">
                Media Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="productname"
                placeholder="Enter product name"
                {...register('productname')}
                onChange={(e) => setProductNameLetters(countLetters(e.target.value))}
                className={errors.productname ? 'border-red-500' : ''}
              />
              <div className="flex items-center justify-between mt-1">
                {errors.productname && (
                  <p className="text-sm text-red-500">{errors.productname.message}</p>
                )}
                <p className="text-xs text-gray-500 ml-auto">{productNameLetters} / 50</p>
              </div>
            </div>

            {/* Subtitle */}
            <div className="space-y-2">
              <Label htmlFor="productsubtitle">
                Subtitle <span className="text-red-500">*</span>
              </Label>
              <Input
                id="productsubtitle"
                placeholder="Enter subtitle"
                {...register('productsubtitle')}
                onChange={(e) => setProductSubtitleLetters(countLetters(e.target.value))}
                className={errors.productsubtitle ? 'border-red-500' : ''}
              />
              <div className="flex items-center justify-between mt-1">
                {errors.productsubtitle && (
                  <p className="text-sm text-red-500">{errors.productsubtitle.message}</p>
                )}
                <p className="text-xs text-gray-500 ml-auto">{productSubtitleLetters} / 75</p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="productdescription">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="productdescription"
                placeholder="Describe your product..."
                rows={5}
                {...register('productdescription')}
                onChange={(e) => setDescriptionLetters(countLetters(e.target.value))}
                className={errors.productdescription ? 'border-red-500' : ''}
              />
              <div className="flex items-center justify-between mt-1">
                {errors.productdescription && (
                  <p className="text-sm text-red-500">{errors.productdescription.message}</p>
                )}
                <p className="text-xs text-gray-500 ml-auto">{descriptionLetters} / 1000</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#C64091] hover:bg-[#A03375]"
              >
                {isSubmitting ? 'Saving...' : 'Next'}
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
