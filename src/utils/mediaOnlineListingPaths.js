import { getMediaJourney } from '../constants/mediaMapping';

export function getMediaListingQueryParams(product) {
  const params = new URLSearchParams();
  const mc =
    product?.mediaCategory ||
    (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('mediaCategory')) ||
    (typeof localStorage !== 'undefined' && localStorage.getItem('mediaCategory')) ||
    '';
  
  const mj = getMediaJourney(mc);
  
  const mp =
    (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('mediaParent')) ||
    (typeof localStorage !== 'undefined' && localStorage.getItem('mediaParent')) ||
    '';
  if (mc) params.set('mediaCategory', mc);
  if (mj) params.set('journey', mj);
  if (mp) params.set('mediaParent', mp);
  return params;
}

export function buildMediaOnlineGeneralInfoPath(productId, product) {
  const params = getMediaListingQueryParams(product);
  const q = params.toString();
  const base = productId
    ? `/mediaonline/general-info/${productId}`
    : '/mediaonline/general-info';
  return q ? `${base}?${q}` : base;
}
