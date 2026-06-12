import {
  Box,
  Typography,
  TextField,
  Button as MuiButton,
  Dialog,
} from '@mui/material';
import { Stack } from '@mui/system';
import { useUpdateProductQuery } from './ProductHooksQuery';
import { useNavigate, useParams } from 'react-router-dom';
import React, { useState, useEffect, useMemo } from 'react';
import api from '../../utils/api';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { DateRangePicker } from 'mui-daterange-picker';
import { ArrowLeft, ArrowRight, Info } from 'lucide-react';
import { Button } from '../../components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../components/ui/tooltip';
import RemoveIcon from '../../assets/Images/CommonImages/RemoveIcon.svg';
import addItemCartIcon from '../../assets/CartPage/addItemIcon.svg';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import defaultIcon from '../../assets/CartPage/defaultCheckBoxIcon.svg';
import { Stepper } from '../AddProduct/AddProductSteps';
import {
  supportingDocsToCheckboxState,
  checkboxStateToSupportingArray,
  emptySupportingCheckboxState,
} from '../../utils/supportingBuyerDocs';
import {
  getMediaListingProfile,
  RADIO_SUPPORTING_DOC_KEYS,
} from '../../config/mediaListingProfiles';
const options = { day: '2-digit', month: 'short', year: 'numeric' };

/** Row-major pairs for a stable 2-column grid (left | right). */
const SUPPORTING_DOC_PAIR_ROWS = [
  ['inspectionPass', 'Pictures'],
  ['LogReport', 'ExhibitionCertificate'],
  ['Videos', 'Other'],
  ['broadcastCertificate', null],
];

const SUPPORTING_DOC_UI_LABELS = {
  inspectionPass: 'Inspection pass',
  LogReport: 'Log Report',
  Videos: 'Videos',
  Pictures: 'Pictures',
  ExhibitionCertificate: 'Exhibition Certificate',
  estimatedFleets: 'Estimated Fleets',
  broadcastCertificate: 'Broadcast Certificate',
  telecastCertificate: 'Telecast Certificate',
  Other: 'Other',
};

function isSupportingDocChecked(v) {
  return v === true || v === 'on';
}

export default function TechInfo() {
  const ProductId = useParams().id;
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const [dateArr, setDateArr] = useState([]);
  const [fetchproductData, setfetchProductData] = useState();
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(null);
  const onChange = (dates) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);
  };
  const [taxbtn, setTaxbtn] = React.useState('');

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };
  const [checkBoxes, setCheckBoxes] = useState(emptySupportingCheckboxState);

  const toggle = () => setOpen(!open);
  const countDaysfromTimeline = (value, timeline) => {
    if (timeline === 'Week') {
      return value * 7;
    } else if (timeline === 'Month') {
      return value * 30;
    } else if (timeline === 'Year') {
      return value * 365;
    } else if (timeline === 'Day') {
      return value;
    } else if (fetchproductData?.mediaVariation?.unit === 'Spot') {
      return fetchproductData?.mediaVariation?.maxOrderQuantityunit;
    } else if (timeline === 'One Time') {
      return value;
    }
  };
  const techFormProfile = getMediaListingProfile(fetchproductData || {});
  const isRadioMediaListing =
    techFormProfile.key === 'radio' ||
    fetchproductData?.ProductSubCategoryName === 'Radio' ||
    fetchproductData?.ProductSubCategory === '65029534eaa5251874e8c6c1';
  const radioSupportingDocKeys = useMemo(
    () =>
      Array.isArray(techFormProfile.supportingDocKeys) &&
      techFormProfile.supportingDocKeys.length
        ? techFormProfile.supportingDocKeys
        : RADIO_SUPPORTING_DOC_KEYS,
    [techFormProfile.supportingDocKeys],
  );
  const supportingDocGridRows = useMemo(() => {
    if (techFormProfile.key === 'television') {
      return [
        ['Videos', 'Pictures'],
        ['LogReport', 'telecastCertificate'],
        ['Other', null],
      ];
    }
    if (techFormProfile.key === 'radio') {
      return [
        ['broadcastCertificate', 'LogReport'],
        ['Videos', 'Pictures'],
        ['Other', null],
      ];
    }
    return SUPPORTING_DOC_PAIR_ROWS;
  }, [techFormProfile.key]);
  const [loopTimeMinutes, setLoopTimeMinutes] = useState('');

  function showSupportingDocKey(key) {
    if (isRadioMediaListing) {
      return radioSupportingDocKeys.includes(key);
    }
    if (Array.isArray(techFormProfile.supportingDocKeys) && techFormProfile.supportingDocKeys.length) {
      return techFormProfile.supportingDocKeys.includes(key);
    }
    return true;
  }

  const sanitizeSupportingCheckboxState = (rawState, allowedKeys) => {
    const next = { ...emptySupportingCheckboxState(), ...rawState };
    Object.keys(next).forEach((k) => {
      if (!allowedKeys.includes(k)) next[k] = false;
    });
    return next;
  };

  const validationSchema = useMemo(
    () =>
      z.object({
        Dimensions: isRadioMediaListing
          ? z.string().max(500)
          : z.string().min(1).max(500),
      }),
    [isRadioMediaListing],
  );

  const resolver = useMemo(
    () => zodResolver(validationSchema),
    [validationSchema],
  );

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    control,
    reset,
    setError,
    clearErrors,
    formState: { errors, isValid },
  } = useForm({
    Values: {
      Dimensions: fetchproductData?.dimensions,
      WhatSupportingYouWouldGiveToBuyer:
        fetchproductData?.whatSupportingYouWouldGiveToBuyer,
    },
    resolver,
  });

  const FetchProduct = async () => {
    await api
      .get(`product/get_product_byId/${ProductId}`)
      .then((res) => {
        const data = res?.data ?? res;
        setfetchProductData(data);
        setValue('Dimensions', data?.Dimensions);
        const profile = getMediaListingProfile(data || {});
        const loadedSupporting = supportingDocsToCheckboxState(
          data?.WhatSupportingYouWouldGiveToBuyer,
        );
        const isRadio =
          profile.key === 'radio' ||
          data?.ProductSubCategoryName === 'Radio' ||
          data?.ProductSubCategory === '65029534eaa5251874e8c6c1';
        const allowedRadio =
          Array.isArray(profile.supportingDocKeys) && profile.supportingDocKeys.length
            ? profile.supportingDocKeys
            : RADIO_SUPPORTING_DOC_KEYS;
        setCheckBoxes(
          isRadio
            ? sanitizeSupportingCheckboxState(loadedSupporting, allowedRadio)
            : loadedSupporting,
        );
        setLoopTimeMinutes(
          data?.loopTimeMinutes != null && data?.loopTimeMinutes !== ''
            ? String(data.loopTimeMinutes)
            : '',
        );
        setDateArr(data?.calender ?? []);
      })
      .catch(() => { });
  };

  useEffect(() => {
    FetchProduct();
  }, []);

  useEffect(() => {
    if (!fetchproductData || typeof sessionStorage === 'undefined') return;
    if (fetchproductData.mediaJourney) {
      sessionStorage.setItem('mediaJourney', fetchproductData.mediaJourney);
      localStorage.setItem('mediaJourney', fetchproductData.mediaJourney);
    }
    if (fetchproductData.mediaCategory) {
      sessionStorage.setItem('mediaCategory', fetchproductData.mediaCategory);
      localStorage.setItem('mediaCategory', fetchproductData.mediaCategory);
    }
  }, [fetchproductData]);

  function getDaysBetweenDates(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = end?.getTime() - start?.getTime();
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1;

    return days;
  }
  const {
    mutate: updateProduct,
    isLoading,
    isError,
    data: productData,
    variables,

    error: RegisterError,
  } = useUpdateProductQuery();
  useEffect(() => {
    dateArr.map((item) => {
      return getDaysBetweenDates(item.startDate, item.endDate);
    });
  }, []);
  const updateProductTechinfostatus = handleSubmit((data) => {
    try {
      const MaxDaysTobeadded = countDaysfromTimeline(
        fetchproductData?.mediaVariation?.maxOrderQuantitytimeline,
        fetchproductData?.mediaVariation?.Timeline,
      );
      let Totaldays = 0;
      dateArr.map((item) => {
        return (Totaldays += getDaysBetweenDates(item.startDate, item.endDate));
      });

      const allowedSupportingKeys = isRadioMediaListing
        ? radioSupportingDocKeys
        : Array.isArray(techFormProfile.supportingDocKeys) &&
            techFormProfile.supportingDocKeys.length
          ? techFormProfile.supportingDocKeys
          : null;
      const selectedKeys = checkboxStateToSupportingArray(checkBoxes).filter((k) =>
        allowedSupportingKeys ? allowedSupportingKeys.includes(k) : true,
      );
      const datatobesent = {
        ...data,
        id: ProductId,
        WhatSupportingYouWouldGiveToBuyer: selectedKeys,
        calender: dateArr,
        ProductUploadStatus: 'technicalinformation',
        BXISpace: false,
        UploadLink: '',
      };
      const supportingOk =
        selectedKeys.length > 0 &&
        (allowedSupportingKeys
          ? selectedKeys.some((k) => allowedSupportingKeys.includes(k))
          : true);
      if (!supportingOk) {
        toast.error(
          isRadioMediaListing
            ? 'Please select at least one supporting document (broadcast certificate, log report, videos, pictures, or other)'
            : 'Please select at least one supporting document',
        );
        return;
      }
      let loopPayload = {};
      if (techFormProfile.loopTimeField && techFormProfile.key !== 'airport') {
        const sec = Math.round(Number(String(loopTimeMinutes).replace(/,/g, '').trim()));
        if (!Number.isFinite(sec) || sec < 10) {
          toast.error('Loop time must be a whole number of at least 10 seconds');
          return;
        }
        loopPayload = { loopTimeSeconds: sec, loopTimeMinutes: sec };
      }
      const datatobesentFinal = { ...datatobesent, ...loopPayload };
      updateProduct(datatobesentFinal, {
        onSuccess: (response) => {
          if (response.status === 200) {
            // Use new dynamic route
            navigate(`/mediaonline/go-live/${ProductId}`);
          }
        },
        onError: (error) => { },
      });
    } catch (error) {
      return error;
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

  const renderSupportingToggle = (docKey) => {
    const label = SUPPORTING_DOC_UI_LABELS[docKey];
    const checked = isSupportingDocChecked(checkBoxes[docKey]);
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          minHeight: 40,
        }}
      >
        {checked ? (
          <>
            <Box
              component="img"
              src={addItemCartIcon}
              onClick={() => {
                setCheckBoxes({
                  ...checkBoxes,
                  [docKey]: false,
                });
              }}
              alt=""
              sx={{ width: 30, height: 30, cursor: 'pointer', flexShrink: 0 }}
            />
            <Typography sx={{ ...CommonTextStyle, color: '#445fd2' }}>
              {label}
            </Typography>
          </>
        ) : (
          <>
            <Box
              component="img"
              src={defaultIcon}
              onClick={() => {
                setCheckBoxes({
                  ...checkBoxes,
                  [docKey]: 'on',
                });
              }}
              alt=""
              sx={{ width: 30, height: 30, cursor: 'pointer', flexShrink: 0 }}
            />
            <Typography sx={{ ...CommonTextStyle }}>{label}</Typography>
          </>
        )}
      </Box>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-8">
      <div className="form-container">
        <div className="stepper-layout">
          <aside className="stepper-rail">
            <Stepper currentStep={3} category="mediaonline" completedSteps={[1, 2]} />
          </aside>
          <main className="stepper-content">
        <div className="form-section">
          <div className="mb-6 w-full border-b border-[#E5E7EB] pb-4">
            <div className="flex items-center gap-2">
              <h2 className="m-0 border-0 p-0 text-[18px] font-semibold leading-snug text-[#111827] [font-family:Manrope,ui-sans-serif,sans-serif]">
                Technical Information
              </h2>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="text-[#6B7A99] hover:text-[#C64091] shrink-0">
                      <Info className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Technical Information refers to specific details and specifications about a product&apos;s technical aspects, packaging Material, packing size, Dimensions, logistic or go live information for your offered product. This is Critical Information from Logistic &amp; Buying Perspective for Making Informed Decisions.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <form onSubmit={updateProductTechinfostatus} className="space-y-6 mt-6">
            <Box sx={{ width: '100%', overflow: 'auto' }}>
              <Stack>
                <Box sx={{ display: 'grid', gap: 1.5, py: 0.5, width: '100%' }}>
                  <Typography sx={{ ...CommonTextStyle, lineHeight: 1.35 }}>
                    What supporting document would you like to give to the
                    Buyer? <span style={{ color: 'red' }}> *</span>
                  </Typography>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'minmax(0, 1fr) minmax(0, 1fr)',
                      },
                      columnGap: { xs: 0, sm: 4 },
                      rowGap: 1.5,
                      alignItems: 'center',
                      width: '100%',
                    }}
                  >
                    {supportingDocGridRows.map(([leftKey, rightKey], rowIdx) => {
                      const leftShow = leftKey && showSupportingDocKey(leftKey);
                      const rightShow = rightKey && showSupportingDocKey(rightKey);
                      if (!leftShow && !rightShow) return null;

                      if (leftShow && rightShow) {
                        return (
                          <React.Fragment key={`support-row-${rowIdx}`}>
                            {renderSupportingToggle(leftKey)}
                            {renderSupportingToggle(rightKey)}
                          </React.Fragment>
                        );
                      }

                      const soloKey = leftShow ? leftKey : rightKey;
                      return (
                        <Box
                          key={`support-row-${rowIdx}-solo`}
                          sx={{
                            gridColumn: { xs: 'auto', sm: '1 / -1' },
                            width: '100%',
                          }}
                        >
                          {renderSupportingToggle(soloKey)}
                        </Box>
                      );
                    })}
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: 'grid',
                    gap: 1,
                    py: 0.5,
                    width: '100%',
                    maxWidth: '100%',
                  }}
                >
                  <Typography sx={{ ...CommonTextStyle, lineHeight: 1.35 }}>
                    {isRadioMediaListing
                      ? 'AD Duration'
                      : 'Dimensions of Ad / Content Needed'}{' '}
                    {!isRadioMediaListing && (
                      <span style={{ color: 'red' }}> *</span>
                    )}
                  </Typography>

                  <TextField
                    multiline
                    variant="standard"
                    placeholder="Eg. 30 Sec"
                    {...register('Dimensions')}
                    sx={{
                      ...borderlessTextFieldSx,
                      minHeight: 47,
                      bgcolor: errors['Dimensions']?.message
                        ? 'rgba(254, 226, 226, 0.35)'
                        : 'transparent',
                    }}
                    InputProps={{
                      disableUnderline: true,
                    }}
                  />
                </Box>
                <Typography sx={ErrorStyle}>
                  {errors['Dimensions']?.message}
                </Typography>
                {techFormProfile.loopTimeField && techFormProfile.key !== 'airport' ? (
                  <Box
                    sx={{
                      display: 'grid',
                      gap: 1,
                      py: 0.5,
                      width: '100%',
                      maxWidth: '100%',
                    }}
                  >
                    <Typography sx={{ ...CommonTextStyle, lineHeight: 1.35 }}>
                      Loop time (seconds)
                    </Typography>
                    <TextField
                      variant="standard"
                      placeholder="e.g. 5"
                      value={loopTimeMinutes}
                      onChange={(e) => setLoopTimeMinutes(e.target.value)}
                      sx={{
                        ...borderlessTextFieldSx,
                        minHeight: 47,
                      }}
                      InputProps={{ disableUnderline: true }}
                    />
                  </Box>
                ) : null}

              </Stack>
            </Box>

            {/* Actions - same as General Information page */}
            <div className="flex justify-between pt-6 gap-2 flex-wrap">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/mediaonline/product-info/${ProductId}`)}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button type="button" variant="outline" onClick={CancelJourney}>
                  Cancel
                </Button>
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-[#C64091] hover:bg-[#A03375]"
              >
                {isLoading ? 'Saving...' : 'Next'}
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

const CommonTextStyle = {
  fontFamily: 'Inter, sans-serif',
  fontStyle: 'normal',
  fontWeight: 400,
  fontSize: '14px',
  lineHeight: '21px',
  color: '#6B7A99',
};

const borderlessTextFieldSx = {
  fontFamily: 'Inter, sans-serif',
  fontSize: '14px',
  fontWeight: 400,
  width: '100%',
  maxWidth: '100%',
  border: 'none',
  boxShadow: 'none',
  outline: 'none',
  '& .MuiInputBase-root': {
    border: 'none',
    boxShadow: 'none',
    borderRadius: 0,
    borderBottom: '1px solid #E5E7EB',
    '&:before': { borderBottom: 'none !important' },
    '&:after': { borderBottom: 'none !important' },
  },
  '& .MuiInputBase-input': {
    color: '#111827',
    paddingLeft: 0,
    paddingBottom: '6px',
    '&::placeholder': {
      color: '#9CA3AF',
      opacity: 1,
    },
  },
  '&:focus-within .MuiInputBase-root': {
    borderBottomColor: '#9CA3AF',
  },
};

const ErrorStyle = {
  color: 'red',
};


