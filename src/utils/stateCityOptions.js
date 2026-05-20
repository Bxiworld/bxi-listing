/** First option in state-dependent city dropdowns (product / media listing info). */
export const ALL_CITIES_LABEL = 'All cities';

export function normalizeCityOptionKey(value) {
  return String(value ?? '').trim().toLowerCase();
}

/** Cities array for a state from StateCityArray.json rows. */
export function getCitiesForState(stateName, stateData = []) {
  if (!stateName) return [];
  const stateObj = (stateData || []).find((s) => s.name === stateName);
  return Array.isArray(stateObj?.data) ? stateObj.data : [];
}

/**
 * City dropdown options: "All cities" first, then state cities, then current value if missing (edit).
 * @param {string[]} baseCities
 * @param {string} [currentCity]
 * @returns {string[]}
 */
export function buildCitySelectOptions(baseCities = [], currentCity = '') {
  const seen = new Set();
  const out = [];
  const push = (label) => {
    const s = String(label ?? '').trim();
    if (!s) return;
    const key = normalizeCityOptionKey(s);
    if (seen.has(key)) return;
    seen.add(key);
    out.push(s);
  };
  push(ALL_CITIES_LABEL);
  (Array.isArray(baseCities) ? baseCities : []).forEach(push);
  push(currentCity);
  return out;
}
