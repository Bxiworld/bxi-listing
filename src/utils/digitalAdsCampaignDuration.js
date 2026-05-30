/**
 * Digital ads campaign duration: Day / Week / Month quantity stored as total days on API.
 */

export const TIMELINE_DURATION_OPTIONS = [
  { value: 'Day', label: 'Day' },
  { value: 'Week', label: 'Week' },
  { value: 'Month', label: 'Month' },
];

export function daysPerTimelineUnit(duration) {
  switch (duration) {
    case 'Day':
      return 1;
    case 'Week':
      return 7;
    case 'Month':
      return 30;
    default:
      return 0;
  }
}

/** Total booking length in days for API (min/max timeline fields). */
export function timelineDurationQuantityToTotalDays(duration, quantity) {
  const q = Number(quantity);
  const per = daysPerTimelineUnit(duration);
  if (!per || !Number.isFinite(q) || q < 1) return 0;
  return Math.round(q * per);
}

function normalizeTimelineUnit(raw) {
  if (raw == null || raw === '') return '';
  const s = String(raw).trim();
  const lower = s.toLowerCase();
  if (lower === 'day') return 'Day';
  if (lower === 'week') return 'Week';
  if (lower === 'month') return 'Month';
  return '';
}

/** Derive quantity from stored total days and known duration unit. */
export function resolveTimelineQuantityFromTotalDays(totalDays, duration) {
  const d = Number(totalDays);
  if (!Number.isFinite(d) || d < 1) return '1';
  if (!duration || !['Day', 'Week', 'Month'].includes(duration)) {
    return String(Math.max(1, Math.round(d)));
  }
  const per = daysPerTimelineUnit(duration);
  if (!per) return '1';
  const q = Math.max(1, Math.round(d / per));
  return String(q);
}

/** Restore duration unit from product / mediaVariation (string fields or legacy day totals). */
export function resolveTimelineDurationFromProduct(mv, data) {
  const fromStrings =
    normalizeTimelineUnit(mv?.Timeline) ||
    normalizeTimelineUnit(mv?.timeline) ||
    normalizeTimelineUnit(data?.timeline);
  if (fromStrings) return fromStrings;

  const n = Number(
    mv?.minOrderQuantitytimeline ??
      mv?.maxOrderQuantitytimeline ??
      data?.minOrderQtyTimeline ??
      data?.maxOrderQtyTimeline,
  );
  if (!Number.isFinite(n) || n < 1) return '';

  if (n === 1) return 'Day';
  if (n === 7) return 'Week';
  if (n === 30 || n === 31) return 'Month';
  if (n % 30 === 0) return 'Month';
  if (n % 7 === 0) return 'Week';
  return 'Day';
}

export function resolveTimelineQuantityForFetch(mv, data, timelineDuration) {
  const explicit =
    data?.campaignDurationQuantity ??
    mv?.campaignDurationQuantity ??
    data?.mediaVariation?.campaignDurationQuantity;
  if (explicit != null && explicit !== '' && Number.isFinite(Number(explicit))) {
    return String(Math.max(1, Math.round(Number(explicit))));
  }

  const totalDays = Number(
    mv?.minOrderQuantitytimeline ??
      mv?.maxOrderQuantitytimeline ??
      data?.minOrderQtyTimeline ??
      data?.maxOrderQtyTimeline,
  );
  return resolveTimelineQuantityFromTotalDays(totalDays, timelineDuration);
}

function pluralizeUnit(unit, quantity) {
  const q = Number(quantity);
  if (!Number.isFinite(q) || q < 1) return '';
  const base =
    unit === 'Month' ? 'month' : unit === 'Week' ? 'week' : unit === 'Day' ? 'day' : String(unit).toLowerCase();
  return q === 1 ? `1 ${base}` : `${q} ${base}s`;
}

/**
 * Human-readable campaign duration for preview (e.g. "2 months").
 */
export function formatCampaignDurationPreview(product, mv = {}, v0 = {}) {
  const pick = (a, b, c) => {
    const filled = (x) => x != null && String(x).trim() !== '';
    if (filled(a)) return a;
    if (filled(b)) return b;
    if (filled(c)) return c;
    return null;
  };

  const unit = resolveTimelineDurationFromProduct(mv, product) ||
    normalizeTimelineUnit(pick(mv.Timeline, v0.Timeline, product?.timeline));

  const explicitQty = pick(
    mv.campaignDurationQuantity,
    v0.campaignDurationQuantity,
    product?.campaignDurationQuantity,
  );

  let qty = explicitQty;
  if (qty == null || qty === '') {
    const minDays = Number(
      pick(mv.minOrderQuantitytimeline, v0.minOrderQuantitytimeline) ?? 0,
    );
    if (unit && minDays > 0) {
      qty = resolveTimelineQuantityFromTotalDays(minDays, unit);
    }
  }

  if (unit && qty != null && String(qty).trim() !== '') {
    return pluralizeUnit(unit, qty);
  }

  const minDays = pick(mv.minOrderQuantitytimeline, v0.minOrderQuantitytimeline);
  const maxDays = pick(mv.maxOrderQuantitytimeline, v0.maxOrderQuantitytimeline);
  if (minDays != null || maxDays != null) {
    const minStr =
      minDays != null && String(minDays).trim() !== '' ? String(minDays) : '—';
    const maxStr =
      maxDays != null && String(maxDays).trim() !== '' ? String(maxDays) : '—';
    return `${minStr} - ${maxStr} days`;
  }

  return null;
}
