import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Package, 
  Plus, 
  Upload, 
  LayoutDashboard,
  ChevronDown,
  LogOut,
  ExternalLink
} from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../ui/collapsible';
import { useAuthUser } from '../../hooks/useAuthUser';
import useListingEntryContext from '../../hooks/useListingEntryContext';
import { getAllowedCategories, getAllowedVouchers } from '../../config/categories';

export const Sidebar = ({ isOpen, onClose }) => {
  const [addProductOpen, setAddProductOpen] = React.useState(false);
  const [bulkUploadOpen, setBulkUploadOpen] = React.useState(false);
  const { companyType, user, isAdmin, loading } = useAuthUser();
  const { source, entryCompanyType } = useListingEntryContext();

  const allowAdminAllCategories = isAdmin || source === 'admin';
  const isNormalUserView = !allowAdminAllCategories;
  // When admin context with URL companyType, prioritize entryCompanyType over logged-in user's type
  const effectiveCompanyType = (allowAdminAllCategories && entryCompanyType)
    ? entryCompanyType
    : (companyType || entryCompanyType || 'Others');
  const allowedCategories = getAllowedCategories(effectiveCompanyType, allowAdminAllCategories);
  const allowedVouchers = getAllowedVouchers(effectiveCompanyType, allowAdminAllCategories);
  const hasProductAccess = allowedCategories.length > 0;
  const hasVoucherAccess = allowedVouchers.length > 0;

  // Avoid showing all categories temporarily while auth is still loading for dashboard source.
  const productCategories = source === 'dashboard' && loading
    ? []
    : allowedCategories.map((category) => ({
      path: category.path,
      label: category.label,
    }));

  const bulkUploadCategories = [
    { path: '/textilebulkupload', label: 'Textile' },
    { path: '/electronicbulkupload', label: 'Electronics' },
    { path: '/fmcgbulkupload', label: 'FMCG' },
    { path: '/officesupplybulkupload', label: 'Office Supply' },
    { path: '/mobilitybulkupload', label: 'Mobility' },
    { path: '/otherbulkupload', label: 'Others' },
    { path: '/resturantbulkupload', label: 'Restaurant' },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="sidebar-overlay show lg:hidden"
          onClick={onClose}
          data-testid="sidebar-overlay"
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn('sidebar', isOpen && 'open')}
        data-testid="sidebar"
      >
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#C64091] flex items-center justify-center">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
                BXI Listing
              </h1>
              <p className="text-xs text-gray-500">{user?.name}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {/* Seller Hub / Products Uploaded */}
          <NavLink
            to="/sellerhub"
            className={({ isActive }) => cn('sidebar-nav-item', isActive && 'active')}
            data-testid="nav-sellerhub"
          >
            <LayoutDashboard />
            <span>Products Uploaded</span>
          </NavLink>

          {/* Add Product */}
          <Collapsible open={addProductOpen} onOpenChange={setAddProductOpen}>
            <CollapsibleTrigger className="sidebar-nav-item w-full justify-between" data-testid="nav-add-product">
              <div className="flex items-center gap-3">
                <Plus />
                <span>{isNormalUserView ? 'Add Listing' : 'Add Product'}</span>
              </div>
              <ChevronDown className={cn('h-4 w-4 transition-transform', addProductOpen && 'rotate-180')} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="pl-8 py-2 space-y-1">
                {isNormalUserView ? (
                  <>
                    {hasProductAccess && (
                      <NavLink
                        to="/add-product"
                        className={({ isActive }) => cn(
                          'block px-4 py-2 text-sm rounded-md transition-colors',
                          isActive
                            ? 'bg-[#FCE7F3] text-[#C64091] font-medium'
                            : 'text-gray-600 hover:bg-gray-100'
                        )}
                        data-testid="nav-add-product-option"
                      >
                        Product
                      </NavLink>
                    )}
                    {hasVoucherAccess && (
                      <NavLink
                        to="/generalVoucherForm"
                        className={({ isActive }) => cn(
                          'block px-4 py-2 text-sm rounded-md transition-colors',
                          isActive
                            ? 'bg-[#FCE7F3] text-[#C64091] font-medium'
                            : 'text-gray-600 hover:bg-gray-100'
                        )}
                        data-testid="nav-add-voucher-option"
                      >
                        Voucher
                      </NavLink>
                    )}
                  </>
                ) : (
                  productCategories.map((category) => (
                    <NavLink
                      key={category.path}
                      to={category.path}
                      className={({ isActive }) => cn(
                        'block px-4 py-2 text-sm rounded-md transition-colors',
                        isActive 
                          ? 'bg-[#FCE7F3] text-[#C64091] font-medium' 
                          : 'text-gray-600 hover:bg-gray-100'
                      )}
                      data-testid={`nav-add-${category.label.toLowerCase().replace(/\//g, '-')}`}
                    >
                      {category.label}
                    </NavLink>
                  ))
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Add Voucher */}
          {!isNormalUserView && (
            <NavLink
              to="/generalVoucherForm"
              className={({ isActive }) => cn('sidebar-nav-item', isActive && 'active')}
              data-testid="nav-add-voucher"
            >
              <Package />
              <span>Add Voucher</span>
            </NavLink>
          )}

          {/* Bulk Upload */}
          {(allowAdminAllCategories || hasProductAccess) && (
            <Collapsible open={bulkUploadOpen} onOpenChange={setBulkUploadOpen}>
              <CollapsibleTrigger className="sidebar-nav-item w-full justify-between" data-testid="nav-bulk-upload">
                <div className="flex items-center gap-3">
                  <Upload />
                  <span>Bulk Upload</span>
                </div>
                <ChevronDown className={cn('h-4 w-4 transition-transform', bulkUploadOpen && 'rotate-180')} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="pl-8 py-2 space-y-1">
                  {bulkUploadCategories.map((category) => (
                    <NavLink
                      key={category.path}
                      to={category.path}
                      className={({ isActive }) => cn(
                        'block px-4 py-2 text-sm rounded-md transition-colors',
                        isActive 
                          ? 'bg-[#FCE7F3] text-[#C64091] font-medium' 
                          : 'text-gray-600 hover:bg-gray-100'
                      )}
                      data-testid={`nav-bulk-${category.label.toLowerCase()}`}
                    >
                      {category.label}
                    </NavLink>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <a
            href="https://dashboard.bxiworld.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="sidebar-nav-item text-gray-500 hover:text-[#C64091]"
            data-testid="nav-main-dashboard"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="text-sm">Back to Dashboard</span>
          </a>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
