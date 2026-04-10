import { Box, Typography, TextField } from '@mui/material';
import { Stack } from '@mui/system';
import { useUpdateProductQuery } from './ProductHooksQuery';
import { useNavigate, useParams } from 'react-router-dom';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import api from '../../utils/api';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Info } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Checkbox } from '../../components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../components/ui/tooltip';
import { Stepper } from '../AddProduct/AddProductSteps';
import {
  supportingDocsToCheckboxState,
  checkboxStateToSupportingArray,
} from '../../utils/supportingBuyerDocs';

const SUPPORTING_DOC_OPTIONS = [
  { key: 'inspectionPass', label: 'Inspection pass' },
  { key: 'LogReport', label: 'Log Report' },
  { key: 'Videos', label: 'Videos' },
  { key: 'Pictures', label: 'Pictures' },
  { key: 'ExhibitionCertificate', label: 'Exhibition Certificate' },
  { key: 'Other', label: 'Other' },
];

const brandControlClass =
  'border-[#C64091] text-[#C64091] data-[state=checked]:bg-[#C64091] data-[state=checked]:text-white';

export default function TechInfo() {
  const ProductId = useParams().id;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dateArr, setDateArr] = useState([]);
  const [BXISpace, setBXISpace] = useState(false);
  const [content, setContent] = useState('checkbox');
  const [checkBoxes, setCheckBoxes] = useState({
    inspectionPass: false,
    LogReport: false,
    Videos: false,
    Pictures: false,
    ExhibitionCertificate: false,
    Other: false,
  });

  const contentRef = useRef(content);
  const BXISpaceRef = useRef(BXISpace);
  contentRef.current = content;
  BXISpaceRef.current = BXISpace;

  const validationSchema = useMemo(
    () =>
      z
        .object({
          Dimensions: z.string().min(1).max(500),
          UploadLink: z.string().optional().default(''),
        })
        .superRefine((data, ctx) => {
          if (contentRef.current === 'uploadLinkSet') {
            const link = (data.UploadLink ?? '').trim();
            if (link.length < 1) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Required',
                path: ['UploadLink'],
              });
            }
          }
          if (contentRef.current === 'checkbox' && !BXISpaceRef.current) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'Please confirm use of BXI Space',
              path: ['UploadLink'],
            });
          }
        }),
    [],
  );

  const resolver = useMemo(
    () => zodResolver(validationSchema),
    [validationSchema],
  );

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver,
  });

  const handleContentModeChange = useCallback(
    (value) => {
      if (value === 'uploadLinkSet') {
        setContent('uploadLinkSet');
        setBXISpace(false);
        setValue('UploadLink', '');
      } else {
        setContent('checkbox');
        setBXISpace(true);
        setValue('UploadLink', '');
      }
    },
    [setValue],
  );

  const FetchProduct = useCallback(async () => {
    if (!ProductId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`product/get_product_byId/${ProductId}`);
      const data = res?.data ?? res;
      setValue('Dimensions', data?.Dimensions);
      setValue('UploadLink', data?.UploadLink);
      setCheckBoxes(
        supportingDocsToCheckboxState(data?.WhatSupportingYouWouldGiveToBuyer),
      );
      setDateArr(data?.calender ?? []);
      setBXISpace(Boolean(data?.BXISpace));
    } catch {
      // keep defaults
    } finally {
      setLoading(false);
    }
  }, [ProductId, setValue]);

  useEffect(() => {
    FetchProduct();
  }, [FetchProduct]);

  const { mutate: updateProduct, isLoading } = useUpdateProductQuery();

  const updateProductTechinfostatus = handleSubmit((data) => {
    try {
      const datatobesent = {
        ...data,
        id: ProductId,
        WhatSupportingYouWouldGiveToBuyer: checkboxStateToSupportingArray(checkBoxes),
        calender: dateArr,
        ProductUploadStatus: 'technicalinformation',
        BXISpace,
      };
      const noneSelected = SUPPORTING_DOC_OPTIONS.every(
        (opt) => !checkBoxes[opt.key],
      );
      if (noneSelected) {
        toast.error('Please Select add all mandatory field');
        return;
      }
      updateProduct(datatobesent, {
        onSuccess: (response) => {
          if (response.status === 200) {
            navigate(`/mediaoffline/go-live/${ProductId}`);
          }
        },
        onError: () => {},
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] py-8 flex items-center justify-center">
        <div className="text-center text-[#6B7A99]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-8">
      <div className="form-container">
        <div className="stepper-layout">
          <aside className="stepper-rail">
            <Stepper currentStep={3} category="mediaoffline" completedSteps={[1, 2]} />
          </aside>
          <main className="stepper-content">
      <div className="listing-journey">
        <div className="listing-journey-container px-4">
          <form
            onSubmit={updateProductTechinfostatus}
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
                px: { xs: 2, sm: 4 },
                py: 3,
                border: '1px solid #E2E8F0',
                borderRadius: '16px',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  borderBottom: '1px solid #E2E8F0',
                  pb: 2,
                  mb: 2,
                }}
              >
                <Typography
                  sx={{
                    fontFamily: 'Inter, sans-serif',
                    fontStyle: 'normal',
                    fontWeight: 600,
                    fontSize: { xs: '18px', sm: '20px', md: '24px' },
                    color: '#5c6b8a',
                    letterSpacing: '0.01em',
                  }}
                >
                  Technical Information
                </Typography>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="text-[#6B7A99] hover:text-[#C64091]"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Technical Information refers to specific details and
                        specifications about a product&apos;s technical aspects,
                        packaging Material, packing size, Dimensions, logistic or
                        go live information for your offered product. This is
                        Critical Information from Logistic &amp; Buying
                        Perspective for Making Informed Decisions.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Box>

              <Box sx={{ width: '100%', overflow: 'auto' }}>
                <Stack spacing={2}>
                  <div className="space-y-3 py-1">
                    <Label className="text-[#5c6b8a] font-medium">
                      What supporting document would you like to give to the
                      Buyer? <span className="text-red-500">*</span>
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {SUPPORTING_DOC_OPTIONS.map(({ key, label }) => (
                        <div
                          key={key}
                          className="flex items-center gap-3 rounded-[10px] border border-[#E2E8F0] bg-[#FAFBFC] px-3 py-2.5 transition-colors hover:border-[#CBD5E1]"
                        >
                          <Checkbox
                            id={`support-${key}`}
                            checked={checkBoxes[key]}
                            onCheckedChange={(c) =>
                              setCheckBoxes((prev) => ({
                                ...prev,
                                [key]: c === true,
                              }))
                            }
                            className={brandControlClass}
                          />
                          <Label
                            htmlFor={`support-${key}`}
                            className="text-sm font-normal text-[#5c6b8a] cursor-pointer leading-snug"
                          >
                            {label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Box sx={{ display: 'grid', gap: '8px', py: '4px' }}>
                    <Typography sx={CommonTextStyle}>
                      Dimensions of Ad / Content Needed{' '}
                      <span style={{ color: 'red' }}>*</span>
                    </Typography>
                    <TextField
                      multiline
                      variant="standard"
                      placeholder="Eg. 30 Sec"
                      {...register('Dimensions')}
                      sx={standardMultilineFieldSx(!!errors.Dimensions?.message)}
                      InputProps={{
                        disableUnderline: true,
                      }}
                    />
                    {errors.Dimensions?.message && (
                      <Typography sx={FieldErrorTextStyle}>
                        {errors.Dimensions.message}
                      </Typography>
                    )}
                  </Box>

                  <div className="space-y-3 pt-1">
                    <Label className="text-[#5c6b8a] font-medium text-sm">
                      Content delivery
                    </Label>
                    <RadioGroup
                      value={content}
                      onValueChange={handleContentModeChange}
                      className="flex flex-row flex-wrap gap-6"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem
                          value="uploadLinkSet"
                          id="content-upload-link"
                          className={brandControlClass}
                        />
                        <Label
                          htmlFor="content-upload-link"
                          className="text-sm font-normal text-[#5c6b8a] cursor-pointer"
                        >
                          Upload Link
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem
                          value="checkbox"
                          id="content-bxi-space"
                          className={brandControlClass}
                        />
                        <Label
                          htmlFor="content-bxi-space"
                          className="text-sm font-normal text-[#5c6b8a] cursor-pointer"
                        >
                          Click here to use BXI Space
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {content !== 'checkbox' ? (
                    <Box sx={{ display: 'grid', gap: '8px', py: '4px' }}>
                      <Typography sx={CommonTextStyle}>
                        Content Upload Link ( Share a link where buyer can drop a
                        content ) <span style={{ color: 'red' }}>*</span>
                      </Typography>
                      <TextField
                        multiline
                        variant="standard"
                        placeholder="Uploaded content has to go to seller with PO & Confirmation"
                        {...register('UploadLink')}
                        sx={standardMultilineFieldSx(
                          !!errors.UploadLink?.message,
                        )}
                        InputProps={{
                          disableUnderline: true,
                        }}
                      />
                      {errors.UploadLink?.message && (
                        <Typography sx={FieldErrorTextStyle}>
                          {errors.UploadLink.message}
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    <div className="flex gap-3 items-start mt-2 rounded-[10px] border border-[#E2E8F0] bg-[#FAFBFC] p-3">
                      <Checkbox
                        id="bxi-space"
                        checked={BXISpace === true}
                        onCheckedChange={(c) => {
                          setBXISpace(c === true);
                        }}
                        className={brandControlClass}
                      />
                      <Label
                        htmlFor="bxi-space"
                        className="text-sm font-normal text-[#5c6b8a] cursor-pointer leading-relaxed"
                      >
                        Click here to use BXI Space from you can download ,
                        though BXI does not take responsibility for the content
                      </Label>
                    </div>
                  )}
                  {content === 'checkbox' && errors.UploadLink?.message && (
                    <Typography sx={FieldErrorTextStyle}>
                      {errors.UploadLink.message}
                    </Typography>
                  )}
                </Stack>
              </Box>

              <div className="flex justify-between pt-8 mt-2 border-t border-[#E2E8F0]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={CancelJourney}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-[#C64091] hover:bg-[#A03375]"
                >
                  {isLoading ? 'Saving...' : 'Next'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Box>
          </form>
        </div>
      </div>
          </main>
        </div>
      </div>
    </div>
  );
}

const formColors = {
  border: '#E2E8F0',
  borderHover: '#CBD5E1',
  borderFocus: '#C64091',
  borderError: '#d32f2f',
  text: '#334155',
  label: '#6B7A99',
  brand: '#C64091',
};

const borderedControlSx = (hasError) => ({
  border: '1px solid',
  borderColor: hasError ? formColors.borderError : formColors.border,
  transition: 'border-color 0.15s ease',
  boxSizing: 'border-box',
  outline: 'none',
  boxShadow: 'none',
  '&:focus': { outline: 'none' },
  '&:focus-visible': { outline: 'none' },
  '& .MuiInputBase-input:focus': { outline: 'none' },
  '&:hover': {
    borderColor: hasError ? formColors.borderError : formColors.borderHover,
  },
  '&.Mui-focused': {
    borderColor: hasError ? formColors.borderError : formColors.borderFocus,
    boxShadow: 'none',
  },
});

const standardMultilineFieldSx = (hasError) => ({
  fontFamily: 'Inter, sans-serif',
  background: '#fff',
  borderRadius: '10px',
  padding: '0px 10px',
  minHeight: '47px',
  height: 'auto',
  fontSize: '12px',
  ...borderedControlSx(hasError),
  '& .MuiInputBase-input': {
    color: formColors.text,
    fontFamily: 'Inter, sans-serif',
    fontSize: '12px',
    lineHeight: '20px',
  },
  '& .MuiInputBase-input::placeholder': {
    color: formColors.label,
    opacity: 0.55,
    WebkitTextFillColor: formColors.label,
  },
});

const CommonTextStyle = {
  fontFamily: 'Inter, sans-serif',
  fontStyle: 'normal',
  fontWeight: 500,
  fontSize: '14px',
  lineHeight: '21px',
  color: '#5c6b8a',
};

const FieldErrorTextStyle = {
  fontFamily: 'Inter, sans-serif',
  fontSize: '12px',
  lineHeight: '18px',
  color: 'red',
};
