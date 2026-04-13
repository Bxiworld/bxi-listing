import {
  Typography,
  Box,
  Button as MuiButton,
  Select,
  MenuItem,
  Input,
  TextField,
  Chip,
} from '@mui/material';
import { Stack } from '@mui/system';
import React, { useEffect, useState, useRef, useMemo } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import RemoveIcon from '../../assets/Images/CommonImages/RemoveIcon.svg';
import RedoIcon from '../../assets/Images/CommonImages/RedoIcon.svg';
import EditIcon from '../../assets/Images/CommonImages/EditIcon.svg';
import { styled } from '@mui/material/styles';
import { useUpdateProductQuery } from './ProductHooksQuery';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import OthercostPortion from './OthercostPortion';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray } from 'react-hook-form';
import bxitoken from '../../assets/Images/CommonImages/BXIToken.png';
import Bxitoken from '../../assets/Images/CommonImages/BXIToken.png';
import { toast } from 'sonner';
import { Info } from 'lucide-react';
import api from '../../utils/api';
import { Stepper } from '../AddProduct/AddProductSteps';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../components/ui/tooltip';
import { Button as UiButton } from '../../components/ui/button';
import StateData from '../../utils/StateCityArray.json';
import { resolveMediaOfflinePrintSubcategoryId } from '../../config/mediaSubcategories';
import {
  FEATURE_ALLOWLIST_BY_KEY,
  filterOfflineFeatureOptions,
} from '../../config/mediaListingProfiles';

const NEWSPAPER_SUBCATEGORY_ID = '647713dcb530d22fce1f6c36';
const PRINT_SUBCATEGORY_NAMES = ['Newspaper', 'Magazines', 'Flyers', 'Electricity bills', 'Boarding Pass'];

/** Single “%” in UI — API/menu values may already include % */
const formatGstPercentLabel = (raw) => {
  if (raw === null || raw === undefined || raw === '') return '';
  const s = String(raw).trim().replace(/%+\s*$/g, '').trim();
  return s === '' ? '' : `${s}%`;
};

const newspaperPricingGridSx = {
  display: 'grid',
  gap: { xs: 2, sm: 2 },
  width: '100%',
  mt: { xs: 2, sm: 2.5 },
  gridTemplateColumns: {
    xs: 'minmax(0, 1fr)',
    sm: 'repeat(2, minmax(0, 1fr))',
    md: 'repeat(3, minmax(0, 1fr))',
    lg: 'repeat(5, minmax(0, 1fr))',
  },
};

const newspaperGridCellSx = {
  display: 'flex',
  flexDirection: 'column',
  gap: 1,
  minWidth: 0,
  width: '100%',
};

const newspaperGridLabelSx = {
  fontFamily: 'Inter, sans-serif',
  fontWeight: 500,
  fontSize: '12px',
  lineHeight: 1.35,
  color: '#5c6b8a',
  minHeight: '2.7em',
};

const ALL_OFFLINE_FEATURE_OPTIONS = [
  { name: 'AD Type' },
  { name: 'Audio' },
  { name: 'Average Like' },
  { name: 'Branding' },
  { name: 'Category' },
  { name: 'Cinematic' },
  { name: 'Circulation' },
  { name: 'Content Creation' },
  { name: 'Contest' },
  { name: 'CPM' },
  { name: 'CPCV' },
  { name: 'Creative' },
  { name: 'CTR' },
  { name: 'Duration' },
  { name: 'Editions' },
  { name: 'Engagement Rate' },
  { name: 'Event Sponsoring Brand' },
  { name: 'Eyeball Reach' },
  { name: 'Eyeballs' },
  { name: 'Footfall' },
  { name: 'Frequency' },
  { name: 'Gender Reach' },
  { name: 'Gold' },
  { name: 'Landmark' },
  { name: 'Lead Time' },
  { name: 'Like Time' },
  { name: 'Media Location' },
  { name: 'Near by' },
  { name: 'No of Seats' },
  { name: 'Occasion' },
  { name: 'Other' },
  { name: 'Platform' },
  { name: 'Placement' },
  { name: 'Platinum' },
  { name: 'Position' },
  { name: 'Prime Time' },
  { name: 'Property Name' },
  { name: 'Quality' },
  { name: 'Reach' },
  { name: 'Readership' },
  { name: 'Roadblock' },
  { name: 'Screen Type' },
  { name: 'Silver' },
  { name: 'Sponsor Tags' },
  { name: 'Studio Shift' },
  { name: 'Time Check' },
  { name: 'Time slot' },
  { name: 'Used for' },
  { name: 'Video' },
];

const MediaProductInfo = () => {
  const ProductId = useParams().id;
  const navigate = useNavigate();
  const [unit, setUnit] = useState('');

  const isNewspaperFromStorage = useMemo(() => {
    try {
      return (
        sessionStorage.getItem('mediaCategory') === 'print' ||
        sessionStorage.getItem('mediaJourney') === 'newspaper' ||
        localStorage.getItem('mediaCategory') === 'print' ||
        localStorage.getItem('mediaJourney') === 'newspaper'
      );
    } catch {
      return false;
    }
  }, []);

  const [HSNStore, setHSNStore] = useState();
  const [ProductData, setProductData] = useState();
  const [hsnCode, setHsnCode] = useState();
  const [FetchedproductData, setFetchedpProuctData] = useState();
  const [onlyState, setOnlyState] = useState(false);
  const [OneUnitProduct, setOneUnitProduct] = useState(false);
  const [IsDisabled, setIsDisabled] = useState();
  const [storeDataOfLocation, setStoreDataOfLocation] = useState({});
  const [OthercostEditId, SetOthercostEditId] = useState(null);
  const [GSTData, setGSTData] = useState();

  const isNewspaperJourney =
    isNewspaperFromStorage ||
    FetchedproductData?.ProductSubCategory === NEWSPAPER_SUBCATEGORY_ID ||
    FetchedproductData?.ProductSubCategoryName === 'News Papers / Magazines' ||
    FetchedproductData?.ProductSubCategoryName === 'Newspaper' ||
    (FetchedproductData?.ProductSubCategoryName &&
      PRINT_SUBCATEGORY_NAMES.includes(FetchedproductData.ProductSubCategoryName)) ||
    // Legacy: ProductSubCategory mistakenly stored as display name
    (FetchedproductData?.ProductSubCategory &&
      PRINT_SUBCATEGORY_NAMES.includes(FetchedproductData.ProductSubCategory));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/Update_TDS_GST/get_all_gst');
        setGSTData(response?.data?.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    control,
    setError,
    reset,

    formState: { errors },
  } = useForm({
    resolver: zodResolver(
      z.object({
        medianame: z.string().min(1),
        offerningbrandat:
          isNewspaperJourney
            ? z.any()
            : z.string().min(1),
        adPosition:
          isNewspaperJourney
            ? z.string().min(1)
            : z.any(),
        mediaVariation: z.object({
          location: z.any(),
          unit: z.any(),
          Timeline: z.any(),
          repetition:
            isNewspaperJourney
              ? z.any()
              : z.string().min(0),
          dimensionSize: z.string().min(1),
          PricePerUnit: z.coerce.string().min(1),
          DiscountedPrice: z.coerce.string().min(1),
          GST: z.coerce.number().gte(5).lte(28),
          HSN: z
            .string()
            .regex(/^\d{4}$|^\d{6}$|^\d{8}$/, {
              message: 'HSN must be 4, 6, or 8 digits',
            })
            .transform((value) => value?.trim()),
          minOrderQuantityunit:
            OneUnitProduct ||
              isNewspaperJourney
              ? z.any()
              : z.coerce.string().min(1),
          minOrderQuantitytimeline:
            isNewspaperJourney
              ? z.any()
              : z.coerce.string().min(1),
          maxOrderQuantityunit:
            OneUnitProduct ||
              isNewspaperJourney
              ? z.any()
              : z.coerce.string().min(1),
          maxOrderQuantitytimeline:
            isNewspaperJourney
              ? z.any()
              : z.coerce.string().min(1),
          edition:
            isNewspaperJourney
              ? z.string().min(1)
              : z.any(),
          Type:
            isNewspaperJourney
              ? z.string().min(1)
              : z.any(),
          releasedetails:
            isNewspaperJourney
              ? z.string().min(1)
              : z.any(),
          availableInsertions: z.any(),
          adType:
            isNewspaperJourney
              ? z.string().min(1)
              : z.any(),
        }),
        GeographicalData: z.object({
          region: z.string().min(1),
          state: IsDisabled === 'PAN India' ? z.any() : z.string().min(1),
          city: IsDisabled === 'PAN India' ? z.any() : z.string().min(1),
          landmark: IsDisabled === 'PAN India' ? z.any() : z.string().min(1),
        }),
      }),
    ),
    defaultValues: {
      mediaVariation: {
        Timeline: 'Day',
      },
    },
  });
  
  const FetchProduct = async () => {
    // Don't fetch if ProductId is not available
    if (!ProductId) {
      return;
    }
    try {
      const response = await api.get('/product/get_product_byId/' + ProductId);
        setFetchedpProuctData(response.data);
        if (
          response.data?.ProductSubCategory === '643cdf01779bc024c189cf95' ||
          response.data?.ProductSubCategory === '643ce635e424a0b8fcbba6d6' ||
          response.data?.ProductSubCategory === '643ce648e424a0b8fcbba710' ||
          response.data?.ProductSubCategory === '643ce6fce424a0b8fcbbad42' ||
          response.data?.ProductSubCategory === '643ce707e424a0b8fcbbad4c' ||
          response.data?.ProductSubCategory === '650296faeaa5251874e8c716'
        ) {
          setOneUnitProduct(true);
          setValue('mediaVariation.minOrderQuantityunit', '1');
          setValue('mediaVariation.maxOrderQuantityunit', '1');
        }
        if (response?.data?.ProductsVariantions?.length > 0) {
          setItems(response?.data?.ProductFeatures);
          setValue('medianame', response?.data?.medianame);
          setValue('offerningbrandat', response?.data?.offerningbrandat);
          setValue('adPosition', response?.data?.adPosition);
          setValue(
            'mediaVariation.PricePerUnit',
            response?.data?.mediaVariation?.PricePerUnit,
          );
          setValue(
            'mediaVariation.repetition',
            response?.data?.mediaVariation?.repetition,
          );
          setValue(
            'mediaVariation.dimensionSize',
            response?.data?.mediaVariation?.dimensionSize,
          );
          setValue(
            'mediaVariation.DiscountedPrice',
            response?.data?.mediaVariation?.DiscountedPrice,
          );
          setValue('mediaVariation.GST', response?.data?.mediaVariation?.GST);
          setValue('mediaVariation.HSN', response?.data?.mediaVariation?.HSN);
          setValue(
            'mediaVariation.minOrderQuantityunit',
            response?.data?.mediaVariation?.minOrderQuantityunit,
          );
          setValue(
            'mediaVariation.minOrderQuantitytimeline',
            response?.data?.mediaVariation?.minOrderQuantitytimeline,
          );
          setValue(
            'mediaVariation.maxOrderQuantityunit',
            response?.data?.mediaVariation?.maxOrderQuantityunit,
          );
          setValue(
            'mediaVariation.maxOrderQuantitytimeline',
            response?.data?.mediaVariation?.maxOrderQuantitytimeline,
          );
          setValue(
            'mediaVariation.location',
            response?.data?.mediaVariation?.location,
          );
          setValue('mediaVariation.unit', response?.data?.mediaVariation?.unit);
          setValue(
            'mediaVariation.Timeline',
            response?.data?.mediaVariation?.Timeline,
          );
          setValue(
            'mediaVariation.minTimeslotSeconds',
            response?.data?.mediaVariation?.minTimeslotSeconds,
          );
          setValue(
            'mediaVariation.maxTimeslotSeconds',
            response?.data?.mediaVariation?.maxTimeslotSeconds,
          );
          OthercostAppend(response?.data?.OtherCost);
          setValue('GeographicalData', response?.data?.GeographicalData);
          setOtherInfoArray(
            response?.data?.OtherInformationBuyerMustKnowOrRemarks,
          );
          setValue('GeographicalData.region', response?.data?.GeographicalData?.region);
          setValue('GeographicalData.state', response?.data?.GeographicalData?.state);
          setValue('GeographicalData.city', response?.data?.GeographicalData?.city);
          setValue(
            'GeographicalData.landmark',
            response?.data?.GeographicalData?.landmark,
          );
          setValue('tags', response?.data?.tags);
        }
      } catch (error) {
        console.error('❌ Error fetching product:', error);
      }
  };
  useEffect(() => {
    FetchProduct();
  }, []);
  const { mutate: updateProduct } = useUpdateProductQuery();

  const [city, setCity] = useState('');
  const [CityArray, setCityArray] = useState();
  const [stateArray, setStateArray] = useState();
  const [state, setState] = useState('');

  useEffect(() => {
    if (stateArray) {
      const stateData = StateData?.filter((item) => item?.name === stateArray);
      setCityArray(stateData[0]?.data);
    }
  }, [stateArray]);

  const {
    fields: OthercostFields,
    append: OthercostAppend,
    remove: OthercostRemove,
    update: OthercostUpdate,
    prepend: OtherCostsPrepend,
  } = useFieldArray({
    control,
    name: 'Othercost',
  });

  const { id } = useParams();

  //Additional feature states and functions
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [traits, setTraits] = useState([]);

  const handleItemAdd = (e) => {
    if (description === '') {
      return toast.error('Please fill the proper features and discription');
    } else if (description.length > 75) {
      return toast.error(' Description must contain atmost 75 characters');
    } else if (name === '') {
      return toast.error('Please add Unique features ');
    } else if (name !== 'Other' && items.some((res) => res.name === name)) {
      setName('');
      return toast.error('Please fill the unique key feature');
    } else if (items.length >= 20) {
      return toast.error('Features cannot be more than 20');
    }
    else {
      const newItem = { name, description };
      if (name.trim() || description.trim() !== '') {
        setItems([...items, newItem]);
      }
    }

    setDescription('');
  };

  const handleDelete = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };
  const tagInputRef = useRef(null);

  const otherInputRef = useRef(null);
  const [OtherInfoArray, setOtherInfoArray] = useState([]);
  const [tags, setTags] = useState([]);

  const handleAddTag = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const currentTag = e.target.value.trim();
      if (currentTag !== '') {
        if (!tags.includes(currentTag)) {
          setTags([...tags, currentTag]);
        }
        tagInputRef.current.value = '';
      }
    }
  };

  const handleAddButtonClick = () => {
    const currentTag = tagInputRef.current.value.trim();
    if (currentTag !== '') {
      if (!tags.includes(currentTag)) {
        setTags([...tags, currentTag]);
      }
      tagInputRef.current.value = '';
    }
  };
  const handleDeleteTag = (tagToDelete) => () => {
    setTags((tags) => tags.filter((tag) => tag !== tagToDelete));
  };

  const OtherInformationSubmit = (e) => {
    const others = otherInputRef.current.value.trim();
    if (others !== '') {
      if (!OtherInfoArray.includes(others)) {
        setOtherInfoArray([...OtherInfoArray, others]);
      }
      otherInputRef.current.value = '';
    }
  };

  const otherenter = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const others = e.target.value.trim();
      if (others !== '') {
        if (!OtherInfoArray.includes(others)) {
          setOtherInfoArray([...OtherInfoArray, others]);
        }
        otherInputRef.current.value = '';
      }
    }
  };

  useEffect(() => {
    if (isNewspaperJourney) {
      setValue('mediaVariation.Timeline', 'Day');
    }
  }, []);

  async function FetchAddedProduct() {
    try {
      const res = await api.get(`/product/get_product_byId/${ProductId}`);
      fetchHsnCode(res.data?.ProductSubCategory);
      return res.data;
    } catch (err) {}
  }

  async function fetchHsnCode(props) {
    try {
      const res = await api.post('/hsn/Get_HSNCode', { SubCatId: '63e38b9ccc4c02b8a0c94b6f' });
      setHSNStore(res.data);
    } catch (err) {}
  }

  const OthercostFieldsarray = [
    'Applicable On',
    'Other cost ',
    'HSN',
    'GST',
    'Reason Of Cost',
  ];

  useEffect(() => {
    FetchAddedProduct();
  }, []);
  const featureChoices = useMemo(() => {
    if (isNewspaperJourney) {
      return FEATURE_ALLOWLIST_BY_KEY.print.map((n) => ({ name: n }));
    }
    return ALL_OFFLINE_FEATURE_OPTIONS;
  }, [isNewspaperJourney]);

  const ConvertPriceToperDay = (price, timeline) => {
    if (timeline === 'Day') {
      return price;
    } else if (timeline === 'Week') {
      return Number(price) / 7;
    } else if (timeline === 'Month') {
      return Number(price) / 30;
    } else if (timeline === 'Year') {
      return Number(price) / 365;
    } else if (unit === 'Spot') {
      return price;
    }
  };

  const updateProductTotextilestatus = handleSubmit((data) => {
    const DiscountedPrice = data?.mediaVariation.DiscountedPrice?.replace(
      /,/g,
      '',
    );
    const PricePerUnit = data?.mediaVariation.PricePerUnit?.replace(/,/g, '');

    if (isNewspaperJourney) {
      setValue('mediaVariation.Timeline', 'Day');
      setValue('mediaVariation.maxOrderQuantityunit', '1');
      setValue('mediaVariation.maxOrderQuantitytimeline', '1');
      setValue('mediaVariation.availableInsertions', '1');
      setValue('mediaVariation.MinOrderQuantity', '1');
    }
    if (OneUnitProduct) {
      setValue('mediaVariation.MinOrderQuantity', '1');
      setValue('mediaVariation.MaxOrderQuantity', '1');
    }
    const datatobesent = {
      ...data,
      id: ProductId,
      ...(FetchedproductData && {
        ProductSubCategory: resolveMediaOfflinePrintSubcategoryId(
          FetchedproductData.ProductSubCategory,
          FetchedproductData.ProductSubCategoryName,
        ),
        ProductSubCategoryName: FetchedproductData.ProductSubCategoryName,
      }),
      OtherCost: OthercostFields,
      GeographicalData: {
        region: getValues()?.GeographicalData?.region,
        state: getValues()?.GeographicalData?.state,
        city: getValues()?.GeographicalData?.city,
        landmark: getValues()?.GeographicalData?.landmark,
      },
      ProductFeatures: items,
      ProductsVariantions: [getValues()?.mediaVariation],
      OtherInformationBuyerMustKnowOrRemarks: OtherInfoArray,
      mediaVariation: getValues()?.mediaVariation,
      ProductUploadStatus: 'productinformation',
      ListingType: 'Media',
      tags: tags,

      DiscountePricePerDay: Math.round(
        Number(
          ConvertPriceToperDay(
            getValues()?.mediaVariation?.DiscountedPrice,
            getValues()?.mediaVariation?.Timeline,
          ),
        ),
      ),
    };

    if (!storeDataOfLocation.region && !data?.GeographicalData?.region) {
      setError('GeographicalData.region', {
        type: 'custom',
        message: 'Please select a region',
      });
      toast.error('Please select a Region');
    }

    if (
      !storeDataOfLocation.state &&
      !data?.GeographicalData?.state &&
      storeDataOfLocation?.region !== 'PAN India'
    ) {
      setError('GeographicalData.state', {
        type: 'custom',
        message: 'Please select a state',
      });
      toast.error('Please select a State');
    }

    if (
      !storeDataOfLocation.city &&
      !data?.GeographicalData?.city &&
      storeDataOfLocation?.region !== 'PAN India'
    ) {
      setError('GeographicalData.city', {
        type: 'custom',
        message: 'Please select a city',
      });
      toast.error('Please select a City');
    }
    if (
      Number(data?.mediaVariation?.minOrderQuantityunit) >
      Number(data?.mediaVariation?.maxOrderQuantityunit)
    ) {
      setError('mediaVariation.maxOrderQuantityunit', {
        type: 'custom',
        message: 'Max Order Quantity can not be less than Min Order Quantity',
      });
      return toast.error('Max Order Quantity can not be less than Min Order Quantity');
    }
    if (
      Number(data?.mediaVariation?.minOrderQuantitytimeline) >
      Number(data?.mediaVariation?.maxOrderQuantitytimeline)
    ) {
      setError('mediaVariation.maxOrderQuantitytimeline', {
        type: 'custom',
        message: 'Max Order Quantity can not be less than Min Order Quantity',
      });
    }
    if (items?.length < 5) {
      return toast.error('Please Select Best Features ( Min 5 )');
    } else if (Number(DiscountedPrice) > Number(PricePerUnit)) {
      setError('mediaVariation.DiscountedPrice', {
        type: 'custom',
        message: 'Discounted Price can not be greater than Price Per Unit',
      });
      return toast.error('Discounted Price can not be greater than Price Per Unit');
    } else if (items?.length > 20) {
      return toast.error('Please Select Best Features ( max 20 )');
    } else if (tags?.length === 0 && FetchedproductData?.tags?.length === 0) {
      return toast.error('Please add atleast one Tag');
    } else {
      updateProduct(datatobesent, {
        onSuccess: (response) => {
          if (response.status === 200) {
            // Use new dynamic route
            navigate(`/mediaoffline/tech-info/${id}`);
          }
        },
        onError: (error) => { },
      });
    }
  });
  let GST = '';
  HSNStore?.filter((item) => {
    return item.HSN === hsnCode;
  })?.map((item, index) => {
    GST = item.GST;
  });
  useEffect(() => {
    setValue('mediaVariation.GST', GST);
  }, [GST]);

  React.useEffect(() => {
    ProductData?.OtherCost.forEach((value) => {
      OthercostAppend(value);
    });
  }, [OthercostAppend]);

  const CancelJourney = () => {
    const WindowConfirmation = window.confirm(
      'Are you sure you want to cancel the product?',
    );
    if (WindowConfirmation) {
      navigate('/sellerhub');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-6 sm:py-8">
      <div className="form-container">
        <div className="stepper-layout">
          <aside className="stepper-rail">
            <Stepper currentStep={2} category="mediaoffline" completedSteps={[1]} />
          </aside>
          <main className="stepper-content min-w-0">
            <div className="form-section">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="form-section-title">Media Information</h2>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="text-[#6B7A99] hover:text-[#C64091] transition-colors shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C64091]/30"
                        aria-label="About media information"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs text-left">
                      <p>
                        Media Information encompasses essential details and specifications about a specific media, including its name, description, features, pricing, and other relevant data, facilitating informed purchasing decisions for potential buyers.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <form
                onSubmit={updateProductTotextilestatus}
                className="space-y-6 mt-1"
              >
                <Box sx={{ width: '100%', overflowX: 'auto' }}>
                  <Stack spacing={2.5} sx={{ width: '100%' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.75,
                    }}
                  >
                    <Typography sx={CommonTextStyle}>
                      Media Name <span style={{ color: 'red' }}> *</span>
                    </Typography>

                    <TextField
                      focused
                      multiline
                      variant="standard"
                      placeholder="Eg. Khushi Advertising"
                      {...register('medianame', {
                        onChange: (e) => {
                          setName(e.target.value);
                        },
                      })}
                      onKeyDown={(e) => {
                        if (e.key === ' ' && e.target.selectionStart === 0) {
                          e.preventDefault();
                        }
                      }}
                      sx={standardMultilineFieldSx(
                        !!errors?.medianame?.message,
                      )}
                      InputProps={{
                        disableUnderline: true,
                      }}
                    />
                    <Typography sx={FieldErrorTextStyle}>
                      {errors?.medianame?.message}
                    </Typography>
                  </Box>
                  {isNewspaperJourney ? (
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 0.75,
                        }}
                      >
                        <Typography sx={CommonTextStyle}>
                        Position of the Ad ?{' '}
                          <span style={{ color: 'red' }}> *</span>
                        </Typography>

                        <TextField
                          focused
                          multiline
                          variant="standard"
                          placeholder="Cover Page, Left Side, Right Side"
                          {...register('adPosition')}
                          onKeyDown={(e) => {
                            if (e.key === ' ' && e.target.selectionStart === 0) {
                              e.preventDefault();
                            }
                          }}
                          sx={standardMultilineFieldSx(
                            !!errors?.adPosition?.message,
                          )}
                          InputProps={{
                            disableUnderline: true,
                          }}
                        />
                        <Typography sx={FieldErrorTextStyle}>
                          {errors?.adPosition?.message}
                        </Typography>
                      </Box>
                    ) : (
                      <>
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 0.75,
                          }}
                        >
                          <Typography sx={CommonTextStyle}>
                          Offering this branding at ?{' '}
                            <span style={{ color: 'red' }}> *</span>
                          </Typography>

                          <TextField
                            focused
                            multiline
                            variant="standard"
                            placeholder="Pan India national TV during morning show"
                            onKeyDown={(e) => {
                              if (
                                e.key === ' ' &&
                              e.target.selectionStart === 0
                              ) {
                                e.preventDefault();
                              }
                            }}
                            {...register('offerningbrandat')}
                            sx={standardMultilineFieldSx(
                              !!errors?.offerningbrandat?.message,
                            )}
                            InputProps={{
                              disableUnderline: true,
                            }}
                          />
                          <Typography
                            sx={FieldErrorTextStyle}
                          >
                            {errors?.offerningbrandat?.message}
                          </Typography>
                        </Box>
                      </>
                    )}
                  {isNewspaperJourney ? (
                      <>
                        <Box sx={newspaperPricingGridSx}>
                          <Box sx={newspaperGridCellSx}>
                            <Typography sx={newspaperGridLabelSx}>
                              Edition (Language){' '}
                              <span style={{ color: 'red' }}> *</span>
                            </Typography>
                            <Input
                              disableUnderline
                              placeholder="Mumbai English"
                              {...register('mediaVariation.edition')}
                              sx={{
                                ...inputStyles,
                                width: '100%',
                                maxWidth: 'none',
                                minWidth: 0,
                              }}
                            />
                            <Typography sx={FieldErrorTextStyle}>
                              {errors?.mediaVariation?.edition?.message}
                            </Typography>
                          </Box>

                          <Box sx={newspaperGridCellSx}>
                            <Typography sx={newspaperGridLabelSx}>Type</Typography>
                            <Select
                              displayEmpty
                              renderValue={(selected) => {
                                if (
                                  selected === undefined ||
                                  selected === null ||
                                  selected === ''
                                ) {
                                  return (
                                    <Box
                                      component="span"
                                      sx={{
                                        color: '#6B7A99',
                                        opacity: 0.55,
                                        fontSize: '12px',
                                      }}
                                    >
                                      Select type
                                    </Box>
                                  );
                                }
                                return selected;
                              }}
                              disableUnderline
                              {...register('mediaVariation.Type', {
                                onChange: (e) => {
                                  setOnlyState(!onlyState);
                                  setUnit(e.target.value);
                                },
                              })}
                              sx={{
                                ...inputStyles,
                                width: '100%',
                                maxWidth: 'none',
                                minWidth: 0,
                              }}
                            >
                              <MenuItem value="Full Page">Full Page</MenuItem>
                              <MenuItem value="Half Page">Half Page</MenuItem>
                              <MenuItem value="Quarter Page">Quarter Page</MenuItem>
                              <MenuItem value="Custom Size">Custom Size</MenuItem>
                            </Select>
                            <Typography sx={FieldErrorTextStyle}>
                              {errors?.mediaVariation?.Type?.message}
                            </Typography>
                          </Box>

                          <Box sx={newspaperGridCellSx}>
                            <Typography sx={newspaperGridLabelSx}>
                              Release Details
                            </Typography>
                            <Select
                              displayEmpty
                              renderValue={(selected) => {
                                if (
                                  selected === undefined ||
                                  selected === null ||
                                  selected === ''
                                ) {
                                  return (
                                    <Box
                                      component="span"
                                      sx={{
                                        color: '#6B7A99',
                                        opacity: 0.55,
                                        fontSize: '12px',
                                      }}
                                    >
                                      Select release
                                    </Box>
                                  );
                                }
                                return selected;
                              }}
                              disableUnderline
                              {...register('mediaVariation.releasedetails', {
                                onChange: () => {
                                  setOnlyState(!onlyState);
                                },
                              })}
                              sx={{
                                ...inputStyles,
                                width: '100%',
                                maxWidth: 'none',
                                minWidth: 0,
                              }}
                            >
                              <MenuItem value="Per Insertion">Per Insertion</MenuItem>
                            </Select>
                            <Typography sx={FieldErrorTextStyle}>
                              {errors?.mediaVariation?.releasedetails?.message}
                            </Typography>
                          </Box>

                          <Box sx={newspaperGridCellSx}>
                            <Typography sx={newspaperGridLabelSx}>
                              No. of insertions available
                            </Typography>
                            <Input
                              disableUnderline
                              placeholder="28"
                              disabled
                              value={1}
                              {...register('mediaVariation.availableInsertions', {
                                onChange: (e) => {
                                  setValue(
                                    'mediaVariation.maxOrderQuantityunit',
                                    e.target.value,
                                  );
                                  setValue(
                                    'mediaVariation.maxOrderQuantitytimeline',
                                    e.target.value,
                                  );
                                },
                              })}
                              sx={{
                                ...inputStyles,
                                width: '100%',
                                maxWidth: 'none',
                                minWidth: 0,
                              }}
                            />
                            <Typography sx={FieldErrorTextStyle}>
                              {
                                errors?.mediaVariation?.availableInsertions
                                  ?.message
                              }
                            </Typography>
                          </Box>

                          <Box sx={newspaperGridCellSx}>
                            <Typography sx={newspaperGridLabelSx}>
                              Dimension size
                            </Typography>
                            <Input
                              disableUnderline
                              placeholder="2048 X 998"
                              {...register('mediaVariation.dimensionSize')}
                              sx={{
                                ...inputStyles,
                                width: '100%',
                                maxWidth: 'none',
                                minWidth: 0,
                              }}
                            />
                          </Box>

                          <Box sx={newspaperGridCellSx}>
                            <Typography sx={newspaperGridLabelSx}>
                              Price per unit
                            </Typography>
                            <Box sx={{ position: 'relative', width: '100%' }}>
                              <Input
                                disableUnderline
                                placeholder="3000"
                                {...register('mediaVariation.PricePerUnit', {
                                  onChange: (event) => {
                                    event.target.value = parseInt(
                                      event.target.value.replace(
                                        /[^\d]+/gi,
                                        '',
                                      ) || 0,
                                    ).toLocaleString('en-US');
                                  },
                                })}
                                sx={{
                                  width: '100%',
                                  height: '42px',
                                  background: '#FFFFFF',
                                  borderRadius: '10px',
                                  fontSize: '12px',
                                  px: 1,
                                  pr: '36px',
                                  boxSizing: 'border-box',
                                  color: '#C64091',
                                  ...borderedControlSx(
                                    !!errors?.mediaVariation?.PricePerUnit?.message,
                                  ),
                                  ...inputPlaceholderSx,
                                }}
                              />
                              <Box
                                component="img"
                                src={Bxitoken}
                                alt=""
                                title="BXI token"
                                sx={{
                                  position: 'absolute',
                                  right: 10,
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  width: 20,
                                  height: 20,
                                  pointerEvents: 'none',
                                }}
                              />
                            </Box>
                            <Typography sx={FieldErrorTextStyle}>
                              {errors?.mediaVariation?.PricePerUnit?.message}
                            </Typography>
                          </Box>

                          <Box sx={newspaperGridCellSx}>
                            <Typography sx={newspaperGridLabelSx}>
                              Discounted price
                            </Typography>
                            <Box sx={{ position: 'relative', width: '100%' }}>
                              <Input
                                disableUnderline
                                placeholder="2000"
                                {...register('mediaVariation.DiscountedPrice', {
                                  onChange: (event) => {
                                    event.target.value = parseInt(
                                      event.target.value.replace(
                                        /[^\d]+/gi,
                                        '',
                                      ) || 0,
                                    ).toLocaleString('en-US');
                                  },
                                })}
                                sx={{
                                  width: '100%',
                                  height: '42px',
                                  background: '#FFFFFF',
                                  borderRadius: '10px',
                                  fontSize: '12px',
                                  color: '#C64091',
                                  px: 1,
                                  pr: '36px',
                                  boxSizing: 'border-box',
                                  ...borderedControlSx(
                                    !!errors?.mediaVariation?.DiscountedPrice?.message,
                                  ),
                                  ...inputPlaceholderSx,
                                }}
                              />
                              <Box
                                component="img"
                                src={Bxitoken}
                                alt=""
                                title="BXI token"
                                sx={{
                                  position: 'absolute',
                                  right: 10,
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  width: 20,
                                  height: 20,
                                  pointerEvents: 'none',
                                }}
                              />
                            </Box>
                            <Typography sx={FieldErrorTextStyle}>
                              {errors?.mediaVariation?.DiscountedPrice?.message}
                            </Typography>
                          </Box>

                          <Box sx={newspaperGridCellSx}>
                            <Typography sx={newspaperGridLabelSx}>Ad type</Typography>
                            <Select
                              disableUnderline
                              displayEmpty
                              renderValue={(selected) => {
                                if (
                                  selected === undefined ||
                                  selected === null ||
                                  selected === ''
                                ) {
                                  return (
                                    <Box
                                      component="span"
                                      sx={{
                                        color: '#6B7A99',
                                        opacity: 0.55,
                                        fontSize: '12px',
                                      }}
                                    >
                                      Select ad type
                                    </Box>
                                  );
                                }
                                return selected;
                              }}
                              {...register('mediaVariation.adType', {
                                onChange: (e) => {
                                  setOnlyState(!onlyState);
                                  setUnit(e.target.value);
                                },
                              })}
                              sx={{
                                ...inputStyles,
                                width: '100%',
                                maxWidth: 'none',
                                minWidth: 0,
                              }}
                            >
                              <MenuItem value="color">Color *</MenuItem>
                              <MenuItem value="Black & White">Black & White</MenuItem>
                            </Select>
                            <Typography sx={FieldErrorTextStyle}>
                              {errors?.mediaVariation?.adType?.message}
                            </Typography>
                          </Box>

                          <Box sx={newspaperGridCellSx}>
                            <Typography sx={newspaperGridLabelSx}>HSN</Typography>
                            <Input
                              disableUnderline
                              placeholder="998346"
                              {...register('mediaVariation.HSN', {
                                onChange: (event) => {
                                  const inputValue = event.target.value;
                                  if (inputValue.match(/\D/g)) {
                                    const filteredValue = inputValue.replace(
                                      /\D/g,
                                      '',
                                    );
                                    event.target.value = filteredValue;
                                  }
                                },
                              })}
                              onKeyDown={(e) => {
                                if (
                                  e.key === ' ' &&
                                  e.target.selectionStart === 0
                                ) {
                                  e.preventDefault();
                                }
                              }}
                              inputProps={{ maxLength: 8 }}
                              sx={{
                                width: '100%',
                                height: '42px',
                                background: '#FFFFFF',
                                borderRadius: '10px',
                                px: 1,
                                fontSize: '12px',
                                fontFamily: 'Inter, sans-serif',
                                color: formColors.text,
                                ...borderedControlSx(
                                  !!errors?.mediaVariation?.HSN?.message,
                                ),
                                ...inputPlaceholderSx,
                              }}
                            />
                            <Typography sx={FieldErrorTextStyle}>
                              {errors?.mediaVariation?.HSN?.message}
                            </Typography>
                          </Box>

                          <Box sx={newspaperGridCellSx}>
                            <Typography sx={newspaperGridLabelSx}>GST</Typography>
                            <Select
                              displayEmpty
                              renderValue={(selected) => {
                                if (
                                  selected === undefined ||
                                  selected === null ||
                                  selected === '' ||
                                  selected === '0'
                                ) {
                                  return (
                                    <Box
                                      component="span"
                                      sx={{
                                        color: '#6B7A99',
                                        opacity: 0.55,
                                        fontSize: '12px',
                                      }}
                                    >
                                      Select GST
                                    </Box>
                                  );
                                }
                                return formatGstPercentLabel(selected);
                              }}
                              sx={{
                                width: '100%',
                                minWidth: 0,
                                height: '42px',
                                background: '#FFFFFF',
                                borderRadius: '10px',
                                fontSize: '12px',
                                fontFamily: 'Inter, sans-serif',
                                color: formColors.text,
                                ...outlinedSelectFieldSx(
                                  !!errors?.mediaVariation?.GST?.message,
                                ),
                              }}
                              {...register('mediaVariation.GST')}
                            >
                              {GSTData?.map((gst, idx) => (
                                <MenuItem key={idx} sx={MenuItems} value={gst?.GST}>
                                  {formatGstPercentLabel(gst?.GST)}
                                </MenuItem>
                              ))}
                            </Select>
                            <Typography sx={FieldErrorTextStyle}>
                              {errors?.mediaVariation?.GST?.message}
                            </Typography>
                          </Box>
                        </Box>
                      </>
                    ) : (
                      <>
                        <Box
                          sx={{
                            mt: 3,
                            height: 'auto',
                            minHeight: '100px',
                            position: 'relative',
                            display: 'flex',
                            flexWrap: 'wrap',
                            justifyContent: 'space-between',
                            flexDirection: 'row',
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '10px',
                              mt: 1,
                              maxWidth: '140px',
                            }}
                          >
                            <Typography
                              sx={{
                                ...CommonTextStyle,
                                fontSize: '12px',
                                fontWeight: 400,
                              }}
                            >
                            Ad Type <span style={{ color: 'red' }}> *</span>
                            </Typography>
                            <Typography
                              sx={{
                                ...CommonTextStyle,
                                fontSize: '12px',
                                fontWeight: 400,
                              }}
                            >
                              {FetchedproductData?.mediaVariation?.location
                                ? 'Your Selected Location :' +
                              FetchedproductData?.mediaVariation?.location
                                : null}
                            </Typography>
                            <Select
                              displayEmpty
                              renderValue={(selected) => {
                                if (
                                  selected === undefined ||
                                  selected === null ||
                                  selected === ''
                                ) {
                                  return (
                                    <Box
                                      component="span"
                                      sx={{
                                        color: '#6B7A99',
                                        opacity: 0.55,
                                        fontSize: '12px',
                                      }}
                                    >
                                      Select location
                                    </Box>
                                  );
                                }
                                return selected;
                              }}
                              disableUnderline
                              {...register('mediaVariation.location')}
                              sx={{
                                ...inputStyles,
                                width: '140px',
                                ...borderedControlSx(
                                  !!errors?.mediaVariation?.location?.message,
                                ),
                              }}
                            >
                              <MenuItem value="All Locations">
                              All Locations
                              </MenuItem>
                              <MenuItem value="Arrival">Arrival</MenuItem>
                              <MenuItem value="Café Wall Branding">
                              Café Wall Branding
                              </MenuItem>
                              <MenuItem value="Coffee Tables">
                              Coffee Tables
                              </MenuItem>
                              <MenuItem value="Concession Counter">
                              Concession Counter
                              </MenuItem>
                              <MenuItem value="Conveyor Belt">
                              Conveyor Belt
                              </MenuItem>
                              <MenuItem value="Departure">Departure</MenuItem>
                              <MenuItem value="Entry Gate">Entry Gate</MenuItem>
                              <MenuItem value="Exit Gate">Exit Gate</MenuItem>
                              <MenuItem value="Handles of the Bus">
                              Handles of the Bus
                              </MenuItem>
                              <MenuItem value="Highway">Highway</MenuItem>
                              <MenuItem value="Lobby">Lobby</MenuItem>
                              <MenuItem value="Mall Atrium">Mall Atrium</MenuItem>
                              <MenuItem value="Near Parking Area">
                              Near Parking Area
                              </MenuItem>
                              <MenuItem value="Out Side Airport">
                              Out Side Airport
                              </MenuItem>
                              <MenuItem value="Parking Area">
                              Parking Area
                              </MenuItem>
                              <MenuItem value="Tent Cards">Tent Cards</MenuItem>
                              <MenuItem value="Waiting Area">
                              Waiting Area
                              </MenuItem>
                              <MenuItem value="main road">main road</MenuItem>
                              <MenuItem value="others">others</MenuItem>
                            </Select>

                            <Typography
                              sx={FieldErrorTextStyle}
                            >
                              {errors?.mediaVariation?.location?.message}
                            </Typography>
                          </Box>
                          {(FetchedproductData?.ProductSubCategory === '643cdf01779bc024c189cf95' ||
                          FetchedproductData?.ProductSubCategory === '643ce635e424a0b8fcbba6d6' ||
                          FetchedproductData?.ProductSubCategory === '643ce648e424a0b8fcbba710' ||
                          FetchedproductData?.ProductSubCategory === '643ce6fce424a0b8fcbbad42' ||
                          FetchedproductData?.ProductSubCategory === '643ce707e424a0b8fcbbad4c' || FetchedproductData?.ProductSubCategory === '650296faeaa5251874e8c716') ? null : (
                              <Box
                                sx={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '10px',
                                  mt: 1,
                                  maxWidth: '140px',
                                }}
                              >
                                <Typography
                                  sx={{ ...CommonTextStyle, fontSize: '12px' }}
                                >
                              Unit <span style={{ color: 'red' }}> *</span>
                                </Typography>
                                <Typography
                                  sx={{
                                    ...CommonTextStyle,
                                    fontSize: '12px',
                                    fontWeight: 400,
                                  }}
                                >
                                  {FetchedproductData?.mediaVariation?.unit
                                    ? 'Your Selected Unit :' +
                                FetchedproductData?.mediaVariation?.unit
                                    : null}
                                </Typography>
                                <Select
                                  displayEmpty
                                  renderValue={(selected) => {
                                    if (
                                      selected === undefined ||
                                      selected === null ||
                                      selected === ''
                                    ) {
                                      return (
                                        <Box
                                          component="span"
                                          sx={{
                                            color: '#6B7A99',
                                            opacity: 0.55,
                                            fontSize: '12px',
                                          }}
                                        >
                                          Select unit
                                        </Box>
                                      );
                                    }
                                    return selected;
                                  }}
                                  disableUnderline
                                  {...register('mediaVariation.unit', {
                                    onChange: (e) => {
                                      setOnlyState(!onlyState);
                                      setUnit(e.target.value);
                                    },
                                  })}
                                  sx={{
                                    ...inputStyles,
                                    width: '140px',
                                    ...borderedControlSx(
                                      !!errors?.mediaVariation?.unit?.message,
                                    ),
                                  }}
                                >
                                  <MenuItem value="Screen">Per Screen</MenuItem>
                                  <MenuItem value="Unit"> Per Unit </MenuItem>
                                  <MenuItem value="Spot"> Per Spot </MenuItem>
                                  <MenuItem value="Sq cm"> Per Sq cm </MenuItem>
                                  <MenuItem value="Display"> Per Display </MenuItem>
                                  <MenuItem value="Location"> Per Location </MenuItem>
                                  <MenuItem value="Release"> Per Release </MenuItem>

                                  {FetchedproductData?.ProductCategoryName ===
                                'MediaOffline' ? null : (
                                      <>
                                        <MenuItem value="Annoucment">
                                          {' '}
                                    Per Annoucment{' '}
                                        </MenuItem>
                                        <MenuItem value="Video"> Per Video</MenuItem>
                                      </>
                                    )}
                                </Select>
                                <Typography
                                  sx={FieldErrorTextStyle}
                                >
                                  {errors?.mediaVariation?.unit?.message}
                                </Typography>
                              </Box>)}
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '10px',
                              mt: 1,
                              maxWidth: '140px',
                            }}
                          >
                            <Typography
                              sx={{ ...CommonTextStyle, fontSize: '12px' }}
                            >
                            Timeline
                            </Typography>
                            <Typography
                              sx={{
                                ...CommonTextStyle,
                                fontSize: '12px',
                              }}
                            >
                              {FetchedproductData?.mediaVariation?.Timeline
                                ? 'Your Selected Timeline :' +
                              FetchedproductData?.mediaVariation?.Timeline
                                : null}
                            </Typography>
                            <Select
                              displayEmpty
                              renderValue={(selected) => {
                                if (
                                  selected === undefined ||
                                  selected === null ||
                                  selected === ''
                                ) {
                                  return (
                                    <Box
                                      component="span"
                                      sx={{
                                        color: '#6B7A99',
                                        opacity: 0.55,
                                        fontSize: '12px',
                                      }}
                                    >
                                      Select timeline
                                    </Box>
                                  );
                                }
                                return selected;
                              }}
                              disableUnderline
                              // {...register("mediaVariation.timeline")}
                              {...register('mediaVariation.Timeline', {
                                onChange: (e) => {
                                  setOnlyState(!onlyState);
                                },
                              })}
                              // disabled={unit === "Spot" ? true : false}
                              sx={{
                                ...inputStyles,
                                width: '140px',
                                ...borderedControlSx(
                                  !!errors?.mediaVariation?.Timeline?.message,
                                ),
                              }}
                            >
                              <MenuItem value="Day"> Per Day </MenuItem>
                              <MenuItem value="Week"> Per Week </MenuItem>
                              <MenuItem value="Month"> Per Month </MenuItem>
                              <MenuItem value="One Time"> Per One Time </MenuItem>
                              <MenuItem value="Year"> Per Year </MenuItem>
                            </Select>
                            <Typography
                              sx={FieldErrorTextStyle}
                            >
                              {errors?.mediaVariation?.Timeline?.message}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '10px',
                              mt: 1,
                              maxWidth: '140px',
                            }}
                          >
                            <Typography
                              sx={{ ...CommonTextStyle, fontSize: '12px', mb: 1 }}
                            >
                            Repetition Of Ads{' '}
                            </Typography>
                            <Input
                              disableUnderline
                              placeholder="28 Per week"
                              {...register('mediaVariation.repetition')}
                              sx={{
                                ...inputStyles,
                                width: '140px',
                                ...borderedControlSx(
                                  !!errors?.mediaVariation?.repetition?.message,
                                ),
                              }}
                              onKeyDown={(e) => {
                                if (
                                  e.key === ' ' &&
                                e.target.selectionStart === 0
                                ) {
                                  e.preventDefault();
                                }
                              }}
                            />
                            <Typography
                              sx={FieldErrorTextStyle}
                            >
                              {errors?.mediaVariation?.repetition?.message}
                            </Typography>
                          </Box>
                        </Box>
                        <Box
                          sx={{
                            height: 'auto',
                            minHeight: '100px',
                            position: 'relative',
                            display: 'flex',
                            flexWrap: 'wrap',
                            justifyContent: 'space-between',
                            flexDirection: 'row',
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '10px',
                              mt: 1,
                              maxWidth: '140px',
                            }}
                          >
                            <Typography
                              sx={{ ...CommonTextStyle, fontSize: '12px' }}
                            >
                            Dimension Size
                            </Typography>
                            <Input
                              disableUnderline
                              placeholder="2048 X 998"
                              {...register('mediaVariation.dimensionSize')}
                              sx={{
                                ...inputStyles,
                                width: '140px',
                                ...borderedControlSx(
                                  !!errors?.mediaVariation?.dimensionSize
                                    ?.message,
                                ),
                              }}
                              onKeyDown={(e) => {
                                if (
                                  e.key === ' ' &&
                                e.target.selectionStart === 0
                                ) {
                                  e.preventDefault();
                                }
                              }}
                            />
                            <Typography
                              sx={FieldErrorTextStyle}
                            >
                              {errors?.mediaVariation?.dimensionSize?.message}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '10px',
                              mt: 1,
                              maxWidth: '140px',
                            }}
                          >
                            <Typography
                              sx={{ ...CommonTextStyle, fontSize: '12px' }}
                            >
                            MRP<span style={{ color: 'red' }}> *</span>( Excl of
                            GST )
                            </Typography>

                            <Box sx={{ position: 'relative' }}>
                              <Input
                                disableUnderline
                                // value={data.mro}
                                placeholder="3000"
                                onKeyDown={(e) => {
                                  if (
                                    e.key === ' ' &&
                                  e.target.selectionStart === 0
                                  ) {
                                    e.preventDefault();
                                  }
                                }}
                                {...register('mediaVariation.PricePerUnit', {
                                  onChange: (event) => {
                                    event.target.value = parseInt(
                                      event.target.value.replace(
                                        /[^\d]+/gi,
                                        '',
                                      ) || 0,
                                    ).toLocaleString('en-US');
                                    setValue(
                                      'mediaVariation.maxOrderQuantityunit',
                                      '1',
                                    );
                                    setValue(
                                      'mediaVariation.minOrderQuantityunit',
                                      '1',
                                    );
                                    setValue(
                                      'mediaVariation.minOrderQuantitytimeline',
                                      '1',
                                    );
                                    setValue(
                                      'mediaVariation.maxOrderQuantitytimeline',
                                      '1',
                                    );
                                  },
                                })}
                                sx={{
                                  width: '139px',
                                  height: '42px',
                                  background: '#FFFFFF',
                                  borderRadius: '10px',
                                  fontSize: '12px',
                                  px: 1,
                                  fontFamily: 'Inter, sans-serif',
                                  color: formColors.text,
                                  ...borderedControlSx(
                                    !!errors?.mediaVariation?.PricePerUnit
                                      ?.message,
                                  ),
                                  ...inputPlaceholderSx,
                                }}
                              />

                              <img
                                src={Bxitoken}
                                style={{
                                  position: 'absolute',
                                  width: '20px',
                                  right: '7%',
                                  bottom: '20%',
                                }}
                                alt="element"
                                title="BXI token icon"
                              />
                            </Box>

                            <Typography
                              sx={FieldErrorTextStyle}
                            >
                              {errors?.mediaVariation?.PricePerUnit?.message}
                            </Typography>
                          </Box>

                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '10px',
                              mt: 1,
                              maxWidth: '140px',
                            }}
                          >
                            <Typography
                              sx={{ ...CommonTextStyle, fontSize: '12px' }}
                            >
                            Discounted MRP
                            </Typography>
                            <Box sx={{ position: 'relative' }}>
                              <Input
                                disableUnderline
                                placeholder="2000"
                                onKeyDown={(e) => {
                                  if (
                                    e.key === ' ' &&
                                  e.target.selectionStart === 0
                                  ) {
                                    e.preventDefault();
                                  }
                                }}
                                {...register('mediaVariation.DiscountedPrice', {
                                  onChange: (event) => {
                                    event.target.value = parseInt(
                                      event.target.value.replace(
                                        /[^\d]+/gi,
                                        '',
                                      ) || 0,
                                    ).toLocaleString('en-US');
                                  },
                                })}
                                sx={{
                                  width: '139px',
                                  height: '42px',
                                  background: '#FFFFFF',
                                  borderRadius: '10px',
                                  fontSize: '12px',
                                  fontFamily: 'Inter, sans-serif',
                                  color: formColors.text,
                                  px: 1,
                                  ...borderedControlSx(
                                    !!errors?.mediaVariation?.DiscountedPrice
                                      ?.message,
                                  ),
                                  ...inputPlaceholderSx,
                                }}
                              />
                              <img
                                src={Bxitoken}
                                style={{
                                  position: 'absolute',
                                  width: '20px',
                                  right: '7%',
                                  bottom: '20%',
                                }}
                                alt="BXI token"
                                title="BXI token icon"
                              />
                            </Box>

                            <Typography
                              sx={FieldErrorTextStyle}
                            >
                              {errors?.mediaVariation?.DiscountedPrice?.message}
                            </Typography>
                          </Box>

                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '10px',
                              mt: 1,
                              maxWidth: '100px',
                            }}
                          >
                            <Typography
                              sx={{ ...CommonTextStyle, fontSize: '12px' }}
                            >
                            HSN <span style={{ color: 'red' }}> *</span>
                            </Typography>

                            <Box sx={{ position: 'relative' }}>
                              <Input
                                disableUnderline
                                placeholder="998346"
                                {...register('mediaVariation.HSN', {
                                  onChange: (event) => {
                                    const inputValue = event.target.value;

                                    if (inputValue.match(/\D/g)) {
                                      const filteredValue = inputValue.replace(
                                        /\D/g,
                                        '',
                                      );
                                      event.target.value = filteredValue;
                                    }
                                  },
                                })}
                                onKeyDown={(e) => {
                                  if (
                                    e.key === ' ' &&
                                  e.target.selectionStart === 0
                                  ) {
                                    e.preventDefault();
                                  }
                                }}
                                inputProps={{ maxLength: 8 }}
                                sx={{
                                  width: '100px',
                                  height: '42px',
                                  background: '#FFFFFF',
                                  borderRadius: '10px',
                                  px: 1,
                                  fontSize: '12px',
                                  fontFamily: 'Inter, sans-serif',
                                  color: formColors.text,
                                  ...borderedControlSx(
                                    !!errors?.mediaVariation?.HSN?.message,
                                  ),
                                  ...inputPlaceholderSx,
                                }}
                              />
                            </Box>
                            <Typography
                              sx={FieldErrorTextStyle}
                            >
                              {errors?.mediaVariation?.HSN?.message}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '10px',
                              mt: 1,
                              minWidth: 0,
                              width: { xs: '100%', sm: 'auto' },
                              maxWidth: { sm: '160px' },
                            }}
                          >
                            <Typography
                              sx={{ ...CommonTextStyle, fontSize: '12px' }}
                            >
                            GST <span style={{ color: 'red' }}> *</span>
                            </Typography>

                            <Select
                              displayEmpty
                              renderValue={(selected) => {
                                if (
                                  selected === undefined ||
                                  selected === null ||
                                  selected === '' ||
                                  selected === '0'
                                ) {
                                  return (
                                    <Box
                                      component="span"
                                      sx={{
                                        color: '#6B7A99',
                                        opacity: 0.55,
                                        fontSize: '12px',
                                      }}
                                    >
                                      Select GST
                                    </Box>
                                  );
                                }
                                return formatGstPercentLabel(selected);
                              }}
                              sx={{
                                width: '100%',
                                minWidth: 88,
                                height: '42px',
                                background: '#FFFFFF',
                                borderRadius: '10px',
                                fontSize: '12px',
                                fontFamily: 'Inter, sans-serif',
                                color: formColors.text,
                                ...outlinedSelectFieldSx(
                                  !!errors?.mediaVariation?.GST?.message,
                                ),
                              }}
                              {...register('mediaVariation.GST')}
                            >
                              {GSTData?.map((gst, idx) => (
                                <MenuItem key={idx} sx={MenuItems} value={gst?.GST}>
                                  {formatGstPercentLabel(gst?.GST)}
                                </MenuItem>
                              ))}
                            </Select>
                            <Typography
                              sx={FieldErrorTextStyle}
                            >
                              {errors?.mediaVariation?.GST?.message}
                            </Typography>
                          </Box>
                        </Box>
                        <Box
                          sx={{
                            height: 'auto',
                            minHeight: '100px',
                            position: 'relative',
                            display: 'flex',
                            flexWrap: 'wrap',
                            justifyContent: 'flex-start',
                            flexDirection: 'row',
                            gap: '15px',
                          }}
                        >
                          {OneUnitProduct ? null : (
                            <React.Fragment>
                              <Box
                                sx={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '10px',
                                  mt: 1,
                                }}
                              >
                                <Typography
                                  sx={{ ...CommonTextStyle, fontSize: '12px' }}
                                >
                                Min Order QTY Unit{' '}
                                  <span style={{ color: 'red' }}> *</span>
                                </Typography>
                                <Box sx={{ display: 'flex', gap: '10px' }}>
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      gap: '10px',
                                      display: 'flex',
                                      flexDirection: 'column',
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        ...borderedWrapperSx(
                                          !!errors?.mediaVariation
                                            ?.minOrderQuantityunit?.message,
                                        ),
                                      }}
                                    >
                                      <Input
                                        disableUnderline
                                        placeholder="100"
                                        onKeyDown={(e) => {
                                          if (
                                            e.key === ' ' &&
                                          e.target.selectionStart === 0
                                          ) {
                                            e.preventDefault();
                                          }
                                        }}
                                        {...register(
                                          'mediaVariation.minOrderQuantityunit',
                                          {
                                            onChange: (event) => {
                                              event.target.value = parseInt(
                                                event.target.value.replace(
                                                  /[^\d]+/gi,
                                                  '',
                                                ) || 0,
                                              ).toLocaleString('en-US');
                                            },
                                          },
                                        )}
                                        sx={{
                                          ...inputInsideGroupedFieldSx,
                                          width: '65px',
                                          padding: '0px',
                                          ml: 1,
                                        }}
                                      />
                                      <Input
                                        disableUnderline
                                        disabled
                                        {...register('mediaVariation.unit')}
                                        sx={{
                                          ...inputInsideGroupedFieldSx,
                                          width: '65px',
                                          padding: '0px',
                                          ml: 1,
                                        }}
                                      />
                                    </Box>
                                    <Typography
                                      sx={FieldErrorTextStyle}
                                    >
                                      {
                                        errors?.mediaVariation
                                          ?.minOrderQuantityunit?.message
                                      }
                                    </Typography>
                                  </Box>
                                </Box>
                              </Box>
                              <Box
                                sx={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '10px',
                                  mt: 1,
                                }}
                              >
                                <Typography
                                  sx={{ ...CommonTextStyle, fontSize: '12px' }}
                                >
                                Max Order QTY Unit{' '}
                                  <span style={{ color: 'red' }}> *</span>
                                </Typography>

                                <Box sx={{ display: 'flex', gap: '10px' }}>
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      gap: '10px',
                                      display: 'flex',
                                      flexDirection: 'column',
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        ...borderedWrapperSx(
                                          !!errors?.mediaVariation
                                            ?.maxOrderQuantityunit?.message,
                                        ),
                                      }}
                                    >
                                      <Input
                                        disableUnderline
                                        placeholder="200"
                                        onKeyDown={(e) => {
                                          if (
                                            e.key === ' ' &&
                                          e.target.selectionStart === 0
                                          ) {
                                            e.preventDefault();
                                          }
                                        }}
                                        {...register(
                                          'mediaVariation.maxOrderQuantityunit',
                                          {
                                            onChange: (event) => {
                                              event.target.value = parseInt(
                                                event.target.value.replace(
                                                  /[^\d]+/gi,
                                                  '',
                                                ) || 0,
                                              ).toLocaleString('en-US');
                                            },
                                          },
                                        )}
                                        sx={{
                                          ...inputInsideGroupedFieldSx,
                                          width: '64px',
                                          padding: '0px',
                                          ml: 1,
                                        }}
                                      />
                                      <Input
                                        disableUnderline
                                        disabled
                                        {...register('mediaVariation.unit')}
                                        sx={{
                                          ...inputInsideGroupedFieldSx,
                                          width: '64px',
                                          padding: '0px',
                                          ml: 1,
                                        }}
                                      />
                                    </Box>
                                    <Typography
                                      sx={FieldErrorTextStyle}
                                    >
                                      {
                                        errors?.mediaVariation
                                          ?.maxOrderQuantityunit?.message
                                      }
                                    </Typography>
                                  </Box>
                                </Box>
                              </Box>
                            </React.Fragment>
                          )}

                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '10px',
                              mt: 1,
                            }}
                          >
                            <Typography
                              sx={{ ...CommonTextStyle, fontSize: '12px' }}
                            >
                            Min Order QTY Timeline{' '}
                              <span style={{ color: 'red' }}> *</span>
                            </Typography>

                            <Box sx={{ display: 'flex', gap: '10px' }}>
                              <Box
                                sx={{
                                  display: 'flex',
                                  gap: '10px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                }}
                              >
                                <Box
                                  sx={{
                                    ...borderedWrapperSx(
                                      !!errors?.mediaVariation
                                        ?.minOrderQuantitytimeline?.message,
                                    ),
                                  }}
                                >
                                  <Input
                                    disableUnderline
                                    {...register(
                                      'mediaVariation.minOrderQuantitytimeline',
                                      {
                                        onChange: (event) => {
                                          event.target.value = parseInt(
                                            event.target.value.replace(
                                              /[^\d]+/gi,
                                              '',
                                            ) || 0,
                                          ).toLocaleString('en-US');
                                        },
                                      },
                                    )}
                                    sx={{
                                      ...inputInsideGroupedFieldSx,
                                      width: '64px',
                                      padding: '5px',
                                    }}
                                    onKeyDown={(e) => {
                                      if (
                                        e.key === ' ' &&
                                      e.target.selectionStart === 0
                                      ) {
                                        e.preventDefault();
                                      }
                                    }}
                                    placeholder={'Timeline'}
                                  />
                                  <Input
                                    disableUnderline
                                    {...register('mediaVariation.Timeline')}
                                    disabled
                                    sx={{
                                      ...inputInsideGroupedFieldSx,
                                      width: '65px',
                                      padding: '0px',
                                    }}
                                  />
                                </Box>
                                <Typography
                                  sx={FieldErrorTextStyle}
                                >
                                  {
                                    errors?.mediaVariation
                                      ?.minOrderQuantitytimeline?.message
                                  }
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '10px',
                              mt: 1,
                            }}
                          >
                            <Typography
                              sx={{ ...CommonTextStyle, fontSize: '12px' }}
                            >
                            Max Order QTY Timeline{' '}
                              <span style={{ color: 'red' }}> *</span>
                            </Typography>

                            <Box sx={{ display: 'flex', gap: '10px' }}>
                              <Box
                                sx={{
                                  display: 'flex',
                                  gap: '10px',
                                  // display: "flex",
                                  flexDirection: 'column',
                                }}
                              >
                                <Box
                                  sx={{
                                    ...borderedWrapperSx(
                                      !!errors?.mediaVariation
                                        ?.maxOrderQuantitytimeline?.message,
                                    ),
                                  }}
                                >
                                  <Input
                                    disableUnderline
                                    {...register(
                                      'mediaVariation.maxOrderQuantitytimeline',
                                      {
                                        onChange: (event) => {
                                          event.target.value = parseInt(
                                            event.target.value.replace(
                                              /[^\d]+/gi,
                                              '',
                                            ) || 0,
                                          ).toLocaleString('en-US');
                                        },
                                      },
                                    )}
                                    onKeyDown={(e) => {
                                      if (
                                        e.key === ' ' &&
                                      e.target.selectionStart === 0
                                      ) {
                                        e.preventDefault();
                                      }
                                    }}
                                    sx={{
                                      ...inputInsideGroupedFieldSx,
                                      width: '64px',
                                      padding: '0px',
                                      ml: 1,
                                    }}
                                    placeholder={'Timeline'}
                                  />
                                  <Input
                                    disableUnderline
                                    {...register('mediaVariation.Timeline')}
                                    disabled
                                    sx={{
                                      ...inputInsideGroupedFieldSx,
                                      width: '50px',
                                      padding: '0px',
                                    }}
                                  />
                                </Box>
                                <Typography
                                  sx={FieldErrorTextStyle}
                                >
                                  {
                                    errors?.mediaVariation
                                      ?.maxOrderQuantitytimeline?.message
                                  }
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </Box>
                      </>
                    )}

                  <OthercostPortion
                    append={(data, index) => {
                      if (index !== null) {
                        OthercostUpdate(index, data);
                      } else {
                        OthercostAppend(data);
                      }
                      SetOthercostEditId(null);
                    }}
                    defaultValue={
                      OthercostEditId !== null
                        ? OthercostFields[OthercostEditId]
                        : null
                    }
                    index={OthercostEditId}
                  />

                  <Box
                    sx={{
                      display: 'flex',
                      gap: '20px',
                      flexDirection: 'column',
                      width: '98%',
                      mx: 'auto',
                    }}
                  >
                    <TableContainer
                      sx={{
                        width: 'auto',
                        borderRadius: '10px',
                        background: 'transparent',
                        border:
                          OthercostFields.length === 0
                            ? 'none'
                            : '1px solid #e3e3e3',
                        ml: 1,
                        overflow: 'auto',
                        '::-webkit-scrollbar': {
                          display: 'flex',
                          height: '6px',
                        },
                      }}
                    >
                      <Table
                        sx={{
                          [`& .${tableCellClasses.root}`]: {
                            borderBottom: 'none',
                          },
                          borderRadius: '10px',
                          overflowX: 'hidden',
                          background: 'transparent',
                        }}
                        size="small"
                        aria-label="a dense table"
                      >
                        {OthercostFields?.map((item, idx) => {
                          return (
                            <>
                              <TableHead>
                                <TableRow>
                                  {OthercostFieldsarray?.map((data) => {
                                    if (data === 'id' || data === 'listPeriod')
                                      return null;
                                    return (
                                      <TableCell
                                        align="left"
                                        key={data}
                                        sx={{
                                          ...tableDataStyle,
                                          padding: '10px',
                                          textTransform: 'capitalize',
                                          whiteSpace: 'nowrap',
                                        }}
                                        component="th"
                                        scope="row"
                                      >
                                        {data}
                                      </TableCell>
                                    );
                                  })}
                                </TableRow>
                              </TableHead>
                              <TableBody
                                sx={{
                                  borderBottom: '1px solid #EDEFF2',
                                }}
                              >
                                <TableRow
                                  key={item}
                                  style={{
                                    borderBottom: '1px solid #e3e3e3',
                                    padding: '10px',
                                  }}
                                >
                                  <TableCell align="center" sx={TableCellStyle}>
                                    {item.AdCostApplicableOn}
                                  </TableCell>
                                  <TableCell
                                    align="left"
                                    sx={{
                                      ...TableCellStyle,
                                      display: 'flex',
                                      alignItems: 'center',
                                    }}
                                  >
                                    {item.CostPrice}
                                    {'  '}
                                    {item.currencyType === 'BXITokens' ? (
                                      <img
                                        src={bxitoken}
                                        style={{
                                          width: '15px',
                                          height: '15px',
                                        }}
                                        alt="bxitoken"
                                        title="BXI token icon"
                                      />
                                    ) : (
                                      item.currencyType
                                    )}
                                  </TableCell>
                                  <TableCell align="left" sx={TableCellStyle}>
                                    {item.AdCostHSN}
                                  </TableCell>
                                  <TableCell align="left" sx={TableCellStyle}>
                                    {formatGstPercentLabel(item.AdCostGST)}
                                  </TableCell>
                                  <TableCell align="left" sx={TableCellStyle}>
                                    {item.ReasonOfCost}
                                  </TableCell>

                                  <Box
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                  >
                                    <MuiButton
                                      type="button"
                                      variant="text"
                                      aria-label="Edit additional cost"
                                      onClick={() => {
                                        SetOthercostEditId(idx);
                                      }}
                                      sx={tableIconButtonSx}
                                    >
                                      <Box
                                        component="img"
                                        src={EditIcon}
                                        alt=""
                                        sx={{ width: 18, height: 18 }}
                                      />
                                    </MuiButton>
                                    <MuiButton
                                      type="button"
                                      variant="text"
                                      aria-label="Remove additional cost"
                                      onClick={() => {
                                        OthercostRemove(idx);
                                      }}
                                      sx={tableIconButtonSx}
                                    >
                                      <Box
                                        component="img"
                                        src={RemoveIcon}
                                        alt=""
                                        sx={{ width: 18, height: 18 }}
                                      />
                                    </MuiButton>
                                  </Box>
                                </TableRow>
                              </TableBody>
                            </>
                          );
                        })}
                      </Table>
                    </TableContainer>
                  </Box>

                  <div className="my-8 border-t border-[#E5E7EB]" role="presentation" />

                  <Box
                    sx={{
                      mt: 2,
                      height: 'auto',
                      minHeight: '100px',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      width: '100%',
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 600,
                        fontFamily: 'Inter, sans-serif',
                        color: '#5c6b8a',
                        fontSize: '15px',
                        mb: 1.5,
                        width: '100%',
                      }}
                    >
                      Media Location
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'space-between',
                        flexDirection: 'row',
                        gap: '10px',
                      }}
                    >
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        mt: 1,
                        maxWidth: '100px',
                      }}
                    >
                      <Typography
                        sx={{
                          ...CommonTextStyle,
                          display: 'flex',
                          flexDirection: 'row',
                          fontSize: '12px',
                        }}
                      >
                        Region
                        <span style={{ color: 'red' }}> *</span>
                      </Typography>
                      <Select
                        displayEmpty
                        renderValue={(selected) => {
                          if (
                            selected === undefined ||
                            selected === null ||
                            selected === ''
                          ) {
                            return (
                              <Box
                                component="span"
                                sx={{
                                  color: '#6B7A99',
                                  opacity: 0.55,
                                  fontSize: '12px',
                                }}
                              >
                                Select region
                              </Box>
                            );
                          }
                          return selected;
                        }}
                        disableUnderline
                        {...register('GeographicalData.region')}
                        sx={{
                          ...inputStyles,
                          ...borderedControlSx(
                            !!errors?.GeographicalData?.region?.message,
                          ),
                        }}
                        onChange={(e) => {
                          setIsDisabled(e.target.value);
                          setStoreDataOfLocation({
                            ...storeDataOfLocation,
                            region: e.target.value,
                          });
                          reset({
                            'GeographicalData.state': '',
                            'GeographicalData.city': '',
                            'GeographicalData.landmark': '',
                          });
                        }}
                      >
                        <MenuItem value="Central ">Central</MenuItem>
                        <MenuItem value="East ">East</MenuItem>
                        <MenuItem value="North">North</MenuItem>
                        <MenuItem value="PAN India">PAN India</MenuItem>
                        <MenuItem value="South">South</MenuItem>
                        <MenuItem value="West">West</MenuItem>
                      </Select>
                      {FetchedproductData && FetchedproductData?.GeographicalData && (
                        <Typography
                          sx={{ ...CommonTextStyle, fontSize: '10px' }}
                        >
                          : {FetchedproductData?.GeographicalData?.region}
                        </Typography>
                      )}{' '}
                      <Typography sx={FieldErrorTextStyle}>
                        {errors?.GeographicalData?.region?.message}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        mt: 1,
                        maxWidth: '140px',
                      }}
                    >
                      <Typography sx={{ ...CommonTextStyle, fontSize: '12px' }}>
                        State <span style={{ color: 'red' }}> *</span>
                      </Typography>
                      <Select
                        displayEmpty
                        renderValue={(selected) => {
                          if (
                            selected === undefined ||
                            selected === null ||
                            selected === ''
                          ) {
                            return (
                              <Box
                                component="span"
                                sx={{
                                  color: '#6B7A99',
                                  opacity: 0.55,
                                  fontSize: '12px',
                                }}
                              >
                                Select state
                              </Box>
                            );
                          }
                          return selected;
                        }}
                        disableUnderline
                        disabled={IsDisabled === 'PAN India' ? true : false}
                        {...register('GeographicalData.state')}
                        sx={{
                          ...inputStyles,
                          width: '139px',
                          ...borderedControlSx(
                            !!errors?.GeographicalData?.state?.message,
                          ),
                        }}
                        onChange={(e) => {
                          setStoreDataOfLocation({
                            ...storeDataOfLocation,
                            state: e.target.value,
                          });
                          setStateArray(e.target.value);
                          setState(e.target.value);
                        }}
                      >
                        {StateData?.sort((a, b) =>
                          a.name.localeCompare(b.name),
                        ).map((res, index) => (
                          <MenuItem key={index} value={res?.name}>
                            {res?.name}
                          </MenuItem>
                        ))}
                      </Select>
                      {FetchedproductData?.GeographicalData ? (
                        <Typography
                          sx={{
                            ...CommonTextStyle,
                            fontSize: '10px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          : {FetchedproductData?.GeographicalData?.state}
                        </Typography>
                      ) : null}{' '}
                      <Typography sx={FieldErrorTextStyle}>
                        {errors?.GeographicalData?.state?.message}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        mt: 1,
                        maxWidth: '140px',
                      }}
                    >
                      <Typography sx={{ ...CommonTextStyle, fontSize: '12px' }}>
                        City <span style={{ color: 'red' }}> *</span>
                      </Typography>
                      <Select
                        displayEmpty
                        renderValue={(selected) => {
                          if (
                            selected === undefined ||
                            selected === null ||
                            selected === ''
                          ) {
                            return (
                              <Box
                                component="span"
                                sx={{
                                  color: '#6B7A99',
                                  opacity: 0.55,
                                  fontSize: '12px',
                                }}
                              >
                                Select city
                              </Box>
                            );
                          }
                          return selected;
                        }}
                        disableUnderline
                        disabled={IsDisabled === 'PAN India' ? true : false}
                        {...register('GeographicalData.city')}
                        sx={{
                          ...inputStyles,
                          width: '139px',
                          ...borderedControlSx(
                            !!errors?.GeographicalData?.city?.message,
                          ),
                        }}
                        onChange={(e) => {
                          setStoreDataOfLocation({
                            ...storeDataOfLocation,
                            city: e.target.value,
                          });
                          setCity(e.target.value);
                        }}
                      >
                        {CityArray?.map((res, index) => (
                          <MenuItem key={index} value={res}>
                            {res}
                          </MenuItem>
                        ))}
                      </Select>
                      {FetchedproductData?.GeographicalData ? (
                        <Typography
                          sx={{ ...CommonTextStyle, fontSize: '10px' }}
                        >
                          : {FetchedproductData?.GeographicalData?.city}
                        </Typography>
                      ) : null}{' '}
                      <Typography sx={FieldErrorTextStyle}>
                        {errors?.GeographicalData?.city?.message}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        mt: 1,
                        maxWidth: '140px',
                      }}
                    >
                      <Typography sx={{ ...CommonTextStyle, fontSize: '12px' }}>
                        Landmark <span style={{ color: 'red' }}> *</span>
                      </Typography>
                      <Input
                        disableUnderline
                        disabled={IsDisabled === 'PAN India' ? true : false}
                        placeholder="Eg. Juhu"
                        onKeyDown={(e) => {
                          if (e.key === ' ' && e.target.selectionStart === 0) {
                            e.preventDefault();
                          }
                        }}
                        {...register('GeographicalData.landmark')}
                        sx={{
                          width: '139px',
                          height: '42px',
                          background: '#FFFFFF',
                          borderRadius: '10px',
                          px: 1,
                          fontFamily: 'Inter, sans-serif',
                          color: formColors.text,
                          fontSize: '12px',
                          ...borderedControlSx(
                            !!errors?.GeographicalData?.landmark?.message,
                          ),
                          ...inputPlaceholderSx,
                        }}
                      />
                      <Typography sx={FieldErrorTextStyle}>
                        {errors?.GeographicalData?.landmark?.message}
                      </Typography>
                    </Box>
                    </Box>
                  </Box>

                  <div className="my-8 border-t border-[#E5E7EB]" role="presentation" />

                  <Box
                    sx={{
                      py: '20px',
                    }}
                  >
                    <Box
                      sx={{
                        fontFamily: 'Inter, sans-serif',
                        color: '#5c6b8a',
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: '15px',
                          fontWeight: 600,
                          color: '#5c6b8a',
                        }}
                      >
                        Select the best features that describe your brand/media
                      </Typography>
                      <Typography
                        sx={{ fontSize: '12px', color: '#5c6b8a', mt: 0.5 }}
                      >
                        (The more features you write the more you are
                        discovered)
                      </Typography>
                    </Box>

                    <Box>
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '20px',
                          mt: 1,
                        }}
                      >
                        <Typography sx={CommonTextStyle}>
                          Select Best Features ( Min 5 and Max 20 ){' '}
                          <span style={{ color: 'red' }}> *</span>
                        </Typography>

                        <Select
                          onChange={(e) => setName(e.target.value)}
                          sx={{
                            width: '100%',
                            background: '#fff',
                            height: '100%',
                            minHeight: 42,
                            borderRadius: '10px',
                            fontSize: '12px',
                            fontFamily: 'Inter, sans-serif',
                            color: formColors.text,
                            ...outlinedSelectFieldSx(false),
                          }}
                          key={traits}
                        >
                          {filterOfflineFeatureOptions(
                            featureChoices,
                            isNewspaperJourney ? FEATURE_ALLOWLIST_BY_KEY.print : null,
                            items.map((i) => i.name),
                          )?.map((el, idx) => {
                            return (
                              <MenuItem
                                key={idx}
                                value={el?.name}
                                sx={CommonTextStyle}
                              >
                                {el.name}
                              </MenuItem>
                            );
                          })}
                        </Select>
                        {items?.length > 0 && items.length < 5 && (
                          <Typography
                            sx={FieldErrorTextStyle}
                          >
                            Select{' '}
                            {5 - items?.length} more feature
                          </Typography>
                        )}
                      </Box>

                      <Box>
                        <Typography sx={{ ...CommonTextStyle, pt: '20px' }}>
                          Feature Description{' '}
                          <span style={{ color: 'red' }}> *</span>
                        </Typography>

                        <TextField
                          focused
                          multiline
                          variant="standard"
                          value={description}
                          placeholder="Eg. Larger then Life Ads Across the Large Screens"
                          sx={{
                            ...TextFieldStyle,
                            width: '100%',
                            minHeight: 120,
                            height: 'auto',
                            py: 0.5,
                          }}
                          onKeyDown={(e) => {
                            if (
                              e.key === ' ' &&
                              e.target.selectionStart === 0
                            ) {
                              e.preventDefault();
                            } else if (e.key === 'Enter') {
                              e.preventDefault();
                              handleItemAdd();
                            }
                          }}
                          onChange={(e) => setDescription(e.target.value)}
                          minRows={3}
                          InputProps={{
                            disableUnderline: true,
                            sx: { py: 1, px: 0.5 },
                          }}
                        />
                        {items?.length > 0 && items.length < 5 && (
                          <Typography
                            sx={{ ...FieldErrorTextStyle, mt: 1 }}
                          >
                            Enter{' '}
                            {5 - items?.length} more feature description
                          </Typography>
                        )}
                      </Box>

                      <MuiButton
                        type="button"
                        variant="contained"
                        onClick={handleItemAdd}
                        sx={{
                          width: '100%',
                          height: '41px',
                          background: '#C64091',
                          borderRadius: '10px',
                          fontFamily: 'Inter, sans-serif',
                          fontStyle: 'normal',
                          fontWeight: 500,
                          fontSize: '14px',
                          lineHeight: '21px',
                          color: '#FFFFFF',
                          textTransform: 'none',
                          boxShadow: 'none',
                          '&:hover': {
                            background: '#b0387d',
                            boxShadow: 'none',
                          },
                          '&:active': {
                            background: '#9c316f',
                          },
                          my: 3,
                        }}
                      >
                        Proceed to Add
                      </MuiButton>

                      <Typography
                        sx={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '15px',
                          fontWeight: 600,
                          color: '#5c6b8a',
                          mt: 2,
                        }}
                      >
                        Key Features({items.length})
                      </Typography>

                      <Box sx={{ width: '100%' }}>
                        {items.map((item, index) => (
                          <Box
                            sx={{
                              border: '1px solid #E3E3E3',
                              marginTop: '1rem',
                              mx: 'auto',
                              height: 'auto',
                              width: '99%',
                              display: 'flex',
                              flexDirection: 'column',
                              placeItems: 'center',
                              borderRadius: '10px',
                            }}
                          >
                            <Box
                              key={index}
                              sx={{
                                display: 'flex',
                                width: '97%',
                                height: 'auto',
                                justifyContent: 'space-between',
                                minHeight: '60px',
                              }}
                            >
                              <Typography sx={{ mapdata }}>
                                <Typography
                                  sx={{
                                    fontWeight: 'bold',
                                    marginTop: '15px',
                                    fontSize: '12px',
                                    height: 'auto',
                                    color: ' #6B7A99',
                                    fontFamily: 'Inter, sans-serif',
                                  }}
                                >
                                  {item.name}
                                </Typography>

                                {item.description}
                              </Typography>

                              <MuiButton
                                type="button"
                                variant="text"
                                onClick={() => handleDelete(index)}
                                aria-label="Remove feature"
                                sx={featureRemoveButtonSx}
                              >
                                ×
                              </MuiButton>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      py: '20px',
                      display: 'flex',
                      gap: '20px',
                      position: 'relative',
                    }}
                  >
                    <Box
                      sx={{
                        width: '100%',
                        height: '45px',
                        mt: '1%',
                        borderRadius: '10px',
                      }}
                    >
                      <Typography sx={CommonTextStyle}>
                        Other information buyer must know/ Remarks{' '}
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'stretch',
                          background: '#fff',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          ...borderedWrapperSx(false),
                        }}
                      >
                        <TextField
                          placeholder="Eg. Technical Charges to be Paid on Extra on actual"
                          inputRef={otherInputRef}
                          id="standard-basic"
                          variant="standard"
                          InputProps={{
                            disableUnderline: true,
                            sx: {
                              fontSize: '14px',
                              px: 1,
                              py: 0.5,
                              fontFamily: 'Inter, sans-serif',
                              color: formColors.text,
                              '& .MuiInputBase-input::placeholder': {
                                color: formColors.label,
                                opacity: 0.5,
                              },
                            },
                          }}
                          sx={{
                            flex: 1,
                            minHeight: '42px',
                            background: 'transparent',
                            border: 'none',
                            borderRadius: 0,
                            '& fieldset': { border: 'none' },
                            '&:hover': { border: 'none' },
                            '&.Mui-focused': { border: 'none' },
                          }}
                          onKeyDown={otherenter}
                        />
                        <MuiButton
                          type="button"
                          variant="outlined"
                          onClick={OtherInformationSubmit}
                          sx={{
                            ...formInlineOutlineButtonSx,
                            right: 1,
                            alignSelf: 'center',
                          }}
                        >
                          Add
                        </MuiButton>
                      </Box>
                    </Box>
                  </Box>

                  {OtherInfoArray?.map((items) => {
                    return (
                      <Box
                        key={items}
                        sx={{
                          justifyContent: 'space-between',
                          display: 'flex',
                          mt: '30px',
                          width: 'auto',
                          gap: '20px',
                          border: '1px solid #E3E3E3',
                          borderRadius: '10px',
                        }}
                      >
                        <Typography
                          id="standard-basic"
                          variant="standard"
                          InputProps={{
                            disableUnderline: 'true',
                            style: {
                              color: 'rgba(107, 122, 153)',
                              fontFamily: 'Inter, sans-serif',

                              fontSize: '14px',
                              padding: '7px',
                            },
                          }}
                          InputLabelProps={{
                            style: {
                              color: 'red',
                            },
                          }}
                          sx={{
                            fontFamily: 'Inter, sans-serif',
                            width: '100%',
                            background: 'transparent',
                            padding: '10px',
                            color: '#C64091',
                          }}
                        >
                          {items}
                        </Typography>
                        <Box
                          sx={{
                            marginRight: '10px',
                          }}
                          component="img"
                          src={RemoveIcon}
                          onClick={() => {
                            const temp = OtherInfoArray.filter(
                              (item) => item !== items,
                            );
                            setOtherInfoArray(temp);
                          }}
                        />
                      </Box>
                    );
                  })}
                  <Box sx={{ display: 'grid', gap: '10px', py: '20px' }}>
                    <Typography sx={TypographyStyle}>
                      Tags (Keywords that can improve your seach visibility on
                      marketplace)<span style={{ color: 'red' }}> *</span>
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'stretch',
                        background: '#fff',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        ...borderedWrapperSx(false),
                      }}
                    >
                      <TextField
                        placeholder="Add Tags"
                        inputRef={tagInputRef}
                        sx={{
                          flex: 1,
                          minHeight: '41px',
                          background: 'transparent',
                          border: 'none',
                          borderRadius: 0,
                          '&:hover': { border: 'none' },
                          '&.Mui-focused': { border: 'none' },
                        }}
                        variant="standard"
                        InputProps={{
                          disableUnderline: true,
                          sx: {
                            fontSize: '14px',
                            mt: 0.5,
                            ml: 0.5,
                            fontFamily: 'Inter, sans-serif',
                            color: formColors.text,
                            '& .MuiInputBase-input::placeholder': {
                              color: formColors.label,
                              opacity: 0.5,
                            },
                          },
                        }}
                        inputProps={{ maxLength: 15 }}
                        onKeyDown={handleAddTag}
                      />
                      <MuiButton
                        type="button"
                        variant="outlined"
                        onClick={handleAddButtonClick}
                        sx={{
                          ...formInlineOutlineButtonSx,
                          right: 1,
                          alignSelf: 'center',
                        }}
                      >
                        Add
                      </MuiButton>
                    </Box>

                    <Box
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        width: 'auto',
                        gap: '5px',
                      }}
                    >
                      {FetchedproductData?.tags?.map((res) => {
                        return (
                          <Chip
                            key={res}
                            label={res}
                            onDelete={handleDeleteTag(res)}
                            color="default"
                            fullWidth
                            sx={{
                              fontSize: '14px',
                              background: '#FFFFFF ',
                              color: '#6B7A99',
                              height: '50px',
                              boxShadow:
                                '0px 4px 4px rgba(229, 229, 229, 0.25)',
                            }}
                          />
                        );
                      })}
                      {tags.map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          onDelete={handleDeleteTag(tag)}
                          color="default"
                          fullWidth
                          sx={{
                            fontSize: '14px',
                            background: '#FFFFFF ',
                            color: '#6B7A99',
                            height: '50px',
                            boxShadow: '0px 4px 4px rgba(229, 229, 229, 0.25)',
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                </Stack>
                </Box>

                <div className="mt-10 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:items-center border-t border-[#E5E7EB] pt-6">
                  <UiButton
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto min-w-[120px] border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]"
                    onClick={() => CancelJourney()}
                  >
                    Cancel
                  </UiButton>
                  <UiButton
                    type="submit"
                    className="w-full sm:w-auto min-w-[120px] bg-[#C64091] hover:bg-[#A03375] text-white"
                  >
                    Next
                  </UiButton>
                </div>
              </form>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default MediaProductInfo;

const formColors = {
  border: '#E2E8F0',
  borderHover: '#CBD5E1',
  borderFocus: '#C64091',
  borderError: '#d32f2f',
  text: '#334155',
  label: '#6B7A99',
  brand: '#C64091',
};

const borderedControlSx = (hasError) => ({
  border: '1px solid',
  borderColor: hasError ? formColors.borderError : formColors.border,
  transition: 'border-color 0.15s ease',
  boxSizing: 'border-box',
  outline: 'none',
  boxShadow: 'none',
  '&:focus': { outline: 'none' },
  '&:focus-visible': { outline: 'none' },
  '& .MuiInputBase-input:focus': { outline: 'none' },
  '&:hover': {
    borderColor: hasError ? formColors.borderError : formColors.borderHover,
  },
  '&.Mui-focused': {
    borderColor: hasError ? formColors.borderError : formColors.borderFocus,
    boxShadow: 'none',
  },
});

const borderedWrapperSx = (hasError) => ({
  border: '1px solid',
  borderColor: hasError ? formColors.borderError : formColors.border,
  borderRadius: '10px',
  background: '#fff',
  display: 'flex',
  transition: 'border-color 0.15s ease',
  outline: 'none',
  boxShadow: 'none',
  '&:hover': {
    borderColor: hasError ? formColors.borderError : formColors.borderHover,
  },
  '&:focus-within': {
    borderColor: hasError ? formColors.borderError : formColors.borderFocus,
    outline: 'none',
    boxShadow: 'none',
  },
});

const inputPlaceholderSx = {
  '& .MuiInputBase-input::placeholder': {
    color: formColors.label,
    opacity: 0.55,
    WebkitTextFillColor: formColors.label,
  },
  '& input::placeholder': {
    color: formColors.label,
    opacity: 0.55,
  },
  '& textarea::placeholder': {
    color: formColors.label,
    opacity: 0.55,
  },
};

const standardMultilineFieldSx = (hasError) => ({
  fontFamily: 'Inter, sans-serif',
  background: '#fff',
  borderRadius: '10px',
  padding: '0px 10px',
  minHeight: '47px',
  height: 'auto',
  fontSize: '12px',
  ...borderedControlSx(hasError),
  '& .MuiInputBase-input': {
    color: formColors.text,
    fontFamily: 'Inter, sans-serif',
    fontSize: '12px',
    lineHeight: '20px',
  },
  '& .MuiInputBase-input::placeholder': {
    color: formColors.label,
    opacity: 0.55,
    WebkitTextFillColor: formColors.label,
  },
});

const outlinedSelectFieldSx = (hasError) => ({
  outline: 'none',
  boxShadow: 'none',
  '& .MuiOutlinedInput-notchedOutline': {
    borderWidth: '1px',
    borderColor: hasError ? formColors.borderError : formColors.border,
    transition: 'border-color 0.15s ease',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: hasError ? formColors.borderError : formColors.borderHover,
  },
  '&.Mui-focused': {
    boxShadow: 'none',
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderWidth: '1px',
    borderColor: `${hasError ? formColors.borderError : formColors.borderFocus} !important`,
  },
});

const CommonTextStyle = {
  fontFamily: 'Inter, sans-serif',
  fontStyle: 'normal',
  fontWeight: 500,
  fontSize: '14px',
  lineHeight: '21px',
  color: '#5c6b8a',
};

const FieldErrorTextStyle = {
  fontFamily: 'Inter, sans-serif',
  fontSize: '12px',
  lineHeight: '18px',
  color: 'red',
};

const tableIconButtonSx = {
  minWidth: 40,
  width: 40,
  height: 40,
  p: 0,
  borderRadius: '8px',
  color: '#64748b',
  '&:hover': {
    backgroundColor: 'rgba(100, 116, 139, 0.08)',
    color: '#C64091',
  },
};

const formInlineOutlineButtonSx = {
  borderColor: '#C64091',
  color: '#5c6b8a',
  textTransform: 'none',
  fontSize: '13px',
  fontWeight: 500,
  fontFamily: 'Inter, sans-serif',
  borderRadius: '10px',
  px: 2,
  minHeight: 36,
  flexShrink: 0,
  boxShadow: 'none',
  '&:hover': {
    borderColor: '#b0387d',
    backgroundColor: 'rgba(198, 64, 145, 0.06)',
    color: '#334155',
  },
};

const featureRemoveButtonSx = {
  minWidth: 36,
  px: 1,
  fontSize: '18px',
  lineHeight: 1,
  fontWeight: 500,
  color: '#94a3b8',
  textTransform: 'none',
  borderRadius: '8px',
  '&:hover': {
    color: '#d32f2f',
    backgroundColor: 'rgba(211, 47, 47, 0.06)',
  },
};

const TextFieldStyle = {
  width: '100%',
  minHeight: '48px',
  background: '#fff',
  borderRadius: '10px',
  border: '1px solid',
  borderColor: formColors.border,
  fontFamily: 'Inter, sans-serif',
  fontStyle: 'normal',
  fontWeight: 400,
  fontSize: '14px',
  color: formColors.text,
  overflow: 'auto',
  paddingLeft: '0px',
  transition: 'border-color 0.15s ease',
  outline: 'none',
  boxShadow: 'none',
  '&:hover': {
    borderColor: formColors.borderHover,
  },
  '&.Mui-focused': {
    borderColor: formColors.borderFocus,
    boxShadow: 'none',
  },
  '&:focus': {
    outline: 'none',
  },
  '& .MuiInputBase-input': {
    color: formColors.text,
  },
  '& .MuiInputBase-input:focus': {
    outline: 'none',
  },
  '& .MuiInputBase-input::placeholder': {
    color: formColors.label,
    opacity: 0.55,
    WebkitTextFillColor: formColors.label,
  },
};
const mapdata = {
  color: ' #6B7A99',
  fontFamily: 'Inter, sans-serif',
  width: '100%',
  fontSize: '12px',
  minHeight: '60px',
  height: 'auto',
};

const tableDataStyle = {
  fontFamily: 'Inter, sans-serif',
  fontStyle: 'normal',
  fontWeight: 500,
  fontSize: 12,
  color: '#6B7A99',
};

const TableCellStyle = {
  fontFamily: 'Inter, sans-serif',
  fontStyle: 'normal',
  fontWeight: 500,
  fontSize: 12,
  textAlign: 'center',
  color: '#C64091',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
};

const inputStyles = {
  width: '110px',
  height: '42px',
  background: '#FFFFFF',
  borderRadius: '10px',
  padding: '0px 10px',
  fontSize: '12px',
  fontFamily: 'Inter, sans-serif',
  color: formColors.text,
  ...borderedControlSx(false),
  ...inputPlaceholderSx,
};

/** Inputs nested inside `borderedWrapperSx` — outer box owns the border */
const inputInsideGroupedFieldSx = {
  height: '42px',
  background: 'transparent',
  borderRadius: 0,
  padding: '0px 8px',
  fontSize: '12px',
  fontFamily: 'Inter, sans-serif',
  color: formColors.text,
  border: 'none',
  boxSizing: 'border-box',
  outline: 'none',
  boxShadow: 'none',
  '&:hover': {
    border: 'none',
    borderColor: 'transparent',
  },
  '&.Mui-focused': {
    border: 'none',
    borderColor: 'transparent',
    boxShadow: 'none',
  },
  '& .MuiInputBase-input:focus': { outline: 'none' },
  ...inputPlaceholderSx,
};
const TypographyStyle = {
  fontFamily: 'Inter, sans-serif',
  fontStyle: 'normal',
  fontWeight: 500,
  fontSize: '14px',
  color: '#5c6b8a',
};

const MenuItems = {
  fontSize: '12px',
  color: formColors.text,
  fontFamily: 'Inter, sans-serif',
  fontStyle: 'normal',
  fontWeight: 400,
};



