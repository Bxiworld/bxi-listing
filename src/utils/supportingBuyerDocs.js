/** Canonical keys stored in DB as WhatSupportingYouWouldGiveToBuyer: string[] */
export const SUPPORTING_DOC_KEYS = [
  'inspectionPass',
  'LogReport',
  'plottingReport',
  'Videos',
  'Pictures',
  'ExhibitionCertificate',
  'estimatedFleets',
  'broadcastCertificate',
  'telecastCertificate',
  'DigitalCopy',
  'HardCopy',
  'Other',
];

export const SUPPORTING_DOC_LABELS = {
  inspectionPass: 'Inspection pass',
  LogReport: 'Log Report',
  plottingReport: 'Plotting report',
  Videos: 'Videos',
  Pictures: 'Photos',
  ExhibitionCertificate: 'Exhibition Certificate',
  estimatedFleets: 'Estimated Fleets',
  broadcastCertificate: 'Broadcast Certificate',
  telecastCertificate: 'Telecast Certificate',
  DigitalCopy: 'Digital Copy',
  HardCopy: 'Hard Copy',
  Other: 'Other',
};

export function getSupportingDocLabel(docKey, options = {}) {
  return SUPPORTING_DOC_LABELS[docKey] || docKey;
}

/** UI order used on multiplex / hoarding-style forms */
export const SUPPORTING_DOC_KEYS_FORM_ORDER = [
  'inspectionPass',
  'Pictures',
  'LogReport',
  'ExhibitionCertificate',
  'Videos',
  'Other',
];

export const SUPPORTING_DOC_KEYS_FORM_ORDER_MULTIPLEX = [
  'inspectionPass',
  'Pictures',
  'plottingReport',
  'ExhibitionCertificate',
  'Videos',
  'Other',
];

/** UI order used on multiplex / hoarding-style forms */
export const SUPPORTING_DOC_KEYS_FORM_ORDER_HOARDING = [
  'Pictures',
  'Videos',
  'Other',
];

/** Media offline print / newspaper tech step */
export const SUPPORTING_DOC_KEYS_FORM_ORDER_PRINT = [
  'Videos',
  'Pictures',
  'DigitalCopy',
  'HardCopy',
  'Other',
];

const LABEL_TO_KEY = Object.fromEntries(
  Object.entries(SUPPORTING_DOC_LABELS).map(([k, v]) => [v, k]),
);

export function toSupportBool(v) {
  return v === true || v === 'on';
}

function normalizeDocKey(input, options = {}) {
  if (input == null) return null;
  const s = String(input).trim();
  if (!s) return null;
  if (SUPPORTING_DOC_KEYS.includes(s)) {
    if (options?.mediaProfile === 'multiplex' && s === 'LogReport') {
      return 'plottingReport';
    }
    return s;
  }
  if (LABEL_TO_KEY[s]) {
    const key = LABEL_TO_KEY[s];
    if (options?.mediaProfile === 'multiplex' && key === 'LogReport') {
      return 'plottingReport';
    }
    return key;
  }
  const compact = s.toLowerCase().replace(/\s+/g, '');
  const byCompact = {
    inspectionpass: 'inspectionPass',
    logreport: 'LogReport',
    plottingreport: 'plottingReport',
    videos: 'Videos',
    pictures: 'Pictures',
    exhibitioncertificate: 'ExhibitionCertificate',
    estimatedfleets: 'estimatedFleets',
    broadcastcertificate: 'broadcastCertificate',
    telecastcertificate: 'telecastCertificate',
    digitalcopy: 'DigitalCopy',
    hardcopy: 'HardCopy',
    other: 'Other',
  }[compact];
  if (!byCompact) return null;
  if (options?.mediaProfile === 'multiplex' && byCompact === 'LogReport') {
    return 'plottingReport';
  }
  return byCompact;
}

function applyMultiplexSupportingDocMigration(state = {}) {
  const next = { ...state };
  if (next.LogReport) {
    next.plottingReport = true;
    next.LogReport = false;
  }
  return next;
}

/** Empty checkbox state for all keys */
export function emptySupportingCheckboxState() {
  return Object.fromEntries(SUPPORTING_DOC_KEYS.map((k) => [k, false]));
}

/**
 * Parse API value (array of keys, legacy object, or legacy label keys) into checkbox state.
 */
export function supportingDocsToCheckboxState(raw, options = {}) {
  const empty = emptySupportingCheckboxState();
  if (!raw) return empty;
  if (Array.isArray(raw)) {
    const next = { ...empty };
    for (const item of raw) {
      const key = normalizeDocKey(item, options);
      if (key) next[key] = true;
    }
    return options?.mediaProfile === 'multiplex'
      ? applyMultiplexSupportingDocMigration(next)
      : next;
  }
  if (typeof raw === 'object') {
    const next = { ...empty };
    for (const [k, val] of Object.entries(raw)) {
      const key = normalizeDocKey(k, options);
      if (key && toSupportBool(val)) next[key] = true;
    }
    return options?.mediaProfile === 'multiplex'
      ? applyMultiplexSupportingDocMigration(next)
      : next;
  }
  return empty;
}

/** Persist: selected keys only, stable order */
export function checkboxStateToSupportingArray(checkboxes, options = {}) {
  if (options?.mediaProfile === 'multiplex') {
    const merged = applyMultiplexSupportingDocMigration(checkboxes || {});
    return SUPPORTING_DOC_KEYS_FORM_ORDER_MULTIPLEX.filter((k) => merged[k]);
  }
  return SUPPORTING_DOC_KEYS.filter((k) => checkboxes[k]);
}

/** Human-readable lines for previews */
export function getSupportingDocsDisplayLabels(raw, options = {}) {
  const state = supportingDocsToCheckboxState(raw, options);
  const keys =
    options?.mediaProfile === 'multiplex'
      ? SUPPORTING_DOC_KEYS_FORM_ORDER_MULTIPLEX
      : SUPPORTING_DOC_KEYS;
  return keys.filter((k) => state[k]).map((k) => getSupportingDocLabel(k, options));
}

export function validateMultiplexSupportingDocs(checkboxes = {}) {
  const selected = checkboxStateToSupportingArray(checkboxes, {
    mediaProfile: 'multiplex',
  });
  if (selected.length > 0) {
    return { valid: true, message: '' };
  }
  return {
    valid: false,
    message: 'Select at least one Supporting Document (e.g. Plotting report)',
  };
}
