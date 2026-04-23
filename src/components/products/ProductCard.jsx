import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Pencil, Trash2, RotateCcw, Package, Archive } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';
import { resolveSellerHubRoute } from '../../utils/sellerHubNavigation';
import {
  getListingType,
  getProductType,
  getProductCategoryName,
  getProductSubCategoryName,
  getVoucherVertical,
  isVoucherListing,
} from '../../utils/listingProductFields';
import bxitoken from '../../assets/bxi-token.svg';

const statusConfig = {
  'Approved': { label: 'Live', className: 'live', color: 'bg-emerald-100 text-emerald-700' },
  'Live': { label: 'Live', className: 'live', color: 'bg-emerald-100 text-emerald-700' },
  'In Draft': { label: 'Draft', className: 'draft', color: 'bg-amber-100 text-amber-700' },
  'Draft': { label: 'Draft', className: 'draft', color: 'bg-amber-100 text-amber-700' },
  'pendingapproval': { label: 'Admin Review', className: 'pending', color: 'bg-blue-100 text-blue-700' },
  'Pending': { label: 'Admin Review', className: 'pending', color: 'bg-blue-100 text-blue-700' },
  'Rejected': { label: 'Rejected', className: 'rejected', color: 'bg-red-100 text-red-700' },
  'delist': { label: 'Delisted', className: 'delist', color: 'bg-gray-100 text-gray-600' },
  'Delist': { label: 'Delisted', className: 'delist', color: 'bg-gray-100 text-gray-600' },
};

const defaultImage = 'https://bxi-icons.sfo3.cdn.digitaloceanspaces.com/brandWorldLogoWithBG.png' || 'https://images.unsplash.com/photo-1612538498488-226257115cc4?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MDV8MHwxfHNlYXJjaHwzfHxtb2Rlcm4lMjBtaW5pbWFsaXN0JTIwcHJvZHVjdCUyMHBhY2thZ2luZyUyMHdoaXRlJTIwYmFja2dyb3VuZHxlbnwwfHx8fDE3NzA3OTI2MDh8MA&ixlib=rb-4.1.0&q=85';

export const ProductCard = ({
  product,
  companyType = 'Others',
  onDelete,
  onRelist,
  onDelist,
  showActions = true,
  tabType = 'Live'
}) => {
  const navigate = useNavigate();

  const {
    _id,
    ProductName,
    ProductUploadStatus,
    ProductImages,
    VoucherImages,
    ProductsVariantions,
    reviewReasonNavigation,
    reviewReason,
  } = product || {};

  // Get image URL
  const imageUrl = ProductImages?.[0]?.url || VoucherImages?.[0]?.url || defaultImage;

  // Get price
  const price = ProductsVariantions?.[0]?.DiscountedPrice || ProductsVariantions?.[0]?.PricePerUnit;

  // Get status config
  const status = statusConfig[ProductUploadStatus] || statusConfig['Draft'];

  const voucherRow = isVoucherListing(product);
  const categoryLabel = voucherRow
    ? getVoucherVertical(product)
    : getProductCategoryName(product) || getProductType(product);
  const subcategoryLabel = getProductSubCategoryName(product);

  // Handle View
  const handleView = () => {
    const path = resolveSellerHubRoute({
      product,
      companyType,
      action: 'view',
    });
    navigate(path);
  };

  // Handle Edit
  const handleEdit = () => {
    const path = resolveSellerHubRoute({
      product,
      companyType,
      action: 'edit',
      reviewReasonNavigation,
    });
    navigate(path);
  };

  // Handle Delete
  const handleDelete = () => {
    if (onDelete) {
      onDelete(product);
    }
  };

  // Handle Relist
  const handleRelist = () => {
    if (onRelist) {
      onRelist(product);
    }
  };

  // Handle Delist
  const handleDelist = () => {
    if (onDelist) {
      onDelist(product);
    }
  };

  return (
    <div className="product-card fade-in" data-testid={`product-card-${_id}`}>
      {/* Image */}
      <div className="relative overflow-hidden group">
        <img
          src={imageUrl}
          alt={ProductName || 'Product'}
          className="product-card-image group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.src = defaultImage;
          }}
        />
        {voucherRow && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-[#C64091] text-white text-xs">
              Voucher
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="product-card-content">
        <h3 className="product-card-name" title={ProductName}>
          {ProductName || 'Untitled Product'}
        </h3>

        <p className="product-card-category">
          {subcategoryLabel || categoryLabel || getListingType(product) || 'Uncategorized'}
        </p>

        {price && (
          <p className="product-card-price flex items-center">
            <img src={bxitoken} alt="BXI Token" className="w-5 h-5 mr-1" />
            {price.toLocaleString('en-IN')}
          </p>
        )}

        {tabType === 'All' && (
          <Badge className={cn('product-card-status', status.color)}>
            {status.label}
          </Badge>
        )}

        {/* Actions */}
        {showActions && (
          <div className="product-card-actions">
            <Button
              variant="outline"
              size="sm"
              onClick={handleView}
              className="flex-1 text-xs"
              data-testid={`view-btn-${_id}`}
            >
              <Eye className="w-3 h-3 mr-1" />
              View
            </Button>

            {tabType === 'Live' && onDelist && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelist}
                className="flex-1 text-xs text-orange-600 border-orange-200 hover:bg-orange-50"
                data-testid={`delist-btn-${_id}`}
              >
                <Archive className="w-3 h-3 mr-1" />
                Delist
              </Button>
            )}

            {tabType !== 'Delist' && tabType !== 'Live' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                className="flex-1 text-xs"
                data-testid={`edit-btn-${_id}`}
              >
                <Pencil className="w-3 h-3 mr-1" />
                Edit
              </Button>
            )}

            {tabType === 'Delist' && onRelist && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRelist}
                className="flex-1 text-xs text-[#C64091] border-[#C64091] hover:bg-[#FCE7F3]"
                data-testid={`relist-btn-${_id}`}
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Relist
              </Button>
            )}

            {(tabType === 'Draft' || tabType === 'In Draft' || tabType === 'Rejected') && onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                data-testid={`delete-btn-${_id}`}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        )}

        {/* Review Section */}
        {tabType === 'Admin Review' && (
          <div className="product-card-review mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">Admin Review</h4>
            <p className="text-sm text-blue-800 line-clamp-3">
              {reviewReason || 'No review reason provided'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
