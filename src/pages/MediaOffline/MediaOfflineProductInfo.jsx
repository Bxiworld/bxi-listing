import {
  Typography,
  Box,
  Button,
  Select,
  MenuItem,
  Input,
  TextField,
  Chip,
  BottomNavigation,
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
import api from '../../utils/api';
import ToolTip from '../../components/ToolTip';
import StateData from '../../utils/StateCityArray.json';

const NEWSPAPER_SUBCATEGORY_ID = '647713dcb530d22fce1f6c36';
const PRINT_SUBCATEGORY_NAMES = ['Newspaper', 'Magazines', 'Flyers', 'Electricity bills', 'Boarding Pass'];

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

  const GSTOptions = [0, 5, 12, 18, 28];
  const [modelName, setModelName] = useState();
  const [HSNStore, setHSNStore] = useState();
  const [ProductData, setProductData] = useState();
  const [hsnCode, setHsnCode] = useState();
  const [FetchedproductData, setFetchedpProuctData] = useState();
  const [onlyState, setOnlyState] = useState(false);
  const [OneUnitProduct, setOneUnitProduct] = useState(false);
  const [IsDisabled, setIsDisabled] = useState();
  const [storeDataOfLocation, setStoreDataOfLocation] = useState({});
  const [paythru, setPaythru] = useState({
    bxitokens: '',
    inr: '',
  });
  const [OthercostEditId, SetOthercostEditId] = useState(null);
  const [GSTData, setGSTData] = useState();

  const isNewspaperJourney =
    isNewspaperFromStorage ||
    FetchedproductData?.ProductSubCategory === NEWSPAPER_SUBCATEGORY_ID ||
    FetchedproductData?.ProductSubCategoryName === 'News Papers / Magazines' ||
    (FetchedproductData?.ProductSubCategory && PRINT_SUBCATEGORY_NAMES.includes(FetchedproductData.ProductSubCategory));

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
  const { fields, append, prepend, remove, swap, move, insert, update } =
    useFieldArray({
      control,
      name: 'ProductsVariantions',
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

  const [data, setData] = useState([]);
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
  const Feature = [
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
    <div className="listing-journey">
      <div className="listing-journey-container">
        <form
          onSubmit={updateProductTotextilestatus}
          className="listing-journey-form"
        >
        <Box
          sx={{
            width: '100%',
            height: 'auto',
            maxHeight: '100%',
            overflowY: 'hidden',
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
            mx: 'auto',
            maxWidth: '980px',
            bgcolor: '#fff',
            overflowX: 'hidden',
            px: 4,
            py: 3,
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
          }}
        >
          <Box>
            <Box
              sx={{
                backgroundColor: '#EEF1F6',
                width: '100%',
                mx: 'auto',
                display: 'flex',
                justifyContent: 'flex-start',
                alignItems: 'center',
                gap: '10px',
                height: '100%',
              }}
            >
              <Typography
                sx={{
                  fontFamily: 'Roboto',
                  fontStyle: 'normal',
                  fontWeight: 600,
                  fontSize: {
                    xs: '18px',
                    sm: '16px',
                    md: '16px',
                    lg: '14px',
                    xl: '14px',
                  },
                  color: '#6B7A99',
                }}
              >
                Media Information
              </Typography>
              <ToolTip
                info={
                  'Media Information encompasses essential details and specifications about a specific media, including its name, description, features, pricing, and other relevant data, facilitating informed purchasing decisions for potential buyers.'
                }
              />
            </Box>
            <Box
              sx={{
                width: '100%',
                mt: 2,
                height: '100%',
                maxHeight: '100%',
                overflowY: 'hidden',
              }}
            >
              <Box
                sx={{
                  overflow: 'hidden',
                  '::-webkit-scrollbar': {
                    display: 'flex',
                  },
                  '::-webkit-scrollbar-thumb': {
                    dynamic: '#8d8e90',
                    minHeight: '10px',
                    borderRadius: '8px',
                  },
                  '::-webkit-scrollbar-thumb:vertical': {
                    maxHeight: '30px',
                  },
                  maxHeight: '100%',
                  height: '100%',
                  p: 1,
                }}
              >
                <Stack>
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
                      sx={{
                        ...lablechange,
                        background: '#fff',
                        borderRadius: '10px',
                        padding: '0px 10px',
                        color: '#C64091',
                        fontSize: '12px',
                        fontWeight: 400,
                        lineHeight: '20px',
                        height: 'auto',
                        minHeight: '47px',
                        border: errors?.medianame?.message
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
                          color: ' #C64091',
                          fontSize: '12px',
                          fontWeight: 400,
                          lineHeight: '20px',
                        },
                      }}
                    />
                    <Typography sx={{ color: 'red', fontFamily: 'Inter, sans-serif' }}>
                      {errors?.medianame?.message}
                    </Typography>
                  </Box>
                  {isNewspaperJourney ? (
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                        }}
                      >
                        <Typography sx={{ ...CommonTextStyle, pt: '20px' }}>
                        Position of the Ad ?{' '}
                          <span style={{ color: 'red' }}> *</span>
                        </Typography>

                        <TextField
                          focused
                          multiline
                          variant="standard"
                          placeholder="Eg. On Screen "
                          {...register('adPosition')}
                          onKeyDown={(e) => {
                            if (e.key === ' ' && e.target.selectionStart === 0) {
                              e.preventDefault();
                            }
                          }}
                          sx={{
                            ...lablechange,
                            background: '#fff',
                            borderRadius: '10px',
                            padding: '0px 10px',
                            color: '#C64091',
                            fontSize: '12px',
                            height: 'auto',
                            minHeight: '47px',
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
                              color: '#C64091',
                              fontSize: '12px',
                            },
                          }}
                        />
                        <Typography sx={{ color: 'red', fontFamily: 'Inter, sans-serif' }}>
                          {errors?.offerningbrandat?.message}
                        </Typography>
                      </Box>
                    ) : (
                      <>
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
                            sx={{
                              ...lablechange,
                              background: '#fff',
                              borderRadius: '10px',
                              padding: '0px 10px',
                              color: '#C64091',
                              fontSize: '12px',
                              height: 'auto',
                              minHeight: '47px',
                              border: errors?.offerningbrandat?.message
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
                                color: '#C64091',
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
                      </>
                    )}
                  {isNewspaperJourney ? (
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
                              maxWidth: '100px',
                            }}
                          >
                            <Typography
                              sx={{ ...CommonTextStyle, fontSize: '12px' }}
                            >
                            Edition (Language){' '}
                              <span style={{ color: 'red' }}> *</span>
                            </Typography>
                            <Input
                              disableUnderline
                              placeholder="Mumbai English"
                              {...register('mediaVariation.edition')}
                              sx={inputStyles}
                            />
                            <Typography
                              sx={{ color: 'red', fontFamily: 'Inter, sans-serif' }}
                            >
                              {errors?.mediaVariation?.edition?.message}
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
                            Type
                            </Typography>
                            <Select
                              disableUnderline
                              {...register('mediaVariation.Type', {
                                onChange: (e) => {
                                  setOnlyState(!onlyState);
                                  setUnit(e.target.value);
                                },
                              })}
                              sx={inputStyles}
                            >
                              <MenuItem value="Full Page">Full Page</MenuItem>
                              <MenuItem value="Half Page">Half Page</MenuItem>
                              <MenuItem value="Quarter Page">
                              Quarter Page
                              </MenuItem>
                              <MenuItem value="Custom Size">Custom Size</MenuItem>
                            </Select>
                            <Typography
                              sx={{ color: 'red', fontFamily: 'Inter, sans-serif' }}
                            >
                              {errors?.mediaVariation?.Type?.message}
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
                            Release Details
                            </Typography>
                            <Select
                              disableUnderline
                              {...register('mediaVariation.releasedetails', {
                                onChange: (e) => {
                                  setOnlyState(!onlyState);
                                },
                              })}
                              sx={inputStyles}
                            >
                              <MenuItem value="Per Insertion">
                              Per Insertion
                              </MenuItem>
                            </Select>
                            <Typography
                              sx={{ color: 'red', fontFamily: 'Inter, sans-serif' }}
                            >
                              {errors?.mediaVariation?.releasedetails?.message}
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
                            No of Insertions Available
                            </Typography>
                            <Input
                              disableUnderline
                              placeholder="28"
                              disabled={true}
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
                              sx={inputStyles}
                            />
                            <Typography
                              sx={{ color: 'red', fontFamily: 'Inter, sans-serif' }}
                            >
                              {
                                errors?.mediaVariation?.availableInsertions
                                  ?.message
                              }
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
                            Dimension Size
                            </Typography>
                            <Input
                              disableUnderline
                              placeholder="2048 X 998"
                              {...register('mediaVariation.dimensionSize')}
                              sx={{ ...inputStyles, width: '100px' }}
                            />
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
                            Price Per Unit
                            </Typography>

                            <Box sx={{ position: 'relative' }}>
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
                                  width: '139px',
                                  height: '42px',
                                  background: '#FFFFFF',
                                  borderRadius: '10px',
                                  fontSize: '12px',
                                  px: 1,
                                  color: '#C64091',
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
                            Discounted Price
                            </Typography>
                            <Box sx={{ position: 'relative' }}>
                              <Input
                                disableUnderline
                                // value={data.discount}
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
                                  width: '139px',
                                  height: '42px',
                                  background: '#FFFFFF',
                                  borderRadius: '10px',
                                  fontSize: '12px',
                                  color: '#C64091',
                                  px: 1,
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
                                alt="BXi token"
                                title="BXI token icon"
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
                            Ad Type
                            </Typography>
                            <Select
                              disableUnderline
                              {...register('mediaVariation.adType', {
                                onChange: (e) => {
                                  setOnlyState(!onlyState);
                                  setUnit(e.target.value);
                                },
                              })}
                              sx={inputStyles}
                            >
                              <MenuItem value="color">
                              Color <span style={{ color: 'red' }}> *</span>
                              </MenuItem>
                              <MenuItem value="Black & White">
                              Black & White
                              </MenuItem>
                            </Select>
                            <Typography
                              sx={{ color: 'red', fontFamily: 'Inter, sans-serif' }}
                            >
                              {errors?.mediaVariation?.adType?.message}
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
                            HSN
                            </Typography>

                            <Box sx={{ position: 'relative' }}>
                              <Input
                                disableUnderline
                                // required={true}
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
                                  color: '#C64091',
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
                            GST
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
                                  color: '#C64091',
                                  border: errors?.mediaVariation?.GST?.message
                                    ? '1px solid red'
                                    : null,
                                }}
                                defaultValue="0"
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
                              disableUnderline
                              {...register('mediaVariation.location')}
                              sx={{
                                ...inputStyles,
                                width: '140px',
                                border: errors?.mediaVariation?.location?.message
                                  ? '1px solid red'
                                  : null,
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
                              sx={{ color: 'red', fontFamily: 'Inter, sans-serif' }}
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
                                    border: errors?.mediaVariation?.unit?.message
                                      ? '1px solid red'
                                      : null,
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
                                  sx={{ color: 'red', fontFamily: 'Inter, sans-serif' }}
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
                                border: errors?.mediaVariation?.Timeline?.message
                                  ? '1px solid red'
                                  : null,
                              }}
                            >
                              <MenuItem value="Day"> Per Day </MenuItem>
                              <MenuItem value="Week"> Per Week </MenuItem>
                              <MenuItem value="Month"> Per Month </MenuItem>
                              <MenuItem value="One Time"> Per One Time </MenuItem>
                              <MenuItem value="Year"> Per Year </MenuItem>
                            </Select>
                            <Typography
                              sx={{ color: 'red', fontFamily: 'Inter, sans-serif' }}
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
                                  color: '#C64091',
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
                                title="BXI token icon"
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
                                  color: '#C64091',
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
                                title="BXI token icon"
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
                                  color: '#C64091',
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
                                  color: '#C64091',
                                  border: errors?.mediaVariation?.GST?.message
                                    ? '1px solid red'
                                    : null,
                                }}
                                defaultValue="0"
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
                                        background: '#fff',
                                        display: 'flex',
                                        borderRadius: '10px',
                                        border: errors?.mediaVariation
                                          ?.minOrderQuantityunit?.message
                                          ? '1px solid red'
                                          : null,
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
                                        background: '#fff',
                                        display: 'flex',
                                        borderRadius: '10px',
                                        border: errors?.mediaVariation
                                          ?.maxOrderQuantityunit?.message
                                          ? '1px solid red'
                                          : null,
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
                                  // display: "flex",
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
                                    <Button
                                      onClick={() => {
                                        SetOthercostEditId(idx);
                                      }}
                                    >
                                      <Box component="img" src={EditIcon} />
                                    </Button>
                                    <Button
                                      onClick={() => {
                                        OthercostRemove(idx);
                                      }}
                                    >
                                      <Box component="img" src={RemoveIcon} />
                                    </Button>
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
                      mt: 4,
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
                        State <span style={{ color: 'red' }}> *</span>
                      </Typography>
                      <Select
                        disableUnderline
                        disabled={IsDisabled === 'PAN India' ? true : false}
                        {...register('GeographicalData.state')}
                        sx={{
                          ...inputStyles,
                          width: '139px',
                          border: errors?.GeographicalData?.state?.message
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
                        City <span style={{ color: 'red' }}> *</span>
                      </Typography>
                      <Select
                        disableUnderline
                        disabled={IsDisabled === 'PAN India' ? true : false}
                        {...register('GeographicalData.city')}
                        sx={{
                          ...inputStyles,
                          width: '139px',
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
                      {FetchedproductData?.GeographicalData ? (
                        <Typography
                          sx={{ ...CommonTextStyle, fontSize: '10px' }}
                        >
                          : {FetchedproductData?.GeographicalData?.city}
                        </Typography>
                      ) : null}{' '}
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
                          color: '#C64091',
                          fontSize: '12px',
                          border: errors?.GeographicalData?.landmark?.message
                            ? '1px solid red'
                            : null,
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
                          Select Best Features ( Min 5 and Max 20 ){' '}
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
                            color: '#C64091',
                          }}
                          key={traits}
                        >
                          {Feature?.map((el, idx) => {
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
                          value={description}
                          placeholder="Eg. Larger then Life Ads Across the Large Screens"
                          sx={{
                            ...TextFieldStyle,
                            height: '100%',
                            color: '#C64091',
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
                            endAdornment: (
                              <Typography
                                variant="body1"
                                style={{
                                  fontFamily: 'Inter, sans-serif',
                                  fontSize: '12px',
                                  color: '#C64091',
                                }}
                              ></Typography>
                            ),
                            style: {
                              fontFamily: 'Inter, sans-serif',
                              fontSize: '12px',
                              padding: '10px',
                              color: '#C64091',
                            },
                          }}
                        />
                        {items?.length > 0 && items.length < 5 && (
                          <Typography
                            sx={{ color: 'red', fontFamily: 'Inter, sans-serif', mt: 1 }}
                          >
                            Enter{' '}
                            {5 - items?.length}more feature description
                          </Typography>
                        )}
                      </Box>

                      <Button
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
                      </Button>

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
                        {items.map((item, index) => (
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

                              <Button
                                onClick={() => handleDelete(index)}
                                sx={{ textTransform: 'none', fontSize: '15px' }}
                              >
                                X
                              </Button>
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
                              color: '#C64091',
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
                        <Button
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
                        </Button>
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
                            color: '#C64091',
                          },
                        }}
                        inputProps={{ maxLength: 15 }}
                        onKeyDown={handleAddTag}
                      />
                      <Button
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
                      </Button>
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
            </Box>
          </Box>
          <Box
            sx={{
              width: '100%',
              mx: 'auto',
              height: '20%',
              bgcolor: 'transparent',
            }}
          >
            <BottomNavigation
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                bgcolor: 'transparent',
                p: '10px',
              }}
              showLabels
            >
              <Box sx={{ display: 'flex', gap: '10px', p: 1, width: '50%' }}>
                <Button
                  sx={{
                    width: '100%',
                    height: '32px',
                    borderRadius: '10px',
                    background: '#fff',
                    color: '#636161',
                    fontSize: '14px',
                    textTransform: 'none',
                    '&:hover': {
                      background: '#EEF1F6',
                      color: '#000',
                    },
                  }}
                  variant="contained"
                  onClick={() => CancelJourney()}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  sx={{
                    width: '100%',
                    height: '32px',
                    borderRadius: '10px',
                    background: '#C64091',
                    fontSize: '14px',
                    textTransform: 'none',
                    '&:hover': {
                      background: '#C64091',
                    },
                  }}
                  variant="contained"
                >
                  Next
                </Button>
              </Box>
            </BottomNavigation>
          </Box>
        </Box>
      </form>
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

const InputsInsideText = {
  fontFamily: 'Inter, sans-serif',
  fontStyle: 'normal',
  fontWeight: 400,
  fontSize: '12px',
  lineHeight: '18px',
  color: '#C64091',
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
  color: '#C64091',
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
  color: '#C64091',
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
  color: '#C64091',
  fontFamily: 'Inter, sans-serif',
  fontStyle: 'normal',
  fontWeight: 400,
};



