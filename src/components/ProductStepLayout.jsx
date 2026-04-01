import React from 'react';

/**
 * ProductStepLayout - Wrapper component for product/voucher steps
 * Displays "My Product" or "My Voucher" title based on category
 */
export const ProductStepLayout = ({ category, children }) => {
  const voucherCategories = [
    'electronicsVoucher', 'fmcgVoucher', 'mobilityVoucher', 'officesupplyVoucher',
    'eeVoucher', 'textileVoucher', 'lifestyleVoucher', 'airlineVoucher',
    'qsrVoucher', 'hotelsVoucher', 'otherVoucher'
  ];

  const mediaCategories = ['mediaonline', 'mediaoffline'];

  const isVoucher = voucherCategories.includes(category);
  const isMedia = mediaCategories.includes(category);
  const title = isVoucher ? 'My Voucher' : isMedia ? 'My Media' : 'My Product';

  return (
    <div>
      <div className="border-b border-[#E5E8EB] px-6 py-4 bg-white mb-6">
        <h1 className="text-2xl font-bold text-[#111827]">{title}</h1>
        <p className="text-sm text-[#6B7A99] mt-1">
          {isVoucher ? 'Create and manage your voucher listings' : isMedia ? 'Create and manage your media listings' : 'Create and manage your product listings'}
        </p>
      </div>
      {children}
    </div>
  );
};
