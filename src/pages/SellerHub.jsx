import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Package, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
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
  deleteProduct,
  deleteDraftProduct,
  relistProduct,
  setActiveTab,
  triggerRefresh,
} from '../redux/slices/productSlice';
import { useAuthUser } from '../hooks/useAuthUser';
import useListingEntryContext from '../hooks/useListingEntryContext';
import { getAllowedCategories, getAllowedVouchers } from '../config/categories';
import { PRODUCT_TYPE_BY_CATEGORY } from '../config/categoryFormConfig';

const TABS = ['Live', 'In Draft', 'Admin Review', 'Delist', 'Rejected', 'All'];
const CATEGORY_FILTER_OPTIONS = Array.from(
  new Set(Object.values(PRODUCT_TYPE_BY_CATEGORY))
).sort((a, b) => a.localeCompare(b));
const LISTING_TYPE_FILTER_OPTIONS = ['Product', 'Voucher', 'Media Online', 'Media Offline'];
const CATEGORY_FILTER_ALIASES = {
  'QSR': ['qsr', 'restaurant', 'restaurant / qsr'],
  'Office Supply': ['office supply', 'officesupply'],
  'Entertainment & Events': ['entertainment & events', 'entertainment and events', 'ee'],
  'Airline Tickets': ['airline tickets', 'airlines tickets', 'airline'],
  'Hotel': ['hotel', 'hotels'],
};

const normalizeCategory = (value = '') =>
  String(value).toLowerCase().replace(/[^a-z0-9&]+/g, ' ').trim();

export default function SellerHub() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { source } = useListingEntryContext();
  console.log("source", source);
  const {
    companyType: companyTypeName,
    isAdmin,
    loading: authLoading,
    isAuthenticated,
  } = useAuthUser();
  console.log("isAdmin", isAdmin);

  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [selectedListingType, setSelectedListingType] = useState('');

  // Redux state
  const {
    liveProducts,
    draftProducts,
    allProducts,
    rejectedProducts,
    delistProducts,
    pendingProducts,
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

  // Fetch current tab data when page changes
  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      return;
    }
    fetchCurrentTabData(currentPage, selectedType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, activeTab, authLoading, isAuthenticated, selectedType]);

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
  const filteredProducts = useMemo(() => {
    if (!selectedType) return products || [];

    const selectedNorm = normalizeCategory(selectedType);
    const aliasPool = new Set([
      selectedNorm,
      ...(CATEGORY_FILTER_ALIASES[selectedType] || []).map((a) => normalizeCategory(a)),
    ]);

    return (products || []).filter((product) => {
      const categoryCandidates = [
        product?.ProductCategoryName,
        product?.ProductType,
        product?.Type,
      ]
        .map((v) => normalizeCategory(v))
        .filter(Boolean);

      return categoryCandidates.some((candidate) =>
        [...aliasPool].some((alias) => candidate === alias || candidate.includes(alias) || alias.includes(candidate))
      );
    });
  }, [products, selectedType]);
  const fullyFilteredProducts = useMemo(() => {
    if (!selectedListingType) return filteredProducts;

    return filteredProducts.filter((product) => {
      const listingTypeNorm = normalizeCategory(product?.ListingType);
      const categoryNorm = normalizeCategory(product?.ProductCategoryName);
      const isMediaOnline = categoryNorm.includes('media online') || categoryNorm.includes('mediaonline');
      const isMediaOffline = categoryNorm.includes('media offline') || categoryNorm.includes('mediaoffline');
      const isVoucher = listingTypeNorm === 'voucher' || categoryNorm.includes('voucher');

      switch (selectedListingType) {
        case 'Product':
          return !isVoucher && !isMediaOnline && !isMediaOffline;
        case 'Voucher':
          return isVoucher;
        case 'Media Online':
          return isMediaOnline;
        case 'Media Offline':
          return isMediaOffline;
        default:
          return true;
      }
    });
  }, [filteredProducts, selectedListingType]);

  // Tab counts
  const tabCounts = useMemo(() => ({
    'Live': liveProducts.totalProducts || liveProducts.data?.length || 0,
    'In Draft': draftProducts.totalProducts || draftProducts.data?.length || 0,
    'Admin Review': pendingProducts.totalProducts || pendingProducts.data?.length || 0,
    'Delist': delistProducts.totalProducts || delistProducts.data?.length || 0,
    'Rejected': rejectedProducts.totalProducts || rejectedProducts.data?.length || 0,
    'All': allProducts.totalProducts || allProducts.data?.length || 0,
  }), [liveProducts, draftProducts, pendingProducts, delistProducts, rejectedProducts, allProducts]);

  // Handle tab change
  const handleTabChange = (tab) => {
    dispatch(setActiveTab(tab));
    setCurrentPage(1);
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

      {/* Product Grid */}
      {loading ? (
        <div className="loading-container">
          <Loader2 className="w-10 h-10 animate-spin text-[#C64091]" />
        </div>
      ) : fullyFilteredProducts && fullyFilteredProducts.length > 0 ? (
        <>
          <div className="product-grid" data-testid="product-grid">
            {fullyFilteredProducts.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                companyType={companyType}
                tabType={activeTab}
                onDelete={handleDeleteClick}
                onRelist={handleRelist}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
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
                  
                  {[...Array(Math.min(totalPages, 5))].map((_, idx) => {
                    const pageNum = idx + 1;
                    return (
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
                    );
                  })}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      data-testid="pagination-next"
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
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
    </div>
  );
}
