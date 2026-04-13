/**
 * Static media subcategories for media listing (used instead of API).
 * Keys match mediaCategory from AddMediaCategoryPage (localStorage/sessionStorage).
 */
export const MEDIA_SUBCATEGORIES_BY_CATEGORY = {
  // Media Online (image 1 + image 3)
  cinema: [
    'On Screen',
    'Offscreen',
    'Activation Space',
  ],
  multiplex: [
    'On Screen',
    'Offscreen',
    'Activation Space',
  ],
  airport: [
    'Static',
    'Digital',
    'Airport Bus Wrap',
  ],
  dooh: [
    'LED OOH',
    'Scala TV',
    'LED Pillar',
    'Easel Standee',
    'CCD Ads',
    'Residential Screen',
    'Corporate Park Screens',
    'Gym digital Screens',
    'Mall Digital Media',
  ],
  television: [
    'Sports',
    'News',
    'Entertainment',
  ],
  other: [
    'Influencer mkt',
    'In app advt',
    'Wall Branding',
  ],
  // Media Online – from image 2 (Print, Radio)
  print: [
    'Newspaper',
    'Magazines',
    'Flyers',
    'Electricity bills',
    'Boarding Pass',
  ],
  radio: [
    'FM Jingle Announcements',
    'Metro annoucement',
    'R J Mentions',
    'Roadblock ads',
    'Railway local train announcement',
    'Podcast',
    'Contest',
  ],

  // Media Offline (image 1 + image 2)
  hoarding: [
    'OOH',
    'Metro Station',
    'Mall Hoardings',
    'Bus Shelters',
    'Railway Station Boards',
  ],
  offlinebtl: [
    'Bus Wrap',
    'Train Wrap',
    'Metro Wrap',
    'Escalator',
    'Pole Kiosks',
    'Auto Wrap',
    'Cab Wrap',
    'Activation Space',
    'flight wrap',
    'Elevator/Lift',
    'Mobile Van',
    'Standee',
  ],
};

/**
 * MongoDB ProductSubCategory values for Media Offline — Print Media static labels.
 * Used when Get_media_offline rows do not match label text; keys must match `print` list above.
 * IDs align with BXI listing logic (OneUnit / newspaper flows).
 */
export const MEDIA_OFFLINE_PRINT_PRODUCT_SUBCATEGORY_ID_BY_LABEL = {
  Newspaper: '647713dcb530d22fce1f6c36',
  Magazines: '643cdf01779bc024c189cf95',
  Flyers: '643ce635e424a0b8fcbba6d6',
  'Electricity bills': '643ce648e424a0b8fcbba710',
  'Boarding Pass': '643ce6fce424a0b8fcbbad42',
};

const OID_HEX = /^[a-f0-9]{24}$/i;

/**
 * Ensure ProductSubCategory is a 24-char hex id for print offline; fix legacy rows that stored the label.
 */
export function resolveMediaOfflinePrintSubcategoryId(raw, nameHint) {
  const r = raw != null ? String(raw).trim() : '';
  if (OID_HEX.test(r)) return r;
  if (MEDIA_OFFLINE_PRINT_PRODUCT_SUBCATEGORY_ID_BY_LABEL[r]) {
    return MEDIA_OFFLINE_PRINT_PRODUCT_SUBCATEGORY_ID_BY_LABEL[r];
  }
  const n = nameHint != null ? String(nameHint).trim() : '';
  if (n && MEDIA_OFFLINE_PRINT_PRODUCT_SUBCATEGORY_ID_BY_LABEL[n]) {
    return MEDIA_OFFLINE_PRINT_PRODUCT_SUBCATEGORY_ID_BY_LABEL[n];
  }
  return r;
}

/**
 * Get subcategory options for a media category key.
 * @param {string} mediaCategory - e.g. 'television', 'hoarding', 'dooh'
 * @returns {string[]} List of subcategory display names
 */
export function getMediaSubcategories(mediaCategory) {
  if (!mediaCategory || typeof mediaCategory !== 'string') return [];
  const key = mediaCategory.toLowerCase().trim();
  return MEDIA_SUBCATEGORIES_BY_CATEGORY[key] || [];
}


export function getMediaSubcategoriesForListing() {
  // call this api 'mediasubcategory/for_listing'
  const  getMediaSubcategoriesForListing = async () => {
    const response = await axios.get('mediasubcategory/for_listing');
    return response?.data?.subcategory;
  }
  return getMediaSubcategoriesForListing();
}