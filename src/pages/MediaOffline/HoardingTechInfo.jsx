import {
    Box,
    Grid,
    Checkbox,
    Typography,
    TextField,
    Button,
    BottomNavigation,
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
import EditIcon from '../../assets/Images/CommonImages/EditIcon.svg';
import { toast } from 'sonner';
import { useNavigate, useParams } from 'react-router-dom';
import React, { useEffect, useRef, useState } from 'react';
import api from '../../utils/api';
import { useFieldArray, useForm } from 'react-hook-form';
import RemoveIcon from '../../assets/Images/CommonImages/RemoveIcon.svg';
import OthercostPortion from './OthercostPortion.jsx';
import ToolTip from '../../components/ToolTip';
import { Stepper } from '../AddProduct/AddProductSteps';
import bxitoken from '../../assets/Images/CommonImages/BXIToken.png';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button as UiButton } from '../../components/ui/button';


// Constants
const TIMELINE_OPTIONS = [10, 20, 30];
const LOCATION_OPTIONS = [
    'All Locations', 'Arrival', 'Café Wall Branding', 'Coffee Tables',
    'Concession Counter', 'Conveyor Belt', 'Departure', 'Entry Gate',
    'Exit Gate', 'Handles of the Bus', 'Highway', 'Lobby', 'Mall Atrium',
    'Near Parking Area', 'Out Side Airport', 'Parking Area', 'Tent Cards',
    'Waiting Area', 'main road', 'others'
];


export default function HoardingTechInfo() {
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
    const tagInputRef = useRef(null);

    const [storeMediaAllData, setStoreMediaAllData] = useState({
        mediaName: '',
        adType: '',
        offeringbrandat: '',
        minOrderTimeslot: '',
        maxOrderTimeslot: '',
        supportingDocs: {
            inspectionPass: false,
            LogReport: false,
            Videos: false,
            Pictures: false,
            ExhibitionCertificate: false,
            Other: false,
        },
        repetition: '',
        dimensionSize: '',
        minOrderQtyTimeline: '',
        maxOrderQtyTimeline: '',
        UploadLink: '',
        HSN: '',
        GST: '',
        timeline: '',
    });

    const docs = [
        'Inspection pass',
        'Pictures',
        'Log Report',
        'Exhibition Certificate',
        'Videos',
        'Other',
    ];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setStoreMediaAllData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (e) => {
        const { value, checked } = e.target;
        setStoreMediaAllData(prev => {
            const updatedSupportingDocs = {
                ...prev.supportingDocs,
                [value]: checked,
            };
            return { ...prev, supportingDocs: updatedSupportingDocs };
        });
    };


    const [checkBoxes, setCheckBoxes] = useState({
        inspectionPass: false,
        LogReport: false,
        Videos: false,
        Pictures: false,
        ExhibitionCertificate: false,
        Other: false,
    });

    const otherenter = (e) => {
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

    const OtherInformationSubmit = (e) => {
        const others = otherInputRef.current.value.trim();
        if (others !== '') {
            if (!OtherInfoArray?.includes(others)) {
                setOtherInfoArray([...OtherInfoArray, others]);
            }
            otherInputRef.current.value = '';
        }
    };

    const handleAddTag = (e) => {
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
            // UploadLink: fetchproductData?.uploadLink,
            WhatSupportingYouWouldGiveToBuyer:
                fetchproductData?.whatSupportingYouWouldGiveToBuyer,
            OtherInformationBuyerMustKnowOrRemarks: fetchproductData?.otherInformationBuyerMustKnowOrRemarks,
            ProductFeatures: fetchproductData?.productFeatures,
            ProductQuantity: fetchproductData?.productQuantity,
            ProductUploadStatus: fetchproductData?.productUploadStatus,
            ProductCategoryName: fetchproductData?.productCategoryName,
            ProductSubCategory: fetchproductData?.productSubCategory,
            repetition: fetchproductData?.mediaVariation?.repetition,
            dimensionSize: fetchproductData?.mediaVariation?.dimensionSize,
            minOrderQuantityunit: fetchproductData?.mediaVariation?.minOrderQuantityunit,
            maxOrderQuantityunit: fetchproductData?.mediaVariation?.maxOrderQuantityunit,
            minTimeslotSeconds: fetchproductData?.mediaVariation?.minTimeslotSeconds,
            maxTimeslotSeconds: fetchproductData?.mediaVariation?.maxTimeslotSeconds,
            minOrderQuantitytimeline: fetchproductData?.mediaVariation?.minOrderQuantitytimeline,
            maxOrderQuantitytimeline: fetchproductData?.mediaVariation?.maxOrderQuantitytimeline,
            Timeline: fetchproductData?.mediaVariation?.Timeline,
            // InterStateGST: fetchproductData?.InterStateGST,
        },
    });

    const fetchMediaOnlineFeatures = async () => {
        await api
            .get('mediaonlinesinfeature/Get_media_onlinesinglefea')
            .then((response) => {
                const sortedData = response.data
                    .slice()
                    .sort((a, b) =>
                        a.MediaonlineFeaturesingle.localeCompare(b.MediaonlineFeaturesingle),
                    );
                setMediaOnlineFeaturesData(sortedData);
            })
            .catch((error) => {
                console.error('Error fetching media online features:', error);
             });
    };

    // ...rest of FetchProduct
    const FetchProduct = async () => {
        await api
            .get(`product/get_product_byId/${ProductId}`)
            .then((res) => {
                const data = res.data;
                setfetchProductData(data);
                setFetchedpProuctData(data); // backup if needed

                // Update storeMediaAllData for all essential fields and dropdowns
                setStoreMediaAllData(prev => ({
                    ...prev,
                    mediaName: data?.mediaName ?? "",
                    offeringbrandat: data?.offeringbrandat ?? "",
                    minOrderTimeslot: data.mediaVariation?.minOrderTimeslot ?? "",
                    maxOrderTimeslot: data.mediaVariation?.maxOrderTimeslot ?? "",
                    repetition: data.mediaVariation?.repetition ?? "",
                    dimensionSize: data.mediaVariation?.dimensionSize ?? "",
                    minOrderQtyTimeline: data.mediaVariation?.minOrderQtyTimeline ?? "",
                    maxOrderQtyTimeline: data.mediaVariation?.maxOrderQtyTimeline ?? "",
                    HSN: data.mediaVariation?.hsn ?? "",
                    // For GST, timeline, adType: these are in react-hook-form, so use setValue (below)
                    supportingDocs: data.WhatSupportingYouWouldGiveToBuyer || {},
                    UploadLink: data.UploadLink ?? "",
                    timeline: data.mediaVariation?.timeline ?? "",
                    HSN: data.mediaVariation?.HSN ?? "",
                    adType: data.mediaVariation?.adType ?? data?.adType ?? "",
                    GST: data.mediaVariation?.GST ?? data?.GST ?? "",

                }));

                setValue('mediaVariation.timeline', data.mediaVariation?.timeline ?? "");
                setValue('mediaVariation.GST', data.mediaVariation?.GST ?? "");
                setValue('mediaVariation.adType', data.mediaVariation?.adType ?? "");
                setValue('UploadLink', data.UploadLink ?? "");

                setTags(Array.isArray(data.tags) ? data.tags : []);
                setItems(Array.isArray(data.ProductFeatures) ? data.ProductFeatures : []);
                setOtherInfoArray(Array.isArray(data.OtherInformationBuyerMustKnowOrRemarks)
                    ? data.OtherInformationBuyerMustKnowOrRemarks
                    : typeof data.OtherInformationBuyerMustKnowOrRemarks === 'string'
                        ? [data.OtherInformationBuyerMustKnowOrRemarks]
                        : []);

                // For Othercost table:
                if (Array.isArray(data.OtherCost)) {
                    // react-hook-form way to set field array:
                    OthercostRemove(); // Remove all
                    data.OtherCost.forEach(row => OthercostAppend(row)); // Add existing ones
                }
            })
            .catch((err) => { /* ... */ });
    };


    useEffect(() => {
        FetchProduct();
    }, []);

    const handleItemAdd = (e) => {
        if (items.length >= 20) {
            return toast.error('Features cannot be more than 20');
        }
        if (description === '') {
            return toast.error('Please fill the proper features and discription');
        } else if (description.length > 75) {
            return toast.error('feature discription less than 75 letters');
        } else if (name === '') {
            return toast.error('Please fill the feature name');
        } else if (name !== 'Other' && items.some((res) => res.name === name)) {
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

    const handleDelete = (index) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const handleDeleteTag = (tagToDelete) => {
        setTags((prevTags) => {
            const updatedTags = prevTags.filter((tag) => tag !== tagToDelete);
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

    const updateProductTechinfostatus = handleSubmit(async (data) => {
        const datatobesent = {
            ...data,
            id: ProductId,
            ProductId: ProductId,
            mediaName: storeMediaAllData.mediaName,
            offeringbrandat: storeMediaAllData.offeringbrandat,
            adType: storeMediaAllData.adType,
            ProductQuantity: 0,
            WhatSupportingYouWouldGiveToBuyer: storeMediaAllData?.supportingDocs,
            OtherCost: OthercostFields,
            ProductFeatures: items,
            GST: data?.mediaVariation?.GST,
            ProductsVariantions: [getValues()?.mediaVariation],
            OtherInformationBuyerMustKnowOrRemarks: OtherInfoArray,
            mediaVariation: {
                ...data?.mediaVariation,
                minOrderQuantityunit: 1,
                maxOrderQuantityunit: 1,
                minOrderQuantitytimeline: storeMediaAllData?.minOrderQtyTimeline,
                maxOrderQuantitytimeline: storeMediaAllData?.maxOrderQtyTimeline,
                GST: '18',
                Timeline: data?.mediaVariation?.timeline ? `${data.mediaVariation.timeline} days` : 'Day',
                HSN: storeMediaAllData?.HSN,
            },
            ProductUploadStatus: 'technicalinformation',
            ListingType: 'Media',
            tags: tags,
            minOrderQuantityunit: 1,
            maxOrderQuantityunit: 1,
            repetition: 0,
            dimensionSize: "",
            minOrderQtyTimeline: storeMediaAllData?.minOrderQtyTimeline,
            maxOrderQtyTimeline: storeMediaAllData?.maxOrderQtyTimeline,
        };

        // Supporting Documents validation
        if (Object.values(storeMediaAllData?.supportingDocs || {}).every(val => !val)) {
            toast.error('Select at least one Supporting Document');
            return;
        }

        // Timeline validation - Critical for hoarding ads (10/20/30 days)
        if (!data?.mediaVariation?.timeline) {
            setError('mediaVariation.timeline', {
                type: 'custom',
                message: 'Please select a timeline for hoarding ads',
            });
            toast.error('Please select a timeline (10, 20, or 30 days)');
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

        if (!storeMediaAllData?.HSN) {
            toast.error('Please enter HSN');
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
            return toast.error('Max Order Quantity cannot be less than Min Order Quantity');
        }

        // Min/Max Timeline validation
        const minTimeline = Number(storeMediaAllData?.minOrderQtyTimeline);
        const maxTimeline = Number(storeMediaAllData?.maxOrderQtyTimeline);
        if (minTimeline > maxTimeline) {
            return toast.error('Max Order Timeline cannot be less than Min Order Timeline');
        }

        // Min/Max Timeslot validation
        const minSlot = Number(storeMediaAllData?.minOrderTimeslot);
        const maxSlot = Number(storeMediaAllData?.maxOrderTimeslot);
        if (minSlot > maxSlot) {
            return toast.error('Max Timeslot cannot be less than Min Timeslot');
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

        // Check required fields
        if (!storeMediaAllData?.HSN) {
            toast.error('Please enter HSN');
            return;
        }

        if (!storeMediaAllData?.GST) {
            setError('mediaVariation.GST', {
                type: 'custom',
                message: 'Please select GST rate',
            });
            toast.error('Please select GST rate');
            return;
        }
        if (!storeMediaAllData?.adType) {
            setError('mediaVariation.adType', {
                type: 'custom',
                message: 'Please select Ad Type',
            });
            toast.error('Please select Ad Type');
            return;
        }

        // Final validation before submission
        else {
            await api.post(
                'product/product_mutation_hoardings',
                {
                    ProductId: datatobesent?.ProductId,
                    ...datatobesent,
                    ProductUploadStatus: 'technicalinformation',
                },
            ).then((response) => {
                if (response.status === 200 || response.data?.mediaVariation?.PricePerUnit) {
                    toast.success('Product updated successfully');
                    const id = ProductId;
                    setTimeout(() => {
                        navigate(`/mediaoffline/hoardingsgolive/${id}`);
                    }, 3000);
                } else {
                    toast.error('Product not updated');
                }
            }).catch((error) => {
                toast.error(`Error in updating product ${error}`);

            });
        }
    });

    function filterMultiples(array, multiple) {
        return array.filter(function (value) {
            return value > multiple;
        });
    }

    useEffect(() => {
        fetchMediaOnlineFeatures();
    }, []);


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
                        <Stepper currentStep={3} category="mediaoffline" completedSteps={[1, 2]} />
                    </aside>
                    <main className="stepper-content">
        <Box className="listing-journey">
            <form onSubmit={updateProductTechinfostatus}>
                <Box className="listing-journey-container">
                    <Box className="listing-journey-form">
                        <Box className="listing-header">
                            <Typography className="listing-header-title">
                                Technical Information
                                <ToolTip
                                    info={
                                        'Technical Information refers to specific details and specifications about a product\'s technical aspects, packaging Material, packing size, Dimensions, logistic or go live information for your offered product, This is Critical Information from Logistic & Buying Perspective for Making Informed Decisions'
                                    }
                                />
                            </Typography>
                        </Box>

                        <Box className="listing-section" sx={{ mt: 2, mb: 3 }}>
                                    <Box
                                        sx={{
                                            height: 'auto',
                                            minHeight: '100px',
                                            position: 'relative',
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            gap: '20px',
                                            flexDirection: 'row',
                                            mb: 3,
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

                                            <Box sx={{ width: "48%" }}>
                                                <Typography
                                                    sx={{ ...CommonTextStyle, mb: 1 }}
                                                >
                                                    Media Name
                                                    <span style={{ color: 'red' }}> *</span>
                                                </Typography>
                                                <Input
                                                    disableUnderline
                                                    placeholder="mumbai airport hoarding"
                                                    name="mediaName"
                                                    required
                                                    inputProps={{
                                                        maxLength: 50,
                                                    }}
                                                    value={storeMediaAllData.mediaName}
                                                    onChange={(e) => {
                                                        setStoreMediaAllData(prev => ({
                                                            ...prev,
                                                            mediaName: e.target.value,
                                                        }));
                                                    }}
                                                    sx={{
                                                        ...inputStyles,
                                                        mt: 1,
                                                        width: '100%',
                                                        border: errors?.mediaVariation?.mediaName?.message
                                                            ? '1px solid #DC2626'
                                                            : '1px solid #CBD5E0',
                                                        '&:hover': {
                                                            border: errors?.mediaVariation?.mediaName?.message
                                                                ? '1px solid #DC2626'
                                                                : '1px solid #94A3B8',
                                                        },
                                                        '&:focus': {
                                                            border: errors?.mediaVariation?.mediaName?.message
                                                                ? '1.5px solid #DC2626'
                                                                : '1.5px solid #C64091',
                                                        },
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
                                            </Box>
                                            <Box sx={{ width: '48%' }}>
                                                <Typography sx={{ ...CommonTextStyle, mb: 1 }}>
                                                    Offering this Branding at ?{' '}
                                                    <span style={{ color: 'red' }}> *</span>
                                                </Typography>
                                                <Input
                                                    disableUnderline
                                                    placeholder='Near mumbai airport exit gate'
                                                    name="offeringbrandat"
                                                    required
                                                    value={storeMediaAllData.offeringbrandat}
                                                    onChange={(e) => {
                                                        setStoreMediaAllData(prev => ({
                                                            ...prev,
                                                            offeringbrandat: e.target.value,
                                                        }));
                                                    }}
                                                    sx={{
                                                        ...inputStyles,
                                                        width: '100%',
                                                        marginTop: '10px',
                                                        border: errors?.mediaVariation?.offeringbrandat?.message
                                                            ? '1px solid #DC2626'
                                                            : '1px solid #CBD5E0',
                                                        '&:hover': {
                                                            border: errors?.mediaVariation?.offeringbrandat?.message
                                                                ? '1px solid #DC2626'
                                                                : '1px solid #94A3B8',
                                                        },
                                                        '&:focus': {
                                                            border: errors?.mediaVariation?.offeringbrandat?.message
                                                                ? '1.5px solid #DC2626'
                                                                : '1.5px solid #C64091',
                                                        },
                                                    }}
                                                />
                                            </Box>


                                        </Box>

                                        <Box sx={{
                                            height: 'auto',
                                            minHeight: '100px',
                                            position: 'relative',
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            justifyContent: 'space-between',
                                            flexDirection: 'row',
                                            width: '100%',
                                            mt: 2,
                                            mb: 1,
                                        }}>
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '10px',
                                                    width: 'auto',
                                                    maxWidth: '200px',
                                                    minWidth: '200px',
                                                }}
                                            >
                                                <Typography
                                                    sx={{
                                                        ...CommonTextStyle,
                                                        fontSize: '12px',
                                                        fontWeight: 400,
                                                        mb: 0.5,
                                                    }}
                                                >
                                                    Ad Type <span style={{ color: 'red' }}> *</span>
                                                </Typography>
                                                {FetchedproductData?.adType && (
                                                    <Typography
                                                        sx={{
                                                            ...CommonTextStyle,
                                                            fontSize: '11px',
                                                            fontWeight: 400,
                                                            mb: 0.5,
                                                            color: '#4caf50',
                                                        }}
                                                    >
                                                        Your Selected Ad Type: {FetchedproductData?.adType}
                                                    </Typography>
                                                )}
                                                <Select
                                                    disableUnderline
                                                    {...register('mediaVariation.adType')}
                                                    sx={{
                                                        ...inputStyles,
                                                        width: '100%',
                                                        border: errors?.mediaVariation?.adType?.message
                                                            ? '1px solid #DC2626'
                                                            : '1px solid #CBD5E0',
                                                        '&:hover': {
                                                            border: errors?.mediaVariation?.adType?.message
                                                                ? '1px solid #DC2626'
                                                                : '1px solid #94A3B8',
                                                        },
                                                        '&:focus': {
                                                            border: errors?.mediaVariation?.adType?.message
                                                                ? '1.5px solid #DC2626'
                                                                : '1.5px solid #C64091',
                                                        },
                                                        '& .MuiSelect-select': {
                                                            border: 'none',
                                                        },
                                                    }}
                                                    onChange={(e) => {
                                                        setStoreMediaAllData(prev => ({
                                                            ...prev,
                                                            adType: e.target.value,
                                                        }));
                                                    }}
                                                >
                                                    {LOCATION_OPTIONS?.map((location) => {
                                                        return (
                                                            <MenuItem sx={MenuItemsCss} value={location}>
                                                                {location}
                                                            </MenuItem>
                                                        )
                                                    })}
                                                </Select>

                                                <Typography
                                                    sx={{ color: 'red', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}
                                                >
                                                    {errors?.mediaVariation?.adType?.message}
                                                </Typography>
                                            </Box>

                                            <Box sx={{ width: 'auto', }}>
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '10px',
                                                        maxWidth: '150px',
                                                        minWidth: '150px',
                                                    }}
                                                >
                                                    <Typography
                                                        sx={{
                                                            ...CommonTextStyle,
                                                            fontSize: '12px',
                                                            fontWeight: 400,
                                                            mb: 0.5,
                                                        }}
                                                    >
                                                        Timeline <span style={{ color: 'red' }}> *</span>
                                                    </Typography>
                                                    {FetchedproductData?.mediaVariation?.timeline && (
                                                        <Typography
                                                            sx={{
                                                                ...CommonTextStyle,
                                                                fontSize: '11px',
                                                                fontWeight: 400,
                                                                mb: 0.5,
                                                                color: '#4caf50',
                                                            }}
                                                        >
                                                            Your Selected Timeline: {FetchedproductData?.mediaVariation?.timeline} days
                                                        </Typography>
                                                    )}
                                                    <Select
                                                        disableUnderline
                                                        {...register('mediaVariation.timeline')}
                                                        sx={{
                                                            ...inputStyles,
                                                            width: '100%',
                                                            border: errors?.mediaVariation?.timeline?.message
                                                                ? '1px solid #DC2626'
                                                                : '1px solid #CBD5E0',
                                                            '&:hover': {
                                                                border: errors?.mediaVariation?.timeline?.message
                                                                    ? '1px solid #DC2626'
                                                                    : '1px solid #94A3B8',
                                                            },
                                                            '&:focus': {
                                                                border: errors?.mediaVariation?.timeline?.message
                                                                    ? '1.5px solid #DC2626'
                                                                    : '1.5px solid #C64091',
                                                            },
                                                            '& .MuiSelect-select': {
                                                                border: 'none',
                                                                color: '#1A202C',
                                                            },
                                                        }}
                                                        value={storeMediaAllData.timeline}
                                                        onChange={(e) => {
                                                            setStoreMediaAllData(prev => ({
                                                                ...prev,
                                                                timeline: e.target.value,
                                                            }));
                                                            setValue('mediaVariation.timeline', e.target.value);
                                                        }}
                                                    >
                                                        {TIMELINE_OPTIONS?.map((timeline) => {
                                                            return (
                                                                <MenuItem key={timeline} sx={MenuItemsCss} value={timeline}>
                                                                    {timeline} days
                                                                </MenuItem>
                                                            )
                                                        })}
                                                    </Select>

                                                    <Typography
                                                        sx={{ color: 'red', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}
                                                    >
                                                        {errors?.mediaVariation?.timeline?.message}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            <Box sx={{ width: 'auto' }}>
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '10px',
                                                        maxWidth: '100%',
                                                    }}
                                                >
                                                    <Typography
                                                        sx={{
                                                            ...CommonTextStyle,
                                                            fontSize: '12px',
                                                            fontWeight: 400,
                                                            mb: 0.5,
                                                        }}
                                                    >
                                                        HSN <span style={{ color: 'red' }}> *</span>
                                                    </Typography>
                                                    {FetchedproductData?.mediaVariation?.HSN && (
                                                        <Typography
                                                            sx={{
                                                                ...CommonTextStyle,
                                                                fontSize: '11px',
                                                                fontWeight: 400,
                                                                mb: 0.5,
                                                                color: '#4caf50',
                                                            }}
                                                        >
                                                            Your Selected HSN: {FetchedproductData?.mediaVariation?.HSN}
                                                        </Typography>
                                                    )}
                                                    <Input
                                                        disableUnderline
                                                        placeholder="123456"
                                                        name="HSN"
                                                        value={storeMediaAllData.HSN}
                                                        onChange={(e) => {
                                                            setStoreMediaAllData(prev => ({
                                                                ...prev,
                                                                HSN: e.target.value,
                                                            }));
                                                        }}
                                                        sx={{
                                                            ...inputStyles,
                                                            mt: 0,
                                                            width: '140px',
                                                            border: errors?.mediaVariation?.HSN?.message
                                                                ? '1px solid #DC2626'
                                                                : '1px solid #CBD5E0',
                                                            '&:hover': {
                                                                border: errors?.mediaVariation?.HSN?.message
                                                                    ? '1px solid #DC2626'
                                                                    : '1px solid #94A3B8',
                                                            },
                                                            '&:focus': {
                                                                border: errors?.mediaVariation?.HSN?.message
                                                                    ? '1.5px solid #DC2626'
                                                                    : '1.5px solid #C64091',
                                                            },
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
                                                </Box>
                                            </Box>
                                            <Box sx={{ width: 'auto', }}>
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '10px',
                                                        maxWidth: '100%',
                                                    }}
                                                >
                                                    <Typography
                                                        sx={{
                                                            ...CommonTextStyle,
                                                            fontSize: '12px',
                                                            fontWeight: 400,
                                                            mb: 0.5,
                                                        }}
                                                    >
                                                        GST <span style={{ color: 'red' }}> *</span>
                                                    </Typography>
                                                  
                                                    <Select
                                                        disableUnderline
                                                        value={storeMediaAllData.GST || ''}
                                                        onChange={(e) => {
                                                            setStoreMediaAllData(prev => ({
                                                                ...prev,
                                                                GST: e.target.value,
                                                            }));
                                                        }}
                                                        sx={{
                                                            ...inputStyles,
                                                            width: '100%',
                                                            border: errors?.mediaVariation?.GST?.message
                                                                ? '1px solid #DC2626'
                                                                : '1px solid #CBD5E0',
                                                            '&:hover': {
                                                                border: errors?.mediaVariation?.GST?.message
                                                                    ? '1px solid #DC2626'
                                                                    : '1px solid #94A3B8',
                                                            },
                                                            '&:focus': {
                                                                border: errors?.mediaVariation?.GST?.message
                                                                    ? '1.5px solid #DC2626'
                                                                    : '1.5px solid #C64091',
                                                            },
                                                            '& .MuiSelect-select': {
                                                                border: 'none',
                                                                color: '#1A202C',
                                                            },
                                                        }}
                                                        >
                                                        <MenuItem sx={MenuItemsCss} value="5">
                                                            5
                                                        </MenuItem>
                                                        <MenuItem sx={MenuItemsCss} value="10">
                                                            10
                                                        </MenuItem>
                                                        <MenuItem sx={MenuItemsCss} value="12">
                                                            12
                                                        </MenuItem>
                                                        <MenuItem sx={MenuItemsCss} value="18">
                                                            18
                                                        </MenuItem>
                                                        <MenuItem sx={MenuItemsCss} value="28">
                                                            28
                                                        </MenuItem>
                                                    </Select>
                                                    {FetchedproductData?.mediaVariation?.GST && (
                                                        <Typography
                                                            sx={{
                                                                ...CommonTextStyle,
                                                                fontSize: '11px',
                                                                fontWeight: 400,
                                                                mb: 0.5,
                                                                color: '#4caf50',
                                                            }}
                                                        >
                                                            Selected GST: {FetchedproductData?.mediaVariation?.GST}
                                                        </Typography>
                                                    )}
                                                    <Typography
                                                        sx={{ color: 'red', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}
                                                    >
                                                        {errors?.mediaVariation?.GST?.message}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Box>



                                    <Box
                                        onChange={(e) => {
                                            setCheckBoxes(e?.target?.checked);
                                        }}
                                        sx={{ display: 'grid', gap: '10px', py: 0, mt: 0, mb: 0 }}
                                    >
                                        <Typography sx={{ ...CommonTextStyle, mb: 1.5 }}>
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
                                                sx={{ display: 'flex', flexDirection: 'row', gap: '10px', flexWrap: 'wrap', mt: 1 }}
                                            >

                                                {docs.map((doc, index) => (
                                                    <Box key={index} sx={{ display: 'flex', gap: '8px', alignItems: 'center', mb: 1 }}>
                                                        <Checkbox
                                                            value={doc}
                                                            checked={!!storeMediaAllData?.supportingDocs?.[doc]}
                                                            onChange={handleCheckboxChange}
                                                            sx={{
                                                                color: '#CBD5E0',
                                                                '&.Mui-checked': {
                                                                    color: '#C64091',
                                                                },
                                                                '&:hover': {
                                                                    backgroundColor: 'rgba(198, 64, 145, 0.1)',
                                                                },
                                                                '&.Mui-checked:hover': {
                                                                    backgroundColor: 'rgba(198, 64, 145, 0.15)',
                                                                },
                                                            }}
                                                        />
                                                        <Typography sx={{ ...CommonTextStyle, fontSize: '13px' }}>{doc}</Typography>
                                                    </Box>
                                                ))}

                                            </Grid>
                                        </Grid>
                                    </Box>

                                    <Box sx={{ mt: 2, mb: 3 }}>
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
                                    </Box>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            gap: '20px',
                                            flexDirection: 'column',
                                            width: '98%',
                                            mx: 'auto',
                                            mt: 2,
                                            mb: 3,
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
                                            py: 1,
                                            mt: 2,
                                            mb: 1,
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                fontFamily: 'ui-sans-serif, system-ui, sans-serif',
                                                color: '#6B7A99',
                                                mb: 2,
                                            }}
                                        >
                                            <Typography sx={{ fontSize: '16px', fontWeight: '500', mb: 0.5 }}>
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
                                                }}
                                            >
                                                <Typography sx={{ ...CommonTextStyle, mb: 1 }}>
                                                    Select Best Features ( Min 5 and Max 20){' '}
                                                    <span style={{ color: 'red' }}> *</span>
                                                </Typography>

                                                <Select
                                                    onChange={(e) => setName(e.target.value)}
                                                    sx={{
                                                        width: '100%',
                                                        background: '#fff',
                                                        height: '42px',
                                                        borderRadius: '8px',
                                                        fontSize: '12px',
                                                        color: '#1A202C',
                                                        border: '1px solid #CBD5E0',
                                                        '&:hover': {
                                                            border: '1px solid #94A3B8',
                                                        },
                                                        '&.Mui-focused': {
                                                            border: '1.5px solid #C64091',
                                                        },
                                                        '.MuiOutlinedInput-notchedOutline': { 
                                                            border: 'none',
                                                        },
                                                        '&.MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline':
                                                        {
                                                            border: 'none',
                                                        },
                                                        '&.MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline':
                                                        {
                                                            border: 'none',
                                                        },
                                                        '& .MuiSelect-select': {
                                                            color: '#1A202C',
                                                        },
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
                                                        sx={{ color: 'red', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}
                                                    >
                                                        Select{' '}
                                                        {5 - items?.length} more feature
                                                    </Typography>
                                                )}
                                            </Box>


                                            <Box sx={{ mt: 2 }}>
                                                <Typography sx={{ ...CommonTextStyle, mb: 1 }}>
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
                                                        minHeight: '100px',
                                                        background: '#FFFFFF',
                                                        border: '1px solid #CBD5E0',
                                                        '&:hover': {
                                                            border: '1px solid #94A3B8',
                                                        },
                                                        '&.Mui-focused': {
                                                            border: '1.5px solid #C64091',
                                                        },
                                                    }}
                                                    onChange={(e) => setDescription(e.target.value)}
                                                    minRows={3}
                                                    InputProps={{
                                                        disableUnderline: true,
                                                        endAdornment: (
                                                            <Typography
                                                                variant="body1"
                                                                style={{
                                                                    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
                                                                    fontSize: '12px',
                                                                    color: '#c64091',
                                                                }}
                                                            ></Typography>
                                                        ),
                                                        style: {
                                                            fontFamily: 'ui-sans-serif, system-ui, sans-serif',
                                                            fontSize: '12px',
                                                            padding: '10px',
                                                            color: '#c64091',
                                                        },
                                                    }}
                                                />
                                                {items?.length > 0 && items.length < 5 && (
                                                    <Typography
                                                        sx={{ color: 'red', fontFamily: 'ui-sans-serif, system-ui, sans-serif', mt: 1 }}
                                                    >
                                                        Enter{' '}
                                                        {5 - items?.length} more feature description
                                                    </Typography>
                                                )}
                                            </Box>
                                            <Button
                                                variant="contained"
                                                onClick={handleItemAdd}
                                                sx={ProceedToAddButtonStyle}
                                            >
                                                Proceed to Add
                                            </Button>

                                            <Typography
                                                sx={{
                                                    color: '#6B7A99',
                                                    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
                                                    fontSize: '16px',
                                                    fontWeight: 600,
                                                    mb: 2,
                                                    mt: 3,
                                                }}
                                            >
                                                Key Features ({items.length})
                                            </Typography>
                                            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                                {items?.map((item, index) => (
                                                    <Box
                                                        key={index}
                                                        sx={{
                                                            border: '1px solid #E3E3E3',
                                                            mx: 'auto',
                                                            height: 'auto',
                                                            width: '100%',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            placeItems: 'center',
                                                            borderRadius: '10px',
                                                            p: 1.5,
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
                                                                        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
                                                                    }}
                                                                >
                                                                    {item.name}
                                                                </Typography>
                                                                <span style={{ fontSize: '12px', color: '#6B7A99' }}>
                                                                    {item.description}
                                                                </span>
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
                                            py: 1,
                                            display: 'flex',
                                            gap: '20px',
                                            position: 'relative',
                                            mt: 1,
                                            mb: 3,
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                width: '100%',
                                                height: '45px',
                                                borderRadius: '10px',
                                            }}
                                        >
                                            <Typography sx={{ ...CommonTextStyle, mb: 1.5 }}>
                                                Other information buyer must know/ Remarks{' '}
                                            </Typography>
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    background: '#fff',
                                                    borderRadius: '10px',
                                                    gap: '10px',
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
                                                            color: '#1A202C',
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
                                                        borderRadius: '8px',
                                                        border: '1px solid #CBD5E0',
                                                        '&:hover': {
                                                            border: '1px solid #94A3B8',
                                                        },
                                                        '&.Mui-focused': {
                                                            border: '1.5px solid #C64091',
                                                        },
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

                                    {OtherInfoArray?.map((items, index) => {
                                        return (
                                            <Box
                                                key={items}
                                                sx={{
                                                    justifyContent: 'space-between',
                                                    display: 'flex',
                                                    mt: index === 0 ? 2 : 1.5,
                                                    mb: index === OtherInfoArray.length - 1 ? 0 : 1,
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
                                                            fontFamily: 'ui-sans-serif, system-ui, sans-serif',
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
                                                        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
                                                        background: 'transparent',
                                                        padding: '10px',
                                                        color: '#1A202C',
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
                                    <Box sx={{ display: 'grid', gap: '10px', mt: 4, mb: 0 }}>
                                        <Typography sx={{ ...TypographyStyle, mb: 1.5 }}>
                                            Tags (Keywords that can improve your seach visibility on
                                            marketplace)<span style={{ color: 'red' }}> *</span>
                                        </Typography>
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                background: '#fff',
                                                borderRadius: '10px',
                                                gap: '10px',
                                            }}
                                        >
                                            <TextField
                                                placeholder="Add Tags"
                                                inputRef={tagInputRef}
                                                sx={{
                                                    width: '100%',
                                                    background: '#fff',
                                                    borderRadius: '8px',
                                                    height: '41px',
                                                    border: '1px solid #CBD5E0',
                                                    '&:hover': {
                                                        border: '1px solid #94A3B8',
                                                    },
                                                    '&.Mui-focused': {
                                                        border: '1.5px solid #C64091',
                                                    },
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

                                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <UiButton
                            type="button"
                            variant="outline"
                            className="border-[#E5E8EB] text-[#111827] hover:bg-[#F8F9FA]"
                            onClick={() => navigate(`/mediaoffline/mediaofflinehoardinginfo/${ProductId}`)}
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </UiButton>
                        <UiButton
                            type="submit"
                            className="bg-[#C64091] hover:bg-[#A03375] text-white shadow-sm"
                        >
                            Next
                            <ArrowRight className="w-4 h-4" />
                        </UiButton>
                    </div>
                </Box>
                </form>
        </Box>
        </main>
        </div>
        </div>
        </div>
    );
}

const CommonTextStyle = {
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    fontStyle: 'normal',
    fontWeight: 400,
    fontSize: '14px',
    lineHeight: '21px',
    color: '#6B7A99',
};

const inputStyles = {
    width: '110px',
    height: '42px',
    background: '#FFFFFF',
    borderRadius: '8px',
    padding: '0px 10px',
    fontSize: '12px',
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    color: '#1A202C',
    border: '1px solid #E5E8EB',
    '&:hover': {
        border: '1px solid #94A3B8',
    },
    '&:focus': {
        border: '1.5px solid #C64091',
        outline: 'none',
    },
    '&.Mui-error': {
        border: '1px solid #DC2626',
    },
    '& input': {
        color: '#1A202C',
    },
    '& input::placeholder': {
        color: '#A0AEC0',
    },
};


const TextFieldStyle = {
    width: '100%',
    height: '48px',
    background: '#fff',
    borderRadius: '8px',
    border: '1px solid #E5E8EB',
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    fontStyle: 'normal',
    fontWeight: 400,
    fontSize: '14px',
    color: '#1A202C',
    overflow: 'auto',
    paddingLeft: '0px',
    '&:hover': {
        border: '1px solid #94A3B8',
    },
    '&:focus': {
        border: '1.5px solid #C64091',
        outline: 'none',
    },
    '&.Mui-error': {
        border: '1px solid #DC2626',
    },
    '& input': {
        color: '#1A202C',
    },
    '& textarea': {
        color: '#1A202C',
    },
    '& input::placeholder': {
        color: '#A0AEC0',
    },
    '& textarea::placeholder': {
        color: '#A0AEC0',
    },
};
const mapdata = {
    color: ' #6B7A99',
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    width: '100%',
    fontSize: '12px',
    minHeight: '60px',
    height: 'auto',
};

const tableDataStyle = {
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    fontStyle: 'normal',
    fontWeight: 500,
    fontSize: 12,
    color: '#6B7A99',
};

const TableCellStyle = {
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    fontStyle: 'normal',
    fontWeight: 500,
    fontSize: 12,
    textAlign: 'center',
    color: '#c64091',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
};


const TypographyStyle = {
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    fontStyle: 'normal',
    fontWeight: 400,
    fontSize: '14px',
    color: '#6B7A99',
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
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    fontStyle: 'normal',
    fontWeight: 500,
    fontSize: '18px',
    lineHeight: '28px',

    color: '#2E2E2E',
};


const ProceedToAddButtonStyle = {
    width: '100%',
    height: '41px',
    background: '#C64091',
    borderRadius: '10px',
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
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
};

const MenuItemsCss = {
    fontSize: '12px',
    color: '#1A202C',
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    fontStyle: 'normal',
    fontWeight: 400,
    '&.Mui-selected': {
        color: '#1A202C',
        backgroundColor: 'rgba(198, 64, 145, 0.1)',
        '&:hover': {
            backgroundColor: 'rgba(198, 64, 145, 0.15)',
        },
    },
};

