import axios from 'axios';

// SECURITY: no hardcoded fallback — a committed value would silently become the
// live gateway key whenever the env var is unset. Fail closed instead.
const BXI_API_KEY = process.env.REACT_APP_BXI_API_KEY;
if (!BXI_API_KEY) {
  throw new Error('REACT_APP_BXI_API_KEY is not set (no hardcoded fallback).');
}
const API_BASE_URL = 'https://bxi-api-development.bxiworld.in';

// Seller auth token handed off from the dashboard (app.bxiworld.com) via URL,
// because sessionStorage is per-origin and the cross-site (.com <-> .in) cookie
// cannot be shared. On first load we read `sellertoken` from the URL, persist it
// to this origin's sessionStorage, and strip it from the address bar.
const SELLER_TOKEN_KEY = 'bxi_auth_token';
const captureSellerTokenFromUrl = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('sellertoken');
    if (tokenFromUrl) {
      sessionStorage.setItem(SELLER_TOKEN_KEY, tokenFromUrl);
      // Remove the token from the visible URL (avoid it lingering in history/logs).
      params.delete('sellertoken');
      const newQuery = params.toString();
      const newUrl =
        window.location.pathname + (newQuery ? `?${newQuery}` : '') + window.location.hash;
      window.history.replaceState({}, document.title, newUrl);
    }
  } catch (e) {
    console.error('[API] Error capturing seller token:', e);
  }
};
if (typeof window !== 'undefined') {
  captureSellerTokenFromUrl();
}
const getSellerToken = () => {
  try {
    return sessionStorage.getItem(SELLER_TOKEN_KEY);
  } catch (e) {
    return null;
  }
};

// Admin token: URL first, then sessionStorage only (never localStorage).
// localStorage on the listing origin persists across users/sessions and caused sellers to inherit admin context.
const getAdminToken = () => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('admintoken');

    if (tokenFromUrl) {
      sessionStorage.setItem('admintoken', tokenFromUrl);
      return tokenFromUrl;
    }

    return sessionStorage.getItem('admintoken');
  } catch (e) {
    console.error('[API] Error getting admin token:', e);
  }
  return null;
};

// Create axios instance with base configuration (BXI mounts routes at root, no /api)
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    bxiapikey: BXI_API_KEY,
  },
});

// Request interceptor - add admin token if present; allow FormData to set Content-Type (multipart)
api.interceptors.request.use(
  (config) => {
    const token = getAdminToken();
    if (token) {
      config.headers['x-admin-token'] = token;
    }
    // Seller auth (handed off from dashboard) — backend accepts Authorization: Bearer.
    const sellerToken = getSellerToken();
    if (sellerToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${sellerToken}`;
    }
    // When sending FormData, do not send Content-Type so the browser sets multipart/form-data with boundary.
    // Otherwise the default application/json causes the server to not parse files and req.files stays empty.
    if (config.data && typeof FormData !== 'undefined' && config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          console.error('Unauthorized - redirecting to login');
          break;
        case 403:
          console.error('Forbidden');
          break;
        case 404:
          console.error('Not found');
          break;
        case 500:
          console.error('Server error');
          break;
        default:
          break;
      }
    }
    return Promise.reject(error);
  }
);

// Product APIs (paths match BXI routes: product/*)
const buildListingParams = (page = 1, type = '', limit) => {
  const params = { page };
  if (type && String(type).trim()) {
    params.Type = type;
  }
  if (limit != null && Number(limit) > 0) {
    params.limit = Number(limit);
  }
  return { params };
};

export const productApi = {
  getLiveProducts: (page = 1, type = '', limit) =>
    api.get('product/get_product_bySellerCompanyId', buildListingParams(page, type, limit)),

  getDraftProducts: (page = 1, type = '', limit) =>
    api.get('product/get_listed_draft_product', buildListingParams(page, type, limit)),

  getAllProducts: (page = 1, type = '', limit) =>
    api.get('product/get_product_byCompanyId', buildListingParams(page, type, limit)),

  getRejectedProducts: (page = 1, type = '', limit) =>
    api.get('product/GetListedRejectedProduct', buildListingParams(page, type, limit)),

  getDelistProducts: (page = 1, type = '', limit) =>
    api.get('product/GetListedDelistProduct', buildListingParams(page, type, limit)),

  getPendingProducts: (page = 1, type = '', limit) =>
    api.get('product/GetListedPendingProduct', buildListingParams(page, type, limit)),

  getProductById: (id) =>
    api.get(`product/get_product_byId/${id}`),

  getPendingAdminListingChangeRequests: () =>
    api.get('product/pending-admin-listing-change-requests'),

  respondToAdminListingChangeRequest: (id, status) =>
    api.put(`product/pending-admin-listing-change-requests/${id}/respond`, { status }),

  // General delete (live/rejected etc.) – BXI: DELETE product/deleteProduct/:id
  deleteProduct: (id) =>
    api.delete(`product/deleteProduct/${id}`),

  // Draft permanent delete – BXI: DELETE product/deleteDraftProduct?ProductId=...
  deleteDraftProduct: (productId) =>
    api.delete(`product/deleteDraftProduct`, { params: { ProductId: productId } }),

  createProduct: (data) =>
    api.post('product/add_product', data),

  updateProduct: (data) =>
    api.put('product/update_product', data),

  /** Media (online/offline) uses product_mutation per bxi-dashboard */
  productMutation: (data) =>
    api.post('product/product_mutation', data),

  /** Go Live: multipart FormData upload (images, sizechart, listperiod) */
  productMutationFormData: (formData, onUploadProgress) => {
    const config = { onUploadProgress };
    return api.post('product/product_mutation', formData, config);
  },

  relistProduct: (data) =>
    api.post('product/delist_relist_live_products', data),
};

// Key feature API (for feature icons on preview)
export const keyFeatureApi = {
  getByName: (name) =>
    api.post('keyfeature/get_KeyFeatures_ByName', { KeyFeature: name }),
};

// Media-specific APIs
export const mediaApi = {
  // Multiplex Excel processing
  uploadMultiplexExcel: (formData) =>
    api.post('product/MultiplexScreen_Excel_Process', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  
  // Get multiplex screens by ID
  getMultiplexScreensById: (id) =>
    api.get(`product/MultiplexScreenGetById/${id}`),
  
  // Media Online features
  getMediaOnlineFeatures: () =>
    api.get('mediaonlinesinfeature/Get_media_onlinesinglefea'),
  
  // Media Offline features
  getMediaOfflineFeatures: () =>
    api.get('mediaofflinesinfeature/Get_media_offlinesinglefea'),
  
  // Hoarding-specific APIs
  uploadHoardingExcel: (formData) =>
    api.post('product/Hoarding_Excel_Process', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  
  getHoardingListById: (id) =>
    api.get(`product/HoardingListGetById/${id}`),
  
  updateHoardingProduct: (data) =>
    api.post('product/product_mutation_hoardings', data),
};

// Company APIs
export const companyApi = {
  getCompanyType: (companyTypeId) =>
    api.get(`company_type/get_companyType/${companyTypeId}`),
};

export const companyTypeApi = {
  getCompanyTypesForCarousel: () =>
    api.get('company_type/get_companyTypes_for_carousel'),
};

// Auth APIs (BXI: auth/logged_user GET, auth/logout GET)
export const authApi = {
  getLoggedInUser: () =>
    api.get('auth/logged_user'),

  getAuthCompany: () =>
    api.get('auth/getauthsCompany'),

  logout: () =>
    api.get('auth/logout'),
};

export const fetchAdminData = async (tokenOverride) => {
  const token =
    tokenOverride ||
    (typeof window !== 'undefined' ? getAdminToken() : null);

  if (!token) {
    return null;
  }

  try {
    const response = await api.get('api/v1/admin/getloggedinnuser', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data || null;
  } catch (error) {
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      console.warn('Admin not authenticated for Standalone SellerHub', error?.response?.data || error.message);
      return null;
    }
    console.error('Failed to fetch admin data in Standalone app', error);
    throw error;
  }
};
// Upload APIs
export const uploadApi = {
  uploadFile: (formData) =>
    api.post('product/add_Image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  uploadVoucherFile: (formData) =>
    api.post('file/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// Bulk upload (BXI: publiq_bulk_upload/*)
export const bulkUploadApi = {
  uploadBulkFile: (formData) =>
    api.post('publiq_bulk_upload/bulk_upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  createCompanyUpload: (storeFile) =>
    api.post('publiq_bulk_upload/create_company_upload', { storeFile }),
  /** Links latest bulk_upload_files entry to bulk_upload_webhook (sets webhook_response_id). Required before corrected-file validation. */
  fetchCompanyUpload: () =>
    api.post('publiq_bulk_upload/fetch_company_upload', {}),
  checkProcessingStatus: (body) =>
    api.post('publiq_bulk_upload/check_processing_status', body),
  /** Corrected Excel after AI output — validated on BXI only (multipart: file, webhook_id, category). */
  uploadCorrectedBulkFile: (formData) =>
    api.post('publiq_bulk_upload/bulk_error_file_upload_User', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getBulkValidationErrors: (webhook_id) =>
    api.post('publiq_bulk_upload/get_validation_errors', { webhook_id }),
};

export default api;
