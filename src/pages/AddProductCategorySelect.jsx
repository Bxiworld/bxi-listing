import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { useAuthUser } from '../hooks/useAuthUser';
import { getAllowedCategories } from '../config/categories';
import { Package } from 'lucide-react';
import useListingEntryContext from '../hooks/useListingEntryContext';

export default function AddProductCategorySelect() {
  const navigate = useNavigate();
  const { companyType, isAdmin, loading } = useAuthUser();
  const { source, entryCompanyType } = useListingEntryContext();

  // Admin context: either isAdmin flag from auth OR source=admin in URL
  const allowAdminAllCategories = isAdmin || source === 'admin';
  // When admin context with URL companyType, prioritize entryCompanyType over logged-in user's type
  const effectiveCompanyType = (allowAdminAllCategories && entryCompanyType)
    ? entryCompanyType
    : (companyType || entryCompanyType || 'Others');
  const categories = getAllowedCategories(effectiveCompanyType, allowAdminAllCategories);
  const hasProductAccess = categories.length > 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="animate-pulse text-[#C64091]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-12 px-6" data-testid="add-product-category-select">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">
          {allowAdminAllCategories ? 'Choose any category (Admin)' : 'Add Product'}
        </h1>
        <p className="text-gray-600 mb-8">
          {allowAdminAllCategories
            ? 'You can add a product or media in any of the categories below.'
            : 'Select a category to add your product.'}
        </p>
        {hasProductAccess ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <Button
                key={cat.slug}
                variant="outline"
                className="h-auto py-6 flex flex-col gap-2 border-2 border-gray-200 hover:border-[#C64091] hover:bg-[#FCE7F3]"
                onClick={() => navigate(cat.path)}
                data-testid={`category-${cat.slug}`}
              >
                <Package className="w-8 h-8 text-[#C64091]" />
                <span className="font-medium">{cat.label}</span>
              </Button>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-gray-700">
            Product listing is not available for your company type. Please use Voucher listing.
          </div>
        )}
        <div className="mt-8">
          <Button variant="ghost" onClick={() => navigate('/sellerhub')}>
            Back to Seller Hub
          </Button>
        </div>
      </div>
    </div>
  );
}
