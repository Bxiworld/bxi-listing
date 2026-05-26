import React, { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';

const VARIANT_FIELD_CONFIG = [
  { key: 'VariantName', label: 'Variant Name' },
  { key: 'DiscountedPrice', label: 'Discounted Price' },
  { key: 'PricePerUnit', label: 'Price Per Unit' },
  { key: 'MinOrderQuantity', label: 'Min Quantity' },
  { key: 'MaxOrderQuantity', label: 'Max Quantity' },
  { key: 'TotalAvailableQty', label: 'Total Available Qty' },
  { key: 'minTimeslotSeconds', label: 'Min Timeslot Seconds' },
  { key: 'maxTimeslotSeconds', label: 'Max Timeslot Seconds' },
  { key: 'minOrderQuantitytimeline', label: 'Min Timeline Quantity' },
  { key: 'maxOrderQuantitytimeline', label: 'Max Timeline Quantity' },
];

const TOP_LEVEL_FIELDS = [
  { key: 'productName', label: 'Product Name' },
  { key: 'location', label: 'Location' },
  { key: 'listperiod', label: 'Listing Days / Validity' },
];

const stringifyValue = (value) => {
  if (value == null || value === '') return '--';
  if (Array.isArray(value)) return value.length ? value.join(', ') : '--';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const hasChanged = (oldValue, newValue) =>
  JSON.stringify(oldValue ?? null) !== JSON.stringify(newValue ?? null);

function DiffRow({ label, oldValue, newValue, changed }) {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-[220px_1fr_1fr] gap-3 rounded-xl border p-3 ${
        changed ? 'border-[#C64091]/40 bg-[#FFF5FB]' : 'border-slate-200 bg-white'
      }`}
    >
      <div className="text-sm font-medium text-slate-700">{label}</div>
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Current
        </div>
        <div className="mt-1 text-sm text-slate-700 break-words">
          {stringifyValue(oldValue)}
        </div>
      </div>
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-[#C64091]">
          Proposed
        </div>
        <div className="mt-1 text-sm text-slate-700 break-words">
          {stringifyValue(newValue)}
        </div>
      </div>
    </div>
  );
}

function VariantSection({ oldVariant, newVariant, index, listingType }) {
  const variantRows = VARIANT_FIELD_CONFIG.filter(({ key }) => {
    const oldValue = oldVariant?.[key];
    const newValue = newVariant?.[key];
    return (
      (oldValue != null || newValue != null) &&
      hasChanged(oldValue, newValue)
    );
  });

  if (!variantRows.length) return null;

  const title =
    oldVariant?.VariantName ||
    newVariant?.VariantName ||
    `Variant ${index + 1}`;

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
          <p className="text-xs text-slate-500">{listingType || 'Listing'} variant comparison</p>
        </div>
      </div>
      <div className="space-y-3">
        {variantRows.map(({ key, label }) => (
          <DiffRow
            key={`${index}-${key}`}
            label={label}
            oldValue={oldVariant?.[key]}
            newValue={newVariant?.[key]}
            changed={hasChanged(oldVariant?.[key], newVariant?.[key])}
          />
        ))}
      </div>
    </div>
  );
}

export default function AdminListingChangeDialog({
  open,
  onOpenChange,
  request,
  onAccept,
  onReject,
  isSubmitting = false,
}) {
  const oldSnapshot = request?.oldSnapshot || {};
  const newSnapshot = request?.newSnapshot || {};
  const listingType = newSnapshot?.listingType || oldSnapshot?.listingType || '';

  const topLevelRows = useMemo(
    () =>
      TOP_LEVEL_FIELDS.filter(({ key }) => {
        const oldValue = oldSnapshot?.[key];
        const newValue = newSnapshot?.[key];
        return (
          (oldValue != null || newValue != null) &&
          hasChanged(oldValue, newValue)
        );
      }),
    [newSnapshot, oldSnapshot]
  );

  const variantCount = Math.max(
    oldSnapshot?.ProductsVariantions?.length || 0,
    newSnapshot?.ProductsVariantions?.length || 0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex w-[calc(100vw-2rem)] max-w-5xl max-h-[calc(100vh-2rem)] flex-col overflow-hidden p-0">
        <DialogHeader className="border-b border-slate-200 px-6 py-5">
          <DialogTitle>Review Admin Suggested Changes</DialogTitle>
          <DialogDescription>
            Compare the current listing details with the admin-proposed values before you
            accept or reject them.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <div className="rounded-2xl border border-[#C64091]/20 bg-[#FFF8FC] px-4 py-3">
            <div className="text-sm font-medium text-slate-900">
              {request?.changedFields?.length || 0} field group(s) changed
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Listing type: {listingType || 'Unknown'}
            </div>
          </div>

          {topLevelRows.length ? (
            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Basic Details
              </h3>
              {topLevelRows.map(({ key, label }) => (
                <DiffRow
                  key={key}
                  label={label}
                  oldValue={oldSnapshot?.[key]}
                  newValue={newSnapshot?.[key]}
                  changed={hasChanged(oldSnapshot?.[key], newSnapshot?.[key])}
                />
              ))}
            </section>
          ) : null}

          {variantCount > 0 ? (
            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Variants & Pricing
              </h3>
              {Array.from({ length: variantCount }).map((_, index) => (
                <VariantSection
                  key={`variant-${index}`}
                  index={index}
                  listingType={listingType}
                  oldVariant={oldSnapshot?.ProductsVariantions?.[index]}
                  newVariant={newSnapshot?.ProductsVariantions?.[index]}
                />
              ))}
            </section>
          ) : null}
        </div>

        <DialogFooter className="shrink-0 border-t border-slate-200 bg-white px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={onReject}
            disabled={isSubmitting}
            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            {isSubmitting ? 'Submitting...' : 'Reject'}
          </Button>
          <Button
            type="button"
            onClick={onAccept}
            disabled={isSubmitting}
            className="bg-[#C64091] hover:bg-[#b23580] text-white"
          >
            {isSubmitting ? 'Submitting...' : 'Accept Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
