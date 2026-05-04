export const MEDIA_CATEGORY_MAPPING = {
  television: {
    journey: "television-ads",
  },
  radio: {
    journey: "display-video",
  },
  print: {
    journey: "newspaper",
  },
  dooh: {
    journey: "digital-ads",
  },
  airport: {
    journey: "airport",
  },
  hoarding: {
    journey: "hoarding",
  },
  multiplex: {
    journey: "multiplex",
  },
  offlinebtl: {
    journey: "btl",
  },
  other: {
    journey: "display-video",
  },
};
export const getMediaJourney = (category) => {
  if (!category) return "";
  const normalized = String(category).toLowerCase().trim();
  return MEDIA_CATEGORY_MAPPING[normalized]?.journey || "";
};
