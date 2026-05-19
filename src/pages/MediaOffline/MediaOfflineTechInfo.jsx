import { Box, Typography, TextField } from '@mui/material';
import { Stack } from '@mui/system';
import { useUpdateProductQuery } from './ProductHooksQuery';
import { useNavigate, useParams } from 'react-router-dom';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../utils/api';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Info } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Checkbox } from '../../components/ui/checkbox';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../components/ui/tooltip';

const COPY_OPTIONS = [
  { value: 'digital', label: 'Digital Copy' },
  { value: 'hard', label: 'Hard Copy' },
];
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

  const [copyType, setCopyType] = useState('digital');

  const [checkBoxes, setCheckBoxes] = useState({
    inspectionPass: false,
    LogReport: false,
    Videos: false,
    Pictures: false,
    ExhibitionCertificate: false,
    Other: false,
  });



  const validationSchema = useMemo(
    () =>
      z.object({
        Dimensions: z.string().min(1).max(500),
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

      setCheckBoxes(
        supportingDocsToCheckboxState(data?.WhatSupportingYouWouldGiveToBuyer),
      );
      setDateArr(data?.calender ?? []);
      setCopyType(data?.mediaVariation?.copyType || data?.copyType || 'digital');

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
        copyType,
        mediaVariation: {
          ...(data?.mediaVariation || {}),
          copyType,
        },
        WhatSupportingYouWouldGiveToBuyer: checkboxStateToSupportingArray(checkBoxes),
        calender: dateArr,
        ProductUploadStatus: 'technicalinformation',

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
                      Copy Type <span className="text-red-500">*</span>
                    </Typography>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {COPY_OPTIONS.map(({ value, label }) => (
                        <div
                          key={value}
                          className="flex items-center gap-3 rounded-[10px] border border-[#E2E8F0] bg-[#FAFBFC] px-3 py-2.5 transition-colors hover:border-[#CBD5E1] cursor-pointer"
                          onClick={() => setCopyType(value)}
                        >
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                              copyType === value
                                ? 'border-[#C64091]'
                                : 'border-[#CBD5E1]'
                            }`}
                          >
                            {copyType === value && (
                              <div className="w-2 h-2 rounded-full bg-[#C64091]" />
                            )}
                          </div>
                          <Label className="text-sm font-normal text-[#5c6b8a] cursor-pointer leading-snug">
                            {label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </Box>

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
