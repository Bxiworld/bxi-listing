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
import EditIcon from '../../assets/Images/CommonImages/EditIcon.svg';
import { useUpdateProductQuery } from './ProductHooksQuery';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Info, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/button';
import OthercostPortion from '../MediaOffline/OthercostPortion.jsx';
import { toast } from 'sonner';
import bxitoken from '../../assets/Images/CommonImages/BXIToken.png';
import Bxitoken from '../../assets/Images/CommonImages/BXIToken.png';
import api from '../../utils/api';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../components/ui/tooltip';
import StateData from '../../utils/StateCityArray.json';
import { Stepper } from '../AddProduct/AddProductSteps';
import { buildMediaOnlineGeneralInfoPath } from '../../utils/mediaOnlineListingPaths';
import {
  resolveMediaOnlineFormProfile,
  filterFeatureDropdownRows,
  isTirupatiAirportSubcategory,
} from '../../config/mediaListingProfiles';

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

  useEffect(() => {
    if (!FetchedproductData || typeof sessionStorage === 'undefined') return;
    if (FetchedproductData.mediaJourney) {
      sessionStorage.setItem('mediaJourney', FetchedproductData.mediaJourney);
      localStorage.setItem('mediaJourney', FetchedproductData.mediaJourney);
    }
    if (FetchedproductData.mediaCategory) {
      sessionStorage.setItem('mediaCategory', FetchedproductData.mediaCategory);
      localStorage.setItem('mediaCategory', FetchedproductData.mediaCategory);
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
    watch,
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
        estimatedFleets: z
          .union([z.string().max(500), z.literal('')])
          .optional()
          .transform((v) => (v == null ? '' : String(v))),
        loopTimeSeconds: z.any().optional(),
        mediaVariation: z.object({
          location: z.string().min(1, 'Location is required'),
          unit: z.string().min(1, 'Unit is required'),
          Timeline: z.string().min(1, 'Timeline is required'),
          repetition: z.string().optional().or(z.literal('')),
          dimensionSize: z.string().optional().or(z.literal('')),
          PricePerUnit: z.coerce.string().min(1, { message: 'Price is required' })
            .refine((value) => parseFloat(value.replace(/,/g, '')) > 0, {
              message: 'Price cannot be zero',
            }),
          DiscountedPrice: z.coerce.string().min(1, { message: 'Discounted price is required' })
            .refine((value) => parseFloat(value.replace(/,/g, '')) > 0, {
              message: 'Discounted price cannot be zero',
            }),
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
      setValue(
        'medianame',
        String(data?.medianame ?? data?.ProductName ?? '').trim(),
      );

      if (data?.ProductSubCategory === '65029534eaa5251874e8c6b4') {
        setValue('mediaVariation.Timeline', 'Month');
      }

      if (data?.mediaVariation) {
        setItems(data?.ProductFeatures);
        setValue('offerningbrandat', data?.offerningbrandat);
        setValue('estimatedFleets', data?.estimatedFleets ?? '');
        setValue(
          'loopTimeSeconds',
          data?.loopTimeSeconds ?? data?.loopTimeMinutes ?? '',
        );
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

  const listingProfile = useMemo(
    () => resolveMediaOnlineFormProfile(FetchedproductData || {}),
    [FetchedproductData],
  );
  /** Flat list for Unit dropdown; native <select> avoids MUI MenuItem direct-descendant quirks. */
  const unitSelectChoices = useMemo(() => {
    if (listingProfile.unitOptions?.length) {
      return listingProfile.unitOptions;
    }
    const isRadio =
      FetchedproductData?.ProductSubCategoryName === 'Radio' ||
      String(FetchedproductData?.ProductSubCategory || '') ===
        '65029534eaa5251874e8c6c1';
    return [
      { value: 'Screen', label: 'Per Screen' },
      { value: 'Unit', label: 'Per Unit' },
      ...(isRadio ? [] : [{ value: 'Spot', label: 'Per Spot' }]),
      { value: 'Sq cm', label: 'Per Sq cm' },
      { value: 'Display', label: 'Per Display' },
      { value: 'Location', label: 'Per Location' },
      { value: 'Release', label: 'Per Release' },
      { value: 'Annoucment', label: 'Per Announcement' },
      { value: 'Video', label: 'Per Video' },
    ];
  }, [
    listingProfile.unitOptions,
    FetchedproductData?.ProductSubCategoryName,
    FetchedproductData?.ProductSubCategory,
  ]);
  const adTypeOptions = listingProfile.adTypeOptions || LocationArr;
  const minTimeslotWatch = watch('mediaVariation.minTimeslotSeconds');

  useEffect(() => {
    if (!listingProfile.syncTimeslots) return;
    if (minTimeslotWatch == null || minTimeslotWatch === '') return;
    const n = Number(minTimeslotWatch);
    if (!Number.isFinite(n)) return;
    setValue('mediaVariation.maxTimeslotSeconds', n);
    const nextMaxOptions = filterMultiples(SecondsFieldArr, n);
    /** Keep max dropdown usable: only [n] makes every option filtered out because max must be > min */
    setMaxtimeslotArr(nextMaxOptions.length > 0 ? nextMaxOptions : SecondsFieldArr.filter((v) => v > n));
  }, [minTimeslotWatch, listingProfile.syncTimeslots, setValue]);

  /** When min/max are not synced, populate max timeslot choices after load (e.g. Media → Other) */
  useEffect(() => {
    if (!FetchedproductData?.mediaVariation) return;
    const profile = resolveMediaOnlineFormProfile(FetchedproductData);
    if (profile.syncTimeslots) return;
    const minTs = Number(FetchedproductData.mediaVariation.minTimeslotSeconds);
    if (!Number.isFinite(minTs) || minTs <= 0) return;
    const filteredArray = filterMultiples(SecondsFieldArr, minTs);
    setMaxtimeslotArr(
      filteredArray.length > 0
        ? filteredArray
        : SecondsFieldArr.filter((v) => v > minTs),
    );
  }, [FetchedproductData]);

  useEffect(() => {
    if (!FetchedproductData || !isTirupatiAirportSubcategory(FetchedproductData)) return;
    setValue('mediaVariation.minOrderQuantityunit', 1);
    setValue('mediaVariation.maxOrderQuantityunit', 1);
  }, [FetchedproductData, setValue]);
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
    const submitProfile = resolveMediaOnlineFormProfile(FetchedproductData || {});
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
    const mergedMediaVariation = {
      ...getValues()?.mediaVariation,
      GST: getValues()?.mediaVariation?.GST
        ? getValues()?.mediaVariation?.GST
        : FetchedproductData?.mediaVariation?.GST,
      ...(submitProfile.syncTimeslots
        ? {
          maxTimeslotSeconds: Number(getValues()?.mediaVariation?.minTimeslotSeconds) || 0,
          minTimeslotSeconds: Number(getValues()?.mediaVariation?.minTimeslotSeconds) || 0,
        }
        : {}),
    };

    let loopTimePayload = {};
    if (listingProfile.key === 'airport' && listingProfile.loopTimeField) {
      const loopSec = Math.round(Number(String(getValues('loopTimeSeconds')).trim()));
      if (!Number.isFinite(loopSec) || loopSec < 10) {
        toast.error('Loop time must be a whole number of at least 10 seconds');
        return;
      }
      loopTimePayload = { loopTimeSeconds: loopSec, loopTimeMinutes: loopSec };
    }

    const datatobesent = {
      ...data,
      id: ProductId,
      ...loopTimePayload,
      estimatedFleets: String(getValues('estimatedFleets') ?? '').trim(),
      OtherCost: OthercostFields,
      ProductFeatures: items,
      GeographicalData: {
        region: getValues()?.GeographicalData?.region,
        state: getValues()?.GeographicalData?.state,
        city: getValues()?.GeographicalData?.city,
        landmark: getValues()?.GeographicalData?.landmark,
      },
      ProductsVariantions: [mergedMediaVariation],
      OtherInformationBuyerMustKnowOrRemarks: OtherInfoArray,
      mediaVariation: mergedMediaVariation,
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
    if (
      submitProfile.repetitionRequired &&
      (!data.mediaVariation.repetition || !String(data.mediaVariation.repetition).trim())
    ) {
      setError('mediaVariation.repetition', {
        type: 'custom',
        message: 'Please select a repetition',
      });
      toast.error('Please select a repetition');
      return;
    }
    if (
      submitProfile.dimensionRequired &&
      (!data.mediaVariation.dimensionSize || !String(data.mediaVariation.dimensionSize).trim())
    ) {
      setError('mediaVariation.dimensionSize', {
        type: 'custom',
        message: `${submitProfile.dimensionLabel} is required`,
      });
      toast.error(`${submitProfile.dimensionLabel} is required`);
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
    if (!FetchedproductData) return;
    const g = FetchedproductData?.mediaVariation?.GST;
    if (g !== null && g !== undefined && g !== 0 && g !== '') {
      setValue('mediaVariation.GST', g);
    } else {
      setValue('mediaVariation.GST', 18);
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
        <div className="stepper-layout">
          <aside className="stepper-rail">
            <Stepper currentStep={2} category="mediaonline" completedSteps={[1]} />
          </aside>
          <main className="stepper-content">
            <div className="form-section">
              <div className="mb-6 flex flex-row items-center justify-between gap-3 border-b border-[#E5E7EB] pb-4">
                <h2 className="m-0 border-0 p-0 font-[Manrope,sans-serif] text-[18px] font-semibold leading-snug text-[#111827]">
                  Media Information
                </h2>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex shrink-0 rounded-full p-1 text-[#6B7A99] transition-colors hover:bg-[#F3E8EF] hover:text-[#C64091]"
                        aria-label="About Media Information"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>
                        Media Information encompasses essential details and specifications about a specific media, including its name, description, features, pricing, and other relevant data, facilitating informed purchasing decisions for potential buyers.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <form onSubmit={updateProductTotextilestatus} className="mt-0 space-y-6">
                <div className="space-y-6 rounded-lg border border-[#E5E8EB] bg-white p-4 sm:p-6">
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
                                color: '#111827',
                                fontSize: '12px',
                                fontWeight: 400,
                                lineHeight: '20px',
                                minHeight: '47px',
                                height: 'auto',
                                border: errors['multiplexScreenName']
                                  ? '1px solid red'
                                  : '1px solid #E5E8EB',
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
                                  color: '#111827',
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
                                minWidth: 0,
                                width: '100%',
                                maxWidth: '100%',
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
                                    : '1px solid #E5E8EB',
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
                                minWidth: 0,
                                width: '100%',
                                maxWidth: '100%',
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
                                    color: '#111827',
                                    border: errors?.mediaVariation?.PricePerUnit
                                      ?.message
                                      ? '1px solid red'
                                      : '1px solid #E5E8EB',
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
                                minWidth: 0,
                                width: '100%',
                                maxWidth: '100%',
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
                                    color: '#111827',
                                    px: 1,
                                    border: errors?.mediaVariation?.DiscountedPrice
                                      ?.message
                                      ? '1px solid red'
                                      : '1px solid #E5E8EB',
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
                                minWidth: 0,
                                width: '100%',
                                maxWidth: '100%',
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
                                    : '1px solid #E5E8EB',
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
                                minWidth: 0,
                                width: '100%',
                                maxWidth: '100%',
                              }}
                            >
                              <Typography
                                sx={{ ...CommonTextStyle, fontSize: '12px' }}
                              >
                                {listingProfile.dimensionLabel}{' '}
                                {listingProfile.dimensionRequired ? (
                                  <span style={{ color: 'red' }}> *</span>
                                ) : null}
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
                                    : '1px solid #E5E8EB',
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
                                          : '1px solid #E5E8EB',
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
                                          : '1px solid #E5E8EB',
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
                                      color: '#111827',
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

                            {listingProfile.key === 'airport' && listingProfile.loopTimeField ? (
                              <Box
                                sx={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '10px',
                                  mt: 1,
                                }}
                              >
                                <Typography sx={{ ...CommonTextStyle, fontSize: '12px' }}>
                                  Loop time (seconds){' '}
                                  <span style={{ color: 'red' }}> *</span>
                                </Typography>
                                <Input
                                  disableUnderline
                                  type="number"
                                  inputProps={{ min: 10, step: 1 }}
                                  {...register('loopTimeSeconds')}
                                  sx={{
                                    ...inputStyles,
                                    width: '140px',
                                    border: '1px solid #E5E8EB',
                                    borderRadius: '10px',
                                    px: 1,
                                    height: 42,
                                  }}
                                />
                              </Box>
                            ) : null}

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
                                        : '1px solid #E5E8EB',
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
                                        : '1px solid #E5E8EB',
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
                                gap: 1,
                                mt: 0,
                                minWidth: 0,
                                width: '100%',
                                maxWidth: '100%',
                              }}
                            >
                              <Typography
                                sx={{ ...CommonTextStyle, fontSize: '12px', lineHeight: 1.25 }}
                              >
                                HSN <span style={{ color: 'red' }}> *</span>
                              </Typography>

                              <Box sx={{ position: 'relative', width: '100%' }}>
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
                                    color: '#111827',
                                    boxSizing: 'border-box',
                                    border: errors?.mediaVariation?.HSN?.message
                                      ? '1px solid red'
                                      : '1px solid #E5E8EB',
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
                                maxWidth: listingProfile.gstSelectWidthPx
                                  ? `${listingProfile.gstSelectWidthPx + 24}px`
                                  : '140px',
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
                                    width: listingProfile.gstSelectWidthPx
                                      ? `${listingProfile.gstSelectWidthPx}px`
                                      : '70px',
                                    height: '42px',
                                    background: '#FFFFFF',
                                    borderRadius: '10px',
                                    fontSize: '12px',
                                    color: '#111827',
                                    border: errors?.mediaVariation?.GST?.message
                                      ? '1px solid red'
                                      : '1px solid #E5E8EB',
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
                            className="grid grid-cols-2 gap-3 sm:gap-4"
                            sx={{ alignItems: 'flex-start' }}
                          >
                            <Box
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                minWidth: 0,
                                width: '100%',
                              }}
                            >
                              <Typography sx={{ ...CommonTextStyle, pt: '0px' }}>
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
                                  mt: 1,
                                  background: '#fff',
                                  borderRadius: '10px',
                                  padding: '0px 10px',
                                  color: '#111827',
                                  fontSize: '12px',
                                  fontWeight: 400,
                                  lineHeight: '20px',
                                  minHeight: '47px',
                                  height: 'auto',
                                  width: '100%',
                                  border: errors['medianame']
                                    ? '1px solid red'
                                    : '1px solid #E5E8EB',
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
                                    color: '#111827',
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
                                minWidth: 0,
                                width: '100%',
                              }}
                            >
                              <Typography sx={{ ...CommonTextStyle, pt: '0px' }}>
                                Offering this branding at ?{' '}
                                <span style={{ color: 'red' }}> *</span>
                              </Typography>

                              <TextField
                                focused
                                multiline
                                variant="standard"
                                placeholder={listingProfile.offeringPlaceholder}
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
                                  mt: 1,
                                  background: '#fff',
                                  borderRadius: '10px',
                                  padding: '0px 10px',
                                  color: '#111827',
                                  fontSize: '12px',
                                  minHeight: '47px',
                                  height: 'auto',
                                  width: '100%',
                                  border: errors['offerningbrandat']
                                    ? '1px solid red'
                                    : '1px solid #E5E8EB',
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
                                    color: '#111827',
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
                          </Box>

                          <Box
                            className="mt-6 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
                            sx={{ alignItems: 'start' }}
                          >
                            <Box
                              className="min-w-0 w-full"
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px',
                                mt: 0,
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
                                      fontWeight: 500,
                                      color: '#6B7A99',
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
                                  border: errors?.mediaVariation?.location
                                    ?.message
                                    ? '1px solid red'
                                    : '1px solid #E5E8EB',
                                }}

                              >
                                {adTypeOptions
                                  .slice()
                                  .sort((a, b) => a.localeCompare(b))
                                  .map((item) => (
                                    <MenuItem key={item} value={item}>
                                      {item}
                                    </MenuItem>
                                  ))}
                              </Select>
                              <Typography
                                sx={{ color: 'red', fontFamily: 'Inter, sans-serif' }}
                              >
                                {errors?.mediaVariation?.location?.message}
                              </Typography>
                            </Box>
                            <Box
                              className="min-w-0 w-full"
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px',
                                mt: 0,
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
                                    fontWeight: 500,
                                    color: '#6B7A99',
                                  }}
                                >
                                  Your Selected Unit:{' '}
                                  {FetchedproductData?.mediaVariation?.unit}
                                </span>
                              ) : null}
                              </Typography>
                              <Controller
                                name="mediaVariation.unit"
                                control={control}
                                render={({ field }) => (
                                  <Select
                                    native
                                    variant="standard"
                                    disableUnderline
                                    fullWidth
                                    value={field.value ?? ''}
                                    onChange={(e) =>
                                      field.onChange(String(e.target.value ?? ''))
                                    }
                                    onBlur={field.onBlur}
                                    name={field.name}
                                    inputRef={field.ref}
                                    inputProps={{
                                      'aria-label': 'Unit',
                                    }}
                                    sx={{
                                      ...inputStyles,
                                      border: errors?.mediaVariation?.unit?.message
                                        ? '1px solid red'
                                        : '2px solid #cecece',
                                      '& .MuiNativeSelect-select': {
                                        paddingRight: '28px',
                                      },
                                    }}
                                  >
                                    <option value="">Select unit</option>
                                    {unitSelectChoices.map((u) => (
                                      <option key={u.value} value={u.value}>
                                        {u.label}
                                      </option>
                                    ))}
                                  </Select>
                                )}
                              />
                              <Typography
                                sx={{ color: 'red', fontFamily: 'Inter, sans-serif' }}
                              >
                                {errors?.mediaVariation?.unit?.message}
                              </Typography>
                            </Box>
                            {FetchedproductData?.ProductSubCategory ===
                              '65029534eaa5251874e8c6b4' ? null : (
                              <Box
                                className="min-w-0 w-full"
                                sx={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '10px',
                                  mt: 0,
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
                                      fontWeight: 500,
                                      color: '#6B7A99',
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
                                    border: errors?.mediaVariation?.Timeline
                                      ?.message
                                      ? '1px solid red'
                                      : '1px solid #E5E8EB',
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
                                  {!listingProfile.timelineHideOneTime ? (
                                    <MenuItem
                                      value="One Time"
                                      onClick={() => {
                                        setOnlyState(!onlyState);
                                      }}
                                    >
                                      {' '}
                                      Per One Time{' '}
                                    </MenuItem>
                                  ) : null}
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
                              className="min-w-0 w-full"
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px',
                                mt: 0,
                              }}
                            >
                              <Typography
                                sx={{ ...CommonTextStyle, fontSize: '12px' }}
                              >
                                Repetition{' '}
                                {listingProfile.repetitionRequired ? (
                                  <span style={{ color: 'red' }}> *</span>
                                ) : null}
                              </Typography>
                              <Input
                                disableUnderline
                                placeholder="28 Per week"
                                {...register('mediaVariation.repetition')}
                                sx={{
                                  ...inputStyles,
                                  mt: 1,
                                  border: errors?.mediaVariation?.repetition
                                    ?.message
                                    ? '1px solid red'
                                    : '2px solid #cecece',
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
                            className="mt-6 grid w-full grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
                            sx={{ alignItems: 'flex-start' }}
                          >
                            <Box
                              className="min-w-0 w-full"
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 1,
                                mt: 0,
                              }}
                            >
                              <Typography
                                sx={{ ...CommonTextStyle, fontSize: '12px', lineHeight: 1.25 }}
                              >
                                {listingProfile.dimensionLabel}{' '}
                                {listingProfile.dimensionRequired ? (
                                  <span style={{ color: 'red' }}> *</span>
                                ) : null}
                              </Typography>
                              <Input
                                placeholder="2048 X 998"
                                disableUnderline
                                {...register('mediaVariation.dimensionSize')}
                                sx={{
                                  ...inputStyles,
                                  width: '100%',
                                  border: errors?.mediaVariation?.dimensionSize
                                    ?.message
                                    ? '1px solid red'
                                    : '1px solid #E5E8EB',
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
                                gap: 1,
                                mt: 0,
                                minWidth: 0,
                                width: '100%',
                                maxWidth: '100%',
                              }}
                            >
                              <Typography
                                sx={{ ...CommonTextStyle, fontSize: '12px', lineHeight: 1.25 }}
                              >
                                MRP <span style={{ color: 'red' }}> *</span>( Excl
                                of GST )
                              </Typography>

                              <Box sx={{ position: 'relative', width: '100%' }}>
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
                                    width: '100%',
                                    height: '42px',
                                    background: '#FFFFFF',
                                    borderRadius: '10px',
                                    fontSize: '12px',
                                    px: 1,
                                    pr: 3.5,
                                    boxSizing: 'border-box',
                                    color: '#111827',
                                    border: errors?.mediaVariation?.PricePerUnit
                                      ?.message
                                      ? '1px solid red'
                                      : '1px solid #E5E8EB',
                                  }}
                                />

                                <img
                                  src={Bxitoken}
                                  style={{
                                    position: 'absolute',
                                    width: '20px',
                                    right: '10px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
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
                                gap: 1,
                                mt: 0,
                                minWidth: 0,
                                width: '100%',
                                maxWidth: '100%',
                              }}
                            >
                              <Typography
                                sx={{ ...CommonTextStyle, fontSize: '12px', lineHeight: 1.25 }}
                              >
                                Discounted MRP{' '}
                                <span style={{ color: 'red' }}> *</span>
                              </Typography>
                              <Box sx={{ position: 'relative', width: '100%' }}>
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
                                    width: '100%',
                                    height: '42px',
                                    background: '#FFFFFF',
                                    borderRadius: '10px',
                                    fontSize: '12px',
                                    color: '#111827',
                                    px: 1,
                                    pr: 3.5,
                                    boxSizing: 'border-box',
                                    border: errors?.mediaVariation?.DiscountedPrice
                                      ?.message
                                      ? '1px solid red'
                                      : '1px solid #E5E8EB',
                                  }}
                                />
                                <img
                                  src={Bxitoken}
                                  style={{
                                    position: 'absolute',
                                    width: '20px',
                                    right: '10px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
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
                                gap: 1,
                                mt: 0,
                                minWidth: 0,
                                width: '100%',
                                maxWidth: '100%',
                              }}
                            >
                              <Typography
                                sx={{ ...CommonTextStyle, fontSize: '12px', lineHeight: 1.25 }}
                              >
                                HSN <span style={{ color: 'red' }}> *</span>
                              </Typography>

                              <Box sx={{ position: 'relative', width: '100%' }}>
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
                                    color: '#111827',
                                    boxSizing: 'border-box',
                                    border: errors?.mediaVariation?.HSN?.message
                                      ? '1px solid red'
                                      : '1px solid #E5E8EB',
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
                                gap: 1,
                                mt: 0,
                                minWidth: 0,
                                width: '100%',
                                maxWidth: '100%',
                              }}
                            >
                              <Typography
                                sx={{ ...CommonTextStyle, fontSize: '12px', lineHeight: 1.25 }}
                              >
                                GST <span style={{ color: 'red' }}> *</span>
                              </Typography>
                              {FetchedproductData?.mediaVariation?.GST && <Typography
                                sx={{
                                  ...CommonTextStyle,
                                  fontSize: '12px',
                                  fontWeight: 400,
                                  border: errors?.mediaVariation?.GST?.message,
                                }}
                              >
                                  <span
                                    style={{
                                      fontWeight: 500,
                                      color: '#6B7A99',
                                    }}
                                  >
                                    Your Selected GST:{' '}
                                    {FetchedproductData?.mediaVariation?.GST}
                                  </span>
                                
                              </Typography>}

                              <Box sx={{ position: 'relative', width: '100%', maxWidth: 120 }}>
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
                                    width: '100%',
                                    height: '42px',
                                    background: '#FFFFFF',
                                    borderRadius: '10px',
                                    fontSize: '12px',
                                    color: '#111827',
                                    boxSizing: 'border-box',
                                    border: errors?.mediaVariation?.GST?.message
                                      ? '1px solid red'
                                      : '1px solid #E5E8EB',
                                  }}
                                  {...register('mediaVariation.GST')}
                                  defaultValue={FetchedproductData?.mediaVariation?.GST || 18}
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
                                    right: 75,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: '#979797',
                                    fontSize: '15px',
                                    pointerEvents: 'none',
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
                            className="mt-6 grid w-full grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
                            sx={{ alignItems: 'flex-start' }}
                          >
                            <Box
                              className="min-w-0 w-full"
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 1,
                                mt: 0,
                                minWidth: 0,
                              }}
                            >
                              <Typography
                                sx={{
                                  ...CommonTextStyle,
                                  fontSize: '12px',
                                  lineHeight: 1.25,
                                }}
                              >
                                Min Order QTY Unit{' '}
                                <span style={{ color: 'red' }}>*</span>
                              </Typography>
                              <Box
                                sx={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 0.5,
                                  width: '100%',
                                  minWidth: 0,
                                }}
                              >
                                <Box
                                  sx={{
                                    display: 'flex',
                                    width: '100%',
                                    minWidth: 0,
                                    alignItems: 'stretch',
                                    background: '#fff',
                                    borderRadius: '10px',
                                    overflow: 'hidden',
                                    border: errors?.mediaVariation
                                      ?.minOrderQuantityunit?.message
                                      ? '1px solid red'
                                      : '1px solid #E5E8EB',
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
                                      flex: '1 1 0',
                                      minWidth: 0,
                                      border: 'none',
                                      borderRadius: 0,
                                      height: '42px',
                                      fontSize: '12px',
                                      px: 1,
                                    }}
                                  />
                                  <Input
                                    disableUnderline
                                    disabled
                                    inputProps={{ readOnly: true }}
                                    value={String(watch('mediaVariation.unit') ?? '')}
                                    sx={{
                                      ...inputStyles,
                                      flex: '1 1 0',
                                      minWidth: 0,
                                      border: 'none',
                                      borderRadius: 0,
                                      borderLeft: '1px solid #E5E8EB',
                                      height: '42px',
                                      fontSize: '12px',
                                      px: 1,
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
                            <Box
                              className="min-w-0 w-full"
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 1,
                                mt: 0,
                                minWidth: 0,
                              }}
                            >
                              <Typography
                                sx={{
                                  ...CommonTextStyle,
                                  fontSize: '12px',
                                  lineHeight: 1.25,
                                }}
                              >
                                Max Order QTY Unit{' '}
                                <span style={{ color: 'red' }}>*</span>
                              </Typography>

                              <Box
                                sx={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 0.5,
                                  width: '100%',
                                  minWidth: 0,
                                }}
                              >
                                <Box
                                  sx={{
                                    display: 'flex',
                                    width: '100%',
                                    minWidth: 0,
                                    alignItems: 'stretch',
                                    background: '#fff',
                                    borderRadius: '10px',
                                    overflow: 'hidden',
                                    border: errors?.mediaVariation
                                      ?.maxOrderQuantityunit?.message
                                      ? '1px solid red'
                                      : '1px solid #E5E8EB',
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
                                      flex: '1 1 0',
                                      minWidth: 0,
                                      border: 'none',
                                      borderRadius: 0,
                                      height: '42px',
                                      fontSize: '12px',
                                      px: 1,
                                    }}
                                  />
                                  <Input
                                    disableUnderline
                                    disabled
                                    inputProps={{ readOnly: true }}
                                    value={String(watch('mediaVariation.unit') ?? '')}
                                    sx={{
                                      ...inputStyles,
                                      flex: '1 1 0',
                                      minWidth: 0,
                                      border: 'none',
                                      borderRadius: 0,
                                      borderLeft: '1px solid #E5E8EB',
                                      height: '42px',
                                      fontSize: '12px',
                                      px: 1,
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
                            <Box
                              className="min-w-0 w-full"
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 1,
                                mt: 0,
                                minWidth: 0,
                              }}
                            >
                              <Typography
                                sx={{
                                  ...CommonTextStyle,
                                  fontSize: '12px',
                                  lineHeight: 1.25,
                                }}
                              >
                                Min Order QTY Timeline{' '}
                                <span style={{ color: 'red' }}>*</span>
                              </Typography>

                              <Box
                                sx={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 0.5,
                                  width: '100%',
                                  minWidth: 0,
                                }}
                              >
                                <Box
                                  sx={{
                                    display: 'flex',
                                    width: '100%',
                                    minWidth: 0,
                                    alignItems: 'stretch',
                                    background: '#fff',
                                    borderRadius: '10px',
                                    overflow: 'hidden',
                                    border: errors?.mediaVariation
                                      ?.minOrderQuantitytimeline?.message
                                      ? '1px solid red'
                                      : '1px solid #E5E8EB',
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
                                      flex: '1 1 0',
                                      minWidth: 0,
                                      border: 'none',
                                      borderRadius: 0,
                                      height: '42px',
                                      fontSize: '12px',
                                      px: 1,
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
                                      flex: '1 1 0',
                                      minWidth: 0,
                                      border: 'none',
                                      borderRadius: 0,
                                      borderLeft: '1px solid #E5E8EB',
                                      height: '42px',
                                      fontSize: '12px',
                                      px: 1,
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
                            <Box
                              className="min-w-0 w-full"
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 1,
                                mt: 0,
                                minWidth: 0,
                              }}
                            >
                              <Typography
                                sx={{
                                  ...CommonTextStyle,
                                  fontSize: '12px',
                                  lineHeight: 1.25,
                                }}
                              >
                                Max Order QTY Timeline{' '}
                                <span style={{ color: 'red' }}>*</span>
                              </Typography>

                              <Box
                                sx={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 0.5,
                                  width: '100%',
                                  minWidth: 0,
                                }}
                              >
                                <Box
                                  sx={{
                                    display: 'flex',
                                    width: '100%',
                                    minWidth: 0,
                                    alignItems: 'stretch',
                                    background: '#fff',
                                    borderRadius: '10px',
                                    overflow: 'hidden',
                                    border: errors?.mediaVariation
                                      ?.maxOrderQuantitytimeline?.message
                                      ? '1px solid red'
                                      : '1px solid #E5E8EB',
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
                                      flex: '1 1 0',
                                      minWidth: 0,
                                      border: 'none',
                                      borderRadius: 0,
                                      height: '42px',
                                      fontSize: '12px',
                                      px: 1,
                                    }}
                                    placeholder={'Timeline'}
                                  />
                                  <Input
                                    disableUnderline
                                    {...register('mediaVariation.Timeline')}
                                    disabled
                                    sx={{
                                      ...inputStyles,
                                      flex: '1 1 0',
                                      minWidth: 0,
                                      border: 'none',
                                      borderRadius: 0,
                                      borderLeft: '1px solid #E5E8EB',
                                      height: '42px',
                                      fontSize: '12px',
                                      px: 1,
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
                            <Box
                              className="min-w-0 w-full"
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 1,
                                mt: 0,
                                minWidth: 0,
                              }}
                            >
                              <Typography
                                sx={{
                                  ...CommonTextStyle,
                                  fontSize: '12px',
                                  lineHeight: 1.25,
                                }}
                              >
                                Min Order Timeslot{' '}
                                <span style={{ color: 'red' }}>*</span>
                              </Typography>

                              <Box
                                sx={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 0.5,
                                  width: '100%',
                                  minWidth: 0,
                                }}
                              >
                                <Box
                                  sx={{
                                    display: 'flex',
                                    width: '100%',
                                    minWidth: 0,
                                    alignItems: 'stretch',
                                    gap: 1,
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
                                      flex: '1 1 0',
                                      minWidth: 0,
                                      width: '100%',
                                      maxWidth: '100%',
                                      border: errors?.mediaVariation
                                        ?.minTimeslotSeconds?.message
                                        ? '1px solid red'
                                        : '1px solid #E5E8EB',
                                    }}
                                  >
                                    {SecondsFieldArr?.map((item, idx) => {
                                      return (
                                        <MenuItem
                                          key={item ?? idx}
                                          sx={{
                                            border: '1px white solid',
                                          }}
                                          onClick={() => {
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
                                      flex: '0 0 76px',
                                      width: '76px',
                                      minWidth: '76px',
                                      maxWidth: '76px',
                                      paddingY: '0.5px',
                                      fontSize: '12px',
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
                                    color: '#6B7A99',
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
                            <Box
                              className="min-w-0 w-full"
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 1,
                                mt: 0,
                                minWidth: 0,
                              }}
                            >
                              <Typography
                                sx={{
                                  ...CommonTextStyle,
                                  fontSize: '12px',
                                  lineHeight: 1.25,
                                }}
                              >
                                Max Order Timeslot{' '}
                                <span style={{ color: 'red' }}>*</span>
                              </Typography>
                              <Box
                                sx={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 0.5,
                                  width: '100%',
                                  minWidth: 0,
                                }}
                              >
                                <Box
                                  sx={{
                                    display: 'flex',
                                    width: '100%',
                                    minWidth: 0,
                                    alignItems: 'stretch',
                                    gap: 1,
                                  }}
                                >
                                  <Select
                                    disableUnderline
                                    {...register(
                                      'mediaVariation.maxTimeslotSeconds',
                                    )}
                                    sx={{
                                      ...inputStyles,
                                      flex: '1 1 0',
                                      minWidth: 0,
                                      width: '100%',
                                      maxWidth: '100%',
                                      border: errors?.mediaVariation
                                        ?.maxTimeslotSeconds?.message
                                        ? '1px solid red'
                                        : '1px solid #E5E8EB',
                                    }}
                                  >

                                    {SecondsFieldArr?.map((item, idx) => {
                                      return (
                                        <MenuItem
                                          key={item ?? idx}
                                          sx={{
                                            border: '1px white solid',
                                          }}
                                          onClick={() => {
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
                                      flex: '0 0 76px',
                                      width: '76px',
                                      minWidth: '76px',
                                      maxWidth: '76px',
                                      paddingY: '0.5px',
                                      fontSize: '12px',
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
                                    color: '#6B7A99',
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

                            {listingProfile.key === 'airport' && listingProfile.loopTimeField ? (
                              <Box
                                className="min-w-0 w-full"
                                sx={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 1,
                                  mt: 1,
                                  minWidth: 0,
                                }}
                              >
                                <Typography
                                  sx={{
                                    ...CommonTextStyle,
                                    fontSize: '12px',
                                    lineHeight: 1.25,
                                  }}
                                >
                                  Loop time (seconds){' '}
                                  <span style={{ color: 'red' }}>*</span>
                                </Typography>
                                <Input
                                  disableUnderline
                                  type="number"
                                  inputProps={{ min: 10, step: 1 }}
                                  {...register('loopTimeSeconds')}
                                  sx={{
                                    ...inputStyles,
                                    maxWidth: 160,
                                    border: '1px solid #E5E8EB',
                                    borderRadius: '10px',
                                    px: 1,
                                    height: 42,
                                  }}
                                />
                              </Box>
                            ) : null}
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
                        className="mt-3 grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
                        sx={{ alignItems: 'flex-start' }}
                      >
                        <Box
                          className="min-w-0 w-full"
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1,
                            mt: 0,
                            minWidth: 0,
                          }}
                        >
                          <Typography
                            sx={{
                              ...CommonTextStyle,
                              fontSize: '12px',
                              lineHeight: 1.25,
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
                              width: '100%',
                              maxWidth: '100%',
                              boxSizing: 'border-box',
                              border: errors?.GeographicalData?.region?.message
                                ? '1px solid red'
                                : '1px solid #E5E8EB',
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
                          className="min-w-0 w-full"
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1,
                            mt: 0,
                            minWidth: 0,
                            width: '100%',
                            maxWidth: '100%',
                          }}
                        >
                          <Typography
                            sx={{ ...CommonTextStyle, fontSize: '12px', lineHeight: 1.25 }}
                          >
                            State {IsDisabled === 'PAN India' ? ' (Optional)' : <span style={{ color: 'red' }}> *</span>}
                          </Typography>

                          <Select
                            disableUnderline
                            disabled={IsDisabled === 'PAN India'}
                            {...register('GeographicalData.state')}
                            sx={{
                              ...inputStyles,
                              width: '100%',
                              maxWidth: '100%',
                              boxSizing: 'border-box',
                              border: errors?.GeographicalData?.state?.message && IsDisabled !== 'PAN India'
                                ? '1px solid red'
                                : '1px solid #E5E8EB',
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
                          className="min-w-0 w-full"
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1,
                            mt: 0,
                            minWidth: 0,
                            width: '100%',
                            maxWidth: '100%',
                          }}
                        >
                          <Typography
                            sx={{ ...CommonTextStyle, fontSize: '12px', lineHeight: 1.25 }}
                          >
                            City {IsDisabled === 'PAN India' ? ' (Optional)' : <span style={{ color: 'red' }}> *</span>}
                          </Typography>

                          <Select
                            disableUnderline
                            disabled={IsDisabled === 'PAN India' ? true : false}
                            {...register('GeographicalData.city')}
                            sx={{
                              ...inputStyles,
                              width: '100%',
                              maxWidth: '100%',
                              boxSizing: 'border-box',
                              border: errors?.GeographicalData?.city?.message
                                ? '1px solid red'
                                : '1px solid #E5E8EB',
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
                          className="min-w-0 w-full"
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1,
                            mt: 0,
                            minWidth: 0,
                            width: '100%',
                            maxWidth: '100%',
                          }}
                        >
                          <Typography
                            sx={{ ...CommonTextStyle, fontSize: '12px', lineHeight: 1.25 }}
                          >
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
                              ...inputStyles,
                              width: '100%',
                              maxWidth: '100%',
                              height: '40px',
                              fontSize: '12px',
                              boxSizing: 'border-box',
                              border: errors?.GeographicalData?.landmark?.message &&
                                IsDisabled !== 'PAN India'
                                ? '1px solid red'
                                : '2px solid #cecece',
                            }}
                          />
                          <Typography sx={{ color: 'red', fontFamily: 'Inter, sans-serif' }}>
                            {errors?.GeographicalData?.landmark?.message}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ py: 2 }}>
                        <Box className="rounded-lg border border-[#E5E8EB] bg-white p-4 sm:p-6 space-y-4">
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
                                  boxSizing: 'border-box',
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
                                  height: '42px',
                                  borderRadius: '10px',
                                  fontSize: '12px',
                                  color: '#111827',
                                  border: '1px solid #E5E8EB',
                                }}
                                key={traits}
                              >
                                {filterFeatureDropdownRows(
                                  MediaOnlineFeaturesData,
                                  listingProfile.featureAllowlist,
                                  items.map((i) => i.name),
                                  listingProfile.featureBlocklist,
                                )?.map((el, idx) => {
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
                                  sx={{ color: 'red', fontFamily: 'Inter, sans-serif', fontSize: '12px' }}
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
                                  color: '#111827',
                                  background: '#FFFFFF',
                                  border: '1px solid #E5E8EB',
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
                                        color: '#111827',
                                      }}
                                    ></Typography>
                                  ),
                                  style: {
                                    fontFamily: 'Inter, sans-serif',
                                    fontSize: '12px',
                                    padding: '10px',
                                    color: '#111827',
                                  },
                                }}
                              />
                              {items?.length > 0 && items.length < 5 && (
                                <Typography
                                  sx={{ color: 'red', fontFamily: 'Inter, sans-serif', mt: 1 , fontSize: '12px' }}
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

                            {listingProfile.key === 'airport' ? (
                              <Box sx={{ width: '100%', mb: 2 }}>
                                <Typography sx={{ ...CommonTextStyle, pb: 1 }}>
                                  Estimated fleets
                                </Typography>
                                <TextField
                                  fullWidth
                                  variant="standard"
                                  placeholder="e.g. daily footfall or fleet size (shown on product preview)"
                                  {...register('estimatedFleets')}
                                  sx={{
                                    ...TextFieldStyle,
                                    color: '#111827',
                                    background: '#FFFFFF',
                                    border: '1px solid #E5E8EB',
                                  }}
                                  InputProps={{ disableUnderline: true }}
                                />
                              </Box>
                            ) : null}

                            <Typography
                              component="div"
                              sx={{
                                color: '#6B7A99',
                                fontFamily: 'Inter, sans-serif',
                                fontSize: '14px',
                                fontWeight: 600,
                                mt: 1,
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
                      </Box>

                      <Box sx={{ py: 2 }}>
                        <Box className="rounded-lg border border-[#E5E8EB] bg-white p-4 sm:p-6 space-y-4">
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 2,
                              position: 'relative',
                              width: '100%',
                            }}
                          >
                            <Box
                              sx={{
                                width: '100%',
                                borderRadius: '10px',
                              }}
                            >
                              <Typography sx={{ ...CommonTextStyle, lineHeight: 1.25 }}>
                                Other information buyer must know/ Remarks{' '}
                              </Typography>
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'stretch',
                                  gap: 1,
                                  mt: 1,
                                  background: '#fff',
                                  borderRadius: '10px',
                                  border: '1px solid #E5E8EB',
                                  overflow: 'hidden',
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
                                      color: '#111827',
                                    },
                                  }}
                                  InputLabelProps={{
                                    style: {
                                      color: 'red',
                                    },
                                  }}
                                  sx={{
                                    width: '100%',
                                    flex: 1,
                                    minWidth: 0,
                                    height: '42px',
                                    background: '#FFFFFF',
                                    borderRadius: 0,
                                  }}
                                  onKeyDown={otherenter}
                                />
                                <MuiButton
                                  variant="outlined"
                                  sx={{
                                    flexShrink: 0,
                                    borderColor: '#c64091',
                                    color: '#6B7A99',
                                    textTransform: 'none',
                                    fontSize: '12px',
                                    alignSelf: 'stretch',
                                    borderRadius: 0,
                                    borderTop: 'none',
                                    borderRight: 'none',
                                    borderBottom: 'none',
                                    px: 2,
                                    '&:hover': {
                                      borderColor: '#c64091',
                                      background: 'rgba(198, 64, 145, 0.06)',
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
                                  mt: 1.5,
                                  width: '100%',
                                  gap: '20px',
                                  border: '1px solid #E5E8EB',
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
                                    color: '#111827',
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
                        </Box>
                      </Box>

                      <Box sx={{ py: 2 }}>
                        <Box className="rounded-lg border border-[#E5E8EB] bg-white p-4 sm:p-6 space-y-4">
                          <Box sx={{ display: 'grid', gap: 1.5 }}>
                            <Typography sx={{ ...TypographyStyle, lineHeight: 1.35 }}>
                              Tags (Keywords that can improve your seach visibility on
                              marketplace)<span style={{ color: 'red' }}> *</span>
                            </Typography>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'stretch',
                                gap: 1,
                                background: '#fff',
                                borderRadius: '10px',
                                border: '1px solid #E5E8EB',
                                overflow: 'hidden',
                              }}
                            >
                              <TextField
                                placeholder="Add Tags"
                                inputRef={tagInputRef}
                                sx={{
                                  width: '100%',
                                  flex: 1,
                                  minWidth: 0,
                                  background: '#fff',
                                  borderRadius: 0,
                                  height: '41px',
                                }}
                                variant="standard"
                                InputProps={{
                                  disableUnderline: true,
                                  style: {
                                    fontSize: '14px',
                                    marginTop: '5px',
                                    marginLeft: '1%',
                                    color: '#111827',
                                  },
                                }}
                                inputProps={{ maxLength: 15 }}
                                onKeyDown={handleAddTag}
                              />
                              <MuiButton
                                variant="outlined"
                                sx={{
                                  flexShrink: 0,
                                  borderColor: '#c64091',
                                  color: '#6B7A99',
                                  textTransform: 'none',
                                  fontSize: '12px',
                                  alignSelf: 'stretch',
                                  borderRadius: 0,
                                  borderTop: 'none',
                                  borderRight: 'none',
                                  borderBottom: 'none',
                                  px: 2,
                                  '&:hover': {
                                    borderColor: '#c64091',
                                    background: 'rgba(198, 64, 145, 0.06)',
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
                        </Box>
                      </Box>
                    </Stack>
                  </Box>
                </div>

                <div className="flex justify-between pt-2 gap-2 flex-wrap">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-[#E5E8EB] text-[#111827] hover:bg-[#F9FAFB]"
                      onClick={() => navigate(buildMediaOnlineGeneralInfoPath(id, FetchedproductData))}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-[#E5E8EB] text-[#111827] hover:bg-[#F9FAFB]"
                      onClick={CancelJourney}
                    >
                      Cancel
                    </Button>
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="bg-[#C64091] hover:bg-[#A03375]">
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

export default MediaProductInfo;

/** Field labels — neutral like Multiplex / shadcn `Label` (not magenta). */
const CommonTextStyle = {
  fontFamily: 'Inter, sans-serif',
  fontStyle: 'normal',
  fontWeight: 600,
  fontSize: '14px',
  lineHeight: '21px',
  color: '#374151',
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
  color: '#374151',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
};

/** Shell styles for full-width TextField rows (matches multiplex / listing form look). */
const lablechange = {
  fontFamily: 'Inter, sans-serif',
  background: '#FFFFFF',
  borderRadius: '10px',
  border: '1px solid #E5E8EB',
  padding: '8px 12px',
  minHeight: '47px',
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  '&:hover': {
    borderColor: '#C64091',
  },
  '&.Mui-focused': {
    borderColor: '#C64091',
    boxShadow: '0 0 0 1px rgba(198, 64, 145, 0.12)',
  },
};
const inputStyles = {
  width: '100%',
  minWidth: 0,
  maxWidth: '100%',
  height: '42px',
  background: '#FFFFFF',
  borderRadius: '10px',
  padding: '0px 10px',
  fontSize: '14px',
  color: '#111827',
  border: '1px solid #E5E8EB',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s ease',
  '&:hover': {
    borderColor: '#C64091',
  },
};
const TypographyStyle = {
  fontFamily: 'Inter, sans-serif',
  fontStyle: 'normal',
  fontWeight: 400,
  fontSize: '14px',
  color: '#6B7A99',
};

const MenuItems = {
  fontSize: '14px',
  color: '#111827',
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
      color: '#C64091',
    },
  },
  '&:hover': {
    backgroundColor: '#f5f5f5',
  },
};


