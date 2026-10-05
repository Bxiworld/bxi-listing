import React from "react";

/**
 * ProductStepLayout - Wrapper component for product/voucher steps
 * Displays "My Product" or "My Voucher" title based on category
 */
export const ProductStepLayout = ({ category, children }) => {
  const voucherCategories = [
    "electronicsVoucher",
    "fmcgVoucher",
    "mobilityVoucher",
    "officesupplyVoucher",
    "eeVoucher",
    "textileVoucher",
    "lifestyleVoucher",
    "airlineVoucher",
    "qsrVoucher",
    "hotelsVoucher",
    "otherVoucher",
  ];

  const mediaCategories = ["mediaonline", "mediaoffline"];

  const isVoucher = voucherCategories.includes(category);
  const isMedia = mediaCategories.includes(category);
  const title = isVoucher ? "My Voucher" : isMedia ? "My Media" : "My Product";

  return (
    <div className="product-step-layout w-full min-w-0">
      <div className="border-b border-[#E5E8EB] bg-white px-4 py-3 sm:mb-6 sm:px-6 sm:py-4">
        <h1 className="text-xl font-bold text-[#111827] sm:text-2xl">
          {title}
        </h1>
        <p className="mt-1 text-xs text-[#6B7A99] sm:text-sm">
          {isVoucher
            ? "Create and manage your voucher listings"
            : isMedia
              ? "Create and manage your media listings"
              : "Create and manage your product listings"}
        </p>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
};
