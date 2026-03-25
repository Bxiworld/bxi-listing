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
import React, { useEffect, useState, useRef } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import RemoveIcon from '../../assets/Images/CommonImages/RemoveIcon.svg';
import EditIcon from '../../assets/Images/CommonImages/EditIcon.svg';
import { useUpdateProductQuery } from './ProductHooksQuery';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray } from 'react-hook-form';
import { Info, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/button';
import OthercostPortion from '../MediaOffline/OthercostPortion.jsx';
import { toast } from 'sonner';
import bxitoken from '../../assets/Images/CommonImages/BXIToken.svg';
import Bxitoken from '../../assets/Images/CommonImages/BXIToken.svg';
import api from '../../utils/api';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../components/ui/tooltip';
import StateData from '../../utils/StateCityArray.json';

const LocationArr = [
  'Specific',
  'Position',
  'Main area',
  'Lobby',
  'Foyer',
  'Wall area',
  'Washrooms',
  'Billing counter',
  'Passage',
  'On screen',
  'On Air',
  'Other',
];

const MediaProductInfo = () => {
  const ProductId = useParams().id;
  const navigate = useNavigate();
  const [unit, setUnit] = useState('');
  const [FetchedproductData, setFetchedpProuctData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [storeDataOfLocation, setStoreDataOfLocation] = useState({});
  const [onlyState, setOnlyState] = useState(false);
  const [IsDisabled, setIsDisabled] = useState();

  const tagInputRef = useRef(null);

  const otherInputRef = useRef(null);
  const [city, setCity] = useState('');
  const [CityArray, setCityArray] = useState();
  const [stateArray, setStateArray] = useState();
  const [state, setState] = useState('');
  const [GSTData, setGSTData] = useState();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('Update_TDS_GST/get_all_gst');
        const resData = response?.data ?? response;
        setGSTData(resData?.data ?? resData);
      } catch (error) {
        toast.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (stateArray) {
      const stateData = StateData?.filter((item) => item?.name === stateArray);
      setCityArray(stateData[0]?.data);
    }
  }, [stateArray]);

  const [OthercostEditId, SetOthercostEditId] = useState(null);
  const [tags, setTags] = useState([]);

  const handleAddTag = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const currentTag = e.target.value.trim();
      if (currentTag !== '' && !tags.includes(currentTag)) {
        setTags([...tags, currentTag]);
        tagInputRef.current.value = '';
      }
    }
  };

  const handleAddButtonClick = () => {
    const currentTag = tagInputRef.current.value.trim();
    if (currentTag !== '' && !tags.includes(currentTag)) {
      setTags([...tags, currentTag]);
      tagInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (FetchedproductData?.tags?.length > 0 && tags.length === 0) {
      setTags(FetchedproductData.tags);
      setValue('tags', FetchedproductData.tags); // Set initial form value
    }
  }, [FetchedproductData]);

  const handleDeleteTag = (tagToDelete) => {
    setTags((prevTags) => {
      const updatedTags = prevTags.filter((tag) => tag !== tagToDelete);
      // Update the form value with new tags
      setValue('tags', updatedTags);
      return updatedTags;
    });
  };

  const [OtherInfoArray, setOtherInfoArray] = useState([]);

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

  const [MediaOnlineFeaturesData, setMediaOnlineFeaturesData] = useState([]);
  const fetchMediaOnlineFeatures = async () => {
    try {
      const response = await api.get('mediaonlinesinfeature/Get_media_onlinesinglefea');
      const raw = response?.data ?? response;
      const list = Array.isArray(raw) ? raw : raw?.data ?? [];
      const sortedData = list
        .slice()
        .sort((a, b) =>
          (a.MediaonlineFeaturesingle || '').localeCompare(b.MediaonlineFeaturesingle || ''),
        );
      setMediaOnlineFeaturesData(sortedData);
    } catch (error) {
      // ignore
    }
  };

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    control,
    setError,
    reset,
    resetField,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(
      z.object({
        medianame:
          FetchedproductData?.ProductSubCategory === '643cda0c53068696706e3951'
            ? z.any()
            : z.string().min(1),
        offerningbrandat:
          FetchedproductData?.ProductSubCategory === '643cda0c53068696706e3951'
            ? z.any()
            : z.string().min(1),
        multiplexScreenName:
          FetchedproductData?.ProductSubCategory === '643cda0c53068696706e3951'
            ? z.string().min(1)
            : z.any(),
        mediaVariation: z.object({
          location: z.string().min(1, 'Location is required'),
          unit: z.string().min(1, 'Unit is required'),
          Timeline: z.string().min(1, 'Timeline is required'),
          repetition: z.string().min(1, 'Repetition is required')
          .refine((value) => parseFloat(value.replace(/,/g, '')) > 0, {
            message: 'Price cannot be zero',
          }),
          dimensionSize: z.string().min(1)
          .refine((value) => parseFloat(value.replace(/,/g, '')) > 0, {
            message: 'Price cannot be zero',
          }),
          PricePerUnit: z.coerce.string().min(1, { message: 'Price is required' })
          .refine((value) => parseFloat(value.replace(/,/g, '')) > 0, {
            message: 'Price cannot be zero',
          }),
          DiscountedPrice: z.coerce.string().min(1, { message: 'Discounted price is required' })
          .refine((value) => parseFloat(value.replace(/,/g, '')) > 0, {
            message: 'Discounted price cannot be zero',
          }),
          GST: z.coerce.number().gte(5).lte(28),
          GST: z.coerce.number().gte(5).lte(28),
          HSN: z
            .string()
            .regex(/^\d{4}$|^\d{6}$|^\d{8}$/, {
              message: 'HSN must be 4, 6, or 8 digits',
            })
            .refine((value) => !/^0+$/.test(value), {
              message: 'HSN cannot be all zeros',
            })
            .transform((value) => value?.trim()),
          minOrderQuantityunit:
            FetchedproductData?.ProductSubCategory === '643cda0c53068696706e3951'
              ? z.any()
              : z.coerce.number().positive('Min order quantity must be greater than 0').min(1, 'Min order quantity must be greater than 0'),

          maxOrderQuantityunit:
            FetchedproductData?.ProductSubCategory === '643cda0c53068696706e3951'
              ? z.any()
              : z.coerce.number().positive('Max order quantity must be greater than 0').min(1, 'Max order quantity must be greater than 0'),

          minOrderQuantitytimeline:
            z.coerce.number().positive('Min order timeline must be greater than 0').min(1, 'Min order timeline must be greater than 0'),

          maxOrderQuantitytimeline:
            z.coerce.number().positive('Max order timeline must be greater than 0').min(1, 'Max order timeline must be greater than 0'),

          seatingCapacity: '643cda0c53068696706e3951'
            ? z.coerce.string().min(1)
            : z.any(),
          maxTimeslotSeconds: z.coerce.number().min(1),
          minTimeslotSeconds: z.coerce.number().min(1),
        }),

// if user selects PAN India then state and city will be optional
        GeographicalData: z.object({
          region: z.string().min(1, "Region is required"),
          state: IsDisabled === 'PAN India' ? z.string().optional() : z.string().min(1, "State is required"),
          city: IsDisabled === 'PAN India' ? z.string().optional() : z.string().min(1, "City is required"),
          landmark: IsDisabled === 'PAN India' ? z.string().optional() : z.string().min(1, "Landmark is required"),
        }),
      }),
    ), 
  });

  const FetchProduct = async () => {
    // Don't fetch if ProductId is not available
    if (!ProductId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setFetchError(null);
    try {
      const response = await api.get(
        'product/get_product_byId/' + ProductId,
      );
      const data = response?.data ?? response;

      setFetchedpProuctData(data);

      if (data?.ProductSubCategory === '65029534eaa5251874e8c6b4') {
        setValue('mediaVariation.Timeline', 'Month');
      }

      if (data?.mediaVariation) {
        setItems(data?.ProductFeatures);
        setValue('medianame', data?.medianame);
        setValue('offerningbrandat', data?.offerningbrandat);
        setValue('adPosition', data?.adPosition);
        setValue(
          'mediaVariation.PricePerUnit',
          data?.mediaVariation?.PricePerUnit,
        );
        setValue('mediaVariation.repetition', data?.mediaVariation?.repetition);
        setValue(
          'mediaVariation.dimensionSize',
          data?.mediaVariation?.dimensionSize,
        );
        setValue(
          'mediaVariation.DiscountedPrice',
          data?.mediaVariation?.DiscountedPrice,
        );
        setValue('mediaVariation.GST', data?.mediaVariation?.GST);
        setValue('mediaVariation.HSN', data?.mediaVariation?.HSN);
        setValue(
          'mediaVariation.minOrderQuantityunit',
          data?.mediaVariation?.minOrderQuantityunit,
        );
        setValue(
          'mediaVariation.minOrderQuantitytimeline',
          data?.mediaVariation?.minOrderQuantitytimeline,
        );
        setValue(
          'mediaVariation.maxOrderQuantityunit',
          data?.mediaVariation?.maxOrderQuantityunit,
        );
        setValue(
          'mediaVariation.maxOrderQuantitytimeline',
          data?.mediaVariation?.maxOrderQuantitytimeline,
        );
        setValue('mediaVariation.location', data?.mediaVariation?.location);
        setValue('mediaVariation.unit', data?.mediaVariation?.unit);
        setValue('mediaVariation.Timeline', data?.mediaVariation?.Timeline);
        OthercostAppend(data?.OtherCost);
        setValue('GeographicalData', data?.GeographicalData);
        setValue(
          'mediaVariation.minTimeslotSeconds',
          data?.mediaVariation?.minTimeslotSeconds,
        );
        setValue(
          'mediaVariation.maxTimeslotSeconds',
          data?.mediaVariation?.maxTimeslotSeconds,
        );

        setOtherInfoArray(data?.OtherInformationBuyerMustKnowOrRemarks);
        setValue('multiplexScreenName', data?.multiplexScreenName);
        setValue(
          'mediaVariation.maxTimeslotSeconds',
          data?.mediaVariation?.maxTimeslotSeconds,
        );
        setValue(
          'mediaVariation.minTimeslotSeconds',
          data?.mediaVariation?.minTimeslotSeconds,
        );
        setValue(
          'mediaVariation.seatingCapacity',
          data?.mediaVariation?.seatingCapacity,
        );

        setValue('GeographicalData.region', data?.GeographicalData.region);
        setValue('GeographicalData.state', data?.GeographicalData.state);
        setValue('GeographicalData.city', data?.GeographicalData.city);
        setValue('GeographicalData.landmark', data?.GeographicalData.landmark);
        setValue('tags', data?.tags);
      }
      setIsLoading(false);
    } catch (error) {
      setFetchError('Failed to load product data. Please try again.');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (ProductId) {
      FetchProduct();
    }
  }, [ProductId]);

  const { mutate: updateProduct, isPending: isSubmitting } = useUpdateProductQuery();

  const SecondsFieldArr = [
    5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95,
    100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150, 155, 160, 165, 170,
    175, 180,
  ];

  function filterMultiples(array, multiple) {
    return array.filter(function (value) {
      return value > multiple;
    });
  }

  const {
    fields: OthercostFields,
    append: OthercostAppend,
    remove: OthercostRemove,
    update: OthercostUpdate,
  } = useFieldArray({
    control,
    name: 'Othercost',
  });

  const { id } = useParams();

  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [traits, setTraits] = useState([]);
  const [MaxtimeslotArr, setMaxtimeslotArr] = useState([]);
  const handleItemAdd = (e) => {
    if (items.length >= 20) {
      return toast.error('Features cannot be more than 20');
    }
    if (description === '') {
      return toast.error('Please fill the proper features and description');  
    } else if (description.length > 75) {
      return toast.error('Description must contain at most 75 characters');
    } else if (name === '') {
      return toast.error('Please add unique features');
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

  async function FetchAddedProduct() {
    try {
      const res = await api.get(`product/get_product_byId/${ProductId}`);
      return res?.data ?? res;
    } catch (error) {
      return null;
    }
  }

  const OthercostFieldsarray = [
    'Applicable On',
    'Other cost ',
    'HSN',
    'GST',
    'Reason Of Cost',
  ];

  useEffect(() => {
    fetchMediaOnlineFeatures();
    FetchAddedProduct();
    if (FetchedproductData?.ProductSubCategory === '643cda0c53068696706e3951') {
      setValue('mediaVariation.unit', 'Screen');
      setValue('mediaVariation.Timeline', 'Week');
    }
  }, []);

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

    if (FetchedproductData?.ProductSubCategory === '643cda0c53068696706e3951') {
      setValue('mediaVariation.unit', 'Screen');
      setValue('mediaVariation.Timeline', 'Week');
      setValue('mediaVariation.MaxOrderQuantity', '1');
      setValue('mediaVariation.MinOrderQuantity', '1');
    }
    if (FetchedproductData?.ProductSubCategory === '65029534eaa5251874e8c6b4') {
      setValue(
        'mediaVariation.MaxOrderQuantity',
        getValues()?.mediaVariation.minOrderQuantityunit,
      );
      setValue(
        'mediaVariation.MinOrderQuantity',
        getValues()?.mediaVariation.minOrderQuantityunit,
      );
      setValue('mediaVariation.Timeline', 'Month');
      setValue(
        'mediaVariation.maxOrderQuantityunit',
        getValues()?.mediaVariation.minOrderQuantityunit,
      );
    }
    const datatobesent = {
      ...data,
      id: ProductId,
      OtherCost: OthercostFields,
      ProductFeatures: items,
      GeographicalData: {
        region: getValues()?.GeographicalData?.region,
        state: getValues()?.GeographicalData?.state,
        city: getValues()?.GeographicalData?.city,
        landmark: getValues()?.GeographicalData?.landmark,
      },
      ProductsVariantions: [getValues()?.mediaVariation],
      OtherInformationBuyerMustKnowOrRemarks: OtherInfoArray,
      mediaVariation: {
        ...getValues()?.mediaVariation,
        GST: getValues()?.mediaVariation?.GST
          ? getValues()?.mediaVariation?.GST
          : FetchedproductData?.mediaVariation?.GST,
      },
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
    if (!data.mediaVariation.location) {
      setError('mediaVariation.location', {
        type: 'custom',
        message: 'Please select a location',
      });
      toast.error('Please select a location');
      return;
    }
    if (!data.mediaVariation.unit) {
      setError('mediaVariation.unit', {
        type: 'custom',
        message: 'Please select a unit',
      });
      toast.error('Please select a unit');
      return;
    }
    if (!data.mediaVariation.Timeline) {
      setError('mediaVariation.Timeline', {
        type: 'custom',
        message: 'Please select a timeline',
      });
      toast.error('Please select a timeline');
      return;
    }
    if (!data.mediaVariation.repetition) {
      setError('mediaVariation.repetition', {
        type: 'custom',
        message: 'Please select a repetition',
      });
      toast.error('Please select a repetition');
      return;
    }

    if (!storeDataOfLocation.region && !data?.GeographicalData?.region) {
      setError('GeographicalData.region', {
        type: 'custom',
        message: 'Please select a region',
      });
      toast.error('Please select a Region');
    }

    if (storeDataOfLocation.region !== 'PAN India' && data?.GeographicalData?.region !== 'PAN India') {
      if (!storeDataOfLocation.state && !data?.GeographicalData?.state) {
        setError('GeographicalData.state', {
          type: 'custom',
          message: 'Please select a state',
        });
        toast.error('Please select a State');
        return;
      }

      if (!storeDataOfLocation.city && !data?.GeographicalData?.city) {
        setError('GeographicalData.city', {
          type: 'custom',
          message: 'Please select a city',
        });
        toast.error('Please select a City');
        return;
      }
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
      return toast.error('Max Order Quantity can not be less than Min Order Quantity');
    }
    if (Number(data?.mediaVariation?.minOrderQuantityunit) === 0) {
      setError('mediaVariation.minOrderQuantityunit', {
        type: 'custom',
        message: 'Min Order Quantity cannot be zero',
      });
      return toast.error('Min Order Quantity cannot be zero');
    }

    if (Number(data?.mediaVariation?.maxOrderQuantityunit) === 0) {
      setError('mediaVariation.maxOrderQuantityunit', {
        type: 'custom',
        message: 'Max Order Quantity cannot be zero',
      });
      return toast.error('Max Order Quantity cannot be zero');
    }

    if (Number(data?.mediaVariation?.minOrderQuantitytimeline) === 0) {
      setError('mediaVariation.minOrderQuantitytimeline', {
        type: 'custom',
        message: 'Min Order Timeline cannot be zero',
      });
      return toast.error('Min Order Timeline cannot be zero');
    }

    if (Number(data?.mediaVariation?.maxOrderQuantitytimeline) === 0) {
      setError('mediaVariation.maxOrderQuantitytimeline', {
        type: 'custom',
        message: 'Max Order Timeline cannot be zero',
      });
      return toast.error('Max Order Timeline cannot be zero');
    }
    if (items?.length < 5) {
      return toast.error('Please Select Best Features ( Min 5 )');
    } else if (Number(DiscountedPrice) > Number(PricePerUnit)) {
      setError('mediaVariation.DiscountedPrice', {
        type: 'custom',
        message: 'Discounted Price can not be greater than Price Per Unit',
      });
      return toast.error('Discounted Price can not be greater than Price Per Unit');
    } else if (!storeDataOfLocation.region && !data?.GeographicalData?.region) {
      setError('GeographicalData.region', {
        type: 'custom',
        message: 'Please Select Region',
      });
      toast.error('Please Select Region');
    } else if (items.length > 20) {
      return toast.error('Please Select Best Features ( max 20 )');
    } else if (tags?.length === 0 && FetchedproductData?.tags?.length === 0) {
      return toast.error('Please add at least one Tag');
    } else {
      updateProduct(datatobesent, {
        onSuccess: (response) => {
          if (response.status === 200) {
            // Use new dynamic route
            navigate(`/mediaonline/tech-info/${id}`);
          }
        },
        onError: (error) => { },
      });
    }
  });

  const CancelJourney = () => {
    const WindowConfirmation = window.confirm(
      'Are you sure you want to cancel the product?',
    );
    if (WindowConfirmation) {
      navigate('/sellerhub');
    }
  };
  // 1. Add useEffect to set GST value when FetchedproductData changes
  useEffect(() => {
    // Check if FetchedproductData.mediaVariation.GST exists and is a valid value
    if (
      FetchedproductData?.mediaVariation?.GST !== null &&
      FetchedproductData?.mediaVariation?.GST !== undefined &&
      FetchedproductData?.mediaVariation?.GST !== 0
    ) {
      setValue('mediaVariation.GST', FetchedproductData.mediaVariation.GST);
    }
  }, [FetchedproductData, setValue]);

  // Show error if there's one
  if (fetchError) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="error">
          {fetchError}
        </Typography>
      </Box>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-8">
      <div className="form-container">
        <div className="form-section">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="form-section-title">Media Information</h2>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-[#6B7A99] hover:text-[#C64091]">
                    <Info className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Media Information encompasses essential details and specifications about a specific media, including its name, description, features, pricing, and other relevant data, facilitating informed purchasing decisions for potential buyers.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <form onSubmit={updateProductTotextilestatus} className="space-y-6 mt-6">
            <Box sx={{ width: '100%', overflow: 'auto' }}>
              <Stack>
                  {FetchedproductData?.ProductSubCategory ===
                    '643cda0c53068696706e3951' ? (
                      <Box>
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                          }}
                        >
                          <Typography sx={{ ...CommonTextStyle, pt: '20px' }}>
                          Screen Number / Name / Location{' '}
                            <span style={{ color: 'red' }}> *</span>
                          </Typography>

                          <TextField
                            focused
                            multiline
                            placeholder="Eg, Screen 3 PVR Inorbit Malad"
                            variant="standard"
                            {...register('multiplexScreenName')}
                            onKeyDown={(e) => {
                              if (
                                e.key === ' ' &&
                              e.target.selectionStart === 0
                              ) {
                                e.preventDefault();
                              }
                            }}
                            sx={{
                              ...lablechange,
                              background: '#fff',
                              borderRadius: '10px',
                              padding: '0px 10px',
                              color: '#c64091',
                              fontSize: '12px',
                              fontWeight: 400,
                              lineHeight: '20px',
                              minHeight: '47px',
                              height: 'auto',
                              border: errors['multiplexScreenName']
                                ? '1px solid red'
                                : null,
                            }}
                            InputProps={{
                              disableUnderline: true,
                              endAdornment: (
                                <Typography
                                  variant="body1"
                                  style={{ fontFamily: 'Inter, sans-serif' }}
                                ></Typography>
                              ),
                              style: {
                                fontFamily: 'Inter, sans-serif',
                                color: ' #c64091',
                                fontSize: '12px',
                                fontWeight: 400,
                                lineHeight: '20px',
                              },
                            }}
                          />
                          <Typography
                            sx={{ color: 'red', fontFamily: 'Inter, sans-serif' }}
                          >
                            {errors?.multiplexScreenName?.message}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                          }}
                        >
                          <Typography sx={{ ...CommonTextStyle, pt: '20px' }}>
                          Offering this Branding at ?{' '}
                            <span style={{ color: 'red' }}> *</span>
                          </Typography>

                          <Select
                            disableUnderline
                            defaultValue={'BMP'}
                            {...register('offerningbrandat')}
                            sx={{
                              ...inputStyles,
                              width: '100%',
                              marginTop: '10px',
                            }}
                          >
                            <MenuItem value="BMP">BMP</MenuItem>
                            <MenuItem value="Interval">Interval</MenuItem>
                            <MenuItem value="Both">Both</MenuItem>
                          </Select>
                          <Typography
                            sx={{ color: 'red', fontFamily: 'Inter, sans-serif' }}
                          >
                            {errors?.offerningbrandat?.message}
                          </Typography>
                        </Box>
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
                              sx={{ ...CommonTextStyle, fontSize: '12px' }}
                            >
                            Seating Capacity
                            </Typography>

                            <Input
                              disableUnderline
                              placeholder="256"
                              {...register('mediaVariation.seatingCapacity')}
                              sx={{
                                ...inputStyles,
                                mt: 1.2,
                                width: '140px',
                                border: errors?.mediaVariation?.seatingCapacity
                                  ?.message
                                  ? '1px solid red'
                                  : null,
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
                              sx={{ color: 'red', fontFamily: 'Inter, sans-serif' }}
                            >
                              {errors?.mediaVariation?.seatingCapacity?.message}
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
                              sx={{
                                ...CommonTextStyle,
                                fontSize: '12px',
                                mb: 1,
                              }}
                            >
                            Rate / Screen / Week{' '}
                              <span style={{ color: 'red' }}> *</span>
                            </Typography>

                            <Box sx={{ position: 'relative' }}>
                              <Input
                                disableUnderline
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
                                  },
                                })}
                                sx={{
                                  width: '139px',
                                  height: '42px',
                                  background: '#FFFFFF',
                                  borderRadius: '10px',
                                  fontSize: '12px',
                                  px: 1,
                                  color: '#c64091',
                                  border: errors?.mediaVariation?.PricePerUnit
                                    ?.message
                                    ? '1px solid red'
                                    : null,
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
                                title="BXI image"
                              />
                            </Box>

                            <Typography
                              sx={{ color: 'red', fontFamily: 'Inter, sans-serif' }}
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
                              sx={{
                                ...CommonTextStyle,
                                fontSize: '12px',
                                mb: 1,
                              }}
                            >
                            Discounted MRP{' '}
                              <span style={{ color: 'red' }}> *</span>
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
                                  color: '#c64091',
                                  px: 1,
                                  border: errors?.mediaVariation?.DiscountedPrice
                                    ?.message
                                    ? '1px solid red'
                                    : null,
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
                                title="BXI image"
                              />
                            </Box>

                            <Typography
                              sx={{ color: 'red', fontFamily: 'Inter, sans-serif' }}
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
                              maxWidth: '140px',
                            }}
                          >
                            <Typography
                              sx={{ ...CommonTextStyle, fontSize: '12px' }}
                            >
                            Repetition
                            </Typography>
                            <Input
                              disableUnderline
                              placeholder="28 Per week"
                              {...register('mediaVariation.repetition')}
                              sx={{
                                ...inputStyles,
                                mt: 1.2,
                                width: '140px',
                                border: errors?.mediaVariation?.repetition
                                  ?.message
                                  ? '1px solid red'
                                  : null,
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
                              sx={{ color: 'red', fontFamily: 'Inter, sans-serif' }}
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
                            gap: '20px',
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
                            Dimension Size{' '}
                              <span style={{ color: 'red' }}> *</span>
                            </Typography>
                            <Input
                              placeholder="2048 X 998"
                              disableUnderline
                              {...register('mediaVariation.dimensionSize')}
                              sx={{
                                ...inputStyles,
                                width: '140px',
                                border: errors?.mediaVariation?.dimensionSize
                                  ?.message
                                  ? '1px solid red'
                                  : null,
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
                              sx={{ color: 'red', fontFamily: 'Inter, sans-serif' }}
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
                            }}
                          >
                            <Typography
                              sx={{ ...CommonTextStyle, fontSize: '12px' }}
                            >
                            Min Order Timeslot{' '}
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
                                    display: 'flex',
                                    borderRadius: '10px',
                                    gap: '5px',
                                  }}
                                >
                                  <Select
                                    disableUnderline
                                    {...register(
                                      'mediaVariation.minTimeslotSeconds',
                                      {
                                        onChange: (e) => {
                                          setOnlyState(!onlyState);
                                        },
                                      },
                                    )}
                                    sx={{
                                      ...inputStyles,
                                      width: '60px',
                                      padding: '0px',
                                      ml: 1,
                                      border: errors?.mediaVariation
                                        ?.minTimeslotSeconds?.message
                                        ? '1px solid red'
                                        : null,
                                    }}
                                  >
                                    {SecondsFieldArr?.map((item, idx) => {
                                      return (
                                        <MenuItem
                                          sx={{
                                            border: '1px white solid',
                                          }}
                                          onClick={() => {
                                            const filteredArray = filterMultiples(
                                              SecondsFieldArr,
                                              item,
                                            );
                                            setMaxtimeslotArr(
                                              filteredArray.length > 0
                                                ? filteredArray
                                                : FetchedproductData
                                                  ?.mediaVariation
                                                  ?.minTimeslotSeconds,
                                            );
                                          }}
                                          value={item}
                                          key={idx}
                                        >
                                          {item}
                                        </MenuItem>
                                      );
                                    })}
                                  </Select>
                                  <Input
                                    disableUnderline
                                    value={'seconds'}
                                    disabled
                                    sx={{
                                      ...inputStyles,
                                      width: '60px',
                                      paddingY: '0.5px',
                                    }}
                                  />
                                </Box>
                                <Typography
                                  sx={{ color: 'red', fontFamily: 'Inter, sans-serif' }}
                                >
                                  {
                                    errors?.mediaVariation?.minTimeslotSeconds
                                      ?.message
                                  }
                                </Typography>
                                <Typography
                                  sx={{
                                    ...CommonTextStyle,
                                    fontSize: '12px',
                                  }}
                                >
                                  {FetchedproductData?.mediaVariation
                                    ?.minTimeslotSeconds
                                    ? 'Selected minTimeslotSeconds :' +
                                  FetchedproductData?.mediaVariation
                                    ?.minTimeslotSeconds
                                    : null}
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
                            Max Order Timeslot{' '}
                              <span style={{ color: 'red' }}> *</span>
                            </Typography>
                            <Box
                              sx={{
                                display: 'flex',
                                gap: '10px',
                              }}
                            >
                              <Box
                                sx={{
                                  display: 'flex',
                                  gap: '10px',
                                  flexDirection: 'column',
                                }}
                              >
                                <Box
                                  sx={{
                                    display: 'flex',
                                    borderRadius: '10px',
                                    gap: '5px',
                                  }}
                                >
                                  <Select
                                    disableUnderline
                                    {...register(
                                      'mediaVariation.maxTimeslotSeconds',
                                    )}
                                    sx={{
                                      ...inputStyles,
                                      width: '60px',
                                      padding: '0px',
                                      ml: 1,
                                      border: errors?.mediaVariation
                                        ?.maxTimeslotSeconds?.message
                                        ? '1px solid red'
                                        : null,
                                    }}
                                  >
                                    {MaxtimeslotArr?.map((item, idx) => {
                                      if (
                                        Number(
                                          getValues()?.mediaVariation
                                            ?.minTimeslotSeconds,
                                        ) >= Number(item)
                                      )
                                        return null;

                                      return (
                                        <MenuItem value={item}>{item}</MenuItem>
                                      );
                                    })}
                                  </Select>
                                  <Input
                                    disableUnderline
                                    value={'seconds'}
                                    disabled
                                    sx={{
                                      ...inputStyles,
                                      width: '60px',
                                      paddingY: '0.5px',
                                    }}
                                  />
                                </Box>
                                <Typography
                                  sx={{ color: 'red', fontFamily: 'Inter, sans-serif' }}
                                >
                                  {
                                    errors?.mediaVariation?.maxTimeslotSeconds
                                      ?.message
                                  }
                                </Typography>
                                <Typography
                                  sx={{
                                    ...CommonTextStyle,
                                    fontSize: '12px',
                                    color: '#c64091',
                                  }}
                                >
                                  {FetchedproductData?.mediaVariation
                                    ?.maxTimeslotSeconds
                                    ? 'Selected maxTimeslotSeconds :' +
                                  FetchedproductData?.mediaVariation
                                    ?.maxTimeslotSeconds
                                    : null}
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
                                    background: '#fff',
                                    display: 'flex',
                                    borderRadius: '10px',
                                    border: errors?.mediaVariation
                                      ?.minOrderQuantitytimeline?.message
                                      ? '1px solid red'
                                      : null,
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
                                      ...inputStyles,
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
                                      ...inputStyles,
                                      width: '65px',
                                      padding: '0px',
                                    }}
                                  />
                                </Box>
                                <Typography
                                  sx={{ color: 'red', fontFamily: 'Inter, sans-serif' }}
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
                                  flexDirection: 'column',
                                }}
                              >
                                <Box
                                  sx={{
                                    background: '#fff',
                                    display: 'flex',
                                    borderRadius: '10px',
                                    border: errors?.mediaVariation
                                      ?.maxOrderQuantitytimeline?.message
                                      ? '1px solid red'
                                      : null,
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
                                      ...inputStyles,
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
                                      ...inputStyles,
                                      width: '50px',
                                      padding: '0px',
                                    }}
                                  />
                                </Box>
                                <Typography
                                  sx={{ color: 'red', fontFamily: 'Inter, sans-serif' }}
                                >
                                  {
                                    errors?.mediaVariation
                                      ?.maxOrderQuantitytimeline?.message
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
                                  color: '#c64091',
                                  border: errors?.mediaVariation?.HSN?.message
                                    ? '1px solid red'
                                    : null,
                                }}
                              />
                            </Box>
                            <Typography
                              sx={{ color: 'red', fontFamily: 'Inter, sans-serif' }}
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
                              maxWidth: '140px',
                            }}
                          >
                            <Typography
                              sx={{ ...CommonTextStyle, fontSize: '12px' }}
                            >
                            GST <span style={{ color: 'red' }}> *</span>
                            </Typography>

                            <Box sx={{ position: 'relative' }}>
                              <Select
                                sx={{
                                  '.MuiOutlinedInput-notchedOutline': {
                                    border: 0,
                                  },
                                  '&.MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline':
                                {
                                  border: 0,
                                },
                                  '&.MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline':
                                {
                                  border: 0,
                                },
                                  width: '70px',
                                  height: '42px',
                                  background: '#FFFFFF',
                                  borderRadius: '10px',
                                  fontSize: '12px',
                                  color: '#c64091',
                                  border: errors?.mediaVariation?.GST?.message
                                    ? '1px solid red'
                                    : null,
                                }}
                                defaultValue={
                                  FetchedproductData?.mediaVariation?.GST
                                }
                                {...register('mediaVariation.GST')}
                              >
                                {GSTData?.map((gst, idx) => {
                                  return (
                                    <MenuItem sx={MenuItems} value={gst?.GST}>
                                      {gst?.GST}
                                    </MenuItem>
                                  );
                                })}
                              </Select>

                              <Typography
                                sx={{
                                  position: 'absolute',
                                  right: '32%',
                                  bottom: '25%',
                                  color: '#979797',
                                  fontSize: '15px',
                                }}
                              >
                              %
                              </Typography>
                            </Box>
                            <Typography
                              sx={{ color: 'red', fontFamily: 'Inter, sans-serif' }}
                            >
                              {errors?.mediaVariation?.GST?.message}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    ) : (
                      <Box>
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                          }}
                        >
                          <Typography sx={{ ...CommonTextStyle, pt: '20px' }}>
                          Media Name <span style={{ color: 'red' }}> *</span>
                          </Typography>

                          <TextField
                            focused
                            multiline
                            placeholder="Eg, Screen 3 PVR Inorbit Malad"
                            variant="standard"
                            {...register('medianame')}
                            onKeyDown={(e) => {
                              if (
                                e.key === ' ' &&
                              e.target.selectionStart === 0
                              ) {
                                e.preventDefault();
                              }
                            }}
                            sx={{
                              ...lablechange,
                              background: '#fff',
                              borderRadius: '10px',
                              padding: '0px 10px',
                              color: '#c64091',
                              fontSize: '12px',
                              fontWeight: 400,
                              lineHeight: '20px',
                              minHeight: '47px',
                              height: 'auto',
                              border: errors['medianame']
                                ? '1px solid red'
                                : '1px solid rgba(164, 123, 123, 1)',
                            }}
                            InputProps={{
                              disableUnderline: true,
                              endAdornment: (
                                <Typography
                                  variant="body1"
                                  style={{ fontFamily: 'Inter, sans-serif' }}
                                ></Typography>
                              ),
                              style: {
                                fontFamily: 'Inter, sans-serif',
                                color: '#c64091',
                                fontSize: '12px',
                                fontWeight: 400,
                                lineHeight: '20px',
                              },
                            }}
                          />
                          <Typography
                            sx={{ color: 'red', fontFamily: 'Inter, sans-serif' }}
                          >
                            {errors?.medianame?.message}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                          }}
                        >
                          <Typography sx={{ ...CommonTextStyle, pt: '20px' }}>
                          Offering this branding at ?{' '}
                            <span style={{ color: 'red' }}> *</span>
                          </Typography>

                          <TextField
                            focused
                            multiline
                            variant="standard"
                            placeholder="Eg. Near Concession area"
                            {...register('offerningbrandat')}
                            onKeyDown={(e) => {
                              if (
                                e.key === ' ' &&
                              e.target.selectionStart === 0
                              ) {
                                e.preventDefault();
                              }
                            }}
                            sx={{
                              ...lablechange,
                              background: '#fff',
                              borderRadius: '10px',
                              padding: '0px 10px',
                              color: '#c64091',
                              fontSize: '12px',
                              minHeight: '47px',
                              height: 'auto',
                              border: errors['offerningbrandat']
                                ? '1px solid red'
                                : '1px solid rgba(164, 123, 123, 1)',
                            }}
                            InputProps={{
                              disableUnderline: true,
                              endAdornment: (
                                <Typography
                                  variant="body1"
                                  style={{ fontFamily: 'Inter, sans-serif' }}
                                ></Typography>
                              ),
                              style: {
                                fontFamily: 'Inter, sans-serif',
                                color: '#c64091',
                                fontSize: '12px',
                              },
                            }}
                          />
                          <Typography
                            sx={{ color: 'red', fontFamily: 'Inter, sans-serif' }}
                          >
                            {errors?.offerningbrandat?.message}
                          </Typography>
                        </Box>

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
                              sx={{ ...CommonTextStyle, fontSize: '12px' }}
                            >
                            Ad Type <span style={{ color: 'red' }}> *</span>
                            </Typography>
                            <Typography
                              sx={{
                                ...CommonTextStyle,
                                fontSize: '12px',
                                fontWeight: 400,
                                border: errors?.mediaVariation?.location?.message,
                              }}
                            >
                              {FetchedproductData?.mediaVariation?.location ? (
                                <span
                                  style={{
                                  //fontWeight: "bold",
                                    color: '#c64091',
                                  }}
                                >
                                Your Selected Location:{' '}
                                  {FetchedproductData?.mediaVariation?.location}
                                </span>
                              ) : null}
                            </Typography>
                            <Select
                              disableUnderline
                              {...register('mediaVariation.location')}
                              sx={{
                                ...inputStyles,
                                width: '140px',
                                border: errors?.mediaVariation?.location
                                  ?.message
                                  ? '1px solid red'
                                  : null,
                              }}

                            >
                              {LocationArr.sort((a, b) => a.localeCompare(b)).map(
                                (item) => (
                                  <MenuItem key={item} value={item}>
                                    {item}
                                  </MenuItem>
                                ),
                              )}
                            </Select>
                            <Typography
                              sx={{ color: 'red', fontFamily: 'Inter, sans-serif' }}
                            >
                              {errors?.mediaVariation?.location?.message}
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
                            Unit <span style={{ color: 'red' }}> *</span>
                            </Typography>
                            <Typography
                              sx={{
                                ...CommonTextStyle,
                                fontSize: '12px',
                                fontWeight: 400,
                              }}
                            > {FetchedproductData?.mediaVariation?.unit ? (
                                <span
                                  style={{
                                    //fontWeight: "bold",
                                    color: '#c64091',
                                  }}
                                >
                              Your Selected Unit:{' '}
                                  {FetchedproductData?.mediaVariation?.unit}
                                </span>
                              ) : null}
                            </Typography>
                            <Select
                              disableUnderline
                              {...register('mediaVariation.unit')}
                              sx={{
                                ...inputStyles,
                                width: '140px',
                                border: errors?.mediaVariation?.unit?.message
                                  ? '1px solid red'
                                  : null,
                              }}
                            >
                              <MenuItem value="Screen">Per Screen</MenuItem>
                              <MenuItem value="Unit"> Per Unit </MenuItem>
                              {FetchedproductData?.ProductSubCategoryName ===
                              'Radio' ||
                              FetchedproductData?.ProductSubCategory ===
                              '65029534eaa5251874e8c6c1' ? null : (
                                  <MenuItem value="Spot"> Per Spot </MenuItem>
                                )}
                              <MenuItem value="Sq cm"> Per Sq cm </MenuItem>
                              <MenuItem value="Display"> Per Display </MenuItem>
                              <MenuItem value="Location"> Per Location </MenuItem>
                              <MenuItem value="Release"> Per Release </MenuItem>
                              <MenuItem value="Annoucment">
                                {' '}
                              Per Annoucment{' '}
                              </MenuItem>
                              <MenuItem value="Video"> Per Video</MenuItem>
                            </Select>
                            <Typography
                              sx={{ color: 'red', fontFamily: 'Inter, sans-serif' }}
                            >
                              {errors?.mediaVariation?.unit?.message}
                            </Typography>
                          </Box>
                          {FetchedproductData?.ProductSubCategory ===
                          '65029534eaa5251874e8c6b4' ? null : (
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
                              Timeline <span style={{ color: 'red' }}> *</span>
                                </Typography>
                                <Typography
                                  sx={{
                                    ...CommonTextStyle,
                                    fontSize: '12px',
                                  }}
                                > {FetchedproductData?.mediaVariation?.Timeline ? (
                                    <span
                                      style={{
                                        //fontWeight: "bold",
                                        color: '#c64091',
                                      }}
                                    >
                                Your Selected Timeline:{' '}
                                      {FetchedproductData?.mediaVariation?.Timeline}
                                    </span>
                                  ) : null}
                                </Typography>
                                <Select
                                  disableUnderline
                                  {...register('mediaVariation.Timeline')}
                                  sx={{
                                    ...inputStyles,
                                    width: '140px',
                                    border: errors?.mediaVariation?.Timeline
                                      ?.message
                                      ? '1px solid red'
                                      : null,
                                  }}
                                  disabled={FetchedproductData?.ProductSubCategory ===
                                '65029534eaa5251874e8c6b4'}
                                >
                                  <MenuItem
                                    value="Day"
                                    onClick={() => {
                                      setOnlyState(!onlyState);
                                    }}
                                  >
                                    {' '}
                                Per Day{' '}
                                  </MenuItem>
                                  <MenuItem
                                    value="Week"
                                    onClick={() => {
                                      setOnlyState(!onlyState);
                                    }}
                                  >
                                    {' '}
                                Per Week{' '}
                                  </MenuItem>
                                  <MenuItem
                                    value="Month"
                                    onClick={() => {
                                      setOnlyState(!onlyState);
                                    }}
                                  >
                                    {' '}
                                Per Month{' '}
                                  </MenuItem>
                                  <MenuItem
                                    value="One Time"
                                    onClick={() => {
                                      setOnlyState(!onlyState);
                                    }}
                                  >
                                    {' '}
                                Per One Time{' '}
                                  </MenuItem>
                                  <MenuItem
                                    value="Year"
                                    onClick={() => {
                                      setOnlyState(!onlyState);
                                    }}
                                  >
                                    {' '}
                                Per Year{' '}
                                  </MenuItem>
                                </Select>
                                <Typography
                                  sx={{ color: 'red', fontFamily: 'Inter, sans-serif' }}
                                >
                                  {errors?.mediaVariation?.Timeline?.message}
                                </Typography>
                              </Box>
                            )}
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
                            Repetition <span style={{ color: 'red' }}> *</span>
                            </Typography>
                            <Input
                              disableUnderline
                              placeholder="28 Per week"
                              {...register('mediaVariation.repetition')}
                              sx={{
                                ...inputStyles,
                                mt: 1.2,
                                width: '140px',
                                border: errors?.mediaVariation?.repetition
                                  ?.message
                                  ? '1px solid red'
                                  : '1px solid rgba(164, 123, 123, 1)',
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
                              sx={{ color: 'red', fontFamily: 'Inter, sans-serif' }}
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
                            Dimension Size{' '}
                              <span style={{ color: 'red' }}> *</span>
                            </Typography>
                            <Input
                              placeholder="2048 X 998"
                              disableUnderline
                              {...register('mediaVariation.dimensionSize')}
                              sx={{
                                ...inputStyles,
                                width: '140px',
                                border: errors?.mediaVariation?.dimensionSize
                                  ?.message
                                  ? '1px solid red'
                                  : '1px solid rgba(164, 123, 123, 1)',
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
                              sx={{ color: 'red', fontFamily: 'Inter, sans-serif' }}
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
                            MRP <span style={{ color: 'red' }}> *</span>( Excl
                            of GST )
                            </Typography>

                            <Box sx={{ position: 'relative' }}>
                              <Input
                                disableUnderline
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
                                  },
                                })}
                                sx={{
                                  width: '139px',
                                  height: '42px',
                                  background: '#FFFFFF',
                                  borderRadius: '10px',
                                  fontSize: '12px',
                                  px: 1,
                                  color: '#c64091',
                                  border: errors?.mediaVariation?.PricePerUnit
                                    ?.message
                                    ? '1px solid red'
                                    : '1px solid rgba(164, 123, 123, 1)',
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
                                title="BXI image"
                              />
                            </Box>

                            <Typography
                              sx={{ color: 'red', fontFamily: 'Inter, sans-serif' }}
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
                            Discounted MRP{' '}
                              <span style={{ color: 'red' }}> *</span>
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
                                  color: '#c64091',
                                  px: 1,
                                  border: errors?.mediaVariation?.DiscountedPrice
                                    ?.message
                                    ? '1px solid red'
                                    : '1px solid rgba(164, 123, 123, 1)',
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
                                title="BXI image"
                              />
                            </Box>

                            <Typography
                              sx={{ color: 'red', fontFamily: 'Inter, sans-serif' }}
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
                                  color: '#c64091',
                                  border: errors?.mediaVariation?.HSN?.message
                                    ? '1px solid red'
                                    : '1px solid rgba(164, 123, 123, 1)',
                                }}
                              />
                            </Box>
                            <Typography
                              sx={{ color: 'red', fontFamily: 'Inter, sans-serif' }}
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
                              maxWidth: '140px',
                            }}
                          >
                            <Typography
                              sx={{ ...CommonTextStyle, fontSize: '12px' }}
                            >
                            GST <span style={{ color: 'red' }}> *</span>
                            </Typography>
                            <Typography
                              sx={{
                                ...CommonTextStyle,
                                fontSize: '12px',
                                fontWeight: 400,
                                border: errors?.mediaVariation?.GST?.message,
                              }}
                            >
                              {FetchedproductData?.mediaVariation?.GST ? (
                                <span
                                  style={{
                                  //fontWeight: "bold",
                                    color: '#c64091',
                                  }}
                                >
                                Your Selected GST:{' '}
                                  {FetchedproductData?.mediaVariation?.GST}
                                </span>
                              ) : null}
                            </Typography>

                            <Box sx={{ position: 'relative' }}>
                              <Select
                                sx={{
                                  '.MuiOutlinedInput-notchedOutline': {
                                    border: 0,
                                  },
                                  '&.MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline':
                                {
                                  border: 0,
                                },
                                  '&.MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline':
                                {
                                  border: 0,
                                },
                                  width: '70px',
                                  height: '42px',
                                  background: '#FFFFFF',
                                  borderRadius: '10px',
                                  fontSize: '12px',
                                  color: '#c64091',
                                  border: errors?.mediaVariation?.GST?.message
                                    ? '1px solid red'
                                    : '1px solid rgba(164, 123, 123, 1)',
                                }}
                                defaultValue=""
                                {...register('mediaVariation.GST')}
                              >
                                {GSTData?.map((gst, idx) => {
                                  return (
                                    <MenuItem sx={MenuItems} value={gst?.GST}>
                                      {gst?.GST}
                                    </MenuItem>
                                  );
                                })}
                              </Select>

                              <Typography
                                sx={{
                                  position: 'absolute',
                                  right: '32%',
                                  bottom: '25%',
                                  color: '#979797',
                                  fontSize: '15px',
                                }}
                              >
                              %
                              </Typography>
                            </Box>
                            <Typography
                              sx={{ color: 'red', fontFamily: 'Inter, sans-serif' }}
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
                                    background: '#fff',
                                    display: 'flex',
                                    borderRadius: '10px',
                                    border: errors?.mediaVariation
                                      ?.minOrderQuantityunit?.message
                                      ? '1px solid red'
                                      : '1px solid rgba(164, 123, 123, 1)',
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
                                          if (
                                            FetchedproductData?.ProductSubCategory ===
                                          '65029534eaa5251874e8c6b4'
                                          ) {
                                            setValue(
                                              'mediaVariation.maxOrderQuantityunit',
                                              event.target.value,
                                            );
                                          }
                                        },
                                      },
                                    )}
                                    sx={{
                                      ...inputStyles,
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
                                      ...inputStyles,
                                      width: '65px',
                                      padding: '0px',
                                      ml: 1,
                                    }}
                                  />
                                </Box>
                                <Typography
                                  sx={{ color: 'red', fontFamily: 'Inter, sans-serif' }}
                                >
                                  {
                                    errors?.mediaVariation?.minOrderQuantityunit
                                      ?.message
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
                                  flexDirection: 'column',
                                }}
                              >
                                <Box
                                  sx={{
                                    background: '#fff',
                                    display: 'flex',
                                    borderRadius: '10px',
                                    border: errors?.mediaVariation
                                      ?.maxOrderQuantityunit?.message
                                      ? '1px solid red'
                                      : '1px solid rgba(164, 123, 123, 1)',
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
                                    disabled={FetchedproductData?.ProductSubCategory ===
                                    '65029534eaa5251874e8c6b4'}
                                    sx={{
                                      ...inputStyles,
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
                                      ...inputStyles,
                                      width: '64px',
                                      padding: '0px',
                                      ml: 1,
                                    }}
                                  />
                                </Box>
                                <Typography
                                  sx={{ color: 'red', fontFamily: 'Inter, sans-serif' }}
                                >
                                  {
                                    errors?.mediaVariation?.maxOrderQuantityunit
                                      ?.message
                                  }
                                </Typography>
                              </Box>
                            </Box>
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
                                    background: '#fff',
                                    display: 'flex',
                                    borderRadius: '10px',
                                    border: errors?.mediaVariation
                                      ?.minOrderQuantitytimeline?.message
                                      ? '1px solid red'
                                      : '1px solid rgba(164, 123, 123, 1)',
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
                                      ...inputStyles,
                                      width: '65px',
                                      ml: 1,
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
                                      ...inputStyles,
                                      width: '65px',
                                      padding: '0px',
                                      ml: 1,
                                    }}
                                  />
                                </Box>
                                <Typography
                                  sx={{ color: 'red', fontFamily: 'Inter, sans-serif' }}
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
                                  flexDirection: 'column',
                                }}
                              >
                                <Box
                                  sx={{
                                    background: '#fff',
                                    display: 'flex',
                                    borderRadius: '10px',
                                    border: errors?.mediaVariation
                                      ?.maxOrderQuantitytimeline?.message
                                      ? '1px solid red'
                                      : '1px solid rgba(164, 123, 123, 1)',
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
                                      ...inputStyles,
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
                                      ...inputStyles,
                                      width: '64px',
                                      padding: '0px',
                                    }}
                                  />
                                </Box>
                                <Typography
                                  sx={{ color: 'red', fontFamily: 'Inter, sans-serif' }}
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
                        <Box
                          sx={{
                            height: 'auto',
                            minHeight: '100px',
                            position: 'relative',
                            display: 'flex',
                            flexWrap: 'wrap',
                            justifyContent: 'flex-start',
                            flexDirection: 'row',
                            gap: '30px',
                          }}
                        >
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
                            Min Order Timeslot
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
                                    display: 'flex',
                                    borderRadius: '10px',
                                    gap: '10px',
                                  }}
                                >
                                  <Select
                                    disableUnderline
                                    {...register(
                                      'mediaVariation.minTimeslotSeconds',
                                      {
                                        onChange: (e) => {
                                          setOnlyState(!onlyState);
                                        },
                                      },
                                    )}
                                    sx={{
                                      ...inputStyles,
                                      width: '140px',
                                      padding: '0px',
                                      ml: 1,
                                      border: errors?.mediaVariation
                                        ?.minTimeslotSeconds?.message
                                        ? '1px solid red'
                                        : null,
                                    }}
                                  >
                                    {SecondsFieldArr?.map((item, idx) => {
                                      return (
                                        <MenuItem
                                          sx={{
                                            border: '1px white solid',
                                          }}
                                          onClick={() => {
                                          // data = ;
                                            setMaxtimeslotArr(
                                              filterMultiples(
                                                SecondsFieldArr,
                                                item,
                                              ),
                                            );
                                          }}
                                          value={item}
                                        >
                                          {item}
                                        </MenuItem>
                                      );
                                    })}
                                  </Select>
                                  <Input
                                    disableUnderline
                                    value={'seconds'}
                                    disabled
                                    sx={{
                                      ...inputStyles,
                                      width: '70px',
                                      paddingY: '0.5px',
                                    }}
                                  />
                                </Box>
                                <Typography
                                  sx={{ color: 'red', fontFamily: 'Inter, sans-serif' }}
                                >
                                  {
                                    errors?.mediaVariation?.minTimeslotSeconds
                                      ?.message
                                  }
                                </Typography>
                                <Typography
                                  sx={{
                                    ...CommonTextStyle,
                                    fontSize: '12px',
                                    color: '#c64091',

                                  }}
                                >
                                  {FetchedproductData?.mediaVariation
                                    ?.minTimeslotSeconds
                                    ? 'Selected minTimeslotSeconds :' +
                                  FetchedproductData?.mediaVariation
                                    ?.minTimeslotSeconds
                                    : null}
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
                            Max Order Timeslot{' '}
                              <span style={{ color: 'red' }}> *</span>
                            </Typography>
                            <Box
                              sx={{
                                display: 'flex',
                                gap: '10px',
                              }}
                            >
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
                                    display: 'flex',
                                    borderRadius: '10px',
                                    gap: '10px',
                                  }}
                                >
                                  <Select
                                    disableUnderline
                                    {...register(
                                      'mediaVariation.maxTimeslotSeconds',
                                    )}
                                    sx={{
                                      ...inputStyles,
                                      width: '140px',
                                      padding: '0px',
                                      ml: 1,
                                      border: errors?.mediaVariation
                                        ?.maxTimeslotSeconds?.message
                                        ? '1px solid red'
                                        : null,
                                    }}
                                  >
                                    {MaxtimeslotArr?.map((item, idx) => {
                                      if (
                                        Number(
                                          getValues()?.mediaVariation
                                            ?.minTimeslotSeconds,
                                        ) >= Number(item)
                                      )
                                        return null;

                                      return (
                                        <MenuItem value={item}>{item}</MenuItem>
                                      );
                                    })}
                                  </Select>
                                  <Input
                                    disableUnderline
                                    value={'seconds'}
                                    disabled
                                    sx={{
                                      ...inputStyles,
                                      width: '70px',
                                      paddingY: '0.5px',
                                    }}
                                  />
                                </Box>
                                <Typography
                                  sx={{ color: 'red', fontFamily: 'Inter, sans-serif' }}
                                >
                                  {
                                    errors?.mediaVariation?.maxTimeslotSeconds
                                      ?.message
                                  }
                                </Typography>
                                <Typography
                                  sx={{
                                    ...CommonTextStyle,
                                    fontSize: '12px',
                                    color: '#c64091',
                                  }}
                                >
                                  {FetchedproductData?.mediaVariation
                                    ?.maxTimeslotSeconds
                                    ? 'Selected maxTimeslotSeconds :' +
                                  FetchedproductData?.mediaVariation
                                    ?.maxTimeslotSeconds
                                    : null}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </Box>
                      </Box>
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
                                        title="BXI image"
                                      />
                                    ) : (
                                      item.currencyType
                                    )}
                                  </TableCell>
                                  <TableCell align="left" sx={TableCellStyle}>
                                    {item.AdCostHSN}
                                  </TableCell>
                                  <TableCell align="left" sx={TableCellStyle}>
                                    {item.AdCostGST} %
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
                                      onClick={() => {
                                        SetOthercostEditId(idx);
                                      }}
                                    >
                                      <Box component="img" src={EditIcon} />
                                    </MuiButton>
                                    <MuiButton
                                      onClick={() => {
                                        OthercostRemove(idx);
                                      }}
                                    >
                                      <Box component="img" src={RemoveIcon} />
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
                          mb: 1,
                        }}
                      >
                        Region
                        <span style={{ color: 'red' }}> *</span>
                      </Typography>
                      <Select
                        disableUnderline
                        {...register('GeographicalData.region')}
                        sx={{
                          ...inputStyles,
                          border: errors?.GeographicalData?.region?.message
                            ? '1px solid red'
                            : null,
                        }}
                        onChange={(e) => {
                          const selectedValue = e.target.value;
                          setIsDisabled(selectedValue);
                          setStoreDataOfLocation({
                            ...storeDataOfLocation,
                            region: selectedValue,
                          });

                          if (selectedValue === 'PAN India') {
                            setValue('GeographicalData.state', '');
                            setValue('GeographicalData.city', '');
                            setValue('GeographicalData.landmark', '');
                            setState('');
                            setCity('');
                          } else {
                            reset({
                              'GeographicalData.state': '',
                              'GeographicalData.city': '',
                              'GeographicalData.landmark': '',
                            });
                          }
                        }}
                      >
                        <MenuItem value="Central">Central</MenuItem>
                        <MenuItem value="East ">East</MenuItem>
                        <MenuItem value="North">North</MenuItem>
                        <MenuItem value="PAN India">PAN India</MenuItem>
                        <MenuItem value="South">South</MenuItem>
                        <MenuItem value="West">West</MenuItem>
                      </Select>

                      <Typography sx={{ color: 'red', fontFamily: 'Inter, sans-serif' }}>
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
                        State {IsDisabled === 'PAN India' ? ' (Optional)' : <span style={{ color: 'red' }}> *</span>}
                      </Typography>

                      <Select
                        disableUnderline
                        disabled={IsDisabled === 'PAN India'}
                        {...register('GeographicalData.state')}
                        sx={{
                          ...inputStyles,
                          width: '139px',
                          mt: 1.2,
                          border: errors?.GeographicalData?.state?.message && IsDisabled !== 'PAN India'
                            ? '1px solid red'
                            : null,
                        }}
                        onChange={(e) => {
                          setStoreDataOfLocation({
                            ...storeDataOfLocation,
                            state: e.target.value,
                          });
                          setStateArray(e.target.value);
                          setState(e.target.value);
                        }}
                        value={IsDisabled === 'PAN India' ? '' : getValues('GeographicalData.state')}
                      >
                        {StateData?.sort((a, b) => a.name.localeCompare(b.name)).map((res, index) => (
                          <MenuItem key={index} value={res?.name}>
                            {res?.name}
                          </MenuItem>
                        ))}
                      </Select>

                      <Typography sx={{ color: 'red', fontFamily: 'Inter, sans-serif' }}>
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
                        City {IsDisabled === 'PAN India' ? ' (Optional)' : <span style={{ color: 'red' }}> *</span>}
                      </Typography>

                      <Select
                        disableUnderline
                        disabled={IsDisabled === 'PAN India' ? true : false}
                        {...register('GeographicalData.city')}
                        sx={{
                          ...inputStyles,
                          width: '139px',
                          mt: 1.2,
                          border: errors?.GeographicalData?.city?.message
                            ? '1px solid red'
                            : null,
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

                      <Typography sx={{ color: 'red', fontFamily: 'Inter, sans-serif' }}>
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
                        Landmark {IsDisabled === 'PAN India' ? ' (Optional)' : <span style={{ color: 'red' }}> *</span>}
                      </Typography>
                      <Input
                        disableUnderline
                        disabled={IsDisabled === 'PAN India' ? true : false}
                        onKeyDown={(e) => {
                          setStoreDataOfLocation({
                            ...storeDataOfLocation,
                            landmark: e.target.value,
                          });
                          if (e.key === ' ' && e.target.selectionStart === 0) {
                            e.preventDefault();
                          }
                        }}
                        placeholder={IsDisabled === 'PAN India' ? 'Eg. Juhu' : 'Eg. Juhu'}
                        {...register('GeographicalData.landmark')}
                        sx={{
                          width: '139px',
                          height: '42px',
                          background: '#FFFFFF',
                          borderRadius: '10px',
                          px: 1,
                          color: '#c64091',
                          fontSize: '12px',
                        }}
                      />
                      <Typography sx={{ color: 'red', fontFamily: 'Inter, sans-serif' }}>
                        {errors?.GeographicalData?.landmark?.message}
                      </Typography>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      py: '20px',
                    }}
                  >
                    <Box
                      sx={{
                        fontFamily: 'Inter, sans-serif',
                        color: '#6B7A99',
                      }}
                    >
                      <Typography sx={{ fontSize: '16px', fontWeight: '500' }}>
                        Select the best features that describe your brand/media
                      </Typography>
                      <Typography sx={{ fontSize: '12px' }}>
                        {' '}
                        (The more features you write the more you are
                        discovered){' '}
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
                          Select Best Features ( Min 5 and Max 20){' '}
                          <span style={{ color: 'red' }}> *</span>
                        </Typography>

                        <Select
                          onChange={(e) => setName(e.target.value)}
                          sx={{
                            width: '100%',
                            '.MuiOutlinedInput-notchedOutline': { border: 0 },
                            '&.MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline':
                            {
                              border: 0,
                            },
                            '&.MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline':
                            {
                              border: 0,
                            },
                            background: '#fff',
                            height: '100%',
                            borderRadius: '10px',
                            fontSize: '12px',
                            color: '#c64091',
                          }}
                          key={traits}
                        >
                          {MediaOnlineFeaturesData?.map((el, idx) => {
                            if (el?.IsHead) {
                              return (
                                <MenuItem
                                  key={idx}
                                  disabled
                                  sx={{
                                    ...CommonTextStyle,
                                    color: '#000',
                                    '&.MuiMenuItem-root': {
                                      color: '#000000',
                                    },
                                    '&.Mui-disabled': {
                                      color: '#000000',
                                    },
                                    fontWeight: 'bold',
                                  }}
                                >
                                  {el?.MediaonlineFeaturesingle}
                                </MenuItem>
                              );
                            }
                            return (
                              <MenuItem
                                key={idx}
                                value={el?.MediaonlineFeaturesingle}
                                sx={CommonTextStyle}
                              >
                                {el?.MediaonlineFeaturesingle}
                              </MenuItem>
                            );
                          })}
                        </Select>
                        {items?.length > 0 && items.length < 5 && (
                          <Typography
                            sx={{ color: 'red', fontFamily: 'Inter, sans-serif' }}
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
                          placeholder="Eg. Larger then Life Ads Across the Large Screens"
                          value={description}
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
                          sx={{
                            ...TextFieldStyle,
                            height: '100%',
                            color: '#c64091',
                            background: '#FFFFFF',
                          }}
                          onChange={(e) => setDescription(e.target.value)}
                          minRows={3}
                          InputProps={{
                            disableUnderline: true,
                            endAdornment: (
                              <Typography
                                variant="body1"
                                style={{
                                  fontFamily: 'Inter, sans-serif',
                                  fontSize: '12px',
                                  color: '#c64091',
                                }}
                              ></Typography>
                            ),
                            style: {
                              fontFamily: 'Inter, sans-serif',
                              fontSize: '12px',
                              padding: '10px',
                              color: '#c64091',
                            },
                          }}
                        />
                        {items?.length > 0 && items.length < 5 && (
                          <Typography
                            sx={{ color: 'red', fontFamily: 'Inter, sans-serif', mt: 1 }}
                          >
                            Enter{' '}
                            {5 - items?.length} more feature description
                          </Typography>
                        )}
                      </Box>
                      <MuiButton
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
                          '&:hover': {
                            background: '#C64091',
                          },
                          my: 3,
                        }}
                      >
                        Proceed to Add
                      </MuiButton>

                      <Typography
                        sx={{
                          color: '#6B7A99',
                          fontFamily: 'Inter, sans-serif',
                          fonmtSize: '20px',
                          marginRight: '75%',
                          marginTop: '1rem',
                        }}
                      >
                        Key Features({items.length})
                      </Typography>

                      <Box sx={{ width: '100%' }}>
                        {items?.map((item, index) => (
                          <Box
                            sx={{
                              border: '1px solid #E3E3E3',
                              marginTop: '1rem',
                              mx: 'auto',
                              height: 'auto',
                              width: '99%',
                              display: ' flex',
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
                                onClick={() => handleDelete(index)}
                                sx={{ textTransform: 'none', fontSize: '15px' }}
                              >
                                X
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
                        pb: '5px',
                      }}
                    >
                      <Typography sx={CommonTextStyle}>
                        Other information buyer must know/ Remarks{' '}
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          background: '#fff',
                          borderRadius: '10px',
                        }}
                      >
                        <TextField
                          placeholder="Eg. Technical Charges to be Paid on Extra on actual"
                          inputRef={otherInputRef}
                          id="standard-basic"
                          variant="standard"
                          InputProps={{
                            disableUnderline: 'true',
                            style: {
                              fontSize: '14px',
                              padding: '7px',
                              color: '#c64091',
                            },
                          }}
                          InputLabelProps={{
                            style: {
                              color: 'red',
                            },
                          }}
                          sx={{
                            width: '100%',
                            height: '42px',
                            background: '#FFFFFF',
                            borderRadius: '10px',
                          }}
                          onKeyDown={otherenter}
                        />
                        <MuiButton
                          variant="outlined"
                          sx={{
                            borderColor: '#c64091',
                            color: '#6B7A99',
                            right: 1,
                            textTransform: 'none',
                            fontSize: '12px',
                            alignSelf: 'center',
                            '&:hover': {
                              border: 'none',
                            },
                          }}
                          onClick={OtherInformationSubmit}
                        >
                          Add
                        </MuiButton>
                      </Box>
                    </Box>
                  </Box>

                  {OtherInfoArray.map((items) => {
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
                            color: '#c64091',
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
                        background: '#fff',
                        borderRadius: '10px',
                      }}
                    >
                      <TextField
                        placeholder="Add Tags"
                        inputRef={tagInputRef}
                        sx={{
                          width: '100%',
                          background: '#fff',
                          borderRadius: '10px',
                          height: '41px',
                        }}
                        variant="standard"
                        InputProps={{
                          disableUnderline: true,
                          style: {
                            color: 'rgba(107, 122, 153)',
                            fontSize: '14px',
                            marginTop: '5px',
                            marginLeft: '1%',
                            color: '#c64091',
                          },
                        }}
                        inputProps={{ maxLength: 15 }}
                        onKeyDown={handleAddTag}
                      />
                      <MuiButton
                        variant="outlined"
                        sx={{
                          borderColor: '#c64091',
                          color: '#6B7A99',
                          right: 1,
                          textTransform: 'none',
                          fontSize: '12px',
                          alignSelf: 'center',
                          '&:hover': {
                            border: 'none',
                          },
                        }}
                        onClick={handleAddButtonClick}
                      >
                        Add
                      </MuiButton>
                    </Box>

                    <Box
                      sx={deleteTagStyle}
                    >
                      {tags.map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          onDelete={() => handleDeleteTag(tag)} // Fix: Pass the tag to delete
                          sx={crosstagstyle}
                        />
                      ))}
                    </Box>
                  </Box>
                </Stack>
            </Box>

            <div className="flex justify-between pt-6">
              <Button type="button" variant="outline" onClick={CancelJourney}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-[#C64091] hover:bg-[#A03375]">
                {isSubmitting ? 'Saving...' : 'Next'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MediaProductInfo;

const CommonTextStyle = {
  fontFamily: 'Inter, sans-serif',
  fontStyle: 'normal',
  fontWeight: 400,
  fontSize: '14px',
  lineHeight: '21px',
  color: '#6B7A99',
};

const TextFieldStyle = {
  width: '100%',
  height: '48px',
  background: '#fff',
  borderRadius: '9px',
  border: 'none',
  fontFamily: 'Inter, sans-serif',
  fontStyle: 'normal',
  fontWeight: 400,
  fontSize: '14px',
  color: '#6B7A99',
  overflow: 'auto',
  paddingLeft: '0px',
  '&:focus': {
    outline: 'none',
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
  color: '#c64091',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
};

const lablechange = {
  fontFamily: 'Inter, sans-serif',
  color: '#6B7A99',
  fontSize: '16px',
  display: 'grid',
  textAlign: 'left',
  marginTop: '2rem',
  fontWeight: 'bold',
  background: 'red',
  '&:focus': {
    border: '1px solid #E8E8E8',
  },
};
const inputStyles = {
  width: '110px',
  height: '42px',
  background: '#FFFFFF',
  borderRadius: '10px',
  padding: '0px 10px',
  fontSize: '12px',
  color: '#c64091',
};
const TypographyStyle = {
  fontFamily: 'Inter, sans-serif',
  fontStyle: 'normal',
  fontWeight: 400,
  fontSize: '14px',
  color: '#6B7A99',
};

const MenuItems = {
  fontSize: '12px',
  color: '#c64091',
  fontFamily: 'Inter, sans-serif',
  fontStyle: 'normal',
  fontWeight: 400,
};
const deleteTagStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  mt: 2,
  minHeight: '50px',
};
const crosstagstyle = {
  fontSize: '14px',
  backgroundColor: '#FFFFFF',
  color: '#6B7A99',
  borderRadius: '16px',
  '& .MuiChip-deleteIcon': {
    color: '#6B7A99',
    '&:hover': {
      color: '#c64091',
    },
  },
  '&:hover': {
    backgroundColor: '#f5f5f5',
  },
};


