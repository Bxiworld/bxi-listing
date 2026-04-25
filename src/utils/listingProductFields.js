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

const normForMedia = (value) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/**
 * Media rows from Seller Hub / APIs (not the seller’s companyType).
 * Used so Admin view and mixed tabs still route to media preview + edit, not product preview.
 */
export function isMediaListing(product) {
  if (!product) return false;
  if (isVoucherListing(product)) return false;
  if (getListingType(product).toLowerCase() === 'media') return true;
  const pt = normForMedia(getProductType(product));
  if (pt === 'mediaonline' || pt === 'mediaoffline') return true;
  if (pt.includes('media online') || pt.includes('media offline')) return true;
  const cat = normForMedia(getProductCategoryName(product));
  if (cat === 'mediaonline' || cat === 'mediaoffline' || cat === 'media') return true;
  if (cat.includes('mediaonline') || cat.includes('mediaoffline')) return true;
  if (
    cat.includes('multiplex') ||
    cat.includes('hoarding') ||
    cat.includes('news paper') ||
    cat.includes('magazine') ||
    cat.includes('dooh') ||
    cat === 'btl' ||
    cat.includes('btl')
  ) {
    return true;
  }
  const mj = String(product?.mediaJourney ?? '').toLowerCase();
  if (mj && (mj.includes('television') || mj === 'television-ads' || mj.includes('digital-ads'))) {
    return true;
  }
  return false;
}

/** Statuses that must never show on Seller Hub "In Draft" (stale InDraft + Approved in DB). */
const SELLER_HUB_NON_DRAFT_STATUSES = new Set([
  'approved',
  'live',
  'pendingapproval',
  'delist',
  'rejected',
  'expiry',
]);

/**
 * In Draft list should only include real drafts. Backend can return rows with
 * InDraft: true and ProductUploadStatus: Approved — filter those out in the client too.
 */
export function passesSellerHubDraftTabListing(product) {
  const s = String(product?.ProductUploadStatus ?? '').trim();
  if (!s) return true;
  return !SELLER_HUB_NON_DRAFT_STATUSES.has(s.toLowerCase());
}

/**
 * Vertical for voucher UI and routing. API often stores ProductType as "Others" while
 * ProductCategoryName holds the real category (e.g. Textile for textileVoucher drafts).
 */
/**
 * Resolve the subcategory display name.
 * Media listings store it as `ProductSubCategoryName`.
 * Product / Voucher listings store the name directly under `ProductSubCategory`.
 * We try both fields and pick the first non-empty string that is NOT a 24-char
 * hex ObjectId (i.e. a raw Mongo ID).
 */
export function getProductSubCategoryName(product) {
  const candidates = [
    product?.ProductSubCategoryName,
    product?.productSubCategoryName,
    product?.ProductSubCategory,
    product?.productSubCategory,
  ];
  const OBJECT_ID_RE = /^[a-f\d]{24}$/i;
  for (const v of candidates) {
    if (v != null && v !== '') {
      const s = String(v).trim();
      if (s && !OBJECT_ID_RE.test(s)) return s;
    }
  }
  return '';
}

const KNOWN_CATEGORY_IDS = {
  '63e38ba3cc4c02b8a0c94b72': 'Hotels',
  '63e38b91cc4c02b8a0c94b69': 'Textile',
  '63e38b96cc4c02b8a0c94b6c': 'Electronics',
  '63e38b9ccc4c02b8a0c94b6f': 'FMCG',
  '63e38bb3cc4c02b8a0c94b78': 'Lifestyle',
  '63e38bb9cc4c02b8a0c94b7b': 'Mobility',
  '63e38bbfcc4c02b8a0c94b7e': 'Others',
  '63e38bc6cc4c02b8a0c94b81': 'QSR',
  '64218b189fe1b6ae750c11bd': 'Airline Tickets',
  '63e38bcecc4c02b8a0c94b84': 'Entertainment & Events',
  '63e38bd5cc4c02b8a0c94b87': 'Office Supply',
};

export function getVoucherVertical(product) {
  let pt = getProductType(product);
  const pc = getProductCategoryName(product);
  
  if (KNOWN_CATEGORY_IDS[pt]) {
    pt = KNOWN_CATEGORY_IDS[pt];
  }

  const ptIsGenericOthers =
    !pt || String(pt).trim().toLowerCase() === 'others';
  
  const OBJECT_ID_RE = /^[a-f\d]{24}$/i;
  const isPtObjectId = pt && OBJECT_ID_RE.test(String(pt).trim());

  if (!ptIsGenericOthers && !isPtObjectId) return pt;
  if (pc && !OBJECT_ID_RE.test(String(pc).trim())) return pc;
  return pt || '';
}
