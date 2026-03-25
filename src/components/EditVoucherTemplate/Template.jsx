import React from 'react';
import { VoucherCardFront, VoucherCardBack } from './VoucherDesignCards';

/**
 * Renders front and back voucher cards for the design page (matches EditVoucherTemplate layout).
 */
export default function Template({
  cardBgColor,
  cardImage,
  productData,
  textInverted,
  myRefFront,
  myRefBack,
  gradientColors = { start: '#7c3aed', end: '#3b82f6' },
}) {
  return (
    <div className="flex flex-col gap-5">
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
    </div>
  );
}
