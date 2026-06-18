/** Voucher store location modes for listing tech step (Ecodes + physical). */

export const VOUCHER_LOCATION_ADDRESS_MODE = {
  SINGLE: 'single',
  MULTIPLE: 'multiple',
};

export const VOUCHER_MULTIPLE_LOCATION_INPUT = {
  EXCEL: 'excel',
  MANUAL: 'manual',
};

export const EMPTY_STORE_ADDRESS = () => ({
  address: '',
  area: '',
  landmark: '',
  city: '',
  state: '',
  pincode: '',
});

export function isCompleteStoreAddress(row = {}) {
  return (
    String(row.area || '').trim() &&
    String(row.landmark || '').trim() &&
    String(row.city || '').trim() &&
    String(row.state || '').trim()
  );
}

export function isCompleteStoreAddressWithPincode(row = {}) {
  return (
    isCompleteStoreAddress(row) &&
    String(row.pincode || '').replace(/\D/g, '').length === 6
  );
}

function parseOfflineAddressListFromProduct(product) {
  if (!product) return [];
  if (Array.isArray(product.OfflineAddressList)) return product.OfflineAddressList;
  if (typeof product.OfflineAddressList === 'string') {
    try {
      const parsed = JSON.parse(product.OfflineAddressList);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function inferVoucherLocationModesFromProduct(product) {
  const savedMode = String(product?.voucherLocationAddressMode || '').trim().toLowerCase();
  const savedInput = String(product?.voucherMultipleLocationInput || '').trim().toLowerCase();
  const list = parseOfflineAddressListFromProduct(product);

  if (savedMode === VOUCHER_LOCATION_ADDRESS_MODE.SINGLE) {
    return {
      voucherLocationAddressMode: VOUCHER_LOCATION_ADDRESS_MODE.SINGLE,
      voucherMultipleLocationInput: VOUCHER_MULTIPLE_LOCATION_INPUT.EXCEL,
    };
  }
  if (savedMode === VOUCHER_LOCATION_ADDRESS_MODE.MULTIPLE) {
    return {
      voucherLocationAddressMode: VOUCHER_LOCATION_ADDRESS_MODE.MULTIPLE,
      voucherMultipleLocationInput:
        savedInput === VOUCHER_MULTIPLE_LOCATION_INPUT.MANUAL
          ? VOUCHER_MULTIPLE_LOCATION_INPUT.MANUAL
          : VOUCHER_MULTIPLE_LOCATION_INPUT.EXCEL,
    };
  }

  if (list.length > 0) {
    const hasHotelList = Array.isArray(product?.HotelsListUrls) && product.HotelsListUrls.length > 0;
    return {
      voucherLocationAddressMode: VOUCHER_LOCATION_ADDRESS_MODE.MULTIPLE,
      voucherMultipleLocationInput: hasHotelList
        ? VOUCHER_MULTIPLE_LOCATION_INPUT.EXCEL
        : VOUCHER_MULTIPLE_LOCATION_INPUT.MANUAL,
    };
  }

  return {
    voucherLocationAddressMode: VOUCHER_LOCATION_ADDRESS_MODE.SINGLE,
    voucherMultipleLocationInput: VOUCHER_MULTIPLE_LOCATION_INPUT.EXCEL,
  };
}

export function normalizeManualStoreLocations(rows = []) {
  return (Array.isArray(rows) ? rows : []).map((row) => ({
    address: String(row?.address || row?.Address || '').trim(),
    area: String(row?.area || row?.Area || '').trim(),
    landmark: String(row?.landmark || row?.Landmark || '').trim(),
    city: String(row?.city || row?.City || '').trim(),
    state: String(row?.state || row?.State || '').trim(),
    pincode: String(row?.pincode || row?.Pincode || '').trim(),
  }));
}

export function buildOfflineAddressListForSubmit({
  mode,
  input,
  parsedExcel = [],
  manualRows = [],
}) {
  if (mode !== VOUCHER_LOCATION_ADDRESS_MODE.MULTIPLE) return [];
  if (input === VOUCHER_MULTIPLE_LOCATION_INPUT.MANUAL) {
    return normalizeManualStoreLocations(manualRows).filter(isCompleteStoreAddressWithPincode);
  }
  return normalizeManualStoreLocations(parsedExcel).filter(isCompleteStoreAddress);
}

export function hasValidDigitalLocation({
  mode,
  input,
  singleAddress,
  parsedExcel = [],
  manualRows = [],
  storeListFile,
}) {
  if (mode === VOUCHER_LOCATION_ADDRESS_MODE.SINGLE) {
    return isCompleteStoreAddressWithPincode(singleAddress);
  }
  if (mode === VOUCHER_LOCATION_ADDRESS_MODE.MULTIPLE) {
    if (input === VOUCHER_MULTIPLE_LOCATION_INPUT.EXCEL) {
      return parsedExcel.length > 0 || !!storeListFile;
    }
    if (input === VOUCHER_MULTIPLE_LOCATION_INPUT.MANUAL) {
      const complete = normalizeManualStoreLocations(manualRows).filter(
        isCompleteStoreAddressWithPincode
      );
      return complete.length >= 2;
    }
  }
  return false;
}
