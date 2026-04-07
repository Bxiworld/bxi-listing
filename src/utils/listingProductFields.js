/**
 * Normalize listing rows from BXI APIs that may use PascalCase or camelCase.
 *
 * Debug: In DevTools Network, inspect `GET product/get_listed_draft_product` — some environments
 * return `listingType: "voucher"` and `productType` / `productCategoryName` (camelCase) instead of
 * `ListingType` / `ProductType` / `ProductCategoryName`. Extend fallbacks here if new shapes appear.
 */

export function getListingType(product) {
  const v = product?.ListingType ?? product?.listingType;
  if (v == null || v === '') return '';
  return String(v).trim();
}

export function getProductType(product) {
  const v =
    product?.ProductType ??
    product?.productType ??
    product?.Type ??
    product?.type;
  if (v == null || v === '') return '';
  return String(v).trim();
}

export function getProductCategoryName(product) {
  const v = product?.ProductCategoryName ?? product?.productCategoryName;
  if (v == null || v === '') return '';
  return String(v).trim();
}

export function isVoucherListing(product) {
  return getListingType(product).toLowerCase() === 'voucher';
}

/**
 * Vertical for voucher UI and routing. API often stores ProductType as "Others" while
 * ProductCategoryName holds the real category (e.g. Textile for textileVoucher drafts).
 */
export function getVoucherVertical(product) {
  const pt = getProductType(product);
  const pc = getProductCategoryName(product);
  const ptIsGenericOthers =
    !pt || String(pt).trim().toLowerCase() === 'others';
  if (!ptIsGenericOthers) return pt;
  if (pc) return pc;
  return pt || '';
}
