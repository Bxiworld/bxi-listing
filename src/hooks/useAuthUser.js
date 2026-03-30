import { useState, useEffect, useCallback } from 'react';
import { authApi, companyApi, fetchAdminData, companyTypeApi } from '../utils/api';

/**
 * Returns logged-in user, company type name, and admin flag.
 * - user: IamUser from auth/logged_user (companyId, superAdmin, roleName, etc.)
 * - companyType: CompanyTypeName string (e.g. 'Media', 'Others', 'Textile')
 * - companyTypeId: id used for get_companyType
 * - isAdmin: true only after successful admin API path (isAdminContext), not raw isBrandWorld from seller API
 * - loading, error, refetch
 */
export function useAuthUser() {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [companyTypeName, setCompanyTypeName] = useState('');
  const [companyTypes, setCompanyTypes] = useState([]);
  const [companyTypeId, setCompanyTypeId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (typeof window !== 'undefined') {
        const q = new URLSearchParams(window.location.search);
        if (q.get('source') === 'dashboard') {
          try {
            sessionStorage.removeItem('admintoken');
            sessionStorage.removeItem('listing_entry_admintoken');
            localStorage.removeItem('admintoken');
          } catch {
            /* ignore */
          }
        }
      }

      // 1. Admin auth only when a token exists on URL or session (never localStorage); dashboard entry clears above.
      let adminUser = null;
      try {
        adminUser = await fetchAdminData();
      } catch (adminError) {
        console.warn('[useAuthUser] Admin auth check failed:', adminError?.message);
      }

      // 2. If admin user found, use admin context
      if (adminUser && adminUser._id) {
        // Set admin user with isAdminContext flag
        setUser({
          ...adminUser,
          isAdminContext: true,
          isBrandWorld: true,
        });
        
        // Get BrandWorld company for admin
        try {
          const companyRes = await authApi.getAuthCompany();
          const companyData = companyRes?.data;
          if (companyData) {
            setCompany(companyData);
            setCompanyTypeId(companyData.companyType || null);
            // Admin can list all product types
            const carouselRes = await companyTypeApi.getCompanyTypesForCarousel();
            setCompanyTypes(carouselRes?.data || []);
            setCompanyTypeName('Admin');
          }
        } catch (e) {
          console.warn('[useAuthUser] Failed to get company for admin:', e?.message);
        }
        return;
      }

      // 3. Fall back to seller/user auth (for bxi-dashboard -> Standalone flow)
      const userRes = await authApi.getLoggedInUser();
      const userData = userRes?.data;
      
      if (!userData || userData === false) {
        setUser(null);
        setCompany(null);
        setCompanyTypeName('');
        setCompanyTypeId(null);
        return;
      }
      setUser(userData);

      try {
        const companyRes = await authApi.getAuthCompany();
        const companyData = companyRes?.data;
        if (companyData && companyData.companyType) {
          setCompany(companyData);
          setCompanyTypeId(companyData.companyType);
          const typeRes = await companyApi.getCompanyType(companyData.companyType);
          const carouselRes = await companyTypeApi.getCompanyTypesForCarousel();
          setCompanyTypes(carouselRes?.data || []);
          const name = typeRes?.data?.CompanyTypeName || typeRes?.data?.stringValue || '';
          setCompanyTypeName(name);
        } else {
          setCompany(companyData || null);
          setCompanyTypeName('');
        }
      } catch (e) {
        setCompany(null);
        setCompanyTypeName('');
      }
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Auth check failed');
      setUser(null);
      setCompany(null);
      setCompanyTypeName('');
      setCompanyTypeId(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);
  const isAdmin = !!user?.isAdminContext;

  return {
    user,
    company,
    companyAvatar: company?.CompanyAvatar?.url,
    companyType: companyTypeName,
    companyTypeId,
    isAdmin,
    loading,
    error,
    refetch,
    isAuthenticated: !!user,
    companyTypes,
  };
}

export default useAuthUser;
