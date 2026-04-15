/**
 * Category-specific media listing rules (seller forms, previews, supporting docs).
 * Resolved from product.mediaCategory / mediaJourney + subcategory where needed.
 */

const RADIO_SUB_ID = '65029534eaa5251874e8c6c1';

function readStorage(key) {
  try {
    return (
      (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(key)) ||
      (typeof localStorage !== 'undefined' && localStorage.getItem(key)) ||
      ''
    );
  } catch {
    return '';
  }
}

/** Airport ad types (stored in mediaVariation.location). */
export const AIRPORT_AD_TYPES = [
  'Lobby',
  'Main Area',
  'On Screen',
  'Security Hold Area',
  'Arrival',
  'Departure',
  'Conveyor Belt',
  'Others',
];

/** Airport units (values match legacy MenuItem value=). */
export const AIRPORT_UNITS = [
  { value: 'Screen', label: 'Per Screen' },
  { value: 'Unit', label: 'Per Unit' },
  { value: 'Display', label: 'Per Display' },
  { value: 'Location', label: 'Per Location' },
];

export const RADIO_AD_TYPES = ['On Air', 'On Screen', 'Others'];

export const RADIO_UNITS = [
  { value: 'Annoucment', label: 'Per Announcement' },
  { value: 'Release', label: 'Per Release' },
  { value: 'Video', label: 'Per Video' },
  { value: 'Spot', label: 'Per Spot' },
];

export const HOARDING_AD_TYPES = ['Main Road', 'Highway', 'Parking'];

export const BUS_WRAP_AD_TYPES = ['Wrap', 'Seatbacks', 'Handle', 'Window Panel'];

export const BUS_WRAP_UNITS = [
  { value: 'Unit', label: 'Per Unit' },
  { value: 'Display', label: 'Per Display' },
];

export const ACTIVATION_AD_TYPES = [
  'Mall Atrium',
  'Concourse Area',
  'Waiting Area',
  'In Stores',
  'Ticket Zone',
  'Parking Area',
];

/** “Others” online category — ad types after add/remove per spec. */
export const OTHERS_ONLINE_AD_TYPES = [
  'Social Media',
  'Digital',
  'Main area',
  'Lobby',
  'Wall area',
  'Washrooms',
  'Passage',
  'Other',
];

export const OTHERS_ONLINE_UNITS = [
  { value: 'Display', label: 'Per Display' },
  { value: 'Unit', label: 'Per Unit' },
  { value: 'Release', label: 'Per Release' },
  { value: 'Annoucment', label: 'Per Announcement' },
  { value: 'Video', label: 'Per Video' },
];

/** Feature labels allowed per profile (matched against API MediaonlineFeaturesingle text). */
export const FEATURE_ALLOWLIST_BY_KEY = {
  airport: [
    'Creative',
    'DOOH',
    'Footfall',
    'Frequency',
    'Location',
    'Visibility',
    'Reach',
    'Others',
  ],
  print: [
    'Ad Type',
    'Branding',
    'Circulation',
    'Edition',
    'Placement',
    'Readership',
    'Frequency',
    'Page',
    'Others',
  ],
  radio: [
    'Contest',
    'Audio Ads',
    'Frequency',
    'Engagement',
    'Position',
    'Target Audience',
    'Location',
    'Reach',
    'Prime Time',
    'Others',
  ],
  hoarding: [
    'Branding',
    'Brand Recognition',
    'Creative',
    'Eyeballs',
    'Location',
    'Reach',
    'Visibility',
    'Target Audience',
    'Hoarding',
    'Others',
  ],
  multiplex: [
    'Ad Type',
    'Audio Visual',
    'Branding',
    'Cinema Category',
    'Property Name',
    'CAS Code',
    'Engagement Rate',
    'Footfall',
    'Languages',
    'Seating Capacity',
    'Position',
    'Viewership',
    'Target Audience',
    'Screen Type',
    'Display Size',
    'Others',
  ],
  dooh: [
    'Creative',
    'Brand Recognition',
    'Branding',
    'DOOH',
    'CPM',
    'Eyeballs',
    'Hoarding',
    'Landmark',
    'Frequency',
    'Media Location',
    'Main Road',
    'Prime Time',
    'Quality',
    'Size',
    'Time',
    'Visibility',
    'Viewership',
    'Others',
  ],
  busWrap: [
    'Branding',
    'CPM',
    'Eyeballs',
    'Reach',
    'Visibility',
    'Recall',
    'Frequency',
    'Creative',
    'Others',
  ],
  activation: [
    'Engagement',
    'Contest',
    'Duration',
    'Reach',
    'Footfall',
    'Lead Time',
    'Others',
    'Eyeballs',
  ],
  othersOnline: [
    'Branding',
    'Brand Recognition',
    'Ad Type',
    'Creative',
    'Digital',
    'Social',
    'Sponsored Tags',
    'User Experience',
    'Viewership',
    'Eyeballs',
    'Family Entertainment',
    'CTR',
    'Collaborations',
    'Engagement Rate',
    'Others',
  ],
};

/** DOOH / digital screens — placement options with removals per spec. */
/** DOOH digital screens — supporting docs (omit inspection pass & exhibition certificate per spec). */
export const DOOH_SUPPORTING_DOC_KEYS = ['Videos', 'Pictures', 'LogReport', 'Other'];

export const DOOH_AD_TYPE_OPTIONS_FILTERED = [
  'All Locations',
  'Café Wall Branding',
  'Coffee Tables',
  'Concession Counter',
  'Entry Gate',
  'Exit Gate',
  'Near Parking Area',
  'Parking Area',
  'Tent Cards',
  'Waiting Area',
  'main road',
  'others',
];

/**
 * @param {object} product
 * @returns {{ key: string, featureAllowlist: string[] | null, adTypeOptions: string[] | null, unitOptions: {value:string,label:string}[] | null, timelineHideOneTime: boolean, dimensionLabel: string, dimensionRequired: boolean, repetitionRequired: boolean, offeringPlaceholder: string, syncTimeslots: boolean, defaultGstIfEmpty: number, previewHideMediaNameFromTech: boolean, previewHideMediaMetaFromTech: boolean, buyerUnitLabelOverride: string | null, loopTimeField: boolean, supportingDocKeys: string[] | null }}
 */
const MULTIPLEX_SUB_ID = '643cda0c53068696706e3951';

export function resolveMediaOnlineFormProfile(product) {
  const mc = String(product?.mediaCategory || readStorage('mediaCategory') || '').toLowerCase();
  const journey = String(product?.mediaJourney || readStorage('mediaJourney') || '').toLowerCase();
  const subName = String(product?.ProductSubCategoryName || '').trim();
  const subId = String(product?.ProductSubCategory || '');

  const base = {
    key: 'default',
    featureAllowlist: null,
    adTypeOptions: null,
    unitOptions: null,
    timelineHideOneTime: false,
    dimensionLabel: 'Dimension Size',
    dimensionRequired: true,
    repetitionRequired: true,
    offeringPlaceholder: 'Eg. station number',
    syncTimeslots: true,
    defaultGstIfEmpty: 18,
    previewHideMediaNameFromTech: false,
    previewHideMediaMetaFromTech: false,
    buyerUnitLabelOverride: null,
    loopTimeField: false,
    supportingDocKeys: null,
    gstSelectWidthPx: null,
  };

  if (
    subId === MULTIPLEX_SUB_ID ||
    subName === 'Multiplex ADs' ||
    String(product?.ProductCategoryName || '') === 'Multiplex ADs'
  ) {
    return {
      ...base,
      key: 'multiplex',
      featureAllowlist: FEATURE_ALLOWLIST_BY_KEY.multiplex,
      gstSelectWidthPx: 88,
    };
  }

  if (mc === 'airport' || journey === 'airport') {
    return {
      ...base,
      key: 'airport',
      featureAllowlist: FEATURE_ALLOWLIST_BY_KEY.airport,
      adTypeOptions: AIRPORT_AD_TYPES,
      unitOptions: AIRPORT_UNITS,
      timelineHideOneTime: true,
      previewHideMediaNameFromTech: true,
      previewHideMediaMetaFromTech: true,
      loopTimeField: true,
      supportingDocKeys: [
        'inspectionPass',
        'Videos',
        'Pictures',
        'estimatedFleets',
        'Other',
      ],
    };
  }

  if (subName === 'Radio' || subId === RADIO_SUB_ID) {
    return {
      ...base,
      key: 'radio',
      featureAllowlist: FEATURE_ALLOWLIST_BY_KEY.radio,
      adTypeOptions: RADIO_AD_TYPES,
      unitOptions: RADIO_UNITS,
      timelineHideOneTime: true,
      dimensionLabel: 'AD Duration',
      dimensionRequired: true,
      repetitionRequired: true,
    };
  }

  if (mc === 'other') {
    return {
      ...base,
      key: 'othersOnline',
      featureAllowlist: FEATURE_ALLOWLIST_BY_KEY.othersOnline,
      adTypeOptions: OTHERS_ONLINE_AD_TYPES,
      unitOptions: OTHERS_ONLINE_UNITS,
      dimensionRequired: false,
      repetitionRequired: false,
    };
  }

  return base;
}

export function isTirupatiAirportSubcategory(product) {
  const n = String(product?.ProductSubCategoryName || '').toLowerCase();
  return n.includes('tirupati');
}

export function resolveOfflineBtlProfile(product) {
  const mc = String(product?.mediaCategory || readStorage('mediaCategory') || '').toLowerCase();
  if (mc !== 'offlinebtl') return null;
  const name = String(product?.ProductSubCategoryName || '').toLowerCase();
  if (name.includes('bus wrap')) {
    return {
      key: 'busWrap',
      offeringPlaceholder: 'Depo Name',
      adTypeOptions: BUS_WRAP_AD_TYPES,
      unitOptions: BUS_WRAP_UNITS,
      featureAllowlist: FEATURE_ALLOWLIST_BY_KEY.busWrap,
    };
  }
  if (name.includes('cab wrap') || name.includes('auto wrap')) {
    return {
      key: 'cabAutoWrap',
      offeringPlaceholder: 'Location Name (Mumbai, Thane)',
      adTypeOptions: null,
      unitOptions: null,
      featureAllowlist: null,
    };
  }
  if (name.includes('activation')) {
    return {
      key: 'activation',
      offeringPlaceholder: 'Main Atrium, Mall / Railway Stations / Croma Stores',
      adTypeOptions: ACTIVATION_AD_TYPES,
      unitOptions: null,
      featureAllowlist: FEATURE_ALLOWLIST_BY_KEY.activation,
      dimensionRequired: false,
    };
  }
  return null;
}

/** Offline print / BTL feature rows use `{ name: string }`. Dedupes selected names; optional allowlist filter. */
export function filterOfflineFeatureOptions(rows, allowlist, selectedNames) {
  if (!Array.isArray(rows)) return [];
  const selected = new Set((selectedNames || []).map((s) => String(s).trim()));
  let out = rows.filter((el) => {
    const label = String(el?.name || '').trim();
    if (!label || selected.has(label)) return false;
    return true;
  });
  if (allowlist?.length) {
    out = out.filter((el) =>
      allowlist.some((a) => a.toLowerCase() === String(el.name).toLowerCase()),
    );
  }
  return out;
}

export function filterFeatureDropdownRows(apiRows, allowlist, selectedNames) {
  if (!Array.isArray(apiRows)) return [];
  const selected = new Set((selectedNames || []).map((s) => String(s).trim()));
  return apiRows.filter((el) => {
    const label = String(el?.MediaonlineFeaturesingle || '').trim();
    if (!label || el?.IsHead) return true;
    if (selected.has(label)) return false;
    if (!allowlist) return true;
    return allowlist.some(
      (a) => a.toLowerCase() === label.toLowerCase(),
    );
  });
}
