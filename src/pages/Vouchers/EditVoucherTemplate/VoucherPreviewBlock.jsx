import React from 'react';
import Template from './Template';
import { Box } from '@mui/material';

// A small, self-contained voucher preview block to render front and back templates
// Keeps JSX structure clean and balanced to avoid nested tag issues in Voucher.jsx
export default function VoucherPreviewBlock({
  value,
  cardBgColor,
  files,
  productData,
  category,
  checked,
  invertIconChecked,
  myRefFront,
  myRefBack,
  myRefFrontThree,
  myRefBackThree
}) {
  return (
    <Box sx={{ width: '100%' }}>
      <div id="voucher-live-preview-front" ref={myRefFront}>
        <Template
          tempOne
          cardBgColor={value === 'Template1' ? cardBgColor : ''}
          cardImage={value === 'Template1' ? files?.[0]?.preview : null}
          category={value === 'Template1' ? (category ? category : 0) : 0}
          templateId="Template1"
          productData={productData}
          textInverted={value === 'Template1' ? checked : true}
          iconInverted={value === 'Template1' ? invertIconChecked : true}
          myRefBack={myRefBack}
          myRefFront={myRefFront}
        />
      </div>
      <div id="voucher-live-preview-back" ref={myRefBack}>
        <Template
          cardBgColor={value === 'Template3' ? cardBgColor : ''}
          cardImage={value === 'Template3' ? files?.[0]?.preview : null}
          category={value === 'Template3' ? (category ? category : 0) : 0}
          templateId="Template3"
          productData={productData}
          textInverted={value === 'Template3' ? checked : true}
          iconInverted={value === 'Template3' ? invertIconChecked : true}
          myRefBack={myRefBackThree}
          myRefFront={myRefFrontThree}
        />
      </div>
    </Box>
  );
}










