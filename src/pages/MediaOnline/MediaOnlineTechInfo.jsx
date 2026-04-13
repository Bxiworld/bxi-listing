import {
  Box,
  Grid,
  Typography,
  TextField,
  Button as MuiButton,
  Checkbox,
  Dialog,
} from '@mui/material';
import { Stack } from '@mui/system';
import { useUpdateProductQuery } from './ProductHooksQuery';
import { useNavigate, useParams } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
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
import FormControlLabel from '@mui/material/FormControlLabel';
import { Stepper } from '../AddProduct/AddProductSteps';
import {
  supportingDocsToCheckboxState,
  checkboxStateToSupportingArray,
  emptySupportingCheckboxState,
} from '../../utils/supportingBuyerDocs';
import { resolveMediaOnlineFormProfile } from '../../config/mediaListingProfiles';
const options = { day: '2-digit', month: 'short', year: 'numeric' };

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
        ...(techFormProfile.loopTimeField ? { loopTimeMinutes: loopTimeMinutes.trim() } : {}),
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
      } else {
        updateProduct(datatobesent, {
          onSuccess: (response) => {
            if (response.status === 200) {
              // Use new dynamic route
              navigate(`/mediaonline/go-live/${ProductId}`);
            }
          },
          onError: (error) => { },
        });
      }
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

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-8">
      <div className="form-container">
        <div className="stepper-layout">
          <aside className="stepper-rail">
            <Stepper currentStep={3} category="mediaonline" completedSteps={[1, 2]} />
          </aside>
          <main className="stepper-content">
        <div className="form-section">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="form-section-title">
              Technical Information
            </h2>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-[#6B7A99] hover:text-[#C64091]">
                    <Info className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Technical Information refers to specific details and specifications about a product&apos;s technical aspects, packaging Material, packing size, Dimensions, logistic or go live information for your offered product. This is Critical Information from Logistic &amp; Buying Perspective for Making Informed Decisions.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <form onSubmit={updateProductTechinfostatus} className="space-y-6 mt-6">
            <Box sx={{ width: '100%', overflow: 'auto' }}>
              <Stack>
                <Box
                  onChange={(e) => {
                    setCheckBoxes(e?.target?.checked);
                  }}
                  sx={{ display: 'grid', gap: '5px', py: '5px' }}
                >
                  <Typography sx={{ ...CommonTextStyle }}>
                    What supporting document would you like to give to the
                    Buyer? <span style={{ color: 'red' }}> *</span>
                  </Typography>
                  <Grid container>
                    <Grid
                      xl={6}
                      lg={6}
                      md={6}
                      sm={12}
                      xs={12}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '20px',
                      }}
                    >
                      {showSupportingDocKey('inspectionPass') ? (
                        checkBoxes.inspectionPass === 'on' ? (
                          <Box sx={{ display: 'flex', gap: '10px' }}>
                            <img
                              src={addItemCartIcon}
                              size={30}
                              onClick={() => {
                                setCheckBoxes({
                                  ...checkBoxes,
                                  inspectionPass: false,
                                });
                              }}
                              alt="Checkbox"
                              title="Checkbox icon"
                            />
                            <Typography
                              sx={{ ...CommonTextStyle, color: '#445fd2' }}
                            >
                              Inspection pass
                            </Typography>
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', gap: '10px' }}>
                            <img
                              alt="checkBox"
                              title="Checkbox icon"
                              src={defaultIcon}
                              onClick={() => {
                                setCheckBoxes({
                                  ...checkBoxes,
                                  inspectionPass: 'on',
                                });
                              }}
                            />
                            <Typography sx={{ ...CommonTextStyle }}>
                              Inspection pass
                            </Typography>
                          </Box>
                        )
                      ) : null}

                      {showSupportingDocKey('LogReport') ? (
                        checkBoxes.LogReport === 'on' ? (
                        <Box sx={{ display: 'flex', gap: '10px' }}>
                          <img
                            src={addItemCartIcon}
                            size={30}
                            onClick={() => {
                              setCheckBoxes({
                                ...checkBoxes,
                                LogReport: false,
                              });
                            }}
                            alt="Checkbox"
                            title="Checkbox icon"
                          />
                          <Typography
                            sx={{ ...CommonTextStyle, color: '#445fd2' }}
                          >
                            Log Report
                          </Typography>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', gap: '10px' }}>
                          <img
                            alt="checkBox"
                            title="Checkbox icon"
                            src={defaultIcon}
                            onClick={() => {
                              setCheckBoxes({
                                ...checkBoxes,
                                LogReport: 'on',
                              });
                            }}
                          />
                          <Typography sx={{ ...CommonTextStyle }}>
                            Log Report
                          </Typography>
                        </Box>
                        )
                      ) : null}
                      {showSupportingDocKey('Videos') ? (
                        checkBoxes.Videos === 'on' ? (
                        <Box sx={{ display: 'flex', gap: '10px' }}>
                          <img
                            src={addItemCartIcon}
                            size={30}
                            onClick={() => {
                              setCheckBoxes({
                                ...checkBoxes,
                                Videos: false,
                              });
                            }}
                            alt="Checkbox"
                            title="Checkbox icon"
                          />
                          <Typography
                            sx={{ ...CommonTextStyle, color: '#445fd2' }}
                          >
                            Videos
                          </Typography>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', gap: '10px' }}>
                          <img
                            alt="checkBox"
                            title="Checkbox icon"
                            src={defaultIcon}
                            onClick={() => {
                              setCheckBoxes({
                                ...checkBoxes,
                                Videos: 'on',
                              });
                            }}
                          />
                          <Typography sx={{ ...CommonTextStyle }}>
                            Videos
                          </Typography>
                        </Box>
                        )
                      ) : null}
                      {showSupportingDocKey('broadcastCertificate') ? (
                        checkBoxes.broadcastCertificate === 'on' ? (
                          <Box sx={{ display: 'flex', gap: '10px' }}>
                            <img
                              src={addItemCartIcon}
                              size={30}
                              onClick={() => {
                                setCheckBoxes({
                                  ...checkBoxes,
                                  broadcastCertificate: false,
                                });
                              }}
                              alt="Checkbox"
                              title="Checkbox icon"
                            />
                            <Typography sx={{ ...CommonTextStyle, color: '#445fd2' }}>
                              Broadcast Certificate
                            </Typography>
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', gap: '10px' }}>
                            <img
                              alt="checkBox"
                              title="Checkbox icon"
                              src={defaultIcon}
                              onClick={() => {
                                setCheckBoxes({
                                  ...checkBoxes,
                                  broadcastCertificate: 'on',
                                });
                              }}
                            />
                            <Typography sx={{ ...CommonTextStyle }}>
                              Broadcast Certificate
                            </Typography>
                          </Box>
                        )
                      ) : null}
                      {showSupportingDocKey('estimatedFleets') ? (
                        checkBoxes.estimatedFleets === 'on' ? (
                          <Box sx={{ display: 'flex', gap: '10px' }}>
                            <img
                              src={addItemCartIcon}
                              size={30}
                              onClick={() => {
                                setCheckBoxes({
                                  ...checkBoxes,
                                  estimatedFleets: false,
                                });
                              }}
                              alt="Checkbox"
                              title="Checkbox icon"
                            />
                            <Typography sx={{ ...CommonTextStyle, color: '#445fd2' }}>
                              Estimated Fleets
                            </Typography>
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', gap: '10px' }}>
                            <img
                              alt="checkBox"
                              title="Checkbox icon"
                              src={defaultIcon}
                              onClick={() => {
                                setCheckBoxes({
                                  ...checkBoxes,
                                  estimatedFleets: 'on',
                                });
                              }}
                            />
                            <Typography sx={{ ...CommonTextStyle }}>
                              Estimated Fleets
                            </Typography>
                          </Box>
                        )
                      ) : null}
                    </Grid>
                    <Grid
                      xl={6}
                      lg={6}
                      md={6}
                      sm={12}
                      xs={12}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '20px',
                      }}
                    >
                      {showSupportingDocKey('Pictures') ? (
                        checkBoxes.Pictures === 'on' ? (
                        <Box sx={{ display: 'flex', gap: '10px' }}>
                          <img
                            src={addItemCartIcon}
                            size={30}
                            onClick={() => {
                              setCheckBoxes({
                                ...checkBoxes,
                                Pictures: false,
                              });
                            }}
                            alt="Checkbox"
                            title="Checkbox icon"
                          />
                          <Typography
                            sx={{ ...CommonTextStyle, color: '#445fd2' }}
                          >
                            Pictures
                          </Typography>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', gap: '10px' }}>
                          <img
                            alt="checkBox"
                            title="Checkbox icon"
                            src={defaultIcon}
                            onClick={() => {
                              setCheckBoxes({
                                ...checkBoxes,
                                Pictures: 'on',
                              });
                            }}
                          />
                          <Typography sx={{ ...CommonTextStyle }}>
                            Pictures
                          </Typography>
                        </Box>
                      )
                      ) : null}
                      {showSupportingDocKey('ExhibitionCertificate') ? (
                        checkBoxes.ExhibitionCertificate === 'on' ? (
                        <Box sx={{ display: 'flex', gap: '10px' }}>
                          <img
                            src={addItemCartIcon}
                            size={30}
                            onClick={() => {
                              setCheckBoxes({
                                ...checkBoxes,
                                ExhibitionCertificate: false,
                              });
                            }}
                            alt="Checkbox"
                            title="Checkbox icon"
                          />
                          <Typography
                            sx={{ ...CommonTextStyle, color: '#445fd2' }}
                          >
                            Exhibition Certificate
                          </Typography>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', gap: '10px' }}>
                          <img
                            alt="checkBox"
                            title="Checkbox icon"
                            src={defaultIcon}
                            onClick={() => {
                              setCheckBoxes({
                                ...checkBoxes,
                                ExhibitionCertificate: 'on',
                              });
                            }}
                          />
                          <Typography sx={{ ...CommonTextStyle }}>
                            Exhibition Certificate
                          </Typography>
                        </Box>
                      )
                      ) : null}
                      {showSupportingDocKey('Other') ? (
                        checkBoxes.Other === 'on' ? (
                        <Box sx={{ display: 'flex', gap: '10px' }}>
                          <img
                            src={addItemCartIcon}
                            size={30}
                            onClick={() => {
                              setCheckBoxes({
                                ...checkBoxes,
                                Other: false,
                              });
                            }}
                            alt="Checkbox"
                            title="Checkbox icon"
                          />
                          <Typography
                            sx={{ ...CommonTextStyle, color: '#445fd2' }}
                          >
                            Other
                          </Typography>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', gap: '10px' }}>
                          <img
                            alt="checkBox"
                            title="Checkbox icon"
                            src={defaultIcon}
                            onClick={() => {
                              setCheckBoxes({
                                ...checkBoxes,
                                Other: 'on',
                              });
                            }}
                          />
                          <Typography sx={{ ...CommonTextStyle }}>
                            Other
                          </Typography>
                        </Box>
                      )
                      ) : null}
                    </Grid>
                  </Grid>
                </Box>

                <Box sx={{ display: 'grid', gap: '5px', py: '5px' }}>
                  <Typography sx={{ ...CommonTextStyle }}>
                    {isRadioMediaListing
                      ? 'AD Duration'
                      : 'Dimensions of Ad / Content Needed'}{' '}
                    {!isRadioMediaListing && (
                      <span style={{ color: 'red' }}> *</span>
                    )}
                  </Typography>

                  <TextField
                    focused
                    multiline
                    variant="standard"
                    placeholder="Eg. 30 Sec"
                    {...register('Dimensions')}
                    sx={{
                      ...lablechange,
                      background: '#fff',
                      borderRadius: '10px',
                      height: '47px',
                      border: errors['Dimensions']?.message
                        ? '1px solid red'
                        : null,
                    }}
                    InputProps={{
                      disableUnderline: true,
                      endAdornment: (
                        <Typography
                          variant="body1"
                          style={{
                            fontFamily: 'Inter, sans-serif',
                            color: '#C64091',
                          }}
                        ></Typography>
                      ),
                      style: {
                        fontFamily: 'Inter, sans-serif',
                        color: ' #6B7A99',
                        fontSize: '12px',
                        color: '#C64091',
                      },
                    }}
                  />
                </Box>
                <Typography sx={ErrorStyle}>
                  {errors['Dimensions']?.message}
                </Typography>
                {techFormProfile.loopTimeField ? (
                  <Box sx={{ display: 'grid', gap: '5px', py: '5px' }}>
                    <Typography sx={{ ...CommonTextStyle }}>
                      Loop Time (Minutes)
                    </Typography>
                    <TextField
                      focused
                      variant="standard"
                      placeholder="e.g. 5"
                      value={loopTimeMinutes}
                      onChange={(e) => setLoopTimeMinutes(e.target.value)}
                      sx={{
                        ...lablechange,
                        background: '#fff',
                        borderRadius: '10px',
                        height: '47px',
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
                >
                  <Box sx={{ display: 'flex' }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        alignContent: 'center',

                        gap: '5px',
                        color: '#6B7A99',
                      }}
                    >
                      <Typography sx={{ fontSize: '12px' }}>
                        Upload Link
                      </Typography>
                      <FormControlLabel
                        value="uploadLinkSet"
                        control={<Radio />}
                      />
                    </Box>

                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        alignContent: 'center',
                        fontSize: '15px',
                        gap: '5px',
                        color: '#6B7A99',
                      }}
                    >
                      <Typography sx={{ fontSize: '12px' }}>
                        Click here to use BXI Space
                      </Typography>
                      <FormControlLabel
                        value="checkbox"
                        control={<Radio />}
                      />
                    </Box>
                  </Box>
                </RadioGroup>
                {content !== 'checkbox' ? (
                  <>
                    <Box sx={{ display: 'grid', gap: '5px', py: '5px' }}>
                      <Typography sx={{ ...CommonTextStyle }}>
                        Content Upload Link ( Share a link where buyer can
                        drop a content ){' '}
                        <span style={{ color: 'red' }}> *</span>
                      </Typography>

                      <TextField
                        focused
                        multiline
                        variant="standard"
                        placeholder="Uploaded content has to go to seller with PO & Confirmation"
                        {...register('UploadLink')}
                        sx={{
                          ...lablechange,
                          background: '#fff',
                          borderRadius: '10px',
                          height: '47px',
                          border: errors['UploadLink']?.message
                            ? '1px solid red'
                            : null,
                        }}
                        InputProps={{
                          disableUnderline: true,
                          endAdornment: (
                            <Typography
                              variant="body1"
                              style={{
                                fontFamily: 'Inter, sans-serif',
                                color: '#C64091',
                              }}
                            ></Typography>
                          ),
                          style: {
                            fontFamily: 'Inter, sans-serif',
                            color: ' #6B7A99',
                            fontSize: '12px',
                            color: '#C64091',
                          },
                        }}
                      />
                    </Box>
                    <Typography sx={ErrorStyle}>
                      {errors['UploadLink']?.message}
                    </Typography>
                  </>
                ) : (
                  <>
                    <Box sx={{ display: 'flex', gap: '10px', mt: 2 }}>
                      <Checkbox
                        {...label}
                        {...register('BXISpace')}
                        checked={BXISpace === true ? true : false}
                        onChange={(e) => setBXISpace(e.target.checked)}
                      />
                      <Typography sx={CommonTextStyle}>
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

const lablechange = {
  fontFamily: 'Inter, sans-serif',
  color: '#6B7A99',
  fontSize: '16px',
  display: 'grid',
  textAlign: 'left',
  fontWeight: 'bold',
  paddingLeft: '10px',
  '&:focus': {
    border: '1px solid #E8E8E8',
  },
};

const ErrorStyle = {
  color: 'red',
};


