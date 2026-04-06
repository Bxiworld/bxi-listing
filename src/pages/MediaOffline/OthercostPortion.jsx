import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  Input,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import ToolTip from '../../components/ToolTip';
import bxitoken from '../../assets/Images/CommonImages/BXIToken.png';
import { useLocation } from 'react-router-dom';
import api from '../../utils/api';

export default function TextileProductInform(props) {
  const location = useLocation();

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    reset,
    trigger,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(
      z.object({
        CostPrice: z.string()
        .min(1, { message: 'Cost price is required' })
        .refine((value) => parseFloat(value.replace(/,/g, '')) > 0, {
          message: 'Cost price cannot be zero',
        }),
        AdCostGST: z.coerce.number().gte(5).lte(28),
        AdCostHSN: z
          .string() 
          .regex(/^\d{4}$|^\d{6}$|^\d{8}$/, {
            message: 'HSN must be 4, 6, or 8 digits',
          })
          .refine((value) => !/^0+$/.test(value), {
            message: 'HSN cannot be all zeros',
          })
          .transform((value) => value?.trim()),
        ReasonOfCost: z.string().min(1).max(75),
        AdCostApplicableOn: z.string().min(1),
        currencyType: z.any(),
      })
    ),
  });

  useEffect(() => {
    if (props.defaultValue == null) {
      return;
    }
    for (const [key, value] of Object.entries(props.defaultValue)) {
      setValue(key, value);
    }
  }, [props.defaultValue]);

  const [GSTData, setGSTData] = useState();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/Update_TDS_GST/get_all_gst');
        setGSTData(response?.data?.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  return (
    <Box
      sx={{
        mt: 1,
        height: 'auto',
        minHeight: '100px',
        position: 'relative',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        flexDirection: 'row',
        py: 2,
      }}
    >
      <Typography
        sx={{
          fontWeight: 600,
          fontFamily: 'Inter, sans-serif',
          color: '#5c6b8a',
          fontSize: '15px',
          marginBottom: '10px',
          width: '100%',
        }}
      >
        Additional Cost
        <Box component="span" sx={{ fontSize: '12px', fontWeight: 500, ml: 0.5 }}>
          ( Additional cost is not mandatory )
        </Box>
      </Typography>
      <Box
        sx={{
          display: 'flex',
          gap: '10px',
          width: '100%',
          justifyContent: 'space-between',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            maxWidth: '200px',
          }}
        >
          <Typography sx={{ ...CommonTextStyle, whiteSpace: 'nowrap' }}>
            Applicable On
          </Typography>
          <Select
            defaultValue={'All'}
            {...register('AdCostApplicableOn')}
            sx={{
              width: '199px',
              height: '48px',
              background: '#FFFFFF',
              borderRadius: '10px',
              px: 1,
              ...ocOutlinedSelectSx(!!errors?.AdCostApplicableOn),
            }}
          >
            <MenuItem value='All'>One Time Cost</MenuItem>
            <MenuItem value='PerUnit'>Per Unit</MenuItem>
          </Select>
          <Typography
            sx={{ ...FieldErrorTextStyle, height: 'auto', width: '103%' }}
          >
            {errors['AdCostApplicableOn']?.message}
          </Typography>
        </Box>
        <Box
          sx={{
            width: '180px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography
              sx={{
                ...CommonTextStyle,
                position: 'relative',
              }}
            >
              Cost(Exc of GST)
            </Typography>
            <ToolTip info="Do you wish to collect this as Trade Credits OR INR?" />
          </Box>

          <Box sx={{ ...ocBorderedRowSx(!!errors['CostPrice']) }}>
            <Input
              disableUnderline
              placeholder='Eg. 1000'
              {...register('CostPrice', {
                onChange: event => {
                  event.target.value = parseInt(
                    event.target.value.replace(/[^\d]+/gi, '') || 0
                  ).toLocaleString('en-US');
                },
              })}
              inputProps={{ maxLength: 15 }}
              sx={{
                ...ocInputInRowSx,
                flex: 1,
                minWidth: 0,
              }}
            />

            <Select
              defaultValue={'₹'}
              {...register('currencyType')}
              sx={{
                ...ocCurrencySelectSx,
                height: '48px',
                minWidth: 56,
              }}
            >
              <MenuItem value='BXITokens'>
                <Box
                  component='img'
                  src={bxitoken}
                  alt='bxitoken'
                  sx={{
                    height: '15px',
                    width: 'auto',
                  }}
                />
              </MenuItem>
              <MenuItem value='₹'>₹</MenuItem>
            </Select>
          </Box>
          <Typography sx={FieldErrorTextStyle}>
            {errors['CostPrice']?.message}
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            maxWidth: '100px',
          }}
        >
          <Typography sx={CommonTextStyle}>
            HSN <span style={{ color: 'red' }}> *</span>
          </Typography>

          <Box sx={{ position: 'relative' }}>
            <Input
              disableUnderline
              placeholder='998346'
              {...register('AdCostHSN', {
                onChange: event => {
                  const inputValue = event.target.value;
                  if (inputValue.match(/\D/g)) {
                    event.target.value = inputValue.replace(/\D/g, '');
                  }
                },
              })}
              inputProps={{ maxLength: 8 }}
              onKeyDown={e => {
                if (e.key === ' ' && e.target.selectionStart === 0)
                  e.preventDefault();
              }}
              sx={{
                width: '100%',
                height: '48px',
                background: '#FFFFFF',
                borderRadius: '10px',
                px: 1,
                fontSize: '12px',
                fontFamily: 'Inter, sans-serif',
                color: ocColors.text,
                ...ocBorderedControlSx(!!errors?.AdCostHSN),
                ...ocPlaceholderSx,
              }}
            />
          </Box>

          {errors?.AdCostHSN && (
            <Typography sx={FieldErrorTextStyle}>
              {errors?.AdCostHSN?.message}
            </Typography>
          )}
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            maxWidth: '100px',
          }}
        >
          <Typography sx={CommonTextStyle}>
            GST <span style={{ color: 'red' }}> *</span>
          </Typography>

          <Box sx={{ position: 'relative' }}>
            <Select
              defaultValue=''
              displayEmpty
              renderValue={(selected) => {
                if (
                  selected === undefined ||
                  selected === null ||
                  selected === ''
                ) {
                  return (
                    <Box
                      component='span'
                      sx={{
                        color: ocColors.label,
                        opacity: 0.55,
                        fontSize: '12px',
                      }}
                    >
                      GST %
                    </Box>
                  );
                }
                return selected;
              }}
              {...register('AdCostGST')}
              sx={{
                width: '100px',
                height: '48px',
                background: '#FFFFFF',
                borderRadius: '10px',
                ...ocOutlinedSelectSx(!!errors?.AdCostGST),
              }}
            >
              {GSTData?.map((gst, idx) => (
                <MenuItem key={idx} sx={MenuItems} value={gst?.GST}>
                  {gst?.GST}
                </MenuItem>
              ))}
            </Select>

            <Typography
              sx={{
                position: 'absolute',
                right: '32%',
                bottom: '25%',
                color: '#979797',
                fontSize: '12px',
              }}
            >
              %
            </Typography>
          </Box>

          {errors?.AdCostGST && (
            <Typography sx={FieldErrorTextStyle}>
              {errors?.AdCostGST?.message}
            </Typography>
          )}
        </Box>
      </Box>
      <Box
        sx={{
          display: 'flex',
          gap: '10px',
          width: '100%',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            width: '100%',
          }}
        >
          <Typography sx={{ ...CommonTextStyle }}>
            Reason Of Cost <span style={{ color: 'red' }}> *</span>
          </Typography>

          <TextField
            {...register('ReasonOfCost')}
            placeholder={
              location.pathname?.includes('media')
                ? 'Content Management Charges, Printing Mounting Charges, Conversion Charges, Log Report Charges etc'
                : 'Customized Packaging'
            }
            variant='standard'
            InputProps={{
              disableUnderline: true,
              sx: {
                fontSize: '14px',
                px: 1.25,
                py: 1,
                minHeight: '48px',
                fontFamily: 'Inter, sans-serif',
                color: ocColors.text,
                boxSizing: 'border-box',
                '& .MuiInputBase-input::placeholder': {
                  color: ocColors.label,
                  opacity: 0.55,
                  WebkitTextFillColor: ocColors.label,
                },
              },
            }}
            sx={{
              width: '100%',
              background: '#FFFFFF',
              borderRadius: '10px',
              marginBottom: '20px',
              outline: 'none',
              boxShadow: 'none',
              border: '1px solid',
              borderColor: errors['ReasonOfCost']
                ? ocColors.borderError
                : ocColors.border,
              transition: 'border-color 0.15s ease',
              '&:hover': {
                borderColor: errors['ReasonOfCost']
                  ? ocColors.borderError
                  : ocColors.borderHover,
              },
              '&.Mui-focused': {
                borderColor: errors['ReasonOfCost']
                  ? ocColors.borderError
                  : ocColors.borderFocus,
                boxShadow: 'none',
              },
              '&:focus-within': {
                borderColor: errors['ReasonOfCost']
                  ? ocColors.borderError
                  : ocColors.borderFocus,
                outline: 'none',
                boxShadow: 'none',
              },
            }}
          />

          {errors['ReasonOfCost'] && (
            <Typography sx={FieldErrorTextStyle}>
              {errors['ReasonOfCost']?.message}
            </Typography>
          )}
        </Box>
      </Box>

      <Box
        sx={{
          display: 'flex',
          gap: '10px',
          width: '100%',
        }}
      >
        <Button
          variant='contained'
          sx={{
            color: '#ffffff',
            backgroundColor: '#C64091',
            textTransform: 'none',
            fontSize: '14px',
            height: '41px',
            width: '100%',
            borderRadius: '10px',
            fontFamily: 'Inter, sans-serif',
            fontStyle: 'normal',
            fontWeight: 500,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
              backgroundColor: '#b0387d',
            },
            '&:active': {
              backgroundColor: '#9c316f',
            },
          }}
          onClick={async () => {
            if ((await trigger()) === false) {
              return;
            }
            props.append(getValues(), props.index);
            reset({
              AdCostName: '',
              CostPrice: '',
              AdCostHSN: '',
              ReasonOfCost: '',
            });
          }}
        >
          Add Additional Cost
        </Button>
      </Box>
    </Box>
  );
}

const ocColors = {
  border: '#E2E8F0',
  borderHover: '#CBD5E1',
  borderFocus: '#C64091',
  borderError: '#d32f2f',
  text: '#334155',
  label: '#6B7A99',
};

const ocPlaceholderSx = {
  '& .MuiInputBase-input::placeholder': {
    color: ocColors.label,
    opacity: 0.55,
    WebkitTextFillColor: ocColors.label,
  },
  '& input::placeholder': {
    color: ocColors.label,
    opacity: 0.55,
  },
};

const ocBorderedControlSx = (hasError) => ({
  border: '1px solid',
  borderColor: hasError ? ocColors.borderError : ocColors.border,
  transition: 'border-color 0.15s ease',
  boxSizing: 'border-box',
  outline: 'none',
  boxShadow: 'none',
  '&:focus': { outline: 'none' },
  '&:focus-visible': { outline: 'none' },
  '& .MuiInputBase-input:focus': { outline: 'none' },
  '&:hover': {
    borderColor: hasError ? ocColors.borderError : ocColors.borderHover,
  },
  '&.Mui-focused': {
    borderColor: hasError ? ocColors.borderError : ocColors.borderFocus,
    boxShadow: 'none',
  },
});

const ocBorderedRowSx = (hasError) => ({
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  background: '#FFFFFF',
  borderRadius: '10px',
  overflow: 'hidden',
  border: '1px solid',
  borderColor: hasError ? ocColors.borderError : ocColors.border,
  transition: 'border-color 0.15s ease',
  outline: 'none',
  boxShadow: 'none',
  '&:hover': {
    borderColor: hasError ? ocColors.borderError : ocColors.borderHover,
  },
  '&:focus-within': {
    borderColor: hasError ? ocColors.borderError : ocColors.borderFocus,
    outline: 'none',
    boxShadow: 'none',
  },
});

const ocInputInRowSx = {
  height: '48px',
  background: 'transparent',
  border: 'none',
  borderRadius: 0,
  px: 1,
  fontSize: '12px',
  fontFamily: 'Inter, sans-serif',
  color: ocColors.text,
  outline: 'none',
  boxShadow: 'none',
  '&:hover': { border: 'none' },
  '&.Mui-focused': { border: 'none', boxShadow: 'none' },
  '& .MuiInputBase-input:focus': { outline: 'none' },
  ...ocPlaceholderSx,
};

const ocCurrencySelectSx = {
  background: 'transparent',
  borderRadius: 0,
  borderLeft: `1px solid ${ocColors.border}`,
  fontFamily: 'Inter, sans-serif',
  fontSize: '12px',
  color: ocColors.text,
  outline: 'none',
  boxShadow: 'none',
  '& .MuiSelect-select': { color: ocColors.text },
  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
  '&:hover .MuiOutlinedInput-notchedOutline': { border: 'none' },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: 'none' },
};

const ocOutlinedSelectSx = (hasError) => ({
  outline: 'none',
  boxShadow: 'none',
  '& .MuiOutlinedInput-notchedOutline': {
    borderWidth: '1px',
    borderColor: hasError ? ocColors.borderError : ocColors.border,
    transition: 'border-color 0.15s ease',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: hasError ? ocColors.borderError : ocColors.borderHover,
  },
  '&.Mui-focused': { boxShadow: 'none' },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderWidth: '1px',
    borderColor: `${hasError ? ocColors.borderError : ocColors.borderFocus} !important`,
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

const MenuItems = {
  fontSize: '12px',
  color: ocColors.text,
  fontFamily: 'Inter, sans-serif',
  fontStyle: 'normal',
  fontWeight: 400,
};

