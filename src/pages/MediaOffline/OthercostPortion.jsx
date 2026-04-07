import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  Input,
  MenuItem,
  Tooltip,
  Select,
  TextField,
  Typography,
  Fade,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { styled } from '@mui/material/styles';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import ToolTip from '../../components/ToolTip';
import bxitoken from '../../assets/Images/CommonImages/BXIToken.png';
import InfoIcon from '../../assets/Images/CommonImages/InfoIcon.svg';
import { useLocation } from 'react-router-dom';
import api from '../../utils/api';

export default function TextileProductInform(props) {
  const GSTOptions = [0, 5, 12, 18, 28];
  const CustomTooltip = styled(({ className, ...props }) => (
    <Tooltip
      {...props}
      componentsProps={{ tooltip: { className: className } }}
    />
  ))(`
          background: #C64091;
          width:200px;
      `);

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
          fontWeight: 500,
          fontFamily: 'Inter, sans-serif',
          color: '#6B7A99',
          fontSize: '20px',
          marginBottom: '10px',
        }}
      >
        Additional Cost
        <span style={{ fontSize: '12px' }}>
          {' '}
          ( Additional cost is not mandatory )
        </span>
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
              fontFamily: 'Inter, sans-serif',
              fontStyle: 'normal',
              fontSize: '12px',
              fontWeight: 400,
              color: '#C64091',
              px: 1,
              border: errors?.AdCostApplicableOn
                ? '1px solid red'
                : '1px solid #C4C4C4',
              '& .MuiSelect-select': {
                fontFamily: 'Inter, sans-serif',
                color: '#C64091',
                fontSize: '12px',
              },
              '.MuiOutlinedInput-notchedOutline': { border: 'none' },
              '&.MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline':
                {
                  border: 'none',
                },
              '&.MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline':
                {
                  border: 'none',
                },
            }}
          >
            <MenuItem value='All'>One Time Cost</MenuItem>
            <MenuItem value='PerUnit'>Per Unit</MenuItem>
          </Select>
          <Typography sx={{ color: 'red', height: 'auto', width: '103%' }}>
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
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Typography
              sx={{
                ...CommonTextStyle,
                fontSize: '13.5px',
                position: 'relative',
              }}
            >
              Cost(Exc of GST)
            </Typography>
            <Box sx={{ width: '15px', height: '15px' }}>
              <CustomTooltip
                title={
                  <Typography sx={ToolTextStyle}>
                    Do you wish to collect this as Trade Credits OR INR?
                  </Typography>
                }
                TransitionComponent={Fade}
                TransitionProps={{ timeout: 400 }}
              >
                <Box
                  component='img'
                  src={InfoIcon}
                  sx={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </CustomTooltip>
            </Box>
          </div>

          <Box
            sx={{
              display: 'flex',
              background: '#FFFFFF',
              borderRadius: '10px',
              width: '100%',
              alignItems: 'center',
              border: errors['CostPrice'] ? '1px solid red' : null,
            }}
          >
            <Box sx={{ width: '100%' }}>
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
                sx={{
                  width: '100%',
                  height: '48px',
                  background: '#FFFFFF',
                  borderRadius: '10px',
                  px: 1,
                  fontSize: '12px',
                  color: '#C64091',
                  border: errors?.CostPrice
                    ? '1px solid red'
                    : '1px solid #C4C4C4',
                  '&:focus': {
                    outline: 'none',
                    border: errors?.CostPrice
                      ? '1px solid red'
                      : '1px solid #C64091',
                  },
                }}
                inputProps={{
                  style: {
                    fontFamily: 'Inter, sans',
                    fontSize: '13px',
                    color: '#C64091',
                  },
                  maxLength: 15,
                }}
              />
            </Box>

            <Select
              defaultValue={'₹'}
              {...register('currencyType')}
              sx={{
                height: '48px',
                width: 'auto',
                '.MuiOutlinedInput-notchedOutline': { border: 0 },
                '&.MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline':
                  {
                    border: 0,
                  },
                '&.MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline':
                  {
                    border: 0,
                  },
                background: '#FFFFFF',

                color: '#6B7A99',
                fontSize: '12px',
                fontFamily: 'Inter, sans',
                fontStyle: 'normal',
                fontWeight: 400,
                borderRadius: '0px 10px 10px 0px',
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
          <Typography sx={{ color: 'red', fontFamily: 'Inter, sans-serif' }}>
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
                color: '#C64091',
                border: errors?.AdCostHSN
                  ? '1px solid red'
                  : '1px solid #C4C4C4',
                '&:focus': {
                  outline: 'none',
                  border: errors?.AdCostHSN
                    ? '1px solid red'
                    : '1px solid #C64091',
                },
              }}
            />
          </Box>

          {errors?.AdCostHSN && (
            <Typography
              sx={{ color: 'red', fontFamily: 'Inter, sans-serif', fontSize: '12px' }}
            >
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
              {...register('AdCostGST')}
              sx={{
                width: '100px',
                height: '48px',
                background: '#FFFFFF',
                borderRadius: '10px',
                fontSize: '12px',
                color: '#C64091',
                border: errors?.AdCostGST
                  ? '1px solid red'
                  : '1px solid #C4C4C4',
                '&:focus': {
                  outline: 'none',
                  border: errors?.AdCostGST
                    ? '1px solid red'
                    : '1px solid #C64091',
                },
                '.MuiOutlinedInput-notchedOutline': { border: 0 },
                '&.MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline':
                  { border: 0 },
                '&.MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline':
                  { border: 0 },
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
                fontSize: '15px',
              }}
            >
              %
            </Typography>
          </Box>

          {errors?.AdCostGST && (
            <Typography
              sx={{ color: 'red', fontFamily: 'Inter, sans-serif', fontSize: '12px' }}
            >
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
              style: {
                fontSize: '14px',
                padding: '10px',
                height: '48px',
                color: '#C64091',
              },
            }}
            sx={{
              width: '100%',
              background: '#FFFFFF',
              borderRadius: '10px',
              marginBottom: '20px',
              border: errors['ReasonOfCost']
                ? '1px solid red'
                : '1px solid #C4C4C4',
              '&:focus-within': {
                border: errors['ReasonOfCost']
                  ? '1px solid red'
                  : '1px solid #C64091',
              },
            }}
          />

          {errors['ReasonOfCost'] && (
            <Typography
              sx={{ color: 'red', fontFamily: 'Inter, sans-serif', fontSize: '12px' }}
            >
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
            fontWeight: 400,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
              backgroundColor: '#C64091',
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

const CommonTextStyle = {
  fontFamily: 'Inter, sans-serif',
  fontStyle: 'normal',
  fontWeight: 400,
  fontSize: '14px',
  lineHeight: '21px',
  color: '#6B7A99',
};

const MenuItems = {
  fontSize: '12px',
  color: '#c64091',
  fontFamily: 'Inter, sans-serif',
  fontStyle: 'normal',
  fontWeight: 400,
};

const ToolTextStyle = {
  fontFamily: 'Inter, sans-serif',
  fontStyle: 'normal',
  fontWeight: 400,
  fontSize: '10px',
  color: '#fff',
  textAlign: 'center',
  cursor: 'pointer',
};


