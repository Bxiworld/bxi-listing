/**
 * Shared helpers for GET /mediasubcategory/for_listing (nested or flat payloads).
 * Keeps AddMediaCategoryPage and Media Offline general info in sync.
 */

export function normalizeLabel(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/**
 * @param {object} payload - axios res.data, shape { subcategory: [...] }
 * @returns {{ _id: string, subCategoryName: string, categoryName: string, displayName: string, iconUrl: string|null }[]}
 */
export function normalizeListingPayload(payload) {
  const docs = payload?.subcategory ?? payload?.data ?? [];
  if (!Array.isArray(docs) || docs.length === 0) return [];

  const first = docs[0];
  const looksFlat =
    first &&
    (first.subCategoryName || first.DisplayName) &&
    !Array.isArray(first.subCategories);

  if (looksFlat) {
    return docs
      .filter((d) => d?._id && (d.subCategoryName || d.DisplayName))
      .map((d) => ({
        _id: String(d._id),
        subCategoryName: d.subCategoryName || d.DisplayName,
        categoryName: d.categoryName || '',
        displayName: d.DisplayName || d.displayName || d.subCategoryName,
        iconUrl: d.iconurl || d.iconUrl || null,
      }));
  }

  const rows = [];
  for (const doc of docs) {
    for (const sub of doc.subCategories || []) {
      if (!sub?._id || !sub.subCategoryName) continue;
      rows.push({
        _id: String(sub._id),
        subCategoryName: sub.subCategoryName,
        categoryName: doc.categoryName || '',
        displayName:
          sub.DisplayName || sub.displayName || sub.subCategoryName,
        iconUrl: sub.iconurl || sub.iconUrl || null,
      });
    }
  }
  return rows;
}

/** Narrow duplicate sub names to the parent group for this offline tile key */
export const OFFLINE_PARENT_HINTS = {
  print: (categoryName) =>
    /print|newspaper|magazine|news\s*paper/i.test(String(categoryName)),
  hoarding: (categoryName) =>
    /hoarding|ooh|outdoor|billboard|media\s*offline/i.test(String(categoryName)),
  offlinebtl: (categoryName) =>
    /btl|offline|wrap|activation|kiosk|standee|van|metro|elevator|flight|pole|escalator|cab|auto/i.test(
      String(categoryName),
    ),
};

/**
 * Resolve one static label (e.g. "Newspaper") to a listing row _id from flattened for_listing data.
 */
export function findListingSubIdForOfflineLabel(flat, label, mediaCategoryKey) {
  if (!Array.isArray(flat) || !label) return null;
  const norm = normalizeLabel(label);
  const matches = flat.filter(
    (r) => normalizeLabel(r.subCategoryName) === norm,
  );
  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0]._id;

  const key = String(mediaCategoryKey || '').toLowerCase().trim();
  const hint = OFFLINE_PARENT_HINTS[key];
  if (hint) {
    const narrowed = matches.filter((r) => hint(r.categoryName));
    if (narrowed.length >= 1) return narrowed[0]._id;
  }
  return matches[0]._id;
}

/**
 * Limit flat rows to the parent category group for this offline `mediaCategory` key (print / hoarding / offlinebtl).
 * If nothing matches, returns the full list so the UI still works.
 */
export function filterFlatRowsForOfflineMediaCategory(flat, mediaCategoryKey) {
  if (!Array.isArray(flat) || flat.length === 0) return [];
  const key = String(mediaCategoryKey || '').toLowerCase().trim();
  const hint = OFFLINE_PARENT_HINTS[key];
  if (!hint) return flat;
  const filtered = flat.filter((r) => hint(r.categoryName));
  return filtered.length > 0 ? filtered : flat;
}

/**
 * Build { label, value } options for offline static subcategory labels using /for_listing flat rows.
 */
export function buildOfflineResolvedOptionsFromListing(
  staticLabels,
  flat,
  mediaCategoryKey,
  printIdFallbackByLabel,
) {
  const isPrint = String(mediaCategoryKey || '').toLowerCase().trim() === 'print';
  const fallback = printIdFallbackByLabel || {};

  return staticLabels.map((name) => {
    const fromListing = findListingSubIdForOfflineLabel(flat, name, mediaCategoryKey);
    return {
      label: name,
      value:
        fromListing != null
          ? String(fromListing)
          : isPrint && fallback[name]
            ? String(fallback[name])
            : name,
    };
  });
}
