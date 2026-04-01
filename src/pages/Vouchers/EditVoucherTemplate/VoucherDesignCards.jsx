import React from 'react';

const defaultCardBg = '#1a1a2e';

/** Front card – horizontal layout: landscape image left, details right (VALUE + terms) */
export const VoucherCardFront = React.forwardRef(
  ({ cardBgColor, cardImage, productData, textInverted, gradientColors }, ref) => {
    const textColor = textInverted ? '#fff' : '#1a1a2e';
    const textMuted = textInverted ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.65)';
    const gradientPrimaryText = textInverted ? '#ffffff' : '#111827';
    const gradientSecondaryText = textInverted
      ? 'rgba(255,255,255,0.85)'
      : 'rgba(17,24,39,0.85)';
    const gradientDivider = textInverted
      ? 'rgba(255,255,255,0.18)'
      : 'rgba(17,24,39,0.18)';
    const bg = (cardBgColor != null && String(cardBgColor).trim() !== '') ? cardBgColor : defaultCardBg;
    const gradientStart = gradientColors?.start || '#7c3aed';
    const gradientEnd = gradientColors?.end || '#3b82f6';
    const valueBoxGradient = `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`;
    return (
      <div
        ref={ref}
        data-html-to-image="voucher-card"
        data-voucher-card-version="design-v2"
        className="rounded-[20px] overflow-hidden border border-white/10 shadow-lg flex flex-col"
        style={{
          height: 320,
          width: 480,
          maxWidth: '100%',
          backgroundColor: bg,
          background: bg,
        }}
      >
        <div className="flex flex-row h-full p-2.5 gap-3">
          <div
            className="relative flex-shrink-0 rounded-[10px] overflow-hidden bg-gray-800"
            style={{ width: 220, height: '100%', minHeight: 'auto' }}
          >
            {cardImage ? (
              <img src={typeof cardImage === 'string' ? cardImage : (cardImage?.preview || '')} alt="voucher" className="w-full h-full object-cover object-center block" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/50 text-sm">Upload image</div>
            )}
          </div>
          <div className="flex-1 flex flex-col justify-between py-2 min-w-0">
            <div>
              <p className="text-[18px] font-semibold leading-tight mb-0.5 truncate" style={{ fontFamily: 'Inter, sans-serif', color: textColor }}>
                {productData?.productName || 'Voucher'}
              </p>
              <p className="text-xs font-normal mb-3" style={{ fontFamily: 'Inter, sans-serif', color: textMuted }}>
                {productData?.voucherType || 'Gift Card'}
              </p>
              <div
                className="p-3 rounded-xl text-center"
                style={{
                  background: valueBoxGradient,
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                <p className="text-[10px] uppercase tracking-wider font-medium mb-1" style={{ color: gradientSecondaryText }}>VALUE</p>
                <p className="text-[28px] font-semibold leading-none" style={{ color: gradientPrimaryText }}>
                  {productData?.pricePerUnit ?? '1000'}
                </p>
              </div>
            </div>
            <div
              className="flex flex-col rounded-xl p-3 mt-2"
              style={{
                background: valueBoxGradient,
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-medium" style={{ color: gradientSecondaryText }}>Valid for</span>
                <span className="text-xs font-medium" style={{ color: gradientPrimaryText }}>
                  {productData?.validityOfVoucherValue} {productData?.validityOfVoucherUnit || 'Days'}
                </span>
              </div>
              <div className="w-full h-px my-1.5" style={{ background: gradientDivider }} />
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-medium" style={{ color: gradientSecondaryText }}>Redemption</span>
                <span className="text-xs font-medium capitalize" style={{ color: gradientPrimaryText }}>
                  {productData?.redemptionType || 'Online'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

/** Back card – details, inclusions, exclusions, terms */
export const VoucherCardBack = React.forwardRef(
  ({ cardBgColor, productData, textInverted }, ref) => {
    const bg = (cardBgColor != null && String(cardBgColor).trim() !== '') ? cardBgColor : defaultCardBg;
    return (
      <div
        ref={ref}
        data-html-to-image="voucher-card"
        data-voucher-card-version="design-v2"
        className="rounded-[20px] overflow-hidden border border-white/10 shadow-lg"
        style={{
          height: 320,
          width: 480,
          maxWidth: '100%',
          backgroundColor: bg,
          background: bg,
        }}
      >
        <div className="h-full p-5 flex flex-col gap-3 overflow-hidden">
          <p className="text-base font-semibold" style={{ fontFamily: 'Inter, sans-serif', color: textInverted ? '#fff' : '#000' }}>Details</p>
          <p className="text-xs font-medium mb-2" style={{ color: textInverted ? 'rgb(255,255,255)' : 'rgba(0,0,0,0.6)' }}>What&apos;s included</p>
          <div
            className="p-3 rounded-[10px] border text-xs"
            style={{
              background: textInverted ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
              borderColor: textInverted ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
              color: textInverted ? '#fff' : 'rgba(0,0,0,0.8)',
            }}
          >
            {productData?.inclusions || 'Inclusions will appear here.'}
          </div>
          <p className="text-xs font-medium mb-2" style={{ color: textInverted ? 'rgb(255,255,255)' : 'rgba(0,0,0,0.6)' }}>Exclusions</p>
          <div
            className="p-3 rounded-[10px] border text-xs"
            style={{
              background: textInverted ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
              borderColor: textInverted ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
              color: textInverted ? '#fff' : 'rgba(0,0,0,0.8)',
            }}
          >
            {productData?.exclusions || 'Exclusions will appear here.'}
          </div>
          <p className="text-xs font-medium mb-2" style={{ color: textInverted ? 'rgb(255,255,255)' : 'rgba(0,0,0,0.6)' }}>Terms and conditions</p>
          <div
            className="p-3 rounded-[10px] border text-xs"
            style={{
              background: textInverted ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
              borderColor: textInverted ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
              color: textInverted ? '#fff' : 'rgba(0,0,0,0.8)',
            }}
          >
            {productData?.termsAndConditions || 'Terms and conditions will appear here.'}
          </div>
        </div>
      </div>
    );
  }
);
