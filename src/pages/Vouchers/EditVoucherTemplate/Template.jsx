import React from 'react';
import { Box, Typography } from '@mui/material';
import { VoucherCardFront, VoucherCardBack } from './VoucherDesignCards';
import { voucherStyle } from './EditVoucherStyle';

function AdditionalProductImagesCard({ images = [], onChooseFiles, onRemoveImage, maxImages = 2 }) {
  const inputRef = React.useRef(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const limitReached = images.length >= maxImages;
  return (
    <Box
      onDragOver={event => {
        event.preventDefault();
        if (!limitReached) setIsDragging(true);
      }}
      onDragLeave={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsDragging(false);
      }}
      onDrop={event => {
        event.preventDefault();
        setIsDragging(false);
        if (!limitReached && event.dataTransfer?.files?.length) onChooseFiles(event.dataTransfer.files);
      }}
      sx={{ width: 480, maxWidth: '100%', minHeight: 320, p: 3, border: '2px dashed #5682ff', borderRadius: 3, bgcolor: isDragging ? '#eaf0ff' : '#f7f8fd', display: 'flex', flexDirection: 'column', transition: 'background-color 120ms ease' }}
    >
      <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#1f2937', mb: .75 }}>
        Want to add more images for your product?
      </Typography>
      <Typography sx={{ fontSize: 13, color: '#64748b', mb: 2 }}>
        Upload additional photos to show after your voucher image.
      </Typography>
      {images.length > 0 && <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
        {images.map(image => <Box key={image.id} sx={{ width: 92, height: 82, position: 'relative', borderRadius: 2, overflow: 'hidden' }}>
          <img src={image.preview} alt={image.file.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <button type="button" aria-label={`Remove ${image.file.name}`} onClick={() => onRemoveImage(image.id)} style={{ position: 'absolute', top: 3, right: 3, border: 0, borderRadius: 10, background: '#fff', color: '#b42318', cursor: 'pointer', lineHeight: '20px', width: 22, height: 22 }}>×</button>
        </Box>)}
      </Box>}
      {!limitReached && <button type="button" onClick={() => inputRef.current?.click()} style={{ minHeight: images.length ? 52 : 128, marginTop: 'auto', border: '1px dashed #5682ff', borderRadius: 10, background: '#fff', color: '#315794', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
        + &nbsp;Click to upload or drag and drop images here
      </button>}
      {!limitReached && <input ref={inputRef} type="file" accept="image/jpeg,image/png" multiple hidden onChange={event => { onChooseFiles(event.target.files); event.target.value = ''; }} />}
      <Typography sx={{ fontSize: 11, color: '#64748b', mt: 1 }}>JPEG or PNG, up to 2 MB each. Optional.</Typography>
      <Typography role="status" sx={{ fontSize: 12, color: limitReached ? '#315794' : '#64748b', mt: 0.5 }}>
        {limitReached ? 'Maximum reached: 3 images total, including the voucher cover (up to 2 product images).' : `You can add up to ${maxImages - images.length} more product image${maxImages - images.length === 1 ? '' : 's'} (3 images total including the voucher cover).`}
      </Typography>
    </Box>
  );
}

const Template = React.memo(({
  cardBgColor,
  cardImage,
  productData,
  companyLogo,
  companyName,
  textInverted,
  myRefFront,
  myRefBack,
  showExtraImageUpload = false,
  additionalImages = [],
  onChooseAdditionalImages,
  onRemoveAdditionalImage,
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
        companyLogo={companyLogo}
        companyName={companyName}
        textInverted={textInverted}
        gradientColors={gradientColors}
      />
      {showExtraImageUpload ? <>
        <AdditionalProductImagesCard
          images={additionalImages}
          onChooseFiles={onChooseAdditionalImages}
          onRemoveImage={onRemoveAdditionalImage}
        />
      </> : <VoucherCardBack
        ref={myRefBack}
        cardBgColor={cardBgColor}
        gradientColors={gradientColors}
        productData={productData}
        textInverted={textInverted}
      />}
    </Box>
  );
});

export default Template;


