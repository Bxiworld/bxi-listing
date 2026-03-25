import React from 'react';
import { Box } from '@mui/material';
import { VoucherCardFront, VoucherCardBack } from './VoucherDesignCards';
import { voucherStyle } from './EditVoucherStyle';

const Template = React.memo(({
  cardBgColor,
  cardImage,
  productData,
  textInverted,
  myRefFront,
  myRefBack,
  gradientColors = { start: '#7c3aed', end: '#3b82f6' },
}) => {
  const classes = voucherStyle();

  return (
    <Box
      className={classes.cardContainer}
      sx={{
        display: 'flex',
        justifyContent: 'flex-start',
        flexDirection: 'column',
        gap: '20px',
        alignItems: 'normal',
        backgroundColor: 'transparent',
      }}
    >
      <VoucherCardFront
        ref={myRefFront}
        cardBgColor={cardBgColor}
        cardImage={cardImage}
        productData={productData}
        textInverted={textInverted}
        gradientColors={gradientColors}
      />
      <VoucherCardBack
        ref={myRefBack}
        cardBgColor={cardBgColor}
        productData={productData}
        textInverted={textInverted}
      />
    </Box>
  );
});

export default Template;


