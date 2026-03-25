import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { productApi } from '../../utils/api';

// Initial state
const initialState = {
  // Live products
  liveProducts: {
    data: [],
    totalProducts: 0,
    totalPages: 0,
    currentPage: 1,
    loading: false,
    error: null,
  },
  // Draft products
  draftProducts: {
    data: [],
    totalProducts: 0,
    totalPages: 0,
    currentPage: 1,
    loading: false,
    error: null,
  },
  // All products
  allProducts: {
    data: [],
    totalProducts: 0,
    totalPages: 0,
    currentPage: 1,
    loading: false,
    error: null,
  },
  // Rejected products
  rejectedProducts: {
    data: [],
    totalProducts: 0,
    totalPages: 0,
    currentPage: 1,
    loading: false,
    error: null,
  },
  // Delisted products
  delistProducts: {
    data: [],
    totalProducts: 0,
    totalPages: 0,
    currentPage: 1,
    loading: false,
    error: null,
  },
  // Pending (Admin Review) products
  pendingProducts: {
    data: [],
    totalProducts: 0,
    totalPages: 0,
    currentPage: 1,
    loading: false,
    error: null,
  },
  // Single product
  currentProduct: {
    data: null,
    loading: false,
    error: null,
  },
  // Active tab
  activeTab: 'Live',
  // Refresh trigger
  refreshTrigger: 0,
};

// Async thunks
export const fetchLiveProducts = createAsyncThunk(
  'products/fetchLive',
  async ({ page = 1, type = '' }, { rejectWithValue }) => {
    try {
      const response = await productApi.getLiveProducts(page, type);
      return {
        products: response.data?.products || response.data?.product || [],
        totalProducts: response.data?.totalProducts || 0,
        totalPages: response.data?.totalPages || 0,
        currentPage: page,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch live products');
    }
  }
);

export const fetchDraftProducts = createAsyncThunk(
  'products/fetchDraft',
  async ({ page = 1, type = '' }, { rejectWithValue }) => {
    try {
      const response = await productApi.getDraftProducts(page, type);
      return {
        products: response.data?.products || response.data?.product || [],
        totalProducts: response.data?.totalProducts || 0,
        totalPages: response.data?.totalPages || 0,
        currentPage: page,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch draft products');
    }
  }
);

export const fetchAllProducts = createAsyncThunk(
  'products/fetchAll',
  async ({ page = 1, type = '' }, { rejectWithValue }) => {
    try {
      const response = await productApi.getAllProducts(page, type);
      return {
        products: response.data?.products || response.data?.product || [],
        totalProducts: response.data?.totalProducts || 0,
        totalPages: response.data?.totalPages || 0,
        currentPage: page,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch all products');
    }
  }
);

export const fetchRejectedProducts = createAsyncThunk(
  'products/fetchRejected',
  async ({ page = 1, type = '' }, { rejectWithValue }) => {
    try {
      const response = await productApi.getRejectedProducts(page, type);
      return {
        products: response.data?.products || response.data?.product || [],
        totalProducts: response.data?.totalProducts || 0,
        totalPages: response.data?.totalPages || 0,
        currentPage: page,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch rejected products');
    }
  }
);

export const fetchDelistProducts = createAsyncThunk(
  'products/fetchDelist',
  async ({ page = 1, type = '' }, { rejectWithValue }) => {
    try {
      const response = await productApi.getDelistProducts(page, type);
      return {
        products: response.data?.products || response.data?.product || [],
        totalProducts: response.data?.totalProducts || 0,
        totalPages: response.data?.totalPages || 0,
        currentPage: page,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch delist products');
    }
  }
);

export const fetchPendingProducts = createAsyncThunk(
  'products/fetchPending',
  async ({ page = 1, type = '' }, { rejectWithValue }) => {
    try {
      const response = await productApi.getPendingProducts(page, type);
      return {
        products: response.data?.products || response.data?.product || [],
        totalProducts: response.data?.totalProducts || 0,
        totalPages: response.data?.totalPages || 0,
        currentPage: page,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch pending products');
    }
  }
);

export const fetchProductById = createAsyncThunk(
  'products/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await productApi.getProductById(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch product');
    }
  }
);

export const deleteProduct = createAsyncThunk(
  'products/delete',
  async (id, { rejectWithValue }) => {
    try {
      await productApi.deleteProduct(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete product');
    }
  }
);

export const deleteDraftProduct = createAsyncThunk(
  'products/deleteDraft',
  async (productId, { rejectWithValue }) => {
    try {
      await productApi.deleteDraftProduct(productId);
      return productId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete draft');
    }
  }
);

export const relistProduct = createAsyncThunk(
  'products/relist',
  async (payload, { rejectWithValue }) => {
    try {
      await productApi.relistProduct(payload);
      return payload;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to relist');
    }
  }
);

// Slice
const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    triggerRefresh: (state) => {
      state.refreshTrigger += 1;
    },
    clearCurrentProduct: (state) => {
      state.currentProduct = {
        data: null,
        loading: false,
        error: null,
      };
    },
    resetProductState: () => initialState,
  },
  extraReducers: (builder) => {
    // Live products
    builder
      .addCase(fetchLiveProducts.pending, (state) => {
        state.liveProducts.loading = true;
        state.liveProducts.error = null;
      })
      .addCase(fetchLiveProducts.fulfilled, (state, action) => {
        state.liveProducts.loading = false;
        state.liveProducts.data = action.payload.products;
        state.liveProducts.totalProducts = action.payload.totalProducts;
        state.liveProducts.totalPages = action.payload.totalPages;
        state.liveProducts.currentPage = action.payload.currentPage;
      })
      .addCase(fetchLiveProducts.rejected, (state, action) => {
        state.liveProducts.loading = false;
        state.liveProducts.error = action.payload;
      })
    // Draft products
      .addCase(fetchDraftProducts.pending, (state) => {
        state.draftProducts.loading = true;
        state.draftProducts.error = null;
      })
      .addCase(fetchDraftProducts.fulfilled, (state, action) => {
        state.draftProducts.loading = false;
        state.draftProducts.data = action.payload.products;
        state.draftProducts.totalProducts = action.payload.totalProducts;
        state.draftProducts.totalPages = action.payload.totalPages;
        state.draftProducts.currentPage = action.payload.currentPage;
      })
      .addCase(fetchDraftProducts.rejected, (state, action) => {
        state.draftProducts.loading = false;
        state.draftProducts.error = action.payload;
      })
    // All products
      .addCase(fetchAllProducts.pending, (state) => {
        state.allProducts.loading = true;
        state.allProducts.error = null;
      })
      .addCase(fetchAllProducts.fulfilled, (state, action) => {
        state.allProducts.loading = false;
        state.allProducts.data = action.payload.products;
        state.allProducts.totalProducts = action.payload.totalProducts;
        state.allProducts.totalPages = action.payload.totalPages;
        state.allProducts.currentPage = action.payload.currentPage;
      })
      .addCase(fetchAllProducts.rejected, (state, action) => {
        state.allProducts.loading = false;
        state.allProducts.error = action.payload;
      })
    // Rejected products
      .addCase(fetchRejectedProducts.pending, (state) => {
        state.rejectedProducts.loading = true;
        state.rejectedProducts.error = null;
      })
      .addCase(fetchRejectedProducts.fulfilled, (state, action) => {
        state.rejectedProducts.loading = false;
        state.rejectedProducts.data = action.payload.products;
        state.rejectedProducts.totalProducts = action.payload.totalProducts;
        state.rejectedProducts.totalPages = action.payload.totalPages;
        state.rejectedProducts.currentPage = action.payload.currentPage;
      })
      .addCase(fetchRejectedProducts.rejected, (state, action) => {
        state.rejectedProducts.loading = false;
        state.rejectedProducts.error = action.payload;
      })
    // Delist products
      .addCase(fetchDelistProducts.pending, (state) => {
        state.delistProducts.loading = true;
        state.delistProducts.error = null;
      })
      .addCase(fetchDelistProducts.fulfilled, (state, action) => {
        state.delistProducts.loading = false;
        state.delistProducts.data = action.payload.products;
        state.delistProducts.totalProducts = action.payload.totalProducts;
        state.delistProducts.totalPages = action.payload.totalPages;
        state.delistProducts.currentPage = action.payload.currentPage;
      })
      .addCase(fetchDelistProducts.rejected, (state, action) => {
        state.delistProducts.loading = false;
        state.delistProducts.error = action.payload;
      })
    // Pending products
      .addCase(fetchPendingProducts.pending, (state) => {
        state.pendingProducts.loading = true;
        state.pendingProducts.error = null;
      })
      .addCase(fetchPendingProducts.fulfilled, (state, action) => {
        state.pendingProducts.loading = false;
        state.pendingProducts.data = action.payload.products;
        state.pendingProducts.totalProducts = action.payload.totalProducts;
        state.pendingProducts.totalPages = action.payload.totalPages;
        state.pendingProducts.currentPage = action.payload.currentPage;
      })
      .addCase(fetchPendingProducts.rejected, (state, action) => {
        state.pendingProducts.loading = false;
        state.pendingProducts.error = action.payload;
      })
    // Single product
      .addCase(fetchProductById.pending, (state) => {
        state.currentProduct.loading = true;
        state.currentProduct.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.currentProduct.loading = false;
        state.currentProduct.data = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.currentProduct.loading = false;
        state.currentProduct.error = action.payload;
      })
    // Delete product
      .addCase(deleteProduct.fulfilled, (state, action) => {
        const id = action.payload;
        state.liveProducts.data = state.liveProducts.data.filter(p => p._id !== id);
        state.draftProducts.data = state.draftProducts.data.filter(p => p._id !== id);
        state.allProducts.data = state.allProducts.data.filter(p => p._id !== id);
        state.rejectedProducts.data = state.rejectedProducts.data.filter(p => p._id !== id);
        state.delistProducts.data = state.delistProducts.data.filter(p => p._id !== id);
        state.pendingProducts.data = state.pendingProducts.data.filter(p => p._id !== id);
      })
      .addCase(deleteDraftProduct.fulfilled, (state, action) => {
        const id = action.payload;
        state.draftProducts.data = state.draftProducts.data.filter(p => p._id !== id);
        state.allProducts.data = state.allProducts.data.filter(p => p._id !== id);
      });
  },
});

export const { setActiveTab, triggerRefresh, clearCurrentProduct, resetProductState } = productSlice.actions;
export default productSlice.reducer;
