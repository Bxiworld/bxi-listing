/** Canonical keys stored in DB as WhatSupportingYouWouldGiveToBuyer: string[] */
export const SUPPORTING_DOC_KEYS = [
  'inspectionPass',
  'LogReport',
  'Videos',
  'Pictures',
  'ExhibitionCertificate',
  'estimatedFleets',
  'broadcastCertificate',
  'Other',
];

export const SUPPORTING_DOC_LABELS = {
  inspectionPass: 'Inspection pass',
  LogReport: 'Log Report',
  Videos: 'Videos',
  Pictures: 'Photos',
  ExhibitionCertificate: 'Exhibition Certificate',
  estimatedFleets: 'Estimated Fleets',
  broadcastCertificate: 'Broadcast Certificate',
  Other: 'Other',
};

/** UI order used on multiplex / hoarding-style forms */
export const SUPPORTING_DOC_KEYS_FORM_ORDER = [
  'inspectionPass',
  'Pictures',
  'LogReport',
  'ExhibitionCertificate',
  'Videos',
  'Other',
];

const LABEL_TO_KEY = Object.fromEntries(
  Object.entries(SUPPORTING_DOC_LABELS).map(([k, v]) => [v, k]),
);

export function toSupportBool(v) {
  return v === true || v === 'on';
}

function normalizeDocKey(input) {
  if (input == null) return null;
  const s = String(input).trim();
  if (!s) return null;
  if (SUPPORTING_DOC_KEYS.includes(s)) return s;
  if (LABEL_TO_KEY[s]) return LABEL_TO_KEY[s];
  const compact = s.toLowerCase().replace(/\s+/g, '');
  const byCompact = {
    inspectionpass: 'inspectionPass',
    logreport: 'LogReport',
    videos: 'Videos',
    pictures: 'Pictures',
    exhibitioncertificate: 'ExhibitionCertificate',
    estimatedfleets: 'estimatedFleets',
    broadcastcertificate: 'broadcastCertificate',
    other: 'Other',
  }[compact];
  return byCompact || null;
}

/** Empty checkbox state for all keys */
export function emptySupportingCheckboxState() {
  return Object.fromEntries(SUPPORTING_DOC_KEYS.map((k) => [k, false]));
}

/**
 * Parse API value (array of keys, legacy object, or legacy label keys) into checkbox state.
 */
export function supportingDocsToCheckboxState(raw) {
  const empty = emptySupportingCheckboxState();
  if (!raw) return empty;
  if (Array.isArray(raw)) {
    const next = { ...empty };
    for (const item of raw) {
      const key = normalizeDocKey(item);
      if (key) next[key] = true;
    }
    return next;
  }
  if (typeof raw === 'object') {
    const next = { ...empty };
    for (const [k, val] of Object.entries(raw)) {
      const key = normalizeDocKey(k);
      if (key && toSupportBool(val)) next[key] = true;
    }
    return next;
  }
  return empty;
}

/** Persist: selected keys only, stable order */
export function checkboxStateToSupportingArray(checkboxes) {
  return SUPPORTING_DOC_KEYS.filter((k) => checkboxes[k]);
}

/** Human-readable lines for previews */
export function getSupportingDocsDisplayLabels(raw) {
  const state = supportingDocsToCheckboxState(raw);
  return SUPPORTING_DOC_KEYS.filter((k) => state[k]).map((k) => SUPPORTING_DOC_LABELS[k]);
}
