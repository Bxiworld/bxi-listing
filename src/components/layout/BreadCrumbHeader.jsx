import { Breadcrumbs, Paper, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const ModernPaper = styled(Paper)(({ theme }) => ({
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  border: '1px solid #f1f5f9',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
  padding: '20px 24px',
  marginBottom: '24px',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
  },
}));

const PageTitle = styled(Typography)(({ theme }) => ({
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontSize: 'clamp(1.5rem, 4vw, 2rem)',
  fontWeight: 700,
  color: '#1e293b',
  marginBottom: '12px',
  lineHeight: 1.2,
  textAlign: 'center',
}));

const StyledBreadcrumbs = styled(Breadcrumbs)(({ theme }) => ({
  '& .MuiBreadcrumbs-separator': {
    margin: '0 8px',
    color: '#cbd5e1',
  },
  '& .MuiBreadcrumbs-ol': {
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
}));

const BreadcrumbItem = styled(Typography)(({ isLast, theme }) => ({
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontSize: '14px',
  fontWeight: isLast ? 600 : 500,
  color: isLast ? '#2563eb' : '#64748b',
  cursor: isLast ? 'default' : 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '4px 8px',
  borderRadius: '6px',
  transition: 'all 0.15s ease-in-out',
  textDecoration: 'none',
  ...(!isLast && {
    '&:hover': {
      backgroundColor: '#f1f5f9',
      color: '#2563eb',
      transform: 'translateY(-1px)',
    },
  }),
}));

const ROUTE_CONFIGS = {
  purchaseorderdetails: 'Purchase Order',
  performainvoice: 'Proforma Invoice',
  choosetransport: 'Choose Transport',
  ordersummerydetails: 'Order Summary',
  mediapurchaseorderdetails: 'Media Purchase Order',
  sellerdetailedordersummary: 'Seller Order Summary',
  hotelsVoucher: 'Hotels Voucher',
  hotelsproductinfo: 'Hotels Product Info',
  hotelstechinfo: 'Hotels Tech Info',
  voucherdesign: 'Voucher Design',
  spacificvoucher: 'Specific Voucher',
  lifestyleproductinfo: 'Lifestyle Product Info',
  lifestyletechinfo: 'Lifestyle Tech Info',
  lifestylegolive: 'Lifestyle Go Live',
  texttileproductInfo: 'Textile Product Info',
  technicalinfo: 'Technical Info',
  golive: 'Go Live',
  officesupplyproductinfo: 'Office Supply Product Info',
  officesupplytechinfo: 'Office Supply Tech Info',
  officesupplygolive: 'Office Supply Go Live',
  electronicsproductinfo: 'Electronics Product Info',
  electronicstechinfo: 'Electronics Tech Info',
  electronicsgolive: 'Electronics Go Live',
  mobilityproductinfo: 'Mobility Product Info',
  mobilitytechinfo: 'Mobility Tech Info',
  mobilitygolive: 'Mobility Go Live',
  fmcgproductinfo: 'FMCG Product Info',
  fmcgtechinfo: 'FMCG Tech Info',
  fmcggolive: 'FMCG Go Live',
  othersproductinfo: 'Others Product Info',
  otherstechinfo: 'Others Tech Info',
  othersgolive: 'Others Go Live',
  restaurantproductinfo: 'Restaurant Product Info',
  restauranttechinfo: 'Restaurant Tech Info',
  restaurantgolive: 'Restaurant Go Live',
  voucherdetail: 'Voucher Detail',
  productdetail: 'Product Detail',
  mediabuying: 'Media Buying',
  regeneratemandate: 'Regenerate Mandate',
  allproductpreview: 'All Product Preview',
  sellerperformainvoice: 'Seller Proforma Invoice',
  sellerpurchaseorderlist: 'Product PO (Sales)',
};

const BreadCrumbHeader = React.memo(({ MainText, showbreadcrumb = false, Margin = true }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const urlSegments = useMemo(() => location.pathname.split('/').filter(Boolean), [location.pathname]);
  const [breadData, setBreadData] = useState([]);

  const getBreadcrumbStorage = useCallback(() => {
    try {
      return JSON.parse(localStorage.getItem('breadcrumbHistory')) || [];
    } catch {
      return [];
    }
  }, []);

  const setBreadcrumbStorage = useCallback((data) => {
    try {
      localStorage.setItem('breadcrumbHistory', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save breadcrumb history:', error);
    }
  }, []);

  const isRouteWithId = useCallback((route) => {
    return Object.keys(ROUTE_CONFIGS).includes(route);
  }, []);

  const capitalizeText = useCallback((text) => {
    return text.replace(/\b\w/g, (char) => char.toUpperCase());
  }, []);

  const getDisplayName = useCallback((item) => {
    if (item.name) {
      if (item.name === 'Dashboard') return 'Wallet Dashboard';
      if (item.url === 'productdetail') return 'Product';
      return capitalizeText(item.name);
    }
    return ROUTE_CONFIGS[item.url] || capitalizeText(item.url);
  }, [capitalizeText]);

  useEffect(() => {
    if (!MainText) return;

    let breadcrumbHistory = getBreadcrumbStorage();
    const currentRoute = urlSegments[urlSegments.length - 1];
    const parentRoute = urlSegments[urlSegments.length - 2];
    const routeToCheck = isRouteWithId(parentRoute) ? parentRoute : currentRoute;
    const existingIndex = breadcrumbHistory.findIndex(item => item.url === routeToCheck || item.url === currentRoute);

    if (existingIndex === -1) {
      const newBreadcrumb = {
        url: isRouteWithId(parentRoute) ? parentRoute : currentRoute,
        name: MainText,
        id: isRouteWithId(parentRoute) ? currentRoute : '',
        fullPath: location.pathname,
      };
      breadcrumbHistory.push(newBreadcrumb);
    } else {
      breadcrumbHistory = breadcrumbHistory.slice(0, existingIndex + 1);
    }

    setBreadcrumbStorage(breadcrumbHistory);
  }, [location.pathname, MainText, urlSegments, getBreadcrumbStorage, setBreadcrumbStorage, isRouteWithId]);

  useEffect(() => {
    if (showbreadcrumb) {
      setBreadData(getBreadcrumbStorage());
    }
  }, [showbreadcrumb, getBreadcrumbStorage]);

  const handleHomeClick = useCallback(() => {
    navigate('/home');
    setBreadcrumbStorage([]);
  }, [navigate, setBreadcrumbStorage]);

  const handleBreadcrumbClick = useCallback((index) => {
    const targetItem = breadData[index];
    if (!targetItem) return;

    let navigationPath;
    if (targetItem.fullPath) {
      navigationPath = targetItem.fullPath;
    } else {
      const targetUrl = targetItem.id ? `${targetItem.url}/${targetItem.id}` : targetItem.url;
      const categoryMap = {
        hotelsVoucher: 'hotelsVoucher',
        lifestyle: 'lifestyle',
        textile: 'textile',
        officesupply: 'officesupply',
        electronics: 'electronics',
        mobility: 'mobility',
        fmcg: 'fmcg',
        others: 'others',
        restaurant: 'restaurant',
      };
      const category = Object.keys(categoryMap).find(cat => urlSegments.includes(cat));
      navigationPath = category ? `/home/${category}/${targetUrl}` : `/home/${targetUrl}`;
    }

    navigate(navigationPath);
    const remainingBreadcrumbs = breadData.slice(0, index + 1);
    setBreadcrumbStorage(remainingBreadcrumbs);
  }, [breadData, navigate, setBreadcrumbStorage, urlSegments]);

  if (!MainText) return null;

  return (
    <ModernPaper
      elevation={0}
      sx={{
        marginBottom: Margin ? '24px' : '8px',
        textAlign: 'center',
      }}
    >
      <PageTitle>{MainText}</PageTitle>

      {showbreadcrumb && (
        <StyledBreadcrumbs
          separator={<ChevronRightIcon sx={{ fontSize: '16px', color: '#cbd5e1' }} />}
          aria-label="breadcrumb"
        >
          <BreadcrumbItem onClick={handleHomeClick}>
            <HomeIcon sx={{ fontSize: '16px' }} />
            Home
          </BreadcrumbItem>

          {breadData.map((item, index) => {
            const isLast = index === breadData.length - 1;
            return (
              <BreadcrumbItem
                key={`breadcrumb-${index}`}
                isLast={isLast}
                onClick={isLast ? undefined : () => handleBreadcrumbClick(index)}
              >
                {getDisplayName(item)}
              </BreadcrumbItem>
            );
          })}
        </StyledBreadcrumbs>
      )}
    </ModernPaper>
  );
});

BreadCrumbHeader.displayName = 'BreadCrumbHeader';

export default BreadCrumbHeader;
