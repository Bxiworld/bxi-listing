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
    'CCD ads',
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