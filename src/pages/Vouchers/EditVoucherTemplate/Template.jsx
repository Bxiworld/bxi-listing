import React from 'react';
import { Box } from '@mui/material';
import { VoucherCardFront, VoucherCardBack } from './VoucherDesignCards';
import { voucherStyle } from './EditVoucherStyle';

const Template = React.memo(({
  cardBgColor,
  cardImage,
  productData,
  companyLogo,
  companyName,
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
        gap: 0,
        alignItems: 'normal',
        backgroundColor: 'transparent',
      }}
    >
      <VoucherCardFront
        ref={myRefFront}
        cardBgColor={cardBgColor}
        cardImage={cardImage}
        productData={productData}
        companyLogo={companyLogo}
        companyName={companyName}
        textInverted={textInverted}
        gradientColors={gradientColors}
      />
      <div aria-hidden="true" style={{ position: 'fixed', left: '-10000px', top: 0, pointerEvents: 'none' }}>
        <VoucherCardBack
          ref={myRefBack}
          cardBgColor={cardBgColor}
          gradientColors={gradientColors}
          productData={productData}
          textInverted={textInverted}
        />
      </div>
    </Box>
  );
});

export default Template;


