import {
  Box,
  Grid,
  Checkbox,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  Input,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  tableCellClasses,
  TableBody,
  Chip,
} from '@mui/material';
import { Stack } from '@mui/system';
import Dialog from '@mui/material/Dialog';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import EditIcon from '../../assets/Images/CommonImages/EditIcon.svg';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { Button as UiButton } from '../../components/ui/button';
import { useUpdateProductQuery } from './ProductHooksQuery';
import { useNavigate, useParams } from 'react-router-dom';
import React, { useEffect, useRef, useState } from 'react';
import api from '../../utils/api';
import {
  supportingDocsToCheckboxState,
  checkboxStateToSupportingArray,
  emptySupportingCheckboxState,
  SUPPORTING_DOC_KEYS_FORM_ORDER,
  SUPPORTING_DOC_LABELS,
} from '../../utils/supportingBuyerDocs';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { styled } from '@mui/material/styles';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateRangePicker } from 'mui-daterange-picker';
import RemoveIcon from '../../assets/Images/CommonImages/RemoveIcon.svg';
import addItemCartIcon from '../../assets/CartPage/addItemIcon.svg';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import defaultIcon from '../../assets/CartPage/defaultCheckBoxIcon.svg';
import bxitoken from '../../assets/Images/CommonImages/BXIToken.png';
import OthercostPortion from '../MediaOffline/OthercostPortion.jsx';

// import { useEffectOnce } from "react-use";
import dayjs from 'dayjs';

import ToolTip from '../../components/ToolTip';
import { Stepper } from '../AddProduct/AddProductSteps';

const CustomPickersDay = styled(PickersDay, {
  shouldForwardProp: prop =>
    prop !== 'dayIsBetween' && prop !== 'isFirstDay' && prop !== 'isLastDay',
})(({ theme, dayIsBetween, isFirstDay, isLastDay }) => ({
  ...(dayIsBetween && {
    borderRadius: 0,
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
    '&:hover, &:focus': {
      backgroundColor: theme.palette.primary.dark,
    },
  }),
  ...(isFirstDay && {
    borderTopLeftRadius: '50%',
    borderBottomLeftRadius: '50%',
  }),
  ...(isLastDay && {
    borderTopRightRadius: '50%',
    borderBottomRightRadius: '50%',
  }),
}));

function Day(props) {
  const { day, selectedDay, TimelineData, ...other } = props;

  if (selectedDay == null) {
    return <PickersDay day={day} {...other} />;
  }

  const start = selectedDay;
  const end = start.add(ReturnDaysFromTimeline(TimelineData), 'day');
  // BoughtDatesArray.push(start);
  const dayIsBetween = day.isBetween(start, end, null, '[]');
  const isFirstDay = day.isSame(start, 'day');
  const isLastDay = day.isSame(end, 'day');

  return (
    <CustomPickersDay
      {...other}
      day={day}
      sx={dayIsBetween ? { px: 2.5, mx: 0 } : {}}
      dayIsBetween={dayIsBetween}
      isFirstDay={isFirstDay}
      isLastDay={isLastDay}
    />
  );
}
function ReturnDaysFromTimeline(timeline) {
  if (timeline === 'Day') {
    return 0;
  } else if (timeline === 'Week') {
    return 6;
  } else if (timeline === 'Month') {
    return 29;
  } else if (timeline === 'Year') {
    return 364;
  }
}

function checkIfDateExists(dateArr, newStartDate, newEndDate) {
  const newStart = dayjs(newStartDate);
  const newEnd = dayjs(newEndDate);

  for (let i = 0; i < dateArr.length; i++) {
    const { startDate, endDate } = dateArr[i];
    const start = dayjs(startDate);
    const end = dayjs(endDate);

    if (
      newStart.isSame(start, 'day') ||
      newStart.isBetween(start, end, null, '[]') ||
      newEnd.isSame(end, 'day') ||
      newEnd.isBetween(start, end, null, '[]')
    ) {
      return true;
    }
  }
  return false;
}

const SecondsFieldArr = [
  5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95,
  100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150, 155, 160, 165, 170,
  175, 180,
];

export default function MediaMultiplexTechInfo() {
  const ProductId = useParams().id;
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const [dateArr, setDateArr] = useState([]);
  const [fetchproductData, setfetchProductData] = useState();
  const [BXISpace, setBXISpace] = useState(false);
  const [content, setContent] = useState('checkbox');
  const [storeUploadLink, setStoreUploadLink] = useState();
  const [tags, setTags] = useState([]);
  const [FetchedproductData, setFetchedpProuctData] = useState();
  const [MaxtimeslotArr, setMaxtimeslotArr] = useState([]);
  const [OthercostEditId, SetOthercostEditId] = useState(null);
  // const [OthercostFields, setOthercostFields] = useState([]);
  const [items, setItems] = useState([]);
  const [OtherInfoArray, setOtherInfoArray] = useState([]);
  const [onlyState, setOnlyState] = useState(false);
  const [MediaOnlineFeaturesData, setMediaOnlineFeaturesData] = useState([]);
  const [traits, setTraits] = useState([]);
  const [description, setDescription] = useState('');
  const otherInputRef = useRef(null);
  const [name, setName] = useState('');
  const [storeHSN, setStoreHSN] = useState('');
  const tagInputRef = useRef(null);

  const [storeMediaAllData, setStoreMediaAllData] = useState({
    offerningbrandat: '',
    minOrderTimeslot: '',
    maxOrderTimeslot: '',
    supportingDocs: emptySupportingCheckboxState(),
    repetition: '',
    dimensionSize: '',
    minOrderQtyTimeline: '',
    maxOrderQtyTimeline: '',
    UploadLink: '',
    HSN: '',
  });

  const handleInputChange = e => {
    const { name, value } = e.target;
    setStoreMediaAllData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = e => {
    const { value, checked } = e.target;
    setStoreMediaAllData(prev => {
      const updatedSupportingDocs = {
        ...prev.supportingDocs,
        [value]: checked,
      };
      return { ...prev, supportingDocs: updatedSupportingDocs };
    });
  };

  const otherenter = e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const others = e.target.value.trim();
      if (others !== '') {
        if (!OtherInfoArray?.includes(others)) {
          setOtherInfoArray([...OtherInfoArray, others]);
        }
        otherInputRef.current.value = '';
      }
    }
  };

  const OtherInformationSubmit = e => {
    const others = otherInputRef.current.value.trim();
    if (others !== '') {
      if (!OtherInfoArray?.includes(others)) {
        setOtherInfoArray([...OtherInfoArray, others]);
      }
      otherInputRef.current.value = '';
    }
  };

  const handleAddTag = e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const currentTag = e.target.value.trim();
      if (currentTag !== '' && !tags?.includes(currentTag)) {
        setTags([...tags, currentTag]);
        tagInputRef.current.value = '';
      }
    }
  };

  const handleAddButtonClick = () => {
    const currentTag = tagInputRef.current.value.trim();
    if (currentTag !== '' && !tags?.includes(currentTag)) {
      setTags([...tags, currentTag]);
      tagInputRef.current.value = '';
    }
  };

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    getValues,
    reset,
    control,
    formState: { errors, isValid },
  } = useForm({
    Values: {
      WhatSupportingYouWouldGiveToBuyer:
        fetchproductData?.whatSupportingYouWouldGiveToBuyer,
      OtherInformationBuyerMustKnowOrRemarks:
        fetchproductData?.otherInformationBuyerMustKnowOrRemarks,
      ProductFeatures: fetchproductData?.productFeatures,
      ProductQuantity: fetchproductData?.productQuantity,
      ProductUploadStatus: fetchproductData?.productUploadStatus,
      ProductCategoryName: fetchproductData?.productCategoryName,
      ProductSubCategory: fetchproductData?.productSubCategory,
      repetition: fetchproductData?.mediaVariation?.repetition,
      dimensionSize: fetchproductData?.mediaVariation?.dimensionSize,
      minOrderQuantityunit:
        fetchproductData?.mediaVariation?.minOrderQuantityunit,
      maxOrderQuantityunit:
        fetchproductData?.mediaVariation?.maxOrderQuantityunit,
      minTimeslotSeconds: fetchproductData?.mediaVariation?.minTimeslotSeconds,
      maxTimeslotSeconds: fetchproductData?.mediaVariation?.maxTimeslotSeconds,
      minOrderQuantitytimeline:
        fetchproductData?.mediaVariation?.minOrderQuantitytimeline,
      maxOrderQuantitytimeline:
        fetchproductData?.mediaVariation?.maxOrderQuantitytimeline,
      Timeline: fetchproductData?.mediaVariation?.Timeline,
    },
  });

  const fetchMediaOnlineFeatures = async () => {
    await api
      .get('mediaonlinesinfeature/Get_media_onlinesinglefea')
      .then(response => {
        const sortedData = response.data
          .slice()
          .sort((a, b) =>
            a.MediaonlineFeaturesingle.localeCompare(b.MediaonlineFeaturesingle)
          );
        setMediaOnlineFeaturesData(sortedData);
      })
      .catch(error => { });
  };

  const FetchProduct = async () => {
    await api
      .get(`product/get_product_byId/${ProductId}`)
      .then(res => {
        const data = res.data;
        setfetchProductData(data);
        setFetchedpProuctData(data);

        setStoreMediaAllData(prev => ({
          ...prev,
          offerningbrandat: data?.offerningbrandat ?? '',
          minOrderTimeslot:
            data?.minOrderTimeslot ??
            data?.mediaVariation?.minTimeslotSeconds ??
            '',
          maxOrderTimeslot:
            data?.maxOrderTimeslot ??
            data?.mediaVariation?.maxTimeslotSeconds ??
            '',
          repetition: data?.repetition ?? '',
          dimensionSize: data?.dimensionSize ?? '',
          minOrderQtyTimeline:
            data?.minOrderQtyTimeline ??
            data?.mediaVariation?.minOrderQuantitytimeline ??
            '',
          maxOrderQtyTimeline:
            data?.maxOrderQtyTimeline ??
            data?.mediaVariation?.maxOrderQuantitytimeline ??
            '',
          HSN:
            data?.mediaVariation?.HSN ??
            data?.ProductsVariantions?.[0]?.HSN ??
            '',
          supportingDocs: supportingDocsToCheckboxState(
            data?.WhatSupportingYouWouldGiveToBuyer,
          ),
          UploadLink: data?.UploadLink ?? '',
        }));

        setValue(
          'mediaVariation.minTimeslotSeconds',
          data?.minOrderTimeslot ??
          data?.mediaVariation?.minTimeslotSeconds ??
          ''
        );
        setValue(
          'mediaVariation.maxTimeslotSeconds',
          data?.maxOrderTimeslot ??
          data?.mediaVariation?.maxTimeslotSeconds ??
          ''
        );
        setValue(
          'mediaVariation.minOrderQuantitytimeline',
          data?.minOrderQtyTimeline ??
          data?.mediaVariation?.minOrderQuantitytimeline ??
          ''
        );
        setValue(
          'mediaVariation.maxOrderQuantitytimeline',
          data?.maxOrderQtyTimeline ??
          data?.mediaVariation?.maxOrderQuantitytimeline ??
          ''
        );
        setValue('mediaVariation.repetition', data?.repetition ?? '');
        setValue('mediaVariation.dimensionSize', data?.dimensionSize ?? '');
        setValue(
          'mediaVariation.HSN',
          data?.mediaVariation?.HSN ?? data?.ProductsVariantions?.[0]?.HSN ?? ''
        );
        setValue(
          'mediaVariation.GST',
          data?.mediaVariation?.GST ??
          data?.ProductsVariantions?.[0]?.GST ??
          '18'
        );
        setValue(
          'mediaVariation.Timeline',
          data?.mediaVariation?.Timeline ??
          data?.ProductsVariantions?.[0]?.Timeline ??
          'Week'
        );

        setTags(Array.isArray(data.tags) ? data.tags : []);
        setItems(
          Array.isArray(data.ProductFeatures) ? data.ProductFeatures : []
        );

        setOtherInfoArray(
          Array.isArray(data.OtherInformationBuyerMustKnowOrRemarks)
            ? data.OtherInformationBuyerMustKnowOrRemarks
            : typeof data.OtherInformationBuyerMustKnowOrRemarks === 'string'
              ? [data.OtherInformationBuyerMustKnowOrRemarks]
              : []
        );

        if (Array.isArray(data.OtherCost)) {
          OthercostRemove();
          data.OtherCost.forEach(row => OthercostAppend(row));
        }

        const minTimeslot =
          data?.minOrderTimeslot ??
          data?.mediaVariation?.minTimeslotSeconds ??
          5;
        if (minTimeslot) {
          const filteredArray = filterMultiples(SecondsFieldArr, minTimeslot);
          setMaxtimeslotArr(
            filteredArray.length > 0 ? filteredArray : SecondsFieldArr
          );
        }

        setStoreUploadLink(data?.UploadLink ?? '');
        setDateArr(data?.calender || []);
        setValue('BXISpace', data?.BXISpace ?? false);
        setBXISpace(data?.BXISpace ?? false);
      })
      .catch(err => {
        console.error('Error fetching product:', err);
      });
  };

  useEffect(() => {
    FetchProduct();
  }, []);

  const handleItemAdd = e => {
    if (items.length >= 20) {
      return toast.error('Features cannot be more than 20');
    }
    if (description === '') {
      toast.error('Please fill the proper features and description');
    } else if (description.length > 75) {
      return toast.error('feature discription less than 75 letters');
    } else if (name === '') {
      return toast.error('Please fill the feature name');
    } else if (name !== 'Other' && items.some(res => res.name === name)) {
      setName('');
      return toast.error('Please fill the unique key feature');
    } else if (items.length >= 20) {
      return toast.error('Features cannot be more than 20');
    } else {
      const newItem = { name, description };
      if (name.trim() || description.trim() !== '') {
        setItems([...items, newItem]);
      }
    }
    setDescription('');
  };

  const handleDelete = index => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleDeleteTag = tagToDelete => {
    setTags(prevTags => {
      const updatedTags = prevTags.filter(tag => tag !== tagToDelete);
      setValue('tags', updatedTags);
      return updatedTags;
    });
  };

  const {
    fields: OthercostFields,
    append: OthercostAppend,
    remove: OthercostRemove,
    update: OthercostUpdate,
  } = useFieldArray({
    control,
    name: 'Othercost',
  });

  const updateProductTechinfostatus = handleSubmit(async data => {
    const datatobesent = {
      ...data,
      id: ProductId,
      ProductQuantity: 0,
      WhatSupportingYouWouldGiveToBuyer: checkboxStateToSupportingArray(
        storeMediaAllData?.supportingDocs,
      ),
      OtherCost: OthercostFields,
      ProductFeatures: items,
      GST: 18,
      ProductsVariantions: [getValues()?.mediaVariation],
      OtherInformationBuyerMustKnowOrRemarks: OtherInfoArray,
      mediaVariation: {
        ...data?.mediaVariation,
        minOrderQuantityunit: 1,
        maxOrderQuantityunit: 1,
        minOrderQuantitytimeline: storeMediaAllData?.minOrderQtyTimeline || 1,
        maxOrderQuantitytimeline: storeMediaAllData?.maxOrderQtyTimeline || 1,
        minTimeslotSeconds: storeMediaAllData?.minOrderTimeslot || 1,
        maxTimeslotSeconds: storeMediaAllData?.maxOrderTimeslot || 1,
        GST: '18',
        Timeline: 'Week',
        HSN: storeMediaAllData?.HSN,
      },
      ProductUploadStatus: 'technicalinformation',
      ListingType: 'Media',
      tags: tags,
      minOrderQuantityunit: 0,
      maxOrderQuantityunit: 0,
      repetition: storeMediaAllData?.repetition,
      dimensionSize: storeMediaAllData?.dimensionSize,
      minOrderQtyTimeline: storeMediaAllData?.minOrderQtyTimeline,
      maxOrderQtyTimeline: storeMediaAllData?.maxOrderQtyTimeline,
      minOrderTimeslot: storeMediaAllData?.minOrderTimeslot,
      maxOrderTimeslot: storeMediaAllData?.maxOrderTimeslot,
      offerningbrandat: storeMediaAllData?.offerningbrandat,
    };

    // Supporting Documents validation
    if (
      checkboxStateToSupportingArray(storeMediaAllData?.supportingDocs || {}).length ===
      0
    ) {
      toast.error('Select at least one Supporting Document');
      return;
    }

    // Repetition validation (only if product is in specific subcategory)
    if (
      !storeMediaAllData?.repetition &&
      FetchedproductData?.ProductSubCategory === '643cda0c53068696706e3951'
    ) {
      setError('mediaVariation.repetition', {
        type: 'custom',
        message: 'Please select a repetition',
      });
      toast.error('Please select a repetition');
      return;
    }

    const hsnStr = String(storeMediaAllData?.HSN ?? '').trim();
    if (!hsnStr) {
      toast.error('Please enter HSN');
      return;
    }
    if (!/^\d{4}$|^\d{6}$|^\d{8}$/.test(hsnStr) || /^0+$/.test(hsnStr)) {
      toast.error('HSN must be 4, 6, or 8 digits and cannot be all zeros');
      return;
    }

    // Min/Max Quantity validation
    const minQty = Number(data?.mediaVariation?.minOrderQuantityunit);
    const maxQty = Number(data?.mediaVariation?.maxOrderQuantityunit);
    if (minQty > maxQty) {
      setError('mediaVariation.maxOrderQuantityunit', {
        type: 'custom',
        message: 'Max Order Quantity cannot be less than Min Order Quantity',
      });
      toast.error('Max Order Quantity cannot be less than Min Order Quantity');
    }

    // Min/Max Timeline validation
    const minTimeline = Number(storeMediaAllData?.minOrderQtyTimeline);
    const maxTimeline = Number(storeMediaAllData?.maxOrderQtyTimeline);
    if (minTimeline > maxTimeline) {
      toast.error('Max Order Timeline cannot be less than Min Order Timeline');
    }

    // Min/Max Timeslot validation
    const minSlot = Number(storeMediaAllData?.minOrderTimeslot);
    const maxSlot = Number(storeMediaAllData?.maxOrderTimeslot);
    if (minSlot > maxSlot) {
      toast.error('Max Timeslot cannot be less than Min Timeslot');
    }

    // Product Features validation
    if (items?.length < 5) {
      return toast.error('Please select at least 5 Product Features');
    }
    if (items?.length > 20) {
      return toast.error('Please select at most 20 Product Features');
    }

    // Tags validation
    if (!tags?.length && !FetchedproductData?.tags?.length) {
      return toast.error('Please add at least one tag');
    }
    // Numeric fields check

    if (
      datatobesent?.maxOrderQtyTimeline === '' ||
      datatobesent?.maxOrderTimeslot === '' ||
      datatobesent?.minOrderTimeslot === '' ||
      datatobesent?.minOrderQtyTimeline === ''
    ) {
      return toast.error('Please fill Timeslots and Timelines');
    }

    if (
      !data.mediaVariation.repetition &&
      !FetchedproductData?.ProductSubCategory === '643cda0c53068696706e3951'
    ) {
      setError('mediaVariation.repetition', {
        type: 'custom',
        message: 'Please select a repetition',
      });
      toast.error('Please select a repetition');
      return;
    }

    if (
      Number(data?.mediaVariation?.minOrderQuantityunit) >
      Number(data?.mediaVariation?.maxOrderQuantityunit)
    ) {
      setError('mediaVariation.maxOrderQuantityunit', {
        type: 'custom',
        message: 'Max Order Quantity can not be less than Min Order Quantity',
      });
      toast.error('Max Order Quantity cannot be less than Min Order Quantity');
    }

    if (
      Number(data?.mediaVariation?.minOrderQuantitytimeline) >
      Number(data?.mediaVariation?.maxOrderQuantitytimeline)
    ) {
      setError('mediaVariation.maxOrderQuantitytimeline', {
        type: 'custom',
        message: 'Max Order Quantity can not be less than Min Order Quantity',
      });
      toast.error('Max Order Quantity cannot be less than Min Order Quantity');
    }
    if (items?.length < 5) {
      return toast.error('Please Select Best Features ( Min 5 )');
    } else if (items.length > 20) {
      return toast.error('Please Select Best Features ( max 20 )');
    } else if (tags?.length === 0 && FetchedproductData?.tags?.length === 0) {
      return toast.error('Please add atleast one Tag');
    } else {
      await api
        .post('product/product_mutation_multimedia', {
          ProductId: datatobesent?.ProductId,
          ...datatobesent,
          dimensionSize: datatobesent?.dimensionSize,
          offerningbrandat: datatobesent?.offerningbrandat,
          ProductUploadStatus: 'technicalinformation',
        })
        .then(response => {
          if (
            response.status === 200 ||
            response.data?.mediaVariation?.PricePerUnit
          ) {
            toast.success('Product updated successfully');
            const id = ProductId;
            setTimeout(() => {
              navigate(`/mediaonline/multiplexgolive/${id}`);
            }, 3000);
          } else {
            toast.error('Product not updated');
          }
        })
        .catch(error => {
          toast.error(`Error in updating product ${error}`);
        });
    }
  });

  function filterMultiples(array, multiple) {
    return array.filter(function (value) {
      return value >= multiple;
    });
  }

  useEffect(() => {
    fetchMediaOnlineFeatures();
  }, []);

  const CancelJourney = () => {
    const WindowConfirmation = window.confirm(
      'Are you sure you want to cancel the product?'
    );
    if (WindowConfirmation) {
      navigate('/sellerhub');
    }
  };

  const OthercostFieldsarray = [
    'Applicable On',
    'Other cost ',
    'HSN',
    'GST',
    'Reason Of Cost',
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-8">
      <div className="form-container">
        <div className="stepper-layout">
          <aside className="stepper-rail">
            <Stepper currentStep={3} category="mediaonline" completedSteps={[1, 2]} />
          </aside>
          <main className="stepper-content">
            <div className="form-section">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="form-section-title !mb-0">Technical information</h2>
                <ToolTip
                  info={
                    "Technical information covers specs, supporting documents, timeslots, timelines, and features buyers need before your multiplex listing goes live."
                  }
                />
              </div>
              <p className="text-sm text-[#6B7A99] mt-2 mb-6 max-w-2xl">
                Add operational details, documents, key features, and search tags. Fields marked with * are required.
              </p>
              <form onSubmit={updateProductTechinfostatus} className="space-y-6">
                <div className="rounded-xl border border-[#E5E8EB] bg-white p-5 sm:p-6 shadow-sm">
                  <Stack
                    sx={{
                      overflow: 'visible',
                      p: 0,
                      gap: 0,
                    }}
                  >
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
                            height: 'auto',
                            minHeight: 'auto',
                            position: 'relative',
                            display: 'flex',
                            flexWrap: 'wrap',
                            justifyContent: 'space-between',
                            flexDirection: 'row',
                            gap: '20px',
                            width: '100%',
                          }}
                        >
                          <Box>
                            <Typography sx={{ ...CommonTextStyle }}>
                              Offering this Branding at ?{' '}
                              <span style={{ color: 'red' }}> *</span>
                            </Typography>
                            <Select
                              disableUnderline
                              value={storeMediaAllData.offerningbrandat}
                              defaultValue={'BMP'}
                              name='offerningbrandat'
                              onChange={handleInputChange}
                              sx={{
                                ...inputStyles,
                                width: '100%',
                                marginTop: '10px',
                              }}
                            >
                              <MenuItem value='BMP'>BMP</MenuItem>
                              <MenuItem value='Interval'>Interval</MenuItem>
                              <MenuItem value='Both'>Both</MenuItem>
                            </Select>
                          </Box>
                          <Box>
                            <Typography sx={{ ...CommonTextStyle }}>
                              Repetition
                            </Typography>
                            <Input
                              disableUnderline
                              placeholder='28 Per week'
                              name='repetition'
                              value={storeMediaAllData?.repetition}
                              onChange={handleInputChange}
                              sx={{
                                ...inputStyles,
                                mt: 1,
                                width: '140px',
                                border: errors?.mediaVariation?.repetition
                                  ?.message
                                  ? '1px solid red'
                                  : '1px solid #E3E3E3',
                              }}
                              onKeyDown={e => {
                                if (
                                  e.key === ' ' &&
                                  e.target.selectionStart === 0
                                ) {
                                  e.preventDefault();
                                }
                              }}
                            />
                          </Box>
                          <Box sx={{ mt: 1 }}>
                            <Typography
                              sx={{
                                ...CommonTextStyle,
                              
                              }}
                            >
                              HSN <span style={{ color: 'red' }}> *</span>
                            </Typography>
                            <Input
                              disableUnderline
                              placeholder='123456'
                              name='HSN'
                              value={storeMediaAllData.HSN}
                              onChange={handleInputChange}
                              sx={{
                                ...inputStyles,
                                width: '140px',
                                border: errors?.mediaVariation?.HSN?.message
                                  ? '1px solid red'
                                  : '1px solid #E3E3E3',
                              }}
                              onKeyDown={e => {
                                if (e.key === ' ' && e.target.selectionStart === 0) {
                                  e.preventDefault();
                                }
                              }}
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
                            width: '100%',
                          }}
                        >
                          <Box
                            className="rounded-xl border border-[#E5E8EB] bg-[#fff] sm:w-[49%] w-full"
                            sx={{ width: { xs: '100%', sm: '49%' } }}
                          >
                            <Box
                              sx={{
                                width: '100%',
                                bgcolor: 'transparent',
                                textAlign: 'center',
                                mt: 1,
                                px: 1,
                              }}
                            >
                              <Typography
                                sx={{ ...CommonTextStyle, fontWeight: 600, color: '#111827' }}
                              >
                                Timeslot
                              </Typography>
                            </Box>

                            <Box
                              sx={{
                                display: 'flex',
                                flexDirection: 'row',
                                gap: '10px',
                                mt: 1,
                                justifyContent: 'space-between',
                                p: 1,
                              }}
                            >
                              <Box
                                sx={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '10px',
                                  mt: 1,
                                  width: '100%',
                                  maxWidth:"240px"
                                }}
                              >
                                <Typography
                                  sx={{ ...CommonTextStyle, fontSize: '12px' }}
                                >
                                  Min <span style={{ color: 'red' }}> *</span>
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
                                        name='minOrderTimeslot'
                                        value={storeMediaAllData.minOrderTimeslot}
                                        onChange={handleInputChange}
                                        sx={{
                                          ...inputStyles,
                                          width: '80px',
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
                                                const filteredArray =
                                                  filterMultiples(
                                                    SecondsFieldArr,
                                                    item
                                                  );
                                                setMaxtimeslotArr(
                                                  filteredArray.length > 0
                                                    ? filteredArray
                                                    : FetchedproductData
                                                      ?.mediaVariation
                                                      ?.minTimeslotSeconds
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
                                          width: '120px',
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
                                  width: '100%',
                                  maxWidth:"240px"
                                }}
                              >
                                <Typography
                                  sx={{ ...CommonTextStyle, fontSize: '12px' }}
                                >
                                  Max <span style={{ color: 'red' }}> *</span>
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
                                        name='maxOrderTimeslot'
                                        value={storeMediaAllData.maxOrderTimeslot}
                                        onChange={handleInputChange}
                                        sx={{
                                          ...inputStyles,
                                          width: '80px',
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
                                                ?.minTimeslotSeconds
                                            ) > Number(item)
                                          )
                                            return null;

                                          return (
                                            <MenuItem value={item}>
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
                                          width: '120px',
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

                          <Box
                            className="rounded-xl border border-[#E5E8EB] bg-[#FFFFFF] sm:w-[49%] w-full"
                            sx={{ width: { xs: '100%', sm: '49%' } }}
                          >
                            <Box
                              sx={{
                                width: '100%',
                                bgcolor: 'transparent',
                                textAlign: 'center',
                                mt: 1,
                                px: 1,
                              }}
                            >
                              <Typography
                                sx={{ ...CommonTextStyle, fontWeight: 600, color: '#111827' }}
                              >
                                Order QTY timeline
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                display: 'flex',
                                flexDirection: 'row',
                                gap: '10px',
                                mt: 1,
                                justifyContent: 'space-between',
                                p: 1,
                              }}
                            >
                              <Box
                                sx={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '10px',
                                  mt: 1,
                                  width: '100%',
                                  maxWidth:"240px"
                                }}
                              >
                                <Typography
                                  sx={{ ...CommonTextStyle, fontSize: '12px' }}
                                >
                                  Min <span style={{ color: 'red' }}> *</span>
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
                                        gap: '5px',
                                      }}
                                    >
                                      <Input
                                        disableUnderline
                                        name='minOrderQtyTimeline'
                                        value={
                                          storeMediaAllData.minOrderQtyTimeline
                                        }
                                        onChange={handleInputChange}
                                        sx={{
                                          ...inputStyles,
                                          width: '80px',
                                          padding: '5px',
                                        }}
                                        onKeyDown={e => {
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
                                          width: '120px',
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
                                  width: '100%',
                                  maxWidth:"240px"
                                }}
                              >
                                <Typography
                                  sx={{ ...CommonTextStyle, fontSize: '12px' }}
                                >
                                  Max <span style={{ color: 'red' }}> *</span>
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
                                        gap: '5px',
                                      }}
                                    >
                                      <Input
                                        disableUnderline
                                        name='maxOrderQtyTimeline'
                                        value={
                                          storeMediaAllData.maxOrderQtyTimeline
                                        }
                                        onChange={handleInputChange}
                                        onKeyDown={e => {
                                          if (
                                            e.key === ' ' &&
                                            e.target.selectionStart === 0
                                          ) {
                                            e.preventDefault();
                                          }
                                        }}
                                        sx={{
                                          ...inputStyles,
                                          width: '80px',
                                          padding: '05px',
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
                                          width: '120px',
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
                          </Box>
                        </Box>
                      </Box>


                      <Box sx={{ display: 'grid', gap: '5px', py: '5px', mt: 2 }}>
                        <Typography sx={{ ...CommonTextStyle }}>
                          What supporting document would you give to the Buyer?{' '}
                          <span style={{ color: 'red' }}> *</span>
                        </Typography>
                        <Grid container>
                          <Grid
                            xl={12}
                            lg={12}
                            md={12}
                            sm={12}
                            xs={12}
                            sx={{
                              display: 'flex',
                              flexDirection: 'row',
                              gap: '10px',
                              flexWrap: 'wrap ',
                            }}
                          >
                            {SUPPORTING_DOC_KEYS_FORM_ORDER.map((docKey) => (
                              <Box
                                key={docKey}
                                sx={{ display: 'flex', gap: '10px' }}
                              >
                                <input
                                  type='checkbox'
                                  value={docKey}
                                  checked={
                                    !!storeMediaAllData?.supportingDocs?.[docKey]
                                  }
                                  onChange={handleCheckboxChange}
                                />
                                <Typography sx={{ ...CommonTextStyle }}>
                                  {SUPPORTING_DOC_LABELS[docKey]}
                                </Typography>
                              </Box>
                            ))}
                          </Grid>
                        </Grid>
                      </Box>

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
                            size='small'
                            aria-label='a dense table'
                          >
                            {OthercostFields?.map((item, idx) => {
                              return (
                                <>
                                  <TableHead>
                                    <TableRow>
                                      {OthercostFieldsarray?.map(data => {
                                        if (
                                          data === 'id' ||
                                          data === 'listPeriod'
                                        )
                                          return null;
                                        return (
                                          <TableCell
                                            align='left'
                                            key={data}
                                            sx={{
                                              ...tableDataStyle,
                                              padding: '10px',
                                              textTransform: 'capitalize',
                                              whiteSpace: 'nowrap',
                                            }}
                                            component='th'
                                            scope='row'
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
                                      <TableCell
                                        align='center'
                                        sx={TableCellStyle}
                                      >
                                        {item.AdCostApplicableOn}
                                      </TableCell>
                                      <TableCell
                                        align='left'
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
                                            alt='bxitoken'
                                          />
                                        ) : (
                                          item.currencyType
                                        )}
                                      </TableCell>
                                      <TableCell align='left' sx={TableCellStyle}>
                                        {item.AdCostHSN}
                                      </TableCell>
                                      <TableCell align='left' sx={TableCellStyle}>
                                        {item.AdCostGST} %
                                      </TableCell>
                                      <TableCell align='left' sx={TableCellStyle}>
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
                                          <Box component='img' src={EditIcon} />
                                        </Button>
                                        <Button
                                          onClick={() => {
                                            OthercostRemove(idx);
                                          }}
                                        >
                                          <Box component='img' src={RemoveIcon} />
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
                          py: '20px',
                        }}
                      >
                        <Box
                          sx={{
                            fontFamily: 'Inter, sans-serif',
                            color: '#6B7A99',
                          }}
                        >
                          <Typography
                            sx={{ fontSize: '16px', fontWeight: '500' }}
                          >
                            Select the best features that describe your
                            brand/media
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
                              onChange={e => setName(e.target.value)}
                              sx={{
                                width: '100%',
                                border: '1px solid rgb(51, 51, 51)',
                                '.MuiOutlinedInput-notchedOutline': { border: 0 },
                                '&.MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline':
                                {
                                  border: 1,
                                },
                                '&.MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline':
                                {
                                  border: 1,
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
                                sx={{ color: 'red', fontFamily: 'Inter, sans-serif', fontSize: '12px' }}
                              >
                                Select {5 - items?.length} more feature
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
                              variant='standard'
                              placeholder='Eg. Larger then Life Ads Across the Large Screens'
                              value={description}
                              onKeyDown={e => {
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
                                border: '1px solid rgb(51, 51, 51)',
                                height: '100%',
                                color: '#c64091',
                                background: '#FFFFFF',
                              }}
                              onChange={e => setDescription(e.target.value)}
                              minRows={3}
                              InputProps={{
                                disableUnderline: true,
                                endAdornment: (
                                  <Typography
                                    variant='body1'
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
                                sx={{
                                  color: 'red',
                                  fontFamily: 'Inter, sans-serif',
                                  mt: 1,
                                }}
                              >
                                Enter {5 - items?.length} more feature description
                              </Typography>
                            )}
                          </Box>
                          <Button
                            variant='contained'
                            onClick={handleItemAdd}
                            sx={ProceedToAddButtonStyle}
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

                                  <Button
                                    onClick={() => handleDelete(index)}
                                    sx={{
                                      textTransform: 'none',
                                      fontSize: '15px',
                                    }}
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
                              placeholder='Eg. Technical Charges to be Paid on Extra on actual'
                              inputRef={otherInputRef}
                              id='standard-basic'
                              variant='standard'
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
                                border: '1px solid rgb(51, 51, 51)',
                              }}
                              onKeyDown={otherenter}
                            />
                            <Button
                              variant='outlined'
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

                      {OtherInfoArray.map(items => {
                        return (
                          <Box
                            key={items}
                            sx={{
                              justifyContent: 'space-between',
                              display: 'flex',
                              mt: '20px',
                              width: 'auto',
                              gap: '20px',
                              border: '1px solid #E3E3E3',
                              borderRadius: '10px',
                            }}
                          >
                            <Typography
                              id='standard-basic'
                              variant='standard'
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
                                background: 'transparent',
                                padding: '10px',
                                color: '#c64091',
                                width: '600px',
                                wordWrap: 'break-word',
                              }}
                            >
                              {items}
                            </Typography>
                            <Box
                              sx={{
                                marginRight: '10px',
                              }}
                              component='img'
                              src={RemoveIcon}
                              onClick={() => {
                                const temp = OtherInfoArray.filter(
                                  item => item !== items
                                );
                                setOtherInfoArray(temp);
                              }}
                            />
                          </Box>
                        );
                      })}
                      <Box sx={{ display: 'grid', gap: '10px', mt: 2 }}>
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
                            placeholder='Add Tags'
                            inputRef={tagInputRef}
                            sx={{
                              width: '100%',
                              background: '#fff',
                              borderRadius: '10px',
                              height: '41px',
                              border: '1px solid rgb(51, 51, 51)',
                            }}
                            variant='standard'
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
                          <Button
                            variant='outlined'
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

                        <Box sx={deleteTagStyle}>
                          {tags.map(tag => (
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
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
                  <UiButton
                    type="button"
                    variant="outline"
                    className="border-[#E5E8EB] text-[#374151]"
                    onClick={() =>
                      navigate(`/mediaonline/mediaonlinemultiplexproductinfo/${ProductId}`)
                    }
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </UiButton>
                  <div className="flex flex-wrap gap-2 sm:gap-3 justify-end w-full sm:w-auto">
                    <UiButton
                      type="button"
                      variant="ghost"
                      className="text-[#6B7A99]"
                      onClick={() => CancelJourney()}
                    >
                      Exit to hub
                    </UiButton>
                    <UiButton
                      type="submit"
                      className="bg-[#C64091] hover:bg-[#a9367a] text-white"
                    >
                      Continue to go live
                    </UiButton>
                  </div>
                </div>
              </form>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

const CommonTextStyle = {
  fontFamily: 'Inter, sans-serif',
  fontStyle: 'normal',
  fontWeight: 500,
  fontSize: '13px',
  lineHeight: '20px',
  color: '#374151',
};

const lablechange = {
  fontFamily: 'Inter, sans-serif',
  color: '#6B7A99',
  fontSize: '16px',
  display: 'grid',
  textAlign: 'left',
  fontWeight: 'bold',
  paddingLeft: '10px',
  // borderBottom: "1px solid #E8E8E8",
  '&:focus': {
    border: '1px solid #E8E8E8',
  },
};

const ErrorStyle = {
  color: 'red',
};
const tableHeader = {
  fontFamily: 'Inter, sans-serif',
  fontStyle: 'normal',
  fontWeight: 600,
  fontSize: {
    xl: '1.5rem',
    lg: '1.5rem',
    md: '1.5rem',
    sm: '1.4rem',
    xs: '1rem',
  },
  color: '#6B7A99',
  textAlign: {
    x: 'start',
    lg: 'start',
    md: 'start',
    sm: 'start',
    xs: 'center',
  },
};

const inputStyles = {
  width: '110px',
  height: '42px',
  background: '#FFFFFF',
  borderRadius: '8px',
  padding: '0px 10px',
  fontSize: '13px',
  color: '#374151',
  border: '1px solid #E5E8EB',
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
const FilterTitle = {
  fontFamily: 'Inter, sans-serif',
  fontStyle: 'normal',
  fontWeight: 500,
  fontSize: '18px',
  lineHeight: '28px',

  color: '#2E2E2E',
};

const ProceedToAddButtonStyle = {
  width: '100%',
  height: '42px',
  background: '#C64091',
  borderRadius: '8px',
  fontFamily: 'Inter, sans-serif',
  fontStyle: 'normal',
  fontWeight: 600,
  fontSize: '14px',
  lineHeight: '21px',
  color: '#FFFFFF',
  textTransform: 'none',
  boxShadow: 'none',
  '&:hover': {
    background: '#a9367a',
    boxShadow: 'none',
  },
  my: 3,
};


