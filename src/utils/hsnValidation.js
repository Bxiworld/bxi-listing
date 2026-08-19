/**
 * HSN digit rules for seller listing (GST e-invoice / B2B):
 * - Aggregate turnover up to ₹5 Cr → 4, 6, or 8 digit HSN
 * - Aggregate turnover above ₹5 Cr → 6 or 8 digit HSN only
 *
 * Admin listing does NOT use turnover-based length — admins keep 4/6/8 digits.
 * Same HSN across variants applies to both admin and sellers.
 *
 * Turnover source: company.GSTDetails.aggregateTurnOverRange.minimum (Signzy/IDfy).
 */

export const FIVE_CRORE_RUPEES = 5 * 10000000;
export const ADMIN_HSN_MAX_LENGTH = 8;
const HSN_4_6_8 = /^\d{4}$|^\d{6}$|^\d{8}$/;
const HSN_6_8 = /^\d{6}$|^\d{8}$/;

export function getCompanyAggregateTurnoverRupees(company) {
  const range = company?.GSTDetails?.aggregateTurnOverRange;
  if (range == null) return null;
  if (typeof range === 'number') {
    return Number.isFinite(range) && range > 0 ? range : null;
  }
  if (typeof range === 'string') {
    const n = Number(String(range).replace(/,/g, ''));
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  if (typeof range === 'object') {
    const min = Number(range.minimum);
    if (Number.isFinite(min) && min > 0) return min;
    const max = Number(range.maximum);
    if (Number.isFinite(max) && max > 0) return max;
  }
  return null;
}

/**
 * Seller-only: HSN length tier from turnover.
 * Missing / up to ₹5 Cr → 4 (4/6/8 allowed). Above ₹5 Cr → 6 (6/8 allowed).
 * @returns {4|6}
 */
export function getRequiredHsnDigitLength(company) {
  const turnover = getCompanyAggregateTurnoverRupees(company);
  if (turnover == null) return 4;
  return turnover > FIVE_CRORE_RUPEES ? 6 : 4;
}

/**
 * Max input length for the HSN field.
 * Admin and sellers both allow 8-digit codes; sellers above ₹5 Cr still cap at 8
 * (they just cannot use 4-digit).
 */
export function getHsnInputMaxLength({ isAdmin, company } = {}) {
  return ADMIN_HSN_MAX_LENGTH;
}

export function hsnLengthLabel(requiredLength, { isAdmin } = {}) {
  if (isAdmin) return '4, 6, or 8 digits';
  return requiredLength === 6 ? '6 or 8 digits' : '4, 6, or 8 digits';
}

export function hsnRequirementHint(requiredLength, { isAdmin } = {}) {
  if (isAdmin) {
    return 'HSN must be 4, 6, or 8 digits';
  }
  if (requiredLength === 6) {
    return 'Company turnover is above ₹5 Cr — HSN must be 6 or 8 digits';
  }
  return 'Company turnover is up to ₹5 Cr — HSN must be 4, 6, or 8 digits';
}

/**
 * Validate HSN for listing forms.
 * @param {string} rawHsn
 * @param {object} options
 * @param {boolean} [options.isAdmin] — when true, allow 4/6/8 (no turnover rule)
 * @param {4|6} [options.requiredLength] — seller turnover tier (4 = 4/6/8, 6 = 6/8)
 * @returns {{ ok: true, value: string } | { ok: false, message: string }}
 */
export function validateListingHsn(rawHsn, options = {}) {
  const { isAdmin = false, requiredLength } = typeof options === 'number'
    ? { isAdmin: false, requiredLength: options } // backward compat: validateListingHsn(hsn, 4)
    : options;

  const value = String(rawHsn ?? '').trim().replace(/\D/g, '');
  if (!value) {
    return { ok: false, message: 'HSN is required' };
  }
  if (value.startsWith('0')) {
    return { ok: false, message: 'HSN cannot start with 0' };
  }
  if (/^0+$/.test(value)) {
    return { ok: false, message: 'HSN cannot be all zeros' };
  }

  if (isAdmin) {
    if (!HSN_4_6_8.test(value)) {
      return { ok: false, message: 'HSN must be 4, 6, or 8 digits' };
    }
    return { ok: true, value };
  }

  const aboveFiveCr = Number(requiredLength) === 6;
  if (aboveFiveCr) {
    if (!HSN_6_8.test(value)) {
      return {
        ok: false,
        message: `HSN must be 6 or 8 digits (${hsnRequirementHint(6)})`,
      };
    }
    return { ok: true, value };
  }

  if (!HSN_4_6_8.test(value)) {
    return {
      ok: false,
      message: `HSN must be 4, 6, or 8 digits (${hsnRequirementHint(4)})`,
    };
  }
  return { ok: true, value };
}

/** Digits-only HSN input; optionally capped to maxLength. */
export function sanitizeHsnInput(raw, maxLength) {
  const digits = String(raw ?? '').replace(/\D/g, '');
  if (maxLength == null || !Number.isFinite(Number(maxLength))) return digits;
  return digits.slice(0, Number(maxLength));
}

/**
 * All variants must share one HSN (admin + seller). Empty list / single variant → ok.
 * @returns {{ ok: true, hsn: string } | { ok: false, message: string }}
 */
export function validateVariantsShareSameHsn(variants) {
  const list = Array.isArray(variants) ? variants : [];
  if (list.length <= 1) {
    const only = String(list[0]?.HSN ?? list[0]?.hsn ?? '').trim();
    return { ok: true, hsn: only };
  }
  const codes = list.map((v) => String(v?.HSN ?? v?.hsn ?? '').trim());
  const first = codes[0];
  if (!first) {
    return { ok: false, message: 'HSN is required on all variants' };
  }
  if (codes.some((c) => c !== first)) {
    return {
      ok: false,
      message: 'HSN code must be the same for all variants',
    };
  }
  return { ok: true, hsn: first };
}
