/**
 * All 12 product/media categories (admin can choose any).
 * Non-admin sees only categories allowed for their company type.
 */
/** All product/media categories (admin sees all 12; app has 10 product routes + 2 media = 12) */
export const ALL_PRODUCT_CATEGORIES = [
  { slug: 'textile', label: 'Textile', path: '/textile/general-info' },
  { slug: 'electronics', label: 'Electronics', path: '/electronics/general-info' },
  { slug: 'fmcg', label: 'FMCG', path: '/fmcg/general-info' },
  { slug: 'officesupply', label: 'Office Supply', path: '/officesupply/general-info' },
  { slug: 'lifestyle', label: 'Lifestyle', path: '/lifestyle/general-info' },
  { slug: 'mobility', label: 'Mobility', path: '/mobility/general-info' },
  { slug: 'restaurant', label: 'Restaurant / QSR', path: '/restaurant/general-info' },
  { slug: 'others', label: 'Others', path: '/others/general-info' },
  { slug: 'mediaonline', label: 'Media Online', path: '/mediaonline/general-info' },
  { slug: 'mediaoffline', label: 'Media Offline', path: '/mediaoffline/general-info' },
];

/** All voucher categories */
export const ALL_VOUCHER_CATEGORIES = [
  { id: 'electronicsVoucher', label: 'Electronics Voucher', path: '/electronicsVoucher/generalinformation' },
  { id: 'fmcgVoucher', label: 'FMCG Voucher', path: '/fmcgVoucher/generalinformation' },
  { id: 'mobilityVoucher', label: 'Mobility Voucher', path: '/mobilityVoucher/generalinformation' },
  { id: 'officesupplyVoucher', label: 'Office Supply Voucher', path: '/officesupplyVoucher/generalinformation' },
  { id: 'eeVoucher', label: 'Entertainment & Events Voucher', path: '/eeVoucher/generalinformation' },
  { id: 'textileVoucher', label: 'Textile Voucher', path: '/textileVoucher/generalinformation' },
  { id: 'lifestyleVoucher', label: 'Lifestyle Voucher', path: '/lifestyleVoucher/generalinformation' },
  { id: 'airlineVoucher', label: 'Airline Voucher', path: '/airlineVoucher/generalinformation' },
  { id: 'qsrVoucher', label: 'QSR Voucher', path: '/qsrVoucher/generalinformation' },
  { id: 'hotelsVoucher', label: 'Hotels Voucher', path: '/hotelsVoucher/generalinformation' },
  { id: 'otherVoucher', label: 'Other Voucher', path: '/otherVoucher/generalinformation' },
];

/** Company type name -> allowed category slugs (non-admin). Admin gets all. */
export const ALLOWED_CATEGORIES_BY_COMPANY_TYPE = {
  'Textile': ['textile'],
  'Electronics': ['electronics'],
  'FMCG': ['fmcg'],
  'Office Supply': ['officesupply'],
  'Lifestyle': ['lifestyle'],
  'Mobility': ['mobility'],
  'QSR': ['restaurant'],
  'Others': ['others'],
  'Media': ['mediaonline', 'mediaoffline'],
  'Entertainment & Events': [],
  'Hotel': [],
  'Airline Tickets': [],
  'Airlines Tickets': [],
  'Hotels': [],
  default: ['textile', 'electronics', 'fmcg', 'officesupply', 'lifestyle', 'mobility', 'restaurant', 'others', 'mediaonline', 'mediaoffline'],
};

/** Company type name -> allowed voucher ids (non-admin). Admin gets all. */
export const ALLOWED_VOUCHERS_BY_COMPANY_TYPE = {
  'Textile': ['textileVoucher'],
  'Electronics': ['electronicsVoucher'],
  'FMCG': ['fmcgVoucher'],
  'Office Supply': ['officesupplyVoucher'],
  'Lifestyle': ['lifestyleVoucher'],
  'Mobility': ['mobilityVoucher'],
  'QSR': ['qsrVoucher'],
  'Others': ['otherVoucher'],
  'Hotel': ['hotelsVoucher'],
  'Hotels': ['hotelsVoucher'],
  'Airline Tickets': ['airlineVoucher'],
  'Airlines Tickets': ['airlineVoucher'],
  'Entertainment & Events': ['eeVoucher'],
  'Media': [],
  default: ['electronicsVoucher', 'fmcgVoucher', 'mobilityVoucher', 'officesupplyVoucher', 'eeVoucher', 'textileVoucher', 'lifestyleVoucher', 'airlineVoucher', 'qsrVoucher', 'hotelsVoucher', 'otherVoucher'],
};

export function getAllowedCategories(companyTypeName, isAdmin) {
  if (isAdmin) {
    return ALL_PRODUCT_CATEGORIES;
  }
  const slugs = ALLOWED_CATEGORIES_BY_COMPANY_TYPE[companyTypeName] || ALLOWED_CATEGORIES_BY_COMPANY_TYPE.default;
  return ALL_PRODUCT_CATEGORIES.filter((c) => slugs.includes(c.slug));
}

export function getAllowedVouchers(companyTypeName, isAdmin) {
  if (isAdmin) {
    return ALL_VOUCHER_CATEGORIES;
  }
  const voucherIds = ALLOWED_VOUCHERS_BY_COMPANY_TYPE[companyTypeName] || ALLOWED_VOUCHERS_BY_COMPANY_TYPE.default;
  return ALL_VOUCHER_CATEGORIES.filter((v) => voucherIds.includes(v.id));
}
