/**
 * Digital ADs (Media Online) – Technical Information.
 * Parity with BXI-frontend DigitalScreensTechInfo + mandatory min/max slot times (seconds).
 */
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFieldArray, useForm } from 'react-hook-form';
import {
  Box,
  Button as MuiButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  tableCellClasses,
} from '@mui/material';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import api from '../../utils/api';
import {
  supportingDocsToCheckboxState,
  checkboxStateToSupportingArray,
  emptySupportingCheckboxState,
  SUPPORTING_DOC_LABELS,
} from '../../utils/supportingBuyerDocs';
import OthercostPortion from '../MediaOffline/OthercostPortion.jsx';
import EditIcon from '../../assets/Images/CommonImages/EditIcon.svg';
import RemoveIcon from '../../assets/Images/CommonImages/RemoveIcon.svg';
import bxitoken from '../../assets/Images/CommonImages/BXIToken.png';
import { Stepper } from '../AddProduct/AddProductSteps';
import {
  LISTING_GST_RATE_OPTIONS,
  formatListingGstPercentLabel,
} from '../../utils/gstOptions';
import {
  DOOH_AD_TYPE_OPTIONS_FILTERED,
  DOOH_SUPPORTING_DOC_KEYS,
  FEATURE_ALLOWLIST_BY_KEY,
  filterFeatureDropdownRows,
} from '../../config/mediaListingProfiles';
// DOOH timeline is locked to whole-day blocks of 10 / 20 / 30 days (per the
// "per 10/20/30 days" pricing spec). No Week/Month; min & max are day dropdowns.
const DOOH_DAY_OPTIONS = ['10', '20', '30'];

/** Snap a stored timeline value to the nearest 10/20/30-day block (handles legacy data). */
function normalizeDoohDays(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 10) return '';
  if (n >= 30) return '30';
  if (n >= 20) return '20';
  return '10';
}

const LOOPTIME_SECOND_OPTIONS = Array.from({ length: 18 }, (_, idx) =>
  String((idx + 1) * 10),
);

const MIN_MAX_TIMESLOT_OPTIONS = LOOPTIME_SECOND_OPTIONS.filter(
  (sec) => Number(sec) <= 60,
);

function getMaxTimeslotOptions(minValue) {
  const min = Number(minValue);
  if (!Number.isFinite(min) || min < 10) {
    return [...MIN_MAX_TIMESLOT_OPTIONS];
  }
  return MIN_MAX_TIMESLOT_OPTIONS.filter((sec) => Number(sec) >= min);
}

function normalizeMinMaxTimeslot(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return '';
  const stepped = Math.min(60, Math.max(10, Math.round(n / 10) * 10));
  return String(stepped);
}

const OthercostFieldsarray = [
  'Applicable On',
  'Other cost ',
  'HSN',
  'GST',
  'Reason Of Cost',
];

const TableCellStyle = {
  fontFamily: 'Inter, sans-serif',
  fontSize: '12px',
  color: '#6B7A99',
  borderBottom: '1px solid #EDEFF2',
};

const tableDataStyle = {
  fontFamily: 'Inter, sans-serif',
  fontSize: '12px',
  fontWeight: 600,
  color: '#6B7A99',
};

export default function DigitalScreensTechInfo() {
  const { id: ProductId } = useParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productData, setProductData] = useState(null);
  const [tags, setTags] = useState([]);
  const [items, setItems] = useState([]);
  const [OtherInfoArray, setOtherInfoArray] = useState([]);
  const [MediaOnlineFeaturesData, setMediaOnlineFeaturesData] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [OthercostEditId, SetOthercostEditId] = useState(null);

  const otherInputRef = useRef(null);
  const tagInputRef = useRef(null);

  const [storeMediaAllData, setStoreMediaAllData] = useState({
    mediaName: '',
    offeringbrandat: '',
    repetition: '',
    dimensionSize: '',
    loopTimeSeconds: '',
    minTimeSeconds: '',
    maxTimeSeconds: '',
    minOrderDays: '',
    maxOrderDays: '',
    UploadLink: '',
    HSN: '',
    adType: '',
    GST: '18',
    supportingDocs: emptySupportingCheckboxState(),
  });

  const { getValues, control, handleSubmit } = useForm({
    defaultValues: { OtherCost: [] },
  });

  const isDigitalAdsJourney =
    String(productData?.mediaJourney || '').toLowerCase() === 'digital-ads';
  const maxTimeOptions = getMaxTimeslotOptions(storeMediaAllData.minTimeSeconds);

  const {
    fields: OthercostFields,
    append: OthercostAppend,
    remove: OthercostRemove,
    update: OthercostUpdate,
    replace: OthercostReplace,
  } = useFieldArray({
    control,
    name: 'OtherCost',
  });

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    setStoreMediaAllData((prev) => ({
      ...prev,
      supportingDocs: {
        ...prev.supportingDocs,
        [value]: checked,
      },
    }));
  };

  const fetchMediaOnlineFeatures = async () => {
    try {
      const response = await api.get('mediaonlinesinfeature/Get_media_onlinesinglefea');
      const sortedData = (response.data || [])
        .slice()
        .sort((a, b) =>
          String(a.MediaonlineFeaturesingle || '').localeCompare(
            String(b.MediaonlineFeaturesingle || ''),
          ),
        );
      setMediaOnlineFeaturesData(sortedData);
    } catch {
      /* optional */
    }
  };

  const FetchProduct = async () => {
    if (!ProductId) return;
    try {
      const res = await api.get(`product/get_product_byId/${ProductId}`);
      const data = res.data;
      setProductData(data);
      const mv = data?.mediaVariation || {};
      const loopTimeSecondsRaw =
        mv.loopTimeSeconds ?? data?.loopTimeSeconds ?? mv.minTimeslotSeconds ?? data?.minOrderTimeslot ?? '';
      const minTimeSecondsNorm = normalizeMinMaxTimeslot(
        mv.minTimeslotSeconds ?? data?.minOrderTimeslot ?? '',
      );
      const maxTimeSecondsNormRaw = normalizeMinMaxTimeslot(
        mv.maxTimeslotSeconds ?? data?.maxOrderTimeslot ?? '',
      );
      const maxTimeSecondsNorm =
        minTimeSecondsNorm &&
        maxTimeSecondsNormRaw &&
        Number(maxTimeSecondsNormRaw) < Number(minTimeSecondsNorm)
          ? minTimeSecondsNorm
          : maxTimeSecondsNormRaw || minTimeSecondsNorm;
      setStoreMediaAllData({
        mediaName:
          (data?.mediaName ??
            data?.medianame ??
            data?.ProductName ??
            '')
            .toString()
            .trim() || '',
        offeringbrandat: data?.offeringbrandat ?? data?.offerningbrandat ?? '',
        repetition:
          mv.repetition != null && mv.repetition !== ''
            ? String(mv.repetition)
            : '',
        dimensionSize: mv.dimensionSize ?? data?.dimensionSize ?? '',
        loopTimeSeconds:
          loopTimeSecondsRaw != null && loopTimeSecondsRaw !== ''
            ? String(loopTimeSecondsRaw)
            : '',
        minTimeSeconds: minTimeSecondsNorm,
        maxTimeSeconds: maxTimeSecondsNorm,
        minOrderDays: normalizeDoohDays(mv.minOrderQuantitytimeline),
        maxOrderDays:
          normalizeDoohDays(mv.maxOrderQuantitytimeline) ||
          normalizeDoohDays(mv.minOrderQuantitytimeline),
        UploadLink: data?.UploadLink ?? '',
        HSN: mv.HSN ?? mv.hsn ?? '',
        adType: mv.adType ?? data?.adType ?? '',
        GST:
          mv.GST != null && mv.GST !== ''
            ? String(mv.GST)
            : data?.GST != null
              ? String(data.GST)
              : '18',
        supportingDocs: supportingDocsToCheckboxState(data?.WhatSupportingYouWouldGiveToBuyer),
      });
      if (data?.tags?.length) setTags(data.tags);
      if (Array.isArray(data?.ProductFeatures)) setItems(data.ProductFeatures);
      if (Array.isArray(data?.OtherInformationBuyerMustKnowOrRemarks)) {
        setOtherInfoArray(data.OtherInformationBuyerMustKnowOrRemarks);
      }
      if (Array.isArray(data?.OtherCost) && data.OtherCost.length > 0) {
        OthercostReplace(data.OtherCost);
      } else {
        OthercostReplace([]);
      }
    } catch {
      toast.error('Failed to load product');
    }
  };

  useEffect(() => {
    fetchMediaOnlineFeatures();
  }, []);

  useEffect(() => {
    FetchProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once per product id
  }, [ProductId]);

  const otherenter = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const others = otherInputRef.current?.value?.trim();
      if (others) {
        if (!OtherInfoArray.includes(others)) {
          setOtherInfoArray([...OtherInfoArray, others]);
        }
        otherInputRef.current.value = '';
      }
    }
  };

  const OtherInformationSubmit = () => {
    const others = otherInputRef.current?.value?.trim();
    if (others && !OtherInfoArray.includes(others)) {
      setOtherInfoArray([...OtherInfoArray, others]);
      otherInputRef.current.value = '';
    }
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const currentTag = tagInputRef.current?.value?.trim();
      if (currentTag && !tags.includes(currentTag)) {
        setTags([...tags, currentTag]);
        tagInputRef.current.value = '';
      }
    }
  };

  const handleAddButtonClick = () => {
    const currentTag = tagInputRef.current?.value?.trim();
    if (currentTag && !tags.includes(currentTag)) {
      setTags([...tags, currentTag]);
      tagInputRef.current.value = '';
    }
  };

  const handleDeleteTag = (tagToDelete) => {
    setTags((prev) => prev.filter((t) => t !== tagToDelete));
  };

  const handleItemAdd = () => {
    if (items.length >= 20) {
      return toast.error('Features cannot be more than 20');
    }
    if (!description.trim()) {
      return toast.error('Please enter a feature description');
    }
    if (description.length > 75) {
      return toast.error('Feature description must be 75 characters or less');
    }
    if (!name.trim()) {
      return toast.error('Please select a feature name');
    }
    if (name !== 'Other' && items.some((res) => res.name === name)) {
      setName('');
      return toast.error('Please choose a unique feature');
    }
    setItems([...items, { name, description: description.trim() }]);
    setDescription('');
  };

  const handleDelete = (index) => {
    const next = [...items];
    next.splice(index, 1);
    setItems(next);
  };

  const onValidSubmit = handleSubmit(async () => {
    if (checkboxStateToSupportingArray(storeMediaAllData.supportingDocs).length === 0) {
      toast.error('Select at least one supporting document for the buyer');
      return;
    }
    const minDays = Number(storeMediaAllData.minOrderDays);
    const maxDays = Number(storeMediaAllData.maxOrderDays);
    if (![10, 20, 30].includes(minDays) || ![10, 20, 30].includes(maxDays)) {
      toast.error('Select Min and Max Days (10, 20, or 30)');
      return;
    }
    if (maxDays < minDays) {
      toast.error('Max Days cannot be less than Min Days');
      return;
    }
    if (!storeMediaAllData.adType) {
      toast.error('Select ad type / placement');
      return;
    }
    if (!storeMediaAllData.HSN?.trim()) {
      toast.error('Enter HSN');
      return;
    }
    if (storeMediaAllData.GST === '' || storeMediaAllData.GST == null) {
      toast.error('Select GST rate');
      return;
    }
    const loopTimeSeconds = Number(storeMediaAllData.loopTimeSeconds);
    if (!Number.isFinite(loopTimeSeconds) || loopTimeSeconds < 10 || loopTimeSeconds > 180) {
      toast.error('Looptime (In Seconds) must be between 10 and 180');
      return;
    }
    const minTimeSeconds = Number(storeMediaAllData.minTimeSeconds);
    if (!Number.isFinite(minTimeSeconds) || minTimeSeconds < 10 || minTimeSeconds > 60) {
      toast.error('Min Time Seconds must be between 10 and 60');
      return;
    }
    const maxTimeSeconds = Number(storeMediaAllData.maxTimeSeconds);
    if (!Number.isFinite(maxTimeSeconds) || maxTimeSeconds < 10 || maxTimeSeconds > 60) {
      toast.error('Max Time Seconds must be between 10 and 60');
      return;
    }
    if (maxTimeSeconds < minTimeSeconds) {
      toast.error('Max Time Seconds cannot be less than Min Time Seconds');
      return;
    }
    if (!storeMediaAllData.mediaName?.trim()) {
      toast.error('Enter media name');
      return;
    }
    if (!storeMediaAllData.offeringbrandat?.trim()) {
      toast.error('Enter where this branding is offered');
      return;
    }
    const rep = Number(storeMediaAllData.repetition);
    if (!Number.isFinite(rep) || rep < 1) {
      toast.error('Enter repetition (minimum 1)');
      return;
    }
    if (!storeMediaAllData.dimensionSize?.trim()) {
      toast.error('Enter dimension size');
      return;
    }
    if (items.length < 5) {
      toast.error('Add at least 5 product features (max 20)');
      return;
    }
    if (items.length > 20) {
      toast.error('At most 20 product features');
      return;
    }
    if (tags.length === 0) {
      toast.error('Add at least one tag');
      return;
    }

    const baseMv = productData?.mediaVariation && typeof productData.mediaVariation === 'object'
      ? { ...productData.mediaVariation }
      : {};

    const campaignDurationQuantity = maxDays;

    const mediaVariation = {
      ...baseMv,
      minOrderQuantityunit: 1,
      maxOrderQuantityunit: 1,
      minOrderQuantitytimeline: minDays,
      maxOrderQuantitytimeline: maxDays,
      campaignDurationQuantity,
      minTimeslotSeconds: minTimeSeconds,
      maxTimeslotSeconds: maxTimeSeconds,
      loopTimeSeconds: loopTimeSeconds,
      GST: storeMediaAllData.GST,
      HSN: storeMediaAllData.HSN.trim(),
      Timeline: 'Day',
      timeline: 'Day',
      repetition: rep,
      dimensionSize: storeMediaAllData.dimensionSize.trim(),
      adType: storeMediaAllData.adType,
    };

    const otherCostRows = getValues().OtherCost || [];

    const datatobesent = {
      ...getValues(),
      id: ProductId,
      ProductId,
      _id: ProductId,
      mediaName: storeMediaAllData.mediaName.trim(),
      offeringbrandat: storeMediaAllData.offeringbrandat.trim(),
      offerningbrandat: storeMediaAllData.offeringbrandat.trim(),
      adType: storeMediaAllData.adType,
      repetition: rep,
      GST: storeMediaAllData.GST,
      ProductQuantity: 0,
      WhatSupportingYouWouldGiveToBuyer: checkboxStateToSupportingArray(
        storeMediaAllData.supportingDocs,
      ),
      OtherCost: otherCostRows,
      ProductFeatures: items,
      ProductsVariantions: [mediaVariation],
      OtherInformationBuyerMustKnowOrRemarks: OtherInfoArray,
      mediaVariation,
      ProductUploadStatus: 'technicalinformation',
      ListingType: 'Media',
      tags,
      minOrderQuantityunit: 1,
      maxOrderQuantityunit: 1,
      dimensionSize: storeMediaAllData.dimensionSize.trim(),
      minOrderQtyTimeline: minDays,
      maxOrderQtyTimeline: maxDays,
      minOrderTimeslot: minTimeSeconds,
      maxOrderTimeslot: maxTimeSeconds,
      loopTimeSeconds: loopTimeSeconds,
      timeline: 'Day',
      Timeline: 'Day',
      campaignDurationQuantity,
      UploadLink: storeMediaAllData.UploadLink?.trim() || '',
    };

    setIsSubmitting(true);
    try {
      await api.post('/product/product_mutation_digitalads', datatobesent);
      toast.success('Technical information saved!');
      navigate(`/mediaonline/digitalscreensgolive/${ProductId}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-8">
      <div className="form-container">
        <div className="stepper-layout">
          <aside className="stepper-rail">
            <Stepper currentStep={3} category="mediaonline" completedSteps={[1, 2]} />
          </aside>
          <main className="stepper-content">
            <div className="max-w-4xl mx-auto px-4 pb-16">
              <div className="form-section bg-white rounded-lg shadow-sm border border-[#E2E8F0] p-6">
                <h2 className="form-section-title mb-6">Digital Screens – Technical Information</h2>
                <form onSubmit={onValidSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Media name *</Label>
                      <Input
                        value={storeMediaAllData.mediaName}
                        onChange={(e) =>
                          setStoreMediaAllData((p) => ({ ...p, mediaName: e.target.value }))
                        }
                        placeholder="e.g. Mumbai airport digital network"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Offering this branding at? *</Label>
                      <Input
                        value={storeMediaAllData.offeringbrandat}
                        onChange={(e) =>
                          setStoreMediaAllData((p) => ({ ...p, offeringbrandat: e.target.value }))
                        }
                        placeholder="e.g. Near departure gate digital totems"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Repetition *</Label>
                      <Input
                        type="number"
                        min={1}
                        value={storeMediaAllData.repetition}
                        onChange={(e) =>
                          setStoreMediaAllData((p) => ({ ...p, repetition: e.target.value }))
                        }
                        placeholder="e.g. 5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Dimension size *</Label>
                      <Input
                        value={storeMediaAllData.dimensionSize}
                        onChange={(e) =>
                          setStoreMediaAllData((p) => ({ ...p, dimensionSize: e.target.value }))
                        }
                        placeholder="e.g. 1920 x 1080 px"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Looptime (In Seconds) *</Label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={storeMediaAllData.loopTimeSeconds}
                        onChange={(e) =>
                          setStoreMediaAllData((p) => ({ ...p, loopTimeSeconds: e.target.value }))
                        }
                      >
                        <option value="">Select loop time</option>
                        {LOOPTIME_SECOND_OPTIONS.map((sec) => (
                          <option key={`loop-${sec}`} value={sec}>
                            {sec}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2 md:col-span-2" style={{ marginTop: "10px" }}>
                      {/* <Label>Min / Max Time (In Seconds) *</Label> */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs">Min Time Seconds *</Label>
                          <select
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            value={storeMediaAllData.minTimeSeconds}
                            onChange={(e) => {
                              const nextMin = e.target.value;
                              const nextMinNumber = Number(nextMin);
                              setStoreMediaAllData((p) => {
                                const prevMax = Number(p.maxTimeSeconds);
                                let nextMax = p.maxTimeSeconds;
                                if (!nextMin) {
                                  nextMax = '';
                                } else if (
                                  !Number.isFinite(prevMax) ||
                                  prevMax < nextMinNumber
                                ) {
                                  nextMax = nextMin;
                                }
                                return {
                                  ...p,
                                  minTimeSeconds: nextMin,
                                  maxTimeSeconds: nextMax,
                                };
                              });
                            }}
                          >
                            <option value="">Select min seconds</option>
                            {MIN_MAX_TIMESLOT_OPTIONS.map((sec) => (
                              <option key={sec} value={sec}>
                                {sec}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Max Time Seconds *</Label>
                          <select
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            value={storeMediaAllData.maxTimeSeconds}
                            onChange={(e) =>
                              setStoreMediaAllData((p) => ({ ...p, maxTimeSeconds: e.target.value }))
                            }
                            disabled={!storeMediaAllData.minTimeSeconds}
                          >
                            <option value="">
                              {storeMediaAllData.minTimeSeconds
                                ? 'Select max seconds'
                                : 'Select min seconds first'}
                            </option>
                            {maxTimeOptions.map((sec) => (
                              <option key={sec} value={sec}>
                                {sec}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2" style={{ marginTop: "10px" }}>
                      <Label>Min Days *</Label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={storeMediaAllData.minOrderDays}
                        onChange={(e) =>
                          setStoreMediaAllData((p) => {
                            const next = { ...p, minOrderDays: e.target.value };
                            // keep max >= min
                            if (Number(p.maxOrderDays) < Number(e.target.value)) {
                              next.maxOrderDays = e.target.value;
                            }
                            return next;
                          })
                        }
                      >
                        <option value="">Select min days</option>
                        {DOOH_DAY_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt} Days
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2" style={{ marginTop: "10px" }}>
                      <Label>Max Days *</Label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={storeMediaAllData.maxOrderDays}
                        onChange={(e) =>
                          setStoreMediaAllData((p) => ({ ...p, maxOrderDays: e.target.value }))
                        }
                        disabled={!storeMediaAllData.minOrderDays}
                      >
                        <option value="">
                          {storeMediaAllData.minOrderDays ? 'Select max days' : 'Select min days first'}
                        </option>
                        {DOOH_DAY_OPTIONS.filter(
                          (opt) => Number(opt) >= Number(storeMediaAllData.minOrderDays || 0),
                        ).map((opt) => (
                          <option key={opt} value={opt}>
                            {opt} Days
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-[#6B7A99]">
                        DOOH is sold in 10 / 20 / 30 day blocks.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Ad type / placement *</Label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={storeMediaAllData.adType}
                        onChange={(e) =>
                          setStoreMediaAllData((p) => ({ ...p, adType: e.target.value }))
                        }
                      >
                        <option value="">Select placement</option>
                        {DOOH_AD_TYPE_OPTIONS_FILTERED.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>GST % *</Label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                        value={storeMediaAllData.GST}
                        onChange={(e) =>
                          setStoreMediaAllData((p) => ({ ...p, GST: e.target.value }))
                        }
                      >
                        {LISTING_GST_RATE_OPTIONS.map((g) => (
                          <option key={g} value={g}>
                            {formatListingGstPercentLabel(g)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>HSN *</Label>
                      <Input
                        value={storeMediaAllData.HSN}
                        onChange={(e) =>
                          setStoreMediaAllData((p) => ({ ...p, HSN: e.target.value }))
                        }
                        placeholder="e.g. 998314"
                      />
                    </div>
                    {!isDigitalAdsJourney && (
                      <div className="space-y-2">
                        <Label>Creative / upload link</Label>
                        <Input
                          value={storeMediaAllData.UploadLink}
                          onChange={(e) =>
                            setStoreMediaAllData((p) => ({ ...p, UploadLink: e.target.value }))
                          }
                          placeholder="https://..."
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label>What supporting document would you give to the buyer? *</Label>
                    <div className="flex flex-wrap gap-4">
                      {DOOH_SUPPORTING_DOC_KEYS.map((docKey) => (
                        <label key={docKey} className="flex items-center gap-2 text-sm text-[#6B7A99]">
                          <input
                            type="checkbox"
                            value={docKey}
                            checked={!!storeMediaAllData.supportingDocs[docKey]}
                            onChange={handleCheckboxChange}
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
                      defaultValue={
                        OthercostEditId !== null ? OthercostFields[OthercostEditId] : null
                      }
                      index={OthercostEditId}
                    />
                    {OthercostFields.length > 0 && (
                      <TableContainer
                        sx={{
                          border: '1px solid #e3e3e3',
                          borderRadius: '10px',
                          overflow: 'auto',
                        }}
                      >
                        <Table
                          size="small"
                          sx={{
                            [`& .${tableCellClasses.root}`]: { borderBottom: 'none' },
                          }}
                        >
                          {OthercostFields.map((item, idx) => (
                            <React.Fragment key={item.id}>
                              <TableHead>
                                <TableRow>
                                  {OthercostFieldsarray.map((data) => (
                                    <TableCell
                                      key={data}
                                      align="left"
                                      sx={{ ...tableDataStyle, padding: '10px' }}
                                      component="th"
                                    >
                                      {data}
                                    </TableCell>
                                  ))}
                                  <TableCell align="center" sx={tableDataStyle} component="th">
                                    Actions
                                  </TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                <TableRow>
                                  <TableCell sx={TableCellStyle}>{item.AdCostApplicableOn}</TableCell>
                                  <TableCell sx={TableCellStyle}>
                                    <span className="inline-flex items-center gap-1">
                                      {item.CostPrice}
                                      {item.currencyType === 'BXITokens' ? (
                                        <img src={bxitoken} alt="" className="w-3.5 h-3.5" />
                                      ) : (
                                        item.currencyType
                                      )}
                                    </span>
                                  </TableCell>
                                  <TableCell sx={TableCellStyle}>{item.AdCostHSN}</TableCell>
                                  <TableCell sx={TableCellStyle}>{item.AdCostGST} %</TableCell>
                                  <TableCell sx={TableCellStyle}>{item.ReasonOfCost}</TableCell>
                                  <TableCell align="center" sx={TableCellStyle}>
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
                              </TableBody>
                            </React.Fragment>
                          ))}
                        </Table>
                      </TableContainer>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label>Product features * (min 5, max 20)</Label>
                      <p className="text-xs text-[#6B7A99] mt-1">
                        Pick a feature, add a short description (max 75 chars), then add to the list.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <select
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        >
                          <option value="">Select feature</option>
                          {filterFeatureDropdownRows(
                            MediaOnlineFeaturesData,
                            FEATURE_ALLOWLIST_BY_KEY.dooh,
                            items.map((i) => i.name),
                          ).map((el, idx) =>
                            el?.IsHead ? (
                              <option key={idx} disabled value={`_section_${idx}`}>
                                — {el.MediaonlineFeaturesingle} —
                              </option>
                            ) : (
                              <option key={idx} value={el.MediaonlineFeaturesingle}>
                                {el.MediaonlineFeaturesingle}
                              </option>
                            ),
                          )}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Short description (max 75 characters)"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          rows={2}
                          maxLength={75}
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
                    {items.length > 0 && items.length < 5 && (
                      <p className="text-sm text-red-600">
                        Add {5 - items.length} more feature(s) to reach the minimum of 5.
                      </p>
                    )}
                    <div className="space-y-2">
                      {items.map((item, index) => (
                        <div
                          key={`${item.name}-${index}`}
                          className="flex items-start justify-between gap-2 rounded-lg border border-[#E3E3E3] p-3"
                        >
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

                  <div className="space-y-2">
                    <Label>Other information buyer must know / remarks</Label>
                    <div className="flex gap-2">
                      <Input ref={otherInputRef} placeholder="Add a remark and press Enter" onKeyDown={otherenter} />
                      <Button type="button" variant="outline" onClick={OtherInformationSubmit}>
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {OtherInfoArray.map((line) => (
                        <Badge
                          key={line}
                          variant="secondary"
                          className="cursor-pointer gap-1 max-w-full whitespace-normal text-left"
                          onClick={() => setOtherInfoArray((a) => a.filter((x) => x !== line))}
                        >
                          {line}
                          <X className="w-3 h-3 shrink-0" />
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Tags *</Label>
                    <div className="flex gap-2">
                      <Input
                        ref={tagInputRef}
                        placeholder="Add tag (max 15 chars) and press Enter"
                        maxLength={15}
                        onKeyDown={handleAddTag}
                      />
                      <Button type="button" variant="outline" onClick={handleAddButtonClick}>
                        Add tag
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => handleDeleteTag(tag)}
                        >
                          {tag} <X className="w-3 h-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between pt-6 border-t border-[#E5E7EB]">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate(`/mediaonline/mediaonlinedigitalscreensinfo/${ProductId}`)}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-[#C64091] hover:bg-[#A03375]"
                    >
                      {isSubmitting ? 'Saving...' : 'Save & Next'}{' '}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </form>

                <Button
                  variant="ghost"
                  className="mt-4 text-[#6B7A99]"
                  type="button"
                  onClick={() => window.confirm('Cancel product?') && navigate('/sellerhub')}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
