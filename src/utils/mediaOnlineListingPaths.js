/**
 * Builds General Information URLs so the correct listing journey is preserved
 * (e.g. television-ads vs digital-ads) when stepping back from product/tech info.
 */
export function getMediaListingQueryParams(product) {
  const params = new URLSearchParams();
  const mc =
    product?.mediaCategory ||
    (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('mediaCategory')) ||
    (typeof localStorage !== 'undefined' && localStorage.getItem('mediaCategory')) ||
    '';
  const mj =
    product?.mediaJourney ||
    (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('mediaJourney')) ||
    (typeof localStorage !== 'undefined' && localStorage.getItem('mediaJourney')) ||
    '';
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
