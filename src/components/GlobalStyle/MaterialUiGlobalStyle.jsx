import React from 'react';
import { createTheme } from '@mui/material/styles';

const ProductAddTheme = createTheme({
  background: {
    default: '#000',
  },
  height: {
    height: '100%',
    maxHeight: '45px',
    minHeight: '45px',
  },
  width: {
    width: '100%',
    minWidth: 500,
  },
  typography: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 600,
    color: 'adb8cc',
  },
});

export default ProductAddTheme;
