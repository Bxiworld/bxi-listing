/**
 * Resolves the route path for Edit or View actions from Seller Hub
 * Based on product type, company type, listing type, and action
 */
import { getVoucherJourneyType, VOUCHER_JOURNEY_TYPE } from './voucherType';
import {
  getProductType,
  getProductCategoryName,
  getVoucherVertical,
  isVoucherListing,
} from './listingProductFields';

// Category route mappings for products
const categoryRoutes = {
  'Textile': '/textile',
  'Electronics': '/electronics',
  'FMCG': '/fmcg',
  'Office Supply': '/officesupply',
  'Lifestyle': '/lifestyle',
  'Mobility': '/mobility',
  'Others': '/others',
  'QSR': '/restaurant',
  'Hotel': '/hotelsVoucher',
  'Airline Tickets': '/airlineVoucher',
  'Entertainment & Events': '/eeVoucher',
};

// Voucher route mappings
const voucherRoutes = {
  'Textile': '/textileVoucher',
  'Electronics': '/electronicsVoucher',
  'FMCG': '/fmcgVoucher',
  'Office Supply': '/officesupplyVoucher',
  'Lifestyle': '/lifestyleVoucher',
  'Mobility': '/mobilityVoucher',
  'Others': '/otherVoucher',
  'QSR': '/qsrVoucher',
  'Hotel': '/hotelsVoucher',
  'Airline Tickets': '/airlineVoucher',
  'Entertainment & Events': '/eeVoucher',
};

// Media category mappings
const mediaRoutes = {
  'Multiplex ADs': '/mediaonline',
  'Digital ADs': '/mediaonline',
  'Hoardings': '/mediaoffline',
  'News Paper & Magazine': '/mediaoffline',
};

// Preview route mappings
const previewRoutes = {
  'Textile': '/textilepreviewpage',
  'Electronics': '/electronicsproductpreview',
  'FMCG': '/fmcgproductpreview',
  'Office Supply': '/allproductpreview',
  'Lifestyle': '/allproductpreview',
  'Mobility': '/mobilityproductpreview',
  'Others': '/allproductpreview',
  'QSR': '/RestaurantProductPreview',
  'Hotel': '/allvoucherpreview',
  'Media': '/mediaonlineproductpreview',
};

// Step mappings for edit navigation (based on reviewReasonNavigation)
const stepMappings = {
  generalinformation: '/general-info',
  productinformation: '/product-info',
  technicalinformation: '/tech-info',
  golive: '/go-live',
  // Voucher-only status: same path segment as go-live; voucherStepMap maps to /voucherdesign
  voucherdesign: '/go-live',
};

/** Order for picking the furthest known step from multiple API fields */
const STEP_PROGRESS_ORDER = {
  generalinformation: 1,
  productinformation: 2,
  technicalinformation: 3,
  golive: 4,
  voucherdesign: 5,
};

/** Normalized labels that are not real step keys — ignore for routing */
const GENERIC_UPLOAD_STATUS_KEYS = new Set(['draft', 'indraft']);

/**
 * Resolve which listing step key (generalinformation, productinformation, …) edit should open.
 * Unmapped reviewReasonNavigation is ignored so ProductUploadStatus / nested tech can be used.
 */
const resolveListingStepKey = (product, reviewReasonNavigation, normalizeKey) => {
  const normReview = normalizeKey(reviewReasonNavigation);
  const normRoot = normalizeKey(product?.ProductUploadStatus);
  const normNested = normalizeKey(product?.ProductTechInfo?.ProductUploadStatus);

  if (normReview && stepMappings[normReview]) {
    return normReview;
  }

  const candidates = [];
  if (normRoot && !GENERIC_UPLOAD_STATUS_KEYS.has(normRoot) && stepMappings[normRoot]) {
    candidates.push(normRoot);
  }
  if (normNested && !GENERIC_UPLOAD_STATUS_KEYS.has(normNested) && stepMappings[normNested]) {
    candidates.push(normNested);
  }

  let bestKey = '';
  let bestOrder = 0;
  for (const k of candidates) {
    const ord = STEP_PROGRESS_ORDER[k] || 0;
    if (ord > bestOrder) {
      bestOrder = ord;
      bestKey = k;
    }
  }

  if (!bestKey && Array.isArray(product?.ProductsVariantions) && product.ProductsVariantions.length > 0) {
    bestKey = 'productinformation';
  }
  if (!bestKey) {
    bestKey = 'generalinformation';
  }
  return bestKey;
};

// Hotel voucher uses different step names (per bxi-dashboard)
const hotelVoucherStepMappings = {
  'generalinformation': '/generalinformation',
  'productinformation': '/hotelsproductinfo',
  'technicalinformation': '/hotelstechinfo',
  'golive': '/hotelsgolive',
  'voucherdesign': '/voucherdesign',
};

/**
 * Resolve the route for Edit or View action from Seller Hub
 * @param {Object} params
 * @param {Object} params.product - The product object
 * @param {string} params.companyType - Company type name (e.g., 'Textile', 'Media')
 * @param {string} params.action - 'edit' or 'view'
 * @param {string} params.reviewReasonNavigation - Optional step for edit navigation
 * @returns {string} - The route path
 */
export const resolveSellerHubRoute = ({ product, companyType, action, reviewReasonNavigation }) => {
  const productId = product?._id;
  const productCategory = getProductCategoryName(product);
  const productSubCategory =
    product?.ProductSubCategoryName ?? product?.productSubCategoryName ?? '';
  const isBulkUpload = !!product?.bulk_upload_res_id;

  if (!productId) {
    console.warn('No product ID found');
    return '/sellerhub';
  }

  // Handle View action
  if (action === 'view') {
    return resolveViewRoute({ product, companyType, productCategory, productSubCategory, productId });
  }

  // Handle Edit action
  if (action === 'edit') {
    return resolveEditRoute({ 
      product, 
      companyType, 
      productCategory, 
      productSubCategory, 
      productId, 
      reviewReasonNavigation,
      isBulkUpload 
    });
  }

  return '/sellerhub';
};

/**
 * Resolve View route
 */
const resolveViewRoute = ({ product, companyType, productCategory, productSubCategory, productId }) => {
  // Handle Media company type
  if (companyType === 'Media') {
    const mediaCategoryField = String(product?.mediaCategory || '').toLowerCase();
    if (mediaCategoryField === 'dooh') {
      return `/hoardingmediaofflineproductpreview/${productId}`;
    }
    if (productCategory === 'Multiplex ADs') {
      if (productSubCategory === 'Digital ADs') {
        return `/mediaonlineproductpreview/${productId}`;
      }
      return `/multiplexmediaonlineproductpreview/${productId}`;
    }
    if (productCategory === 'Hoardings' || productSubCategory === 'Hoardings') {
      return `/hoardingmediaofflineproductpreview/${productId}`;
    }
    return `/mediaonlineproductpreview/${productId}`;
  }

  // Handle Voucher listing type
  if (isVoucherListing(product)) {
    const voucherType = getVoucherJourneyType(
      product?.VoucherType ?? product?.voucherType
    );
    if (voucherType === VOUCHER_JOURNEY_TYPE.VALUE_GIFT) {
      return `/valueandgiftvoucher/${productId}`;
    }
    if (voucherType === VOUCHER_JOURNEY_TYPE.OFFER_SPECIFIC) {
      return `/spacificvoucher/${productId}`;
    }
    return `/allvoucherpreview/${productId}`;
  }

  // Handle Product listing type
  const normalizeKeyForCategoryCompare = (key) => {
    if (!key) return '';
    return String(key).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  };

  const categoryCandidate =
    productCategory || getProductType(product) || companyType;
  const previewRouteFromExact =
    previewRoutes[categoryCandidate] || previewRoutes[productCategory] || previewRoutes[companyType];

  const normalizedCategoryCandidate = normalizeKeyForCategoryCompare(categoryCandidate);
  const previewRouteFromFuzzy = !previewRouteFromExact && normalizedCategoryCandidate
    ? Object.keys(previewRoutes).find((k) => normalizeKeyForCategoryCompare(k) === normalizedCategoryCandidate)
    : null;

  const previewRoute = previewRouteFromExact || (previewRouteFromFuzzy ? previewRoutes[previewRouteFromFuzzy] : null) || '/allproductpreview';
  return `${previewRoute}/${productId}`;
};

/**
 * Resolve Edit route
 * For drafts, step is taken from ProductUploadStatus when reviewReasonNavigation is missing
 * so the user returns to the page where they left off.
 */
const resolveEditRoute = ({ 
  product, 
  companyType, 
  productCategory, 
  productSubCategory,
  productId, 
  reviewReasonNavigation,
  isBulkUpload 
}) => {
  const normalizeReviewKey = (key) => {
    if (!key) return '';
    return String(key)
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, '') // remove spaces/underscores/hyphens
      .replace(/[^\w]/g, ''); // remove any other unexpected chars
  };

  const normalizedReviewKey = normalizeReviewKey(reviewReasonNavigation);
  const listingStepKey = resolveListingStepKey(product, reviewReasonNavigation, normalizeReviewKey);
  const step = stepMappings[listingStepKey] || '/general-info';

  const normalizeKeyForCategoryCompare = (key) => {
    if (!key) return '';
    return String(key).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  };

  // Handle bulk upload products
  if (isBulkUpload) {
    return `/mediaSheetsProductsPreview/${productId}`;
  }

  // Handle Media company type (multiplex, digital, hoarding have specific step routes)
  if (companyType === 'Media') {
    const reviewKey = listingStepKey;
    const mediaJourney = product?.mediaJourney;
    if (mediaJourney === 'television-ads') {
      const televisionSteps = {
        generalinformation: 'general-info',
        productinformation: 'product-info',
        technicalinformation: 'tech-info',
        golive: 'go-live',
      };
      const televisionStep = televisionSteps[reviewKey] || 'product-info';
      return `/mediaonline/${televisionStep}/${productId}`;
    }
    if (productCategory === 'Multiplex ADs') {
      if (productSubCategory === 'Digital ADs') {
        const digitalSteps = { generalinformation: 'general-info', productinformation: 'mediaonlinedigitalscreensinfo', technicalinformation: 'mediaonlinedigitalscreenstechinfo', golive: 'digitalscreensgolive' };
        const digitalStep = digitalSteps[reviewKey] || 'mediaonlinedigitalscreensinfo';
        return `/mediaonline/${digitalStep}/${productId}`;
      }
      const multiplexSteps = { generalinformation: 'general-info', productinformation: 'mediaonlinemultiplexproductinfo', technicalinformation: 'mediamultiplextechinfo', golive: 'multiplexgolive' };
      const multiplexStep = multiplexSteps[reviewKey] || 'mediaonlinemultiplexproductinfo';
      return `/mediaonline/${multiplexStep}/${productId}`;
    }
    if (productCategory === 'Hoardings' || productSubCategory === 'Hoardings') {
      if (reviewKey === 'golive') {
        return `/mediaonline/go-live/${productId}?from=hoarding`;
      }
      const hoardingSteps = {
        generalinformation: 'general-info',
        productinformation: 'mediaofflinehoardinginfo',
        technicalinformation: 'mediaofflinehoardingtechinfo',
      };
      const hoardingStep = hoardingSteps[reviewKey] || 'mediaofflinehoardinginfo';
      return `/mediaoffline/${hoardingStep}/${productId}`;
    }
    // Default media offline (e.g. News Paper & Magazine): general-info or product-info
    if (reviewKey === 'generalinformation') {
      return `/mediaoffline/general-info/${productId}`;
    }
    return `/mediaoffline/product-info/${productId}`;
  }

  // Handle Voucher listing type — use getVoucherVertical: ProductType may be wrongly "Others" while
  // ProductCategoryName has the real vertical (e.g. Textile).
  if (isVoucherListing(product)) {
    const voucherCategoryCandidate =
      getVoucherVertical(product) || companyType;
    const voucherRouteFromExactMatch =
      voucherRoutes[voucherCategoryCandidate] || voucherRoutes[productCategory] || voucherRoutes[companyType];
    const normalizedVoucherCategory = normalizeKeyForCategoryCompare(voucherCategoryCandidate);
    const voucherRouteFromFuzzyMatch = !voucherRouteFromExactMatch && normalizedVoucherCategory
      ? Object.keys(voucherRoutes).find((k) => normalizeKeyForCategoryCompare(k) === normalizedVoucherCategory)
      : null;

    const isHotelCategory = (val) => {
      const n = normalizeKeyForCategoryCompare(val);
      return n === 'hotel' || n === 'hotels';
    };
    // Map key is "Hotel" only; API may send "Hotels" — align with hotels voucher route.
    const voucherRouteFromHotelSynonym =
      !voucherRouteFromExactMatch && !voucherRouteFromFuzzyMatch && isHotelCategory(voucherCategoryCandidate)
        ? voucherRoutes.Hotel
        : null;

    const voucherRoute =
      voucherRouteFromExactMatch ||
      (voucherRouteFromFuzzyMatch ? voucherRoutes[voucherRouteFromFuzzyMatch] : null) ||
      voucherRouteFromHotelSynonym ||
      voucherRoutes.Others;
    const isHotel =
      companyType === 'Hotel' ||
      companyType === 'Hotels' ||
      isHotelCategory(productCategory) ||
      isHotelCategory(getVoucherVertical(product));

    // Hotel voucher uses different step names (hotelsproductinfo, hotelstechinfo, hotelsgolive)
    const hotelStepKey =
      normalizedReviewKey && hotelVoucherStepMappings[normalizedReviewKey]
        ? normalizedReviewKey
        : listingStepKey;
    if (isHotel && hotelVoucherStepMappings[hotelStepKey]) {
      return `${voucherRoute}${hotelVoucherStepMappings[hotelStepKey]}/${productId}`;
    }
    // Generic voucher step mapping: product step 2->techinfo, 3->golive, 4->voucherdesign
    const voucherStepMap = {
      '/general-info': '/generalinformation',
      '/product-info': '/techinfo',
      '/tech-info': '/golive',
      '/go-live': '/voucherdesign',
    };
    const voucherStep = voucherStepMap[step] || '/generalinformation';
    return `${voucherRoute}${voucherStep}/${productId}`;
  }

  // Handle Product listing type
  // In Admin view, `companyType` is often "Admin", so prefer the actual saved product category.

  // Some draft/listing items may not have `ProductCategoryName` populated consistently.
  // Fall back to other fields used elsewhere in the page (ProductType / Type).
  const categoryCandidate = productCategory || getProductType(product);

  const categoryRouteFromExactMatch =
    categoryRoutes[categoryCandidate] || categoryRoutes[productCategory] || categoryRoutes[companyType];
  const normalizedProductCategory = normalizeKeyForCategoryCompare(categoryCandidate);
  const categoryRouteFromFuzzyMatch = !categoryRouteFromExactMatch && normalizedProductCategory
    ? Object.keys(categoryRoutes).find((k) => normalizeKeyForCategoryCompare(k) === normalizedProductCategory)
    : null;

  const categoryRoute = categoryRouteFromExactMatch || (categoryRouteFromFuzzyMatch ? categoryRoutes[categoryRouteFromFuzzyMatch] : null);
  if (categoryRoute) {
    return `${categoryRoute}${step}/${productId}`;
  }

  // Default fallback
  return `/others${step}/${productId}`;
};

/**
 * Get category options based on company type
 */
export const getCategoryOptions = (companyType) => {
  if (companyType === 'Media') {
    return [
      { value: 'mediaonline', label: 'Media Online' },
      { value: 'mediaoffline', label: 'Media Offline' },
    ];
  }

  return [
    { value: 'textile', label: 'Textile' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'fmcg', label: 'FMCG' },
    { value: 'officesupply', label: 'Office Supply' },
    { value: 'lifestyle', label: 'Lifestyle' },
    { value: 'mobility', label: 'Mobility' },
    { value: 'others', label: 'Others' },
    { value: 'restaurant', label: 'Restaurant/QSR' },
  ];
};

/**
 * Get voucher options based on company type
 */
export const getVoucherOptions = (companyType) => {
  return [
    { value: 'electronicsVoucher', label: 'Electronics Voucher' },
    { value: 'fmcgVoucher', label: 'FMCG Voucher' },
    { value: 'mobilityVoucher', label: 'Mobility Voucher' },
    { value: 'officesupplyVoucher', label: 'Office Supply Voucher' },
    { value: 'eeVoucher', label: 'Entertainment & Events Voucher' },
    { value: 'textileVoucher', label: 'Textile Voucher' },
    { value: 'lifestyleVoucher', label: 'Lifestyle Voucher' },
    { value: 'airlineVoucher', label: 'Airline Voucher' },
    { value: 'qsrVoucher', label: 'QSR Voucher' },
    { value: 'otherVoucher', label: 'Other Voucher' },
    { value: 'hotelsVoucher', label: 'Hotels Voucher' },
  ];
};

export default resolveSellerHubRoute;
