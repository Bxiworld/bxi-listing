import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Package, Loader2, Search, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { ProductCard } from '../components/products/ProductCard';
import { TabCard } from '../components/products/TabCard';
import { DeleteDialog } from '../components/products/DeleteDialog';
import AdminListingChangeDialog from '../components/products/AdminListingChangeDialog';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '../components/ui/pagination';
import { toast } from 'sonner';
import {
  fetchLiveProducts,
  fetchDraftProducts,
  fetchAllProducts,
  fetchRejectedProducts,
  fetchDelistProducts,
  fetchPendingProducts,
  fetchPendingAdminListingChanges,
  acceptAdminListingChange,
  rejectAdminListingChange,
  deleteProduct,
  deleteDraftProduct,
  relistProduct,
  delistProduct,
  setActiveTab,
  triggerRefresh,
} from '../redux/slices/productSlice';
import { useAuthUser } from '../hooks/useAuthUser';
import useListingEntryContext from '../hooks/useListingEntryContext';
import BulkUploadJobsBanner from '../components/BulkUploadJobsBanner';
import { getAllowedCategories, getAllowedVouchers } from '../config/categories';
import { PRODUCT_TYPE_BY_CATEGORY } from '../config/categoryFormConfig';
import { isMediaListing, isVoucherListing, passesSellerHubDraftTabListing } from '../utils/listingProductFields';
import { productApi } from '../utils/api';

const HUB_PAGE_SIZE = 20;
const HUB_SEARCH_CATALOG_MAX = 5000;

const TAB_PRODUCT_FETCHERS = {
  Live: productApi.getLiveProducts,
  'In Draft': productApi.getDraftProducts,
  'Admin Review': productApi.getPendingProducts,
  Delist: productApi.getDelistProducts,
  Rejected: productApi.getRejectedProducts,
  All: productApi.getAllProducts,
};

const TABS = ['Live', 'In Draft', 'Admin Review', 'Delist', 'Rejected', 'All'];
const CATEGORY_FILTER_OPTIONS = Array.from(
  new Set(Object.values(PRODUCT_TYPE_BY_CATEGORY))
).sort((a, b) => a.localeCompare(b));
const LISTING_TYPE_FILTER_OPTIONS = ['Product', 'Voucher', 'Media'];
const CATEGORY_FILTER_ALIASES = {
  'QSR': ['qsr', 'restaurant', 'restaurant / qsr'],
  'Office Supply': ['office supply', 'officesupply'],
  'Entertainment & Events': ['entertainment & events', 'entertainment and events', 'ee'],
  'Airline Tickets': ['airline tickets', 'airlines tickets', 'airline'],
  'Hotel': ['hotel', 'hotels'],
};

const normalizeCategory = (value = '') =>
  String(value).toLowerCase().replace(/[^a-z0-9&]+/g, ' ').trim();

const productMatchesHubSearch = (product, rawQuery) => {
  const q = String(rawQuery || '').trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    product?.ProductName,
    product?.ProductDescription,
    product?.ProductSubCategoryName,
    product?.ProductCategoryName,
    product?.BrandName,
    product?._id,
    product?.SKU,
    product?.ListingType,
    product?.Type,
    Array.isArray(product?.tags) ? product.tags.join(' ') : product?.tags,
  ]
    .filter((v) => v != null && v !== '')
    .map((v) => String(v).toLowerCase())
    .join(' ');
  const words = q.split(/\s+/).filter(Boolean);
  return words.every((w) => haystack.includes(w));
};

function filterSellerHubProducts(
  source,
  { activeTab, selectedType, selectedListingType }
) {
  let list =
    activeTab !== 'In Draft'
      ? source || []
      : (source || []).filter(passesSellerHubDraftTabListing);

  if (selectedType) {
    if (selectedType === 'Media') {
      list = list.filter((product) => isMediaListing(product));
    } else {
      const selectedNorm = normalizeCategory(selectedType);
      const aliasPool = new Set([
        selectedNorm,
        ...(CATEGORY_FILTER_ALIASES[selectedType] || []).map((a) =>
          normalizeCategory(a)
        ),
      ]);

      list = list.filter((product) => {
        if (isMediaListing(product)) {
          return false;
        }

        const categoryCandidates = [
          product?.ProductCategoryName,
          product?.ProductType,
          product?.Type,
        ]
          .map((v) => normalizeCategory(v))
          .filter(Boolean);

        return categoryCandidates.some((candidate) =>
          [...aliasPool].some(
            (alias) =>
              candidate === alias ||
              candidate.includes(alias) ||
              alias.includes(candidate)
          )
        );
      });
    }
  }

  if (selectedListingType) {
    list = list.filter((product) => {
      const isMedia = isMediaListing(product);
      const isVoucher = isVoucherListing(product);

      switch (selectedListingType) {
        case 'Product':
          return !isVoucher && !isMedia;
        case 'Voucher':
          return isVoucher;
        case 'Media':
          return isMedia;
        default:
          return true;
      }
    });
  }

  return list;
}

function getVisiblePages(currentPage, totalPages, maxVisible = 7) {
  if (!totalPages || totalPages < 1) return [];
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const half = Math.floor(maxVisible / 2);
  let start = Math.max(1, currentPage - half);
  let end = Math.min(totalPages, start + maxVisible - 1);

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export default function SellerHub() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  useListingEntryContext();
  const {
    companyType: companyTypeName,
    isAdmin,
    loading: authLoading,
    isAuthenticated,
  } = useAuthUser();

  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pendingChangeDialogOpen, setPendingChangeDialogOpen] = useState(false);
  const [selectedPendingChange, setSelectedPendingChange] = useState(null);
  const [isSubmittingPendingChange, setIsSubmittingPendingChange] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [selectedListingType, setSelectedListingType] = useState('');
  const [hubSearch, setHubSearch] = useState('');
  const [debouncedHubSearch, setDebouncedHubSearch] = useState('');
  const [searchCatalog, setSearchCatalog] = useState([]);
  const [searchCatalogLoading, setSearchCatalogLoading] = useState(false);

  // Redux state
  const {
    liveProducts,
    draftProducts,
    allProducts,
    rejectedProducts,
    delistProducts,
    pendingProducts,
    pendingAdminListingChanges,
    activeTab,
    refreshTrigger,
  } = useSelector((state) => state.products);

  const companyType = companyTypeName || 'Others';
  const isMedia = companyType === 'Media';
  // Treat either a true admin flag or an explicit admin source as admin view
  const showAdminView = isAdmin;
  const allowedCategories = getAllowedCategories(companyType, showAdminView);
  const allowedVouchers = getAllowedVouchers(companyType, showAdminView);
  const hasProductAccess = allowedCategories.length > 0;
  const hasVoucherAccess = allowedVouchers.length > 0;
  // Match bxi-dashboard: EE uses eephysical (Entertainment vs Events); Media uses media-physical; others use physical
  const addListingPath = isMedia
    ? '/media-physical'
    : companyType === 'Entertainment & Events' && hasVoucherAccess
      ? '/eephysical'
      : (hasProductAccess || hasVoucherAccess) ? '/physical' : '/sellerhub';
  const addListingLabel = hasProductAccess
    ? (isMedia ? 'Add Media' : 'Add Product')
    : 'Add Voucher';
  const listingTypeLabel = isMedia ? 'media listings' : (hasVoucherAccess && !hasProductAccess ? 'voucher listings' : 'product listings');

  const fetchAllTabsData = (type = '') => {
    dispatch(fetchLiveProducts({ page: 1, type }));
    dispatch(fetchDraftProducts({ page: 1, type }));
    dispatch(fetchAllProducts({ page: 1, type }));
    dispatch(fetchRejectedProducts({ page: 1, type }));
    dispatch(fetchDelistProducts({ page: 1, type }));
    dispatch(fetchPendingProducts({ page: 1, type }));
  };

  // Fetch all products on mount, refresh, and filter change
  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      return;
    }
    fetchAllTabsData(selectedType);
    setCurrentPage(1);
  }, [dispatch, refreshTrigger, authLoading, isAuthenticated, selectedType]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      return;
    }
    dispatch(fetchPendingAdminListingChanges());
  }, [dispatch, refreshTrigger, authLoading, isAuthenticated]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedHubSearch(hubSearch), 400);
    return () => clearTimeout(timer);
  }, [hubSearch]);

  // Fetch current tab data when page changes (skip while cross-tab search is active)
  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      return;
    }
    if (debouncedHubSearch.trim()) {
      return;
    }
    fetchCurrentTabData(currentPage, selectedType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, activeTab, authLoading, isAuthenticated, selectedType, debouncedHubSearch]);

  const fetchCurrentTabData = (page, type = '') => {
    switch (activeTab) {
      case 'Live':
        dispatch(fetchLiveProducts({ page, type }));
        break;
      case 'In Draft':
        dispatch(fetchDraftProducts({ page, type }));
        break;
      case 'Admin Review':
        dispatch(fetchPendingProducts({ page, type }));
        break;
      case 'Delist':
        dispatch(fetchDelistProducts({ page, type }));
        break;
      case 'Rejected':
        dispatch(fetchRejectedProducts({ page, type }));
        break;
      case 'All':
        dispatch(fetchAllProducts({ page, type }));
        break;
      default:
        break;
    }
  };

  // Get current tab data
  const getCurrentTabData = () => {
    switch (activeTab) {
      case 'Live':
        return liveProducts;
      case 'In Draft':
        return draftProducts;
      case 'Admin Review':
        return pendingProducts;
      case 'Delist':
        return delistProducts;
      case 'Rejected':
        return rejectedProducts;
      case 'All':
        return allProducts;
      default:
        return liveProducts;
    }
  };

  const currentTabData = getCurrentTabData();
  const { data: products, totalProducts, totalPages, loading } = currentTabData;
  const tabProducts = useMemo(() => {
    if (activeTab !== 'In Draft') return products || [];
    return (products || []).filter(passesSellerHubDraftTabListing);
  }, [activeTab, products]);

  const hubFilterOptions = useMemo(
    () => ({ activeTab, selectedType, selectedListingType }),
    [activeTab, selectedType, selectedListingType]
  );

  const fullyFilteredProducts = useMemo(
    () => filterSellerHubProducts(tabProducts, hubFilterOptions),
    [tabProducts, hubFilterOptions]
  );

  const isSearchActive = Boolean(debouncedHubSearch.trim());

  // Tab counts
  const tabCounts = useMemo(() => ({
    'Live': liveProducts.totalProducts || liveProducts.data?.length || 0,
    'In Draft': draftProducts.totalProducts || draftProducts.data?.length || 0,
    'Admin Review': pendingProducts.totalProducts || pendingProducts.data?.length || 0,
    'Delist': delistProducts.totalProducts || delistProducts.data?.length || 0,
    'Rejected': rejectedProducts.totalProducts || rejectedProducts.data?.length || 0,
    'All': allProducts.totalProducts || allProducts.data?.length || 0,
  }), [liveProducts, draftProducts, pendingProducts, delistProducts, rejectedProducts, allProducts]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      return undefined;
    }

    const query = debouncedHubSearch.trim();
    if (!query) {
      setSearchCatalog([]);
      setSearchCatalogLoading(false);
      return undefined;
    }

    const fetcher = TAB_PRODUCT_FETCHERS[activeTab];
    if (!fetcher) {
      return undefined;
    }

    let cancelled = false;

    (async () => {
      setSearchCatalogLoading(true);
      try {
        const catalogLimit = Math.min(
          Math.max(tabCounts[activeTab] || HUB_PAGE_SIZE, HUB_PAGE_SIZE),
          HUB_SEARCH_CATALOG_MAX
        );
        const response = await fetcher(1, selectedType, catalogLimit);
        if (cancelled) return;
        const items = response.data?.products || response.data?.product || [];
        setSearchCatalog(Array.isArray(items) ? items : []);
        setCurrentPage(1);
      } catch {
        if (!cancelled) {
          setSearchCatalog([]);
        }
      } finally {
        if (!cancelled) {
          setSearchCatalogLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    debouncedHubSearch,
    activeTab,
    selectedType,
    authLoading,
    isAuthenticated,
    refreshTrigger,
    tabCounts,
  ]);

  const matchedProducts = useMemo(() => {
    const source = isSearchActive ? searchCatalog : tabProducts;
    const filtered = filterSellerHubProducts(source, hubFilterOptions);
    const query = isSearchActive ? debouncedHubSearch : hubSearch;
    return filtered.filter((product) => productMatchesHubSearch(product, query));
  }, [
    isSearchActive,
    searchCatalog,
    tabProducts,
    hubFilterOptions,
    debouncedHubSearch,
    hubSearch,
  ]);

  const displayProducts = useMemo(() => {
    if (!isSearchActive) {
      return matchedProducts;
    }
    const start = (currentPage - 1) * HUB_PAGE_SIZE;
    return matchedProducts.slice(start, start + HUB_PAGE_SIZE);
  }, [isSearchActive, matchedProducts, currentPage]);

  const activeTotalPages = isSearchActive
    ? Math.max(1, Math.ceil(matchedProducts.length / HUB_PAGE_SIZE))
    : totalPages;

  const activeLoading = isSearchActive ? searchCatalogLoading : loading;

  const pendingAdminChangeByProductId = useMemo(() => {
    const requestMap = {};
    (pendingAdminListingChanges?.data || []).forEach((request) => {
      const productId = String(request?.productId || request?.productId?._id || '');
      if (productId) {
        requestMap[productId] = request;
      }
    });
    return requestMap;
  }, [pendingAdminListingChanges?.data]);

  // Handle tab change
  const handleTabChange = (tab) => {
    dispatch(setActiveTab(tab));
    setCurrentPage(1);
    setHubSearch('');
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle delete
  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete?._id) return;

    const isDraft = activeTab === 'In Draft';
    setIsDeleting(true);
    try {
      if (isDraft) {
        await dispatch(deleteDraftProduct(productToDelete._id)).unwrap();
      } else {
        await dispatch(deleteProduct(productToDelete._id)).unwrap();
      }
      toast.success('Product deleted successfully');
      setDeleteDialogOpen(false);
      setProductToDelete(null);
      dispatch(triggerRefresh());
      fetchCurrentTabData(currentPage, selectedType);
    } catch (error) {
      toast.error(error || 'Failed to delete product');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRelist = async (product) => {
    if (!product?._id) return;
    if (
      !window.confirm('Relist this listing? It will return to live after approval where applicable.')
    ) {
      return;
    }
    try {
      await dispatch(relistProduct({
        productId: product._id,
        ProductUploadStatus: 'Approved',
      })).unwrap();
      toast.success('Product relisted successfully');
      dispatch(triggerRefresh());
      fetchCurrentTabData(currentPage, selectedType);
    } catch (error) {
      toast.error(error || 'Failed to relist product');
    }
  };

  const handleDelist = async (product) => {
    if (!product?._id) return;
    if (!window.confirm('Delist this listing? Buyers will no longer see it in the marketplace.')) {
      return;
    }
    try {
      await dispatch(delistProduct({
        productId: product._id,
        ProductUploadStatus: 'Delist',
      })).unwrap();
      toast.success('Product delisted successfully');
      dispatch(triggerRefresh());
      fetchCurrentTabData(currentPage, selectedType);
    } catch (error) {
      toast.error(error || 'Failed to delist product');
    }
  };

  const handleReviewPendingChange = (product, request) => {
    if (!request?._id) return;
    setSelectedPendingChange({
      ...request,
      product,
    });
    setPendingChangeDialogOpen(true);
  };

  const handlePendingChangeDialogOpenChange = (open) => {
    if (isSubmittingPendingChange) return;
    setPendingChangeDialogOpen(open);
    if (!open) {
      setSelectedPendingChange(null);
    }
  };

  const handleAcceptPendingChange = async () => {
    if (!selectedPendingChange?._id) return;
    setIsSubmittingPendingChange(true);
    try {
      await dispatch(acceptAdminListingChange(selectedPendingChange._id)).unwrap();
      toast.success('Admin changes accepted successfully');
      setPendingChangeDialogOpen(false);
      setSelectedPendingChange(null);
      dispatch(triggerRefresh());
    } catch (error) {
      toast.error(error || 'Failed to accept admin changes');
    } finally {
      setIsSubmittingPendingChange(false);
    }
  };

  const handleRejectPendingChange = async () => {
    if (!selectedPendingChange?._id) return;
    setIsSubmittingPendingChange(true);
    try {
      await dispatch(rejectAdminListingChange(selectedPendingChange._id)).unwrap();
      toast.success('Admin changes rejected successfully');
      setPendingChangeDialogOpen(false);
      setSelectedPendingChange(null);
      dispatch(triggerRefresh());
    } catch (error) {
      toast.error(error || 'Failed to reject admin changes');
    } finally {
      setIsSubmittingPendingChange(false);
    }
  };

  // Get section title
  const getSectionTitle = () => {
    if (isMedia) {
      switch (activeTab) {
        case 'Live': return 'Live Media';
        case 'In Draft': return 'In Draft Media';
        case 'Admin Review': return 'Admin Review Media';
        case 'Delist': return 'Delisted Media';
        case 'Rejected': return 'Rejected Media';
        case 'All': return 'All Media';
        default: return 'Products';
      }
    }
    switch (activeTab) {
      case 'Live': return 'Live Products';
      case 'In Draft': return 'In Draft Products';
      case 'Admin Review': return 'Admin Review Products';
      case 'Delist': return 'Delisted Products';
      case 'Rejected': return 'Rejected Products';
      case 'All': return 'All Products';
      default: return 'Products';
    }
  };

  // Calculate total products for hero
  const totalProductsCount = tabCounts['All'] || 0;

  return (
    <div className="min-h-screen bg-[#F8F9FA]" data-testid="seller-hub-page">
      {authLoading ? (
        <div className="loading-container">
          <Loader2 className="w-10 h-10 animate-spin text-[#C64091]" />
        </div>
      ) : null}
      {/* Hero Section */}
      <div className="seller-hero">
        <div className="seller-hero-content" >
          
            <>
              <h1>{showAdminView ? 'Ready Stock Listings' : 'Sell with BXI'}</h1>
              <p>Manage your {totalProductsCount} {listingTypeLabel}{showAdminView ? ' (Admin view)' : ''}</p>
            </>
          
          <Button
            onClick={() => navigate(showAdminView ? '/allcategoriesadmin' : addListingPath)}
            className="bg-white text-[#C64091] hover:bg-gray-100 font-semibold px-6 py-3 h-auto shadow-lg hover:shadow-xl transition-shadow"
            data-testid="add-product-btn"
          >
            <Plus className="w-5 h-5 mr-2" />
            {addListingLabel}
          </Button>
        </div>
      </div>

      {/* Bulk upload recovery: resume/download in-flight or finished jobs without re-uploading */}
      <BulkUploadJobsBanner />

      {/* Tab Cards */}
      <div className="tab-cards-container" >
        <div className="tab-cards-grid">
          {TABS.map((tab) => (
            <TabCard
              key={tab}
              tab={tab}
              count={tabCounts[tab]}
              isActive={activeTab === tab}
              onClick={() => handleTabChange(tab)}
              isMedia={isMedia}
              buttonVariant={tab === 'Live Products' || tab === 'All Products' ? 'filled' : 'outline'}
            />
          ))}
        </div>
      </div>

      {/* Section Title */}
      <div className="section-header">
        <h2 className="section-title" data-testid="section-title">
          {getSectionTitle()}
        </h2>

        {showAdminView && (
          <div className="admin-filter">
            <div className="admin-filter-select w-[220px]">
              <Select
                value={selectedType || undefined}
                onValueChange={(value) => {
                  // Radix Select doesn't allow empty-string SelectItem values.
                  // Map our "All Categories" sentinel back to empty string state.
                  setSelectedType(value === '__all__' ? '' : value);
                  setSelectedListingType('');
                }}
              >
                <SelectTrigger
                  data-testid="sellerhub-category-filter"
                  aria-label="Category filter"
                  className="bg-white"
                >
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Categories</SelectItem>
                  {CATEGORY_FILTER_OPTIONS.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="admin-filter-select w-[260px]">
              <Select
                value={selectedListingType || undefined}
                onValueChange={(value) => {
                  // Allow clearing back to "All Types"
                  setSelectedListingType(value === '__all_types__' ? '' : value);
                }}
              >
                <SelectTrigger
                  data-testid="sellerhub-listing-type-filter"
                  aria-label="Listing type filter"
                  disabled={!selectedType}
                  className="bg-white"
                >
                  <SelectValue
                    placeholder={selectedType ? 'All Types' : 'Select Category First'}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all_types__">All Types</SelectItem>
                  {LISTING_TYPE_FILTER_OPTIONS.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      <div className="w-full max-w-xl mx-auto px-4 mb-6">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
            aria-hidden
          />
          <Input
            value={hubSearch}
            onChange={(e) => setHubSearch(e.target.value)}
            placeholder="Search by name, category, ID…"
            className="pl-9 pr-9 h-10 bg-white border-[#E5E8EB]"
            data-testid="sellerhub-search"
            aria-label="Search listings in this tab"
          />
          {hubSearch ? (
            <button
              type="button"
              onClick={() => setHubSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60"
              aria-label="Clear search"
              data-testid="sellerhub-search-clear"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        {hubSearch.trim() ? (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {searchCatalogLoading
              ? 'Searching all listings in this tab…'
              : `Showing ${matchedProducts.length} match${matchedProducts.length === 1 ? '' : 'es'} across this tab.`}
          </p>
        ) : null}
      </div>

      {/* Product Grid */}
      {activeLoading ? (
        <div className="loading-container">
          <Loader2 className="w-10 h-10 animate-spin text-[#C64091]" />
        </div>
      ) : displayProducts && displayProducts.length > 0 ? (
        <>
          <div className="product-grid" data-testid="product-grid">
            {displayProducts.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                companyType={companyType}
                tabType={activeTab}
                pendingAdminChange={pendingAdminChangeByProductId[String(product?._id)]}
                onReviewPendingChange={handleReviewPendingChange}
                onDelete={handleDeleteClick}
                onRelist={handleRelist}
                onDelist={handleDelist}
              />
            ))}
          </div>

          {/* Pagination */}
          {activeTotalPages > 1 && (
            <div className="pagination-container">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      data-testid="pagination-prev"
                    />
                  </PaginationItem>

                  {getVisiblePages(currentPage, activeTotalPages).map((pageNum) => (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => handlePageChange(pageNum)}
                          isActive={currentPage === pageNum}
                          className="cursor-pointer"
                          data-testid={`pagination-${pageNum}`}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => currentPage < activeTotalPages && handlePageChange(currentPage + 1)}
                      className={currentPage === activeTotalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      data-testid="pagination-next"
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      ) : fullyFilteredProducts?.length > 0 && hubSearch.trim() && !searchCatalogLoading ? (
        <div className="empty-state" data-testid="sellerhub-search-empty">
          <Package className="empty-state-icon" />
          <p className="empty-state-text">No listings match your search.</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => setHubSearch('')}
            className="mt-4"
            data-testid="sellerhub-search-clear-btn"
          >
            Clear search
          </Button>
        </div>
      ) : (tabProducts || []).length > 0 && fullyFilteredProducts?.length === 0 ? (
        <div className="empty-state" data-testid="sellerhub-filter-empty">
          <Package className="empty-state-icon" />
          <p className="empty-state-text">No listings match your filters.</p>
        </div>
      ) : (
        <div className="empty-state" data-testid="empty-state">
          <Package className="empty-state-icon" />
          <p className="empty-state-text">
            No {isMedia ? 'media' : (hasVoucherAccess && !hasProductAccess ? 'vouchers' : 'products')} in this section yet.
          </p>
          <Button
            onClick={() => navigate(addListingPath)}
            className="mt-4 bg-[#C64091] hover:bg-[#A03375]"
            data-testid="empty-add-product-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Your First {hasProductAccess ? (isMedia ? 'Media' : 'Product') : 'Voucher'}
          </Button>
        </div>
      )}

      {/* Delete Dialog */}
      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        productName={productToDelete?.ProductName}
        isDeleting={isDeleting}
      />

      <AdminListingChangeDialog
        open={pendingChangeDialogOpen}
        onOpenChange={handlePendingChangeDialogOpenChange}
        request={selectedPendingChange}
        onAccept={handleAcceptPendingChange}
        onReject={handleRejectPendingChange}
        isSubmitting={isSubmittingPendingChange}
      />
    </div>
  );
}
