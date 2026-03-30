import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthUser } from '../../hooks/useAuthUser';
import useListingEntryContext from '../../hooks/useListingEntryContext';
import { getAllowedCategories, getAllowedVouchers } from '../../config/categories';

export default function ListingAccessGuard({ kind, category, children }) {
  const { companyType, isAdmin, loading } = useAuthUser();
  const { source, entryCompanyType } = useListingEntryContext();

  let hasAdminToken = false;
  if (typeof window !== 'undefined') {
    try {
      hasAdminToken = !!(
        window.sessionStorage.getItem('admintoken') ||
        window.sessionStorage.getItem('listing_entry_admintoken')
      );
    } catch {
      hasAdminToken = false;
    }
  }

  const allowAdminAllCategories =
    isAdmin || (source === 'admin' && hasAdminToken);
  // When admin context with URL companyType, prioritize entryCompanyType over logged-in user's type
  const effectiveCompanyType = (allowAdminAllCategories && entryCompanyType)
    ? entryCompanyType
    : (companyType || entryCompanyType || 'Others');

  if (loading) {
    return null;
  }

  let isAllowed = false;
  if (kind === 'listing') {
    const allowedCategories = getAllowedCategories(effectiveCompanyType, allowAdminAllCategories);
    const allowedVouchers = getAllowedVouchers(effectiveCompanyType, allowAdminAllCategories);
    isAllowed = allowedCategories.length > 0 || allowedVouchers.length > 0;
  } else if (kind === 'voucher') {
    const allowedVouchers = getAllowedVouchers(effectiveCompanyType, allowAdminAllCategories);
    isAllowed = category
      ? allowedVouchers.some((voucher) => voucher.id === category)
      : allowedVouchers.length > 0;
  } else {
    const allowedCategories = getAllowedCategories(effectiveCompanyType, allowAdminAllCategories);
    isAllowed = category
      ? allowedCategories.some((item) => item.slug === category)
      : allowedCategories.length > 0;
  }

  if (!isAllowed) {
    return <Navigate to="/sellerhub" replace />;
  }

  return children;
}
