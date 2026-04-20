import {
  Box,
  Typography,
  TextField,
  Button as MuiButton,
  Checkbox,
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
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import { Stepper } from '../AddProduct/AddProductSteps';
import {
  supportingDocsToCheckboxState,
  checkboxStateToSupportingArray,
  emptySupportingCheckboxState,
} from '../../utils/supportingBuyerDocs';
import { resolveMediaOnlineFormProfile } from '../../config/mediaListingProfiles';
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
  const [BXISpace, setBXISpace] = useState(false);
  const [content, setContent] = useState('checkbox');
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
  const label = { inputProps: { 'aria-label': 'Checkbox demo' } };
  const isRadioMediaListing =
    fetchproductData?.ProductSubCategoryName === 'Radio' ||
    fetchproductData?.ProductSubCategory === '65029534eaa5251874e8c6c1';

  const techFormProfile = resolveMediaOnlineFormProfile(fetchproductData || {});
  const supportingDocGridRows = useMemo(() => {
    if (techFormProfile.key === 'television') {
      return [
        ['Videos', 'Pictures'],
        ['LogReport', 'telecastCertificate'],
        ['Other', null],
      ];
    }
    return SUPPORTING_DOC_PAIR_ROWS;
  }, [techFormProfile.key]);
  const [loopTimeMinutes, setLoopTimeMinutes] = useState('');

  function showSupportingDocKey(key) {
    if (Array.isArray(techFormProfile.supportingDocKeys) && techFormProfile.supportingDocKeys.length) {
      return techFormProfile.supportingDocKeys.includes(key);
    }
    if (isRadioMediaListing) {
      return ['broadcastCertificate', 'LogReport'].includes(key);
    }
    return true;
  }

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    control,
    reset,
    setError,

    formState: { errors, isValid },
  } = useForm({
    Values: {
      Dimensions: fetchproductData?.dimensions,
      UploadLink: fetchproductData?.uploadLink,
      WhatSupportingYouWouldGiveToBuyer:
        fetchproductData?.whatSupportingYouWouldGiveToBuyer,
    },
    resolver: zodResolver(
      z.object({
        Dimensions: isRadioMediaListing
          ? z.string().max(500)
          : z.string().min(1).max(500),
        UploadLink: BXISpace === true ? z.any() : z.string().min(1),
        BXISpace: z.boolean(),
      }),
    ),
  });

  const ContentChange = (event) => {
    if (event.target.value === 'uploadLinkSet') {
      setContent('uploadLinkSet');
      setBXISpace('');
    } else {
      setContent(event.target.value);
    }
    reset({
      UploadLink: '',
      BXISpace: false,
    });
  };

  const FetchProduct = async () => {
    await api
      .get(`product/get_product_byId/${ProductId}`)
      .then((res) => {
        const data = res?.data ?? res;
        setfetchProductData(data);
        setValue('Dimensions', data?.Dimensions);
        setValue('UploadLink', data?.UploadLink);
        setCheckBoxes(
          supportingDocsToCheckboxState(data?.WhatSupportingYouWouldGiveToBuyer),
        );
        setLoopTimeMinutes(
          data?.loopTimeMinutes != null && data?.loopTimeMinutes !== ''
            ? String(data.loopTimeMinutes)
            : '',
        );
        setDateArr(data?.calender ?? []);
        setValue('BXISpace', data?.BXISpace);
        setBXISpace(data?.BXISpace);
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

      const datatobesent = {
        ...data,
        id: ProductId,
        WhatSupportingYouWouldGiveToBuyer: checkboxStateToSupportingArray(checkBoxes),
        calender: dateArr,
        ProductUploadStatus: 'technicalinformation',
        BXISpace: BXISpace,
      };
      const selectedKeys = checkboxStateToSupportingArray(checkBoxes);
      const supportingOk =
        selectedKeys.length > 0 &&
        (() => {
          if (Array.isArray(techFormProfile.supportingDocKeys) && techFormProfile.supportingDocKeys.length) {
            return selectedKeys.some((k) => techFormProfile.supportingDocKeys.includes(k));
          }
          if (isRadioMediaListing) {
            return selectedKeys.some((k) => k === 'broadcastCertificate' || k === 'LogReport');
          }
          return true;
        })();
      if (!supportingOk) {
        toast.error('Please select at least one supporting document');
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
                <RadioGroup
                  row
                  aria-labelledby="demo-row-radio-buttons-group-label"
                  name="row-radio-buttons-group"
                  value={content}
                  onChange={ContentChange}
                  sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    columnGap: 3,
                    rowGap: 1,
                    mt: 0.5,
                  }}
                >
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.75,
                    }}
                  >
                    <Typography
                      component="span"
                      sx={{ fontSize: '12px', color: '#6B7A99', whiteSpace: 'nowrap' }}
                    >
                      Upload Link
                    </Typography>
                    <Radio value="uploadLinkSet" size="small" sx={{ p: 0.5 }} />
                  </Box>
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.75,
                      maxWidth: { xs: '100%', sm: 'none' },
                    }}
                  >
                    <Typography
                      component="span"
                      sx={{
                        fontSize: '12px',
                        color: '#6B7A99',
                        lineHeight: 1.35,
                      }}
                    >
                      Click here to use BXI Space
                    </Typography>
                    <Radio value="checkbox" size="small" sx={{ p: 0.5, flexShrink: 0 }} />
                  </Box>
                </RadioGroup>
                {content !== 'checkbox' ? (
                  <>
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
                        Content Upload Link ( Share a link where buyer can
                        drop a content ){' '}
                        <span style={{ color: 'red' }}> *</span>
                      </Typography>

                      <TextField
                        multiline
                        variant="standard"
                        placeholder="Uploaded content has to go to seller with PO & Confirmation"
                        {...register('UploadLink')}
                        sx={{
                          ...borderlessTextFieldSx,
                          minHeight: 47,
                          bgcolor: errors['UploadLink']?.message
                            ? 'rgba(254, 226, 226, 0.35)'
                            : 'transparent',
                        }}
                        InputProps={{
                          disableUnderline: true,
                        }}
                      />
                    </Box>
                    <Typography sx={ErrorStyle}>
                      {errors['UploadLink']?.message}
                    </Typography>
                  </>
                ) : (
                  <>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 1.5,
                        mt: 2,
                        width: '100%',
                        maxWidth: '100%',
                      }}
                    >
                      <Checkbox
                        {...label}
                        {...register('BXISpace')}
                        checked={BXISpace === true ? true : false}
                        onChange={(e) => setBXISpace(e.target.checked)}
                        sx={{ p: 0, mt: 0.25 }}
                      />
                      <Typography
                        sx={{
                          ...CommonTextStyle,
                          flex: 1,
                          minWidth: 0,
                          lineHeight: 1.5,
                        }}
                      >
                        Click here to use BXI Space from you can download ,
                        though BXI does not take responsibility for the
                        content{' '}
                      </Typography>
                    </Box>
                    <Typography sx={ErrorStyle}>
                      {errors['UploadLink']?.message}
                    </Typography>
                  </>
                )}

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


