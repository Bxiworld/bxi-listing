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

/** Front card – black and gold ribbon design. */
export const VoucherCardFront = React.forwardRef(
  ({ cardBgColor, cardImage, productData, companyLogo, companyName, textInverted }, ref) => {
    const brandName = companyName || productData?.companyName || productData?.brandName || 'Your Company';
    const voucherType = (productData?.voucherType || 'Specific')
      .replace(/^offer\s+/i, '')
      .replace(/\s+voucher$/i, '')
      .trim() || 'Specific';
    const brandInitials = brandName.split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]).join('').toUpperCase() || 'ID';
    const primaryTextColor = textInverted ? '#fff' : '#000';
    const accentColor = getAccentColor(cardBgColor);
    return (
      <div
        ref={ref}
        data-html-to-image="voucher-card"
        data-voucher-card-version="black-gold-ribbon"
        className="relative overflow-hidden rounded-[24px] shadow-lg"
        style={{
          height: 320,
          width: 480,
          maxWidth: '100%',
          background: cardBgColor || 'linear-gradient(115deg, #15130b 0%, #080f10 100%)',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div className="absolute left-8 top-7 z-10 flex h-[68px] items-center gap-[22px]">
          <div className="relative flex h-[84px] w-[84px] shrink-0 items-center justify-center overflow-hidden rounded-full border-[4px] border-[#d8b331] bg-[#511020] text-[#e6c54b] shadow-[0_5px_12px_rgba(0,0,0,0.3)]">
            <span className="absolute" style={{ fontFamily: 'Impact, "Arial Narrow", sans-serif', fontSize: 27, fontWeight: 700 }}>{brandInitials}</span>
            {companyLogo && <img src={companyLogo} alt={`${brandName} logo`} className="relative block h-full w-full object-cover" onError={event => { event.currentTarget.style.display = 'none'; }} />}
          </div>
          <p className="max-w-[300px] truncate text-[14px] uppercase tracking-[0.22em]" style={{ color: primaryTextColor }}>{brandName}</p>
        </div>
        <div className="absolute left-8 top-[116px] z-10 flex items-baseline gap-2 whitespace-nowrap" style={{ maxWidth: 'calc(79% - 50px)' }}>
          <span className="shrink-0 text-[52px] font-black uppercase leading-none" style={{ fontFamily: 'Impact, "Arial Narrow", sans-serif', letterSpacing: '-0.025em', color: accentColor }}>Offer</span>
          <span className="min-w-0 truncate text-[48px] font-light uppercase leading-none" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 300, letterSpacing: '-0.045em', color: primaryTextColor }}>{voucherType}</span>
        </div>
        <div aria-hidden="true" className="absolute left-0 right-0 top-[70%] h-[4px]" style={{ backgroundColor: accentColor, backgroundImage: 'radial-gradient(rgba(255,255,255,0.65) 1px, transparent 1.2px)', backgroundSize: '7px 4px' }} />
        <div aria-hidden="true" className="absolute bottom-0 left-[79%] top-0 w-[5px]" style={{ backgroundColor: accentColor, backgroundImage: 'radial-gradient(rgba(255,255,255,0.65) 1px, transparent 1.2px)', backgroundSize: '5px 7px' }} />
        <p className="absolute left-8 top-[78%] z-10 max-w-[330px] truncate text-[21px] font-medium uppercase leading-none tracking-[0.2em]" style={{ fontFamily: 'Arial, sans-serif', color: primaryTextColor }}>{productData?.productName || 'Gift Card'}</p>
        <div aria-hidden="true" className="absolute z-20 h-[78px] w-[100px]" style={{ left: 'calc(79% - 48px)', top: 'calc(70% - 36px)' }}>
          <svg viewBox="0 0 100 80" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 39C42 24 31 9 18 12C5 15 7 34 18 39C27 43 40 40 50 39ZM50 39C58 24 69 9 82 12C95 15 93 34 82 39C73 43 60 40 50 39ZM49 40L22 75M51 40L78 75" stroke={accentColor} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
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
