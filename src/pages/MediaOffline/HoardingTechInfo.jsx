import {
    Paper,
    Box,
    Grid,
    Checkbox,
    Typography,
    BottomNavigation,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    tableCellClasses,
    TableBody,
    Chip,
    Button as MuiButton,
} from '@mui/material';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Stack } from '@mui/system';
import EditIcon from '../../assets/Images/CommonImages/EditIcon.svg';
import { toast } from 'sonner';
import { useNavigate, useParams } from 'react-router-dom';
import React, { useEffect, useRef, useState } from 'react';
import api from '../../utils/api';
import {
    supportingDocsToCheckboxState,
    checkboxStateToSupportingArray,
    emptySupportingCheckboxState,
    SUPPORTING_DOC_LABELS,
    SUPPORTING_DOC_KEYS_FORM_ORDER_HOARDING,
} from '../../utils/supportingBuyerDocs';
import { useFieldArray, useForm } from 'react-hook-form';
import RemoveIcon from '../../assets/Images/CommonImages/RemoveIcon.svg';
import OthercostPortion from './OthercostPortion.jsx';
import ToolTip from '../../components/ToolTip';
import { Stepper } from '../AddProduct/AddProductSteps';
import {
    filterFeatureDropdownRows,
    FEATURE_ALLOWLIST_BY_KEY,
} from '../../config/mediaListingProfiles';
import bxitoken from '../../assets/Images/CommonImages/BXIToken.png';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';


// Constants
const TIMELINE_OPTIONS = [10, 20, 30];
const LOCATION_OPTIONS = [
    'All Locations',
    'Concession Counter',
    'Entry Gate',
    'Exit Gate',
    'Highway',
    'Lobby',
    'Mall Atrium',
    'Near Parking Area',
    'Out Side Airport',
    'Parking Area',
    'Waiting Area',
    'main road',
    'others',
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
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [storeMediaAllData, setStoreMediaAllData] = useState({
        mediaName: '',
        adType: '',
        offeringbrandat: '',
        minOrderTimeslot: '',
        maxOrderTimeslot: '',
        supportingDocs: emptySupportingCheckboxState(),
        repetition: '',
        dimensionSize: '',
        minOrderQtyTimeline: '',
        maxOrderQtyTimeline: '',
        UploadLink: '',
        HSN: '',
        GST: '',
        timeline: '',
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setStoreMediaAllData(prev => ({ ...prev, [name]: value }));
    };

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
                    mediaName: data?.mediaName ?? data?.ProductName ?? '',
                    offeringbrandat: data?.offeringbrandat ?? "",
                    minOrderTimeslot: data.mediaVariation?.minOrderTimeslot ?? "",
                    maxOrderTimeslot: data.mediaVariation?.maxOrderTimeslot ?? "",
                    repetition: data.mediaVariation?.repetition ?? "",
                    dimensionSize: data.mediaVariation?.dimensionSize ?? "",
                    minOrderQtyTimeline: data.mediaVariation?.minOrderQtyTimeline ?? "",
                    maxOrderQtyTimeline: data.mediaVariation?.maxOrderQtyTimeline ?? "",
                    HSN: data.mediaVariation?.hsn ?? "",
                    // For GST, timeline, adType: these are in react-hook-form, so use setValue (below)
                    supportingDocs: supportingDocsToCheckboxState(
                        data.WhatSupportingYouWouldGiveToBuyer,
                    ),
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
            WhatSupportingYouWouldGiveToBuyer: checkboxStateToSupportingArray(
                storeMediaAllData?.supportingDocs,
            ),
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
        if (checkboxStateToSupportingArray(storeMediaAllData?.supportingDocs || []).length === 0) {
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
            setIsSubmitting(true);
            try {
                const response = await api.post(
                    'product/product_mutation_hoardings',
                    {
                        ProductId: datatobesent?.ProductId,
                        ...datatobesent,
                        ProductUploadStatus: 'technicalinformation',
                    },
                );
                if (response.status === 200 || response.data?.mediaVariation?.PricePerUnit) {
                    toast.success('Product updated successfully');
                    const id = ProductId;
                    setTimeout(() => {
                        navigate(`/mediaonline/go-live/${id}?from=hoarding`);
                    }, 3000);
                } else {
                    toast.error('Product not updated');
                }
            } catch (error) {
                toast.error(`Error in updating product ${error}`);
            } finally {
                setIsSubmitting(false);
            }
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
                        <div className="max-w-4xl mx-auto px-4 pb-16">
                            <div className="form-section bg-white rounded-lg shadow-sm border border-[#E2E8F0] p-6">
                                <h2 className="form-section-title mb-6 flex items-center gap-2">
                                    Technical Information
                                    <ToolTip
                                        info={
                                            'Technical Information refers to specific details and specifications about a product\'s technical aspects, packaging Material, packing size, Dimensions, logistic or go live information for your offered product, This is Critical Information from Logistic & Buying Perspective for Making Informed Decisions'
                                        }
                                    />
                                </h2>

                                <form onSubmit={updateProductTechinfostatus} className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Media Name *</Label>
                                            <Input
                                                placeholder="mumbai airport hoarding"
                                                name="mediaName"
                                                required
                                                maxLength={50}
                                                value={storeMediaAllData.mediaName}
                                                onChange={(e) => {
                                                    setStoreMediaAllData(prev => ({
                                                        ...prev,
                                                        mediaName: e.target.value,
                                                    }));
                                                }}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Offering this Branding at ? *</Label>
                                            <Input
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
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="space-y-2">
                                            <Label>Ad Type *</Label>
                                            <select
                                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                {...register('mediaVariation.adType')}
                                                value={storeMediaAllData.adType}
                                                onChange={(e) => {
                                                    setStoreMediaAllData(prev => ({
                                                        ...prev,
                                                        adType: e.target.value,
                                                    }));
                                                }}
                                            >
                                                <option value="">Select ad type</option>
                                                {LOCATION_OPTIONS?.map((location) => (
                                                    <option key={location} value={location}>
                                                        {location}
                                                    </option>
                                                ))}
                                            </select>
                                            {FetchedproductData?.adType && (
                                                <p className="text-[11px] text-[#4caf50]">
                                                    Your Selected Ad Type: {FetchedproductData?.adType}
                                                </p>
                                            )}
                                            {errors?.mediaVariation?.adType?.message && (
                                                <p className="text-xs text-red-600">{errors?.mediaVariation?.adType?.message}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Timeline *</Label>
                                            <select
                                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                {...register('mediaVariation.timeline')}
                                                value={storeMediaAllData.timeline}
                                                onChange={(e) => {
                                                    setStoreMediaAllData(prev => ({
                                                        ...prev,
                                                        timeline: e.target.value,
                                                    }));
                                                    setValue('mediaVariation.timeline', e.target.value);
                                                }}
                                            >
                                                <option value="">Select timeline</option>
                                                {TIMELINE_OPTIONS?.map((timeline) => (
                                                    <option key={timeline} value={timeline}>
                                                        {timeline} days
                                                    </option>
                                                ))}
                                            </select>
                                            {FetchedproductData?.mediaVariation?.timeline && (
                                                <p className="text-[11px] text-[#4caf50]">
                                                    Your Selected Timeline: {FetchedproductData?.mediaVariation?.timeline} days
                                                </p>
                                            )}
                                            {errors?.mediaVariation?.timeline?.message && (
                                                <p className="text-xs text-red-600">{errors?.mediaVariation?.timeline?.message}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label>HSN *</Label>
                                            <Input
                                                placeholder="123456"
                                                name="HSN"
                                                value={storeMediaAllData.HSN}
                                                onChange={(e) => {
                                                    setStoreMediaAllData(prev => ({
                                                        ...prev,
                                                        HSN: e.target.value,
                                                    }));
                                                }}
                                            />
                                            {FetchedproductData?.mediaVariation?.HSN && (
                                                <p className="text-[11px] text-[#4caf50]">
                                                    Your Selected HSN: {FetchedproductData?.mediaVariation?.HSN}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label>GST *</Label>
                                            <select
                                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                value={storeMediaAllData.GST || ''}
                                                onChange={(e) => {
                                                    setStoreMediaAllData(prev => ({
                                                        ...prev,
                                                        GST: e.target.value,
                                                    }));
                                                }}
                                            >
                                                <option value="">Select GST</option>
                                                {['5', '10', '12', '18', '28'].map((val) => (
                                                    <option key={val} value={val}>{val}%</option>
                                                ))}
                                            </select>
                                            {FetchedproductData?.mediaVariation?.GST && (
                                                <p className="text-[11px] text-[#4caf50]">
                                                    Selected GST: {FetchedproductData?.mediaVariation?.GST}%
                                                </p>
                                            )}
                                            {errors?.mediaVariation?.GST?.message && (
                                                <p className="text-xs text-red-600">{errors?.mediaVariation?.GST?.message}</p>
                                            )}
                                        </div>
                                    </div>



                                    <div className="space-y-3">
                                        <Label>What supporting document would you give to the Buyer? *</Label>
                                        <div className="flex flex-wrap gap-4">
                                            {SUPPORTING_DOC_KEYS_FORM_ORDER_HOARDING.map((docKey) => (
                                                <label key={docKey} className="flex items-center gap-2 text-sm text-[#6B7A99]">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!storeMediaAllData?.supportingDocs?.[docKey]}
                                                        onChange={(e) => {
                                                            setStoreMediaAllData((prev) => ({
                                                                ...prev,
                                                                supportingDocs: {
                                                                    ...prev.supportingDocs,
                                                                    [docKey]: e.target.checked,
                                                                },
                                                            }));
                                                        }}
                                                        className="rounded border-input"
                                                    />
                                                    {SUPPORTING_DOC_LABELS[docKey]}
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label>Other costs</Label>
                                        <OthercostPortion
                                            append={(data, index) => {
                                                if (index !== null) OthercostUpdate(index, data);
                                                else OthercostAppend(data);
                                                SetOthercostEditId(null);
                                            }}
                                            defaultValue={OthercostEditId !== null ? OthercostFields[OthercostEditId] : null}
                                            index={OthercostEditId}
                                        />
                                        {OthercostFields.length > 0 && (
                                            <TableContainer className="border rounded-lg overflow-auto">
                                                <Table size="small">
                                                    <TableHead>
                                                        <TableRow>
                                                            {OthercostFieldsarray.map((data) => {
                                                                if (data === 'id' || data === 'listPeriod') return null;
                                                                return (
                                                                    <TableCell key={data} className="bg-[#F8F9FA] font-medium">
                                                                        {data}
                                                                    </TableCell>
                                                                );
                                                            })}
                                                            <TableCell align="center" className="bg-[#F8F9FA] font-medium">Actions</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {OthercostFields.map((item, idx) => (
                                                            <TableRow key={idx}>
                                                                <TableCell>{item.AdCostApplicableOn}</TableCell>
                                                                <TableCell>
                                                                    <span className="flex items-center gap-1">
                                                                        {item.CostPrice}
                                                                        {item.currencyType === 'BXITokens' ? (
                                                                            <img src={bxitoken} alt="" className="w-4 h-4" />
                                                                        ) : (
                                                                            item.currencyType
                                                                        )}
                                                                    </span>
                                                                </TableCell>
                                                                <TableCell>{item.AdCostHSN}</TableCell>
                                                                <TableCell>{item.AdCostGST}%</TableCell>
                                                                <TableCell>{item.ReasonOfCost}</TableCell>
                                                                <TableCell align="center">
                                                                    <div className="flex justify-center gap-1">
                                                                        <MuiButton size="small" onClick={() => SetOthercostEditId(idx)}>
                                                                            <Box component="img" src={EditIcon} alt="Edit" sx={{ width: 18 }} />
                                                                        </MuiButton>
                                                                        <MuiButton size="small" onClick={() => OthercostRemove(idx)}>
                                                                            <Box component="img" src={RemoveIcon} alt="Remove" sx={{ width: 18 }} />
                                                                        </MuiButton>
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        )}
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <Label>Product features * (min 5, max 20)</Label>
                                                <p className="text-xs text-[#6B7A99] mt-1">
                                                    Select the best features that describe your brand/media.
                                                </p>
                                            </div>
                                            <Badge variant="secondary" className="bg-[#C640911A] text-[#C64091] hover:bg-[#C6409126] border-none">
                                                {items.length} Features Added
                                            </Badge>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <select
                                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                                    onChange={(e) => setName(e.target.value)}
                                                    value={name}
                                                >
                                                    <option value="">Select feature</option>
                                                    {filterFeatureDropdownRows(
                                                        MediaOnlineFeaturesData,
                                                        FEATURE_ALLOWLIST_BY_KEY.hoarding,
                                                        items.map((i) => i.name),
                                                    )?.map((el, idx) => (
                                                        el?.IsHead ? (
                                                            <option key={idx} disabled className="font-bold text-gray-500">
                                                                — {el.MediaonlineFeaturesingle} —
                                                            </option>
                                                        ) : (
                                                            <option key={idx} value={el.MediaonlineFeaturesingle}>
                                                                {el.MediaonlineFeaturesingle}
                                                            </option>
                                                        )
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <Textarea
                                                    placeholder="Feature description"
                                                    value={description}
                                                    onChange={(e) => setDescription(e.target.value)}
                                                    rows={2}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && !e.shiftKey) {
                                                            e.preventDefault();
                                                            handleItemAdd();
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <Button type="button" variant="outline" onClick={handleItemAdd}>
                                            Add feature
                                        </Button>

                                        <div className="space-y-2">
                                            {items.map((item, index) => (
                                                <div key={index} className="flex items-start justify-between gap-2 rounded-lg border border-[#E2E8F0] p-3 bg-gray-50">
                                                    <div>
                                                        <p className="text-sm font-semibold text-[#111827]">{item.name}</p>
                                                        <p className="text-sm text-[#6B7A99]">{item.description}</p>
                                                    </div>
                                                    <Button type="button" variant="ghost" size="sm" onClick={() => handleDelete(index)}>
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-[#E2E8F0]">
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <Label>Other Information Buyer Must Know</Label>
                                                <Badge variant="secondary" className="bg-gray-100 text-[#6B7A99] border-none">
                                                    {OtherInfoArray?.length || 0} Items
                                                </Badge>
                                            </div>
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="e.g. Free installation for first 10 days"
                                                    ref={otherInputRef}
                                                    onKeyDown={otherenter}
                                                />
                                                <Button type="button" variant="outline" onClick={OtherInformationSubmit}>
                                                    Add
                                                </Button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {OtherInfoArray?.map((info, idx) => (
                                                    <Badge key={idx} variant="secondary" className="flex items-center gap-1 py-1 px-2 h-auto text-xs">
                                                        {info}
                                                        <X
                                                            className="w-3 h-3 cursor-pointer hover:text-red-500"
                                                            onClick={() => setOtherInfoArray(OtherInfoArray.filter((_, i) => i !== idx))}
                                                        />
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <Label>Tags *</Label>
                                                <Badge variant="secondary" className="bg-gray-100 text-[#6B7A99] border-none">
                                                    {tags?.length || 0} Tags
                                                </Badge>
                                            </div>
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="Add tags and press enter"
                                                    ref={tagInputRef}
                                                    onKeyDown={handleAddTag}
                                                />
                                                <Button type="button" variant="outline" onClick={handleAddButtonClick}>
                                                    Add
                                                </Button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {tags?.map((tag, idx) => (
                                                    <Badge key={idx} variant="secondary" className="flex items-center gap-1 py-1 px-2 h-auto text-xs">
                                                        {tag}
                                                        <X
                                                            className="w-3 h-3 cursor-pointer hover:text-red-500"
                                                            onClick={() => setTags(tags.filter((_, i) => i !== idx))}
                                                        />
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center pt-8 border-t border-[#E2E8F0]">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => navigate(`/mediaoffline/hoardinglisting/${ProductId}`)}
                                            className="flex items-center gap-2 h-10 px-6"
                                        >
                                            <ArrowLeft className="w-4 h-4" />
                                            Back
                                        </Button>
                                        <Button
                                            type="submit"
                                            className="flex items-center gap-2 h-10 px-6 bg-[#C64091] hover:bg-[#A33276] text-white"
                                            disabled={items.length < 5 || isSubmitting}
                                        >
                                            {isSubmitting ? 'Saving...' : 'Save & Next'}
                                            <ArrowRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </div>
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

