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
import { getMediaSubcategories } from '../../config/mediaSubcategories';
import { Stepper } from '../AddProduct/AddProductSteps';

/**
 * Journey type determines the flow after general info:
 * - digital-ads / digital-screens → Digital Screens flow (DOOH / Excel)
 * - television-ads → Generic media online product-info (Television; not digital screens)
 * - multiplex → Multiplex flow
 * - display-video / airport / other → Generic product info flow
 */
const getJourneyRoute = (journey, productId) => {
  switch (journey) {
    case 'digital-ads':
    case 'digital-screens':
      return `/mediaonline/mediaonlinedigitalscreensinfo/${productId}`;
    case 'multiplex':
      return `/mediaonline/mediaonlinemultiplexproductinfo/${productId}`;
    case 'television-ads':
    case 'display-video':
    case 'airport':
    default:
      return `/mediaonline/product-info/${productId}`;
  }
};

const schema = z.object({
  subcategory: z.string().min(1, 'Subcategory is required'),
  productname: z.string().min(5, 'Minimum 5 characters').max(50, 'Maximum 50 characters'),
  productsubtitle: z.string().min(10, 'Minimum 10 characters').max(75, 'Maximum 75 characters'),
  productdescription: z.string().min(20, 'Minimum 20 characters').max(1000, 'Maximum 1000 characters'),
});

export default function MediaGeneralInfo() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productData, setProductData] = useState(null);

  const mediaCategory = useMemo(() => {
    return searchParams.get('mediaCategory') ||
      sessionStorage.getItem('mediaCategory') ||
      localStorage.getItem('mediaCategory') ||
      productData?.mediaCategory ||
      '';
  }, [searchParams, productData?.mediaCategory]);

  /** Parent document `categoryName` from /mediasubcategory/for_listing (tile click). */
  const listingParent = useMemo(() => {
    return (
      searchParams.get('mediaParent') ||
      sessionStorage.getItem('mediaParent') ||
      localStorage.getItem('mediaParent') ||
      ''
    );
  }, [searchParams]);

  const filteredSubcategories = useMemo(() => {
    if (listingParent) {
      const byParent = subcategories.find(
        (cat) => cat.categoryName === listingParent
      );
      if (byParent?.subCategories?.length) {
        return byParent.subCategories;
      }
    }
    const selectedCategory = subcategories.find(
      (cat) => cat.categoryName === mediaCategory
    );
    return selectedCategory?.subCategories || [];
  }, [subcategories, mediaCategory, listingParent]);

  const journeyRaw = useMemo(() => {
    return searchParams.get('journey') ||
      sessionStorage.getItem('mediaJourney') ||
      localStorage.getItem('mediaJourney') ||
      productData?.mediaJourney ||
      '';
  }, [searchParams, productData?.mediaJourney]);

  /** Television must not follow the DOOH digital-screens journey; normalize legacy links. */
  const journey = useMemo(() => {
    if (mediaCategory === 'television' && journeyRaw === 'digital-ads') {
      return 'television-ads';
    }
    return journeyRaw;
  }, [mediaCategory, journeyRaw]);

  useEffect(() => {
    if (mediaCategory === 'television' && journeyRaw === 'digital-ads') {
      sessionStorage.setItem('mediaJourney', 'television-ads');
      localStorage.setItem('mediaJourney', 'television-ads');
    }
  }, [mediaCategory, journeyRaw]);

  // Static subcategories (used instead of API when available for this category)
  const staticSubcategories = useMemo(
    () => getMediaSubcategories(mediaCategory),
    [mediaCategory]
  );
  // const useStaticSubcategories = staticSubcategories.length > 0;
  const useStaticSubcategories = false;

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

  // Fetch subcategories from API only when not using static list (for fallback/editing)
  useEffect(() => {
    if (useStaticSubcategories) {
      setLoading(false);
      return;
    }
    const fetchSubcategories = async () => {
      try {
      const res = await api.get('/mediasubcategory/all');
      const data = res?.data?.data || [];

      setSubcategories(data);
      } catch (error) {
        toast.error('Failed to load subcategories');
      } finally {
        setLoading(false);
      }
    };
    fetchSubcategories();
  }, [useStaticSubcategories]);

  useEffect(() => {
    if (loading || useStaticSubcategories) return;
    const productId = id || location?.state?.id;
    if (productId) return;

    const preId =
      searchParams.get('preselectedSubcategoryId') ||
      sessionStorage.getItem('preselectedSubcategoryId') ||
      localStorage.getItem('preselectedSubcategoryId');
    if (!preId) return;

    const match = filteredSubcategories.some(
      (s) => String(s._id) === String(preId)
    );
    if (!match) return;

    setValue('subcategory', String(preId), { shouldValidate: true });
    sessionStorage.removeItem('preselectedSubcategoryId');
    localStorage.removeItem('preselectedSubcategoryId');
  }, [
    loading,
    useStaticSubcategories,
    id,
    location?.state?.id,
    filteredSubcategories,
    setValue,
    searchParams,
  ]);

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
          let subToSet = data.ProductSubCategory || '';
          if (useStaticSubcategories) {
            if (data.ProductSubCategoryName && staticSubcategories.includes(data.ProductSubCategoryName))
              subToSet = data.ProductSubCategoryName;
            else if (staticSubcategories.includes(subToSet))
              subToSet = subToSet;
            else
              subToSet = '';
          }
          setValue('subcategory', subToSet);
          setValue('productname', data.ProductName || '');
          setValue('productsubtitle', data.ProductSubtitle || '');
          setValue('productdescription', data.ProductDescription || '');
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      }
    };
    fetchProduct();
  }, [id, location?.state?.id, setValue, useStaticSubcategories, staticSubcategories]);

  const getSubcategoryName = (subcategoryId) => {
    if (!subcategoryId) return '';
    if (useStaticSubcategories && staticSubcategories.includes(subcategoryId))
      return subcategoryId;
    if (
      productData?.ProductSubCategory === subcategoryId &&
      productData?.ProductSubCategoryName
    )
      return productData.ProductSubCategoryName;

    const inFiltered = filteredSubcategories.find(
      (sub) => String(sub._id) === String(subcategoryId)
    );
    if (inFiltered?.subCategoryName) return inFiltered.subCategoryName;

    for (const cat of subcategories) {
      const found = cat.subCategories?.find(
        (sub) => String(sub._id) === String(subcategoryId)
      );
      if (found?.subCategoryName) return found.subCategoryName;
    }
    return subcategoryId;
  };

  const onSubmit = async (data) => {
    if (!data.subcategory) {
      toast.error('Please select a subcategory');
      return;
    }

    setIsSubmitting(true);
    try {
      const subcategoryName = getSubcategoryName(data.subcategory);
      const productId = id || location?.state?.id;

      // Determine ProductCategoryName based on journey or subcategory
      let productCategoryName = 'MediaOnline';
      if (journey === 'multiplex' || subcategoryName === 'Multiplex ADs' || data.subcategory === '643cda0c53068696706e3951') {
        productCategoryName = 'Multiplex ADs';
      }

      const payload = {
        ProductName: data.productname,
        ProductSubtitle: data.productsubtitle,
        ProductDescription: data.productdescription,
        ProductSubCategory: data.subcategory,
        id: productId,
        ProductUploadStatus: 'productinformation',
        ListingType: 'Media',
        ProductCategoryName: productCategoryName,
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
      } else if (responseData?.ProductSubCategoryName === 'Digital ADs') {
        if (mediaCategory === 'television' || journey === 'television-ads') {
          navigate(`/mediaonline/product-info/${savedProductId}`);
        } else {
          navigate(`/mediaonline/mediaonlinedigitalscreensinfo/${savedProductId}`);
        }
      } else if (responseData?.ProductCategoryName === 'Multiplex ADs') {
        navigate(`/mediaonline/mediaonlinemultiplexproductinfo/${savedProductId}`);
      } else {
        navigate(`/mediaonline/product-info/${savedProductId}`);
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
            <Stepper currentStep={1} category="mediaonline" />
          </aside>
          <main className="stepper-content">
        <div className="form-section">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="form-section-title">
              General Information - {({ television: 'Television', multiplex: 'Multiplex', dooh: 'DOOH', radio: 'Radio', airport: 'Airport', other: 'Other' })[mediaCategory] || 'Media Online'}
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
                    ? staticSubcategories
                        .slice()
                        .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
                        .map((name) => (
                          <SelectItem key={name} value={name}>
                            {name}
                          </SelectItem>
                        ))
                    : filteredSubcategories
                      .slice() 
                      .sort((a, b) =>
                        (a.subCategoryName || '')
                          .toLowerCase()
                          .localeCompare((b.subCategoryName || '').toLowerCase())
                      )
                      .map((item) => {
                        const displayName = String(item.subCategoryName || '').trim();

                        return (
                          <SelectItem key={item._id} value={item._id}>
                            {displayName}
                          </SelectItem>
                        );
                      })}
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
                placeholder="Eg. Cafe coffee Day Juhu (8 keywords max)"
                {...register('productname')}
                className={errors.productname ? 'border-red-500' : ''}
                onKeyDown={(e) => {
                  if (e.key === ' ' && e.target.selectionStart === 0) {
                    e.preventDefault();
                  }
                }}
              />
              {errors.productname && (
                <p className="text-sm text-red-500">{errors.productname.message}</p>
              )}
            </div>

            {/* Subtitle */}
            <div className="space-y-2">
              <Label htmlFor="productsubtitle">
                Subtitle <span className="text-red-500">*</span>
              </Label>
              <Input
                id="productsubtitle"
                placeholder="Eg. Digital Ads inside cafe on 64 inch TV (24 keywords max)"
                {...register('productsubtitle')}
                className={errors.productsubtitle ? 'border-red-500' : ''}
                onKeyDown={(e) => {
                  if (e.key === ' ' && e.target.selectionStart === 0) {
                    e.preventDefault();
                  }
                }}
              />
              {errors.productsubtitle && (
                <p className="text-sm text-red-500">{errors.productsubtitle.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="productdescription">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="productdescription"
                placeholder="Eg. Big Brands Need Big digital 64 inch Screens, strategically placed inside cafeteria at a prominent location..."
                rows={5}
                {...register('productdescription')}
                className={errors.productdescription ? 'border-red-500' : ''}
                onKeyDown={(e) => {
                  if (e.key === ' ' && e.target.selectionStart === 0) {
                    e.preventDefault();
                  }
                }}
              />
              {errors.productdescription && (
                <p className="text-sm text-red-500">{errors.productdescription.message}</p>
              )}
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
