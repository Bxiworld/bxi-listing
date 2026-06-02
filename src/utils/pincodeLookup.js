import api from './api';
import { buildCitySelectOptions } from './stateCityOptions';

const normalize = (s) => (s || '').toLowerCase().replace(/\s+/g, '') || '';

export async function fetchPincodeFromApi(pincode) {
  const digits = String(pincode || '').replace(/\D/g, '');
  if (digits.length !== 6) {
    throw new Error('Invalid pincode');
  }
  const res = await api.get(`/pincode/${digits}`);
  return res?.data;
}

/**
 * Resolve state/city/region/landmark from pincode using StateCityArray.
 * @returns {Promise<{ state: string, city: string, region?: string, landmark?: string, cityOptions: Array } | null>}
 */
export async function resolveLocationFromPincode(pincode, { StateData, STATE_REGION_MAP }) {
  const data = await fetchPincodeFromApi(pincode);

  if (data?.[0]?.Status !== 'Success' || !data?.[0]?.PostOffice?.length) {
    return null;
  }

  const postOffices = data[0].PostOffice;
  const firstPo = postOffices[0];
  const apiStateName = firstPo?.State;
  const apiDistrict = firstPo?.District || firstPo?.Block;
  const apiLandmark = firstPo?.Name;

  const matchedState = StateData.find((s) => normalize(s.name) === normalize(apiStateName));
  if (!matchedState) {
    return {
      unmatchedState: apiStateName,
      state: null,
      city: null,
      region: null,
      landmark: apiLandmark || '',
      cityOptions: [],
    };
  }

  const cities = matchedState.data || [];

  const findMatchingCity = (candidate) => {
    const candNorm = normalize(candidate);
    if (!candNorm) return null;

    const exact = cities.find((c) => normalize(c) === candNorm);
    if (exact) return exact;

    const partial = cities.find(
      (c) => normalize(c).includes(candNorm) || candNorm.includes(normalize(c))
    );
    return partial || null;
  };

  const candidateStrings = Array.from(
    new Set(
      postOffices.flatMap((po) => [po?.District, po?.Block, po?.Region]).filter(Boolean)
    )
  );

  const matchedCity = candidateStrings.map((c) => findMatchingCity(c)).find(Boolean) || null;
  const fallbackCity = apiDistrict || apiStateName || candidateStrings[0] || '';
  const nextCity = matchedCity || fallbackCity || cities?.[0] || '';
  const nextCityStr = String(nextCity || '').trim();

  return {
    state: matchedState.name,
    city: nextCityStr,
    region: STATE_REGION_MAP?.[matchedState.name] || 'North',
    landmark: apiLandmark || '',
    cityOptions: buildCitySelectOptions(cities, nextCityStr),
  };
}
