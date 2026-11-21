import React from 'react';
import { Box, Typography } from '@mui/material';

const defaultCardBg = '#351b20';

const isLightColor = color => {
  if (typeof color !== 'string' || !/^#([0-9a-f]{6}|[0-9a-f]{8})$/i.test(color)) return false;
  const hex = color.slice(1, 7);
  const channels = [0, 2, 4].map(index => parseInt(hex.slice(index, index + 2), 16));
  const alpha = color.length === 9 ? parseInt(color.slice(7, 9), 16) / 255 : 1;
  const base = [53, 27, 32];
  const blended = channels.map((channel, index) => channel * alpha + base[index] * (1 - alpha));
  const luminance = blended.reduce((total, channel, index) => {
    const normalized = channel / 255;
    return total + normalized * [0.2126, 0.7152, 0.0722][index];
  }, 0);
  return luminance > 0.42;
};

const getAccentColor = color => {
  if (typeof color !== 'string' || !/^#([0-9a-f]{6}|[0-9a-f]{8})$/i.test(color)) return '#dbb52e';
  const hex = color.slice(1, 7);
  const channels = [0, 2, 4].map(index => parseInt(hex.slice(index, index + 2), 16));
  const alpha = color.length === 9 ? parseInt(color.slice(7, 9), 16) / 255 : 1;
  const base = [53, 27, 32];
  const blended = channels.map((channel, index) => channel * alpha + base[index] * (1 - alpha));
  const light = isLightColor(color);
  return `rgb(${blended.map(channel => Math.round(light ? channel * 0.52 : channel + (255 - channel) * 0.68)).join(', ')})`;
};

/** Front card – dark overlay design with a full-card uploaded image. */
export const VoucherCardFront = React.forwardRef(
  ({ cardBgColor, cardImage, productData, companyLogo, companyName, textInverted, gradientColors }, ref) => {
    const brandName = companyName || productData?.companyName || productData?.brandName || 'Your Company';
    const rawVoucherType = (productData?.voucherType || 'Offer Specific').trim();
    const normalizedVoucherType = rawVoucherType.replace(/\s+voucher$/i, '').trim();
    const [voucherHeadingLead, ...voucherHeadingRest] = /^offer\s+/i.test(normalizedVoucherType)
      ? ['Offer', normalizedVoucherType.replace(/^offer\s+/i, '')]
      : /^specific$/i.test(normalizedVoucherType)
        ? ['Offer', 'Specific']
        : /^value$/i.test(normalizedVoucherType)
          ? ['Gift', 'Card']
          : normalizedVoucherType.split(/\s+/);
    const voucherHeadingDetail = voucherHeadingRest.join(' ') || 'Specific';
    const brandInitials = brandName.split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]).join('').toUpperCase() || 'ID';
    const primaryTextColor = textInverted ? '#fff' : '#000';
    const accentColor = getAccentColor(cardBgColor);
    const imageSrc = typeof cardImage === 'string' ? cardImage : cardImage?.preview;

    return (
      <div
        ref={ref}
        data-html-to-image="voucher-card"
        data-voucher-card-version="dark-overlay"
        className="relative overflow-hidden rounded-[24px] shadow-lg"
        style={{
          height: 320,
          width: 480,
          maxWidth: '100%',
          background: cardBgColor || `linear-gradient(135deg, ${gradientColors?.start || '#7c3aed'}, ${gradientColors?.end || '#3b82f6'})`,
          fontFamily: 'Arial, sans-serif',
        }}
      >
        {imageSrc && <img src={imageSrc} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" style={{ opacity: 0.5 }} />}
        <div aria-hidden="true" className="absolute inset-0" style={{ background: 'linear-gradient(115deg, rgba(13,16,14,0.52), rgba(8,15,24,0.42))' }} />
        <div className="absolute left-6 top-5 z-10 flex h-[42px] items-center gap-3">
          <div className="relative flex h-[42px] w-[42px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-[#111827] shadow-sm">
            <span className="absolute text-[12px] font-bold">{brandInitials}</span>
            {companyLogo && <img src={companyLogo} alt={`${brandName} logo`} className="relative block h-full w-full object-cover" onError={event => { event.currentTarget.style.display = 'none'; }} />}
          </div>
          <p className="max-w-[330px] truncate text-[14px] font-bold uppercase" style={{ color: primaryTextColor }}>{brandName}</p>
        </div>
        <div className="absolute bottom-[25px] left-6 z-10 flex max-w-[calc(100%-48px)] flex-col items-start">
          <div aria-hidden="true" className="mb-3 h-[4px] w-[48px] rounded-full" style={{ backgroundColor: accentColor }} />
          <p className="mb-1 truncate text-[12px] font-bold uppercase tracking-[0.16em]" style={{ color: primaryTextColor }}>{voucherHeadingLead} {voucherHeadingDetail}</p>
          <p className="max-w-full truncate text-[38px] font-bold leading-none tracking-[-0.04em]" style={{ color: primaryTextColor }}>{productData?.productName || 'Gift Card'}</p>
        </div>
      </div>
    );
  }
);

/** Back card – details, inclusions, exclusions, terms */
export const VoucherCardBack = React.forwardRef(
  ({ cardBgColor, gradientColors, productData, textInverted }, ref) => {
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
          background: cardBgColor != null && String(cardBgColor).trim() !== ''
            ? cardBgColor
            : `linear-gradient(135deg, ${gradientColors?.start || '#7c3aed'}, ${gradientColors?.end || '#3b82f6'})`,
        }}
      >
        <div className="h-full p-5 flex flex-col gap-3 overflow-hidden">
          <p className="text-base font-semibold" style={{ fontFamily: 'Inter, sans-serif', color: textInverted ? '#fff' : '#000' }}>Details</p>
          <Box
            className="p-3 rounded-[10px] border"
            sx={{
              background: textInverted ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
              borderColor: textInverted ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
              height: '56px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Typography
              sx={{
                fontSize: '12px',
                lineHeight: '1.4',
                color: textInverted ? '#fff' : 'rgba(0,0,0,0.8)',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {productData?.inclusions || 'Inclusions will appear here.'}
            </Typography>
          </Box>
          <p className="text-xs font-medium mb-2" style={{ color: textInverted ? 'rgb(255,255,255)' : 'rgba(0,0,0,0.6)' }}>Exclusions</p>
          <Box
            className="p-3 rounded-[10px] border"
            sx={{
              background: textInverted ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
              borderColor: textInverted ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
              height: '56px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Typography
              sx={{
                fontSize: '12px',
                lineHeight: '1.4',
                color: textInverted ? '#fff' : 'rgba(0,0,0,0.8)',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {productData?.exclusions || 'Exclusions will appear here.'}
            </Typography>
          </Box>
          <p className="text-xs font-medium mb-2" style={{ color: textInverted ? 'rgb(255,255,255)' : 'rgba(0,0,0,0.6)' }}>Terms and conditions</p>
          <Box
            className="p-3 rounded-[10px] border"
            sx={{
              background: textInverted ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
              borderColor: textInverted ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
              height: '56px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Typography
              sx={{
                fontSize: '12px',
                lineHeight: '1.4',
                color: textInverted ? '#fff' : 'rgba(0,0,0,0.8)',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {productData?.termsAndConditions || 'Terms and conditions will appear here.'}
            </Typography>
          </Box>
        </div>
      </div>
    );
  }
);
