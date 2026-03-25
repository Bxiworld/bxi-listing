import axios from 'axios';

const BXI_API_KEY = process.env.REACT_APP_BXI_API_KEY || 'Bearer K8sY2jF4pL3rQ1hA9gZ6bX7wC5vU0t';

// Get admin token - checks URL first, then sessionStorage
// Always checks URL to handle fresh navigations from BXI-admin
const getAdminToken = () => {
  try {
    // Always check URL first (in case of fresh navigation from admin)
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('admintoken');
    
    if (tokenFromUrl) {
      // Store for subsequent requests
      sessionStorage.setItem('admintoken', tokenFromUrl);
      console.log('[API] Admin token found in URL');
      return tokenFromUrl;
    }
    
    // Fall back to stored token
    const storedToken = sessionStorage.getItem('admintoken');
    if (storedToken) {
      console.log('[API] Using stored admin token');
      return storedToken;
    }
  } catch (e) {
    console.error('[API] Error getting admin token:', e);
  }
  return null;
};

// Create axios instance with base configuration (BXI mounts routes at root, no /api)
const api = axios.create({
  baseURL: 'https://bxi-api-development.bxiworld.in',
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
      console.log('[API] Admin token attached to request:', config.url);
    } else {
      console.log('[API] No admin token, using cookie auth for:', config.url);
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
const buildListingParams = (page = 1, type = '') => {
  const params = { page };
  if (type && String(type).trim()) {
    params.Type = type;
  }
  return { params };
};

export const productApi = {
  getLiveProducts: (page = 1, type = '') =>
    api.get('product/get_product_bySellerCompanyId', buildListingParams(page, type)),

  getDraftProducts: (page = 1, type = '') =>
    api.get('product/get_listed_draft_product', buildListingParams(page, type)),

  getAllProducts: (page = 1, type = '') =>
    api.get('product/get_product_byCompanyId', buildListingParams(page, type)),

  getRejectedProducts: (page = 1, type = '') =>
    api.get('product/GetListedRejectedProduct', buildListingParams(page, type)),

  getDelistProducts: (page = 1, type = '') =>
    api.get('product/GetListedDelistProduct', buildListingParams(page, type)),

  getPendingProducts: (page = 1, type = '') =>
    api.get('product/GetListedPendingProduct', buildListingParams(page, type)),

  getProductById: (id) =>
    api.get(`product/get_product_byId/${id}`),

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
    (typeof window !== 'undefined' &&
      (localStorage.getItem('admintoken') ||
        sessionStorage.getItem('admintoken')));

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

// Bulk upload (BXI: publiq_bulk_upload/bulk_upload, single file field 'file')
export const bulkUploadApi = {
  uploadBulkFile: (formData) =>
    api.post('publiq_bulk_upload/bulk_upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export default api;
