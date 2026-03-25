export const VOUCHER_JOURNEY_TYPE = {
  OFFER_SPECIFIC: 'OFFER_SPECIFIC',
  VALUE_GIFT: 'VALUE_GIFT',
};

const OFFER_ALIASES = ['offer specific', 'offer_specific', 'offerspecific'];
const VALUE_GIFT_ALIASES = [
  'value voucher / gift cards',
  'value voucher / gift cards ',
  'value voucher',
  'gift card',
  'gift cards',
  'value_gift',
];

const normalize = (value = '') => String(value).trim().toLowerCase();

export const getVoucherJourneyType = (rawValue = '') => {
  const normalized = normalize(rawValue);
  if (!normalized) return VOUCHER_JOURNEY_TYPE.OFFER_SPECIFIC;
  if (OFFER_ALIASES.some((a) => normalized.includes(a))) return VOUCHER_JOURNEY_TYPE.OFFER_SPECIFIC;
  if (VALUE_GIFT_ALIASES.some((a) => normalized.includes(a))) return VOUCHER_JOURNEY_TYPE.VALUE_GIFT;
  if (normalized === VOUCHER_JOURNEY_TYPE.OFFER_SPECIFIC.toLowerCase()) return VOUCHER_JOURNEY_TYPE.OFFER_SPECIFIC;
  if (normalized === VOUCHER_JOURNEY_TYPE.VALUE_GIFT.toLowerCase()) return VOUCHER_JOURNEY_TYPE.VALUE_GIFT;
  return VOUCHER_JOURNEY_TYPE.OFFER_SPECIFIC;
};

export const getVoucherJourneyTypeFromStorage = () => {
  if (typeof localStorage === 'undefined') return VOUCHER_JOURNEY_TYPE.OFFER_SPECIFIC;
  const canonical = localStorage.getItem('digitalDataType');
  if (canonical === VOUCHER_JOURNEY_TYPE.OFFER_SPECIFIC || canonical === VOUCHER_JOURNEY_TYPE.VALUE_GIFT) {
    return canonical;
  }
  return getVoucherJourneyType(localStorage.getItem('digitalData'));
};

export const isOfferSpecificVoucherJourney = (rawValue) =>
  getVoucherJourneyType(rawValue) === VOUCHER_JOURNEY_TYPE.OFFER_SPECIFIC;

export const isValueGiftVoucherJourney = (rawValue) =>
  getVoucherJourneyType(rawValue) === VOUCHER_JOURNEY_TYPE.VALUE_GIFT;

export const getVoucherJourneyLabel = (type) =>
  type === VOUCHER_JOURNEY_TYPE.VALUE_GIFT ? 'Value Voucher / Gift Cards' : 'Offer Specific';

