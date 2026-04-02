import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Scale, Package, ArrowLeft, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import {
  Box,
  Button,
  Chip,
  Paper,
  Typography,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Stack,
  Grid,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Popover,
} from '@mui/material';
import { productApi, keyFeatureApi } from '../utils/api';
import { toast } from 'sonner';
import BXIIcon from '../assets/BXI_COIN.png';
import BXITokenIcon from '../assets/bxi-token.svg';

const defaultImage =
  'https://images.unsplash.com/photo-1612538498488-226257115cc4?w=400&h=400&fit=crop';

const CATEGORY_TO_SLUG = {
  Textile: 'textile',
  'Office Supply': 'officesupply',
  Lifestyle: 'lifestyle',
  Others: 'others',
  Electronics: 'electronics',
  FMCG: 'fmcg',
  Mobility: 'mobility',
  QSR: 'restaurant',
  Media: 'mediaonline',
};

function formatPrice(value) {
  if (value == null || value === '') return 'N/A';
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (Number.isNaN(num)) return String(value);
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function FeatureItem({ name, description }) {
  const [iconUrl, setIconUrl] = useState(null);
  const [imgError, setImgError] = useState(false);
  useEffect(() => {
    if (!name) return;
    keyFeatureApi
      .getByName(name)
      .then((res) => {
        const data = res?.data ?? res;
        const url = data?.URL ?? data?.url;
        if (url) setIconUrl(url);
      })
      .catch(() => {});
  }, [name]);
  const showImg = iconUrl && !imgError;
  return (
    <Stack direction="row" spacing={2} alignItems="flex-start">
      <Box
        sx={{
          width: 40,
          height: 40,
          flexShrink: 0,
          borderRadius: 1,
          bgcolor: 'grey.100',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {showImg ? (
          <img
            src={iconUrl}
            alt={name}
            style={{ width: 40, height: 40, objectFit: 'contain' }}
            onError={() => setImgError(true)}
          />
        ) : (
          <Package style={{ width: 24, height: 24, color: 'grey.500' }} />
        )}
      </Box>
      <Box>
        <Typography variant="body2" fontWeight="medium" color="text.secondary">
          {name}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          {description}
        </Typography>
      </Box>
    </Stack>
  );
}

function DiscountedPriceDisplay({ regularPrice, discountPrice, percentage }) {
  const reg = Number(regularPrice) || 0;
  const disc = Number(discountPrice) || 0;
  const pct = Number(percentage) || 0;
  const discount = reg - disc;
  const discountPercent = reg > 0 ? (discount / reg) * 100 : 0;
  const gstPrice = pct > 0 ? disc / (1 + pct / 100) : disc;
  const gstAmount = disc - gstPrice;

  return (
    <Stack spacing={0.5}>
      <Stack direction="row" flexWrap="wrap" alignItems="baseline" spacing={1}>
        {discountPercent > 0 && (
          <Typography variant="body1" fontWeight="bold" color="error.main">
            -{discountPercent.toFixed(2)}%
          </Typography>
        )}
        <Typography variant="h5" fontWeight="bold" color="text.primary" sx={{ fontSize: { md: '1.75rem' } }}>
          {formatPrice(disc)}
        </Typography>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Typography variant="body2" color="text.secondary">
            ({formatPrice(gstPrice)}
          </Typography>
          <img src={BXIIcon} alt="GST" style={{ height: 16, width: 16 }} />
          <Typography variant="body2" color="text.secondary">
            + {formatPrice(gstAmount)}₹ GST)
          </Typography>
        </Stack>
      </Stack>
      {discountPercent > 0 && (
        <Typography variant="body2" color="text.disabled">
          MRP: <Typography component="span" sx={{ textDecoration: 'line-through' }}>{formatPrice(reg)}</Typography>
        </Typography>
      )}
      <Typography variant="caption" color="text.secondary">
        All prices are inclusive of Taxes
      </Typography>
    </Stack>
  );
}

function TabPanel({ children, value, index, ...rest }) {
  return (
    <div role="tabpanel" hidden={value !== index} {...rest}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

export default function ProductPreview() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [sizeChartAnchor, setSizeChartAnchor] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!id) {
      setError('No product ID');
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    productApi
      .getProductById(id)
      .then((res) => {
        const raw = res?.data ?? res;
        const data = raw?.body ?? raw?.data ?? raw;
        if (cancelled) return;
        setProduct(data);
        const variants = data?.ProductsVariantions ?? [];
        if (variants?.length > 0) {
          setSelectedVariant(variants[0]?._id ?? variants[0]?.id);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message || 'Failed to load product');
          setProduct(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleBack = () => {
    const cat = product?.ProductCategoryName;
    const slug = CATEGORY_TO_SLUG[cat];
    if (slug) {
      navigate(`/${slug}/go-live/${id}`);
    } else {
      navigate('/sellerhub');
    }
  };

  const handleUpload = () => {
    if (!id || uploading) return;
    setUploading(true);
    const isVoucherListing = product?.ListingType === 'Voucher';
    productApi
      .productMutation({ id, ProductUploadStatus: 'pendingapproval' })
      .then(() => {
        toast.success('Once uploaded, changes are subject to approval.');
        setTimeout(() => navigate('/sellerhub'), 2000);
      })
      .catch(() => {
        toast.error(
          isVoucherListing ? 'Failed to upload voucher' : 'Failed to upload products'
        );
      })
      .finally(() => setUploading(false));
  };

  const variants = product?.ProductsVariantions ?? [];
  const selectedVariantData = variants.find(
    (v) => (v._id ?? v.id) === selectedVariant
  );

  const isVoucherListing = product?.ListingType === 'Voucher';
  const images = product?.ListingType === 'Product' ? product?.ProductImages  : product?.ListingType === "Media" ?  product?.ProductImages : product?.VoucherImages || [];
  const sizeChartUrl = product?.SizeChart?.[0]?.url;
  const canShowUpload =
    product?.ProductUploadStatus !== 'Approved' &&
    product?.ProductUploadStatus !== 'pendingapproval' &&
    images?.length > 0;
  const uploadCtaLabel =
    isVoucherListing ? 'Upload Voucher' : 'Upload Products';

  const primaryColor = '#C64091';
  const primaryDark = '#A03375';

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: '#f8fafc',
          py: 3,
          pb: 6,
          px: { xs: 2, sm: 3, lg: 4 },
        }}
      >
        <Box sx={{ maxWidth: 1152, mx: 'auto', width: '100%' }}>
          <Skeleton variant="rectangular" height={40} width={192} sx={{ mb: 3 }} />
          <Paper elevation={0} sx={{ overflow: 'hidden', border: '1px solid', borderColor: 'grey.200' }}>
            <Grid container>
              <Grid item xs={12} md={6}>
                <Skeleton variant="rectangular" sx={{ aspectRatio: '1' }} />
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ p: { xs: 3, md: 4 } }}>
                  <Stack spacing={2}>
                    <Skeleton variant="text" width="75%" height={32} />
                    <Skeleton variant="text" width="50%" height={24} />
                    <Skeleton variant="text" width="33%" height={48} />
                  </Stack>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Box>
      </Box>
    );
  }

  if (error || !product) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: '#f8fafc',
          py: 3,
          pb: 6,
          px: { xs: 2, sm: 3, lg: 4 },
        }}
      >
        <Box sx={{ maxWidth: 1152, mx: 'auto', width: '100%' }}>
          <Button
            startIcon={<ArrowLeft size={20} />}
            onClick={() => navigate('/sellerhub')}
            sx={{ mb: 3, color: 'grey.600', '&:hover': { color: primaryColor, bgcolor: 'transparent' } }}
          >
            Back to My Products
          </Button>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              textAlign: 'center',
              border: '1px solid',
              borderColor: 'error.light',
            }}
          >
            <Typography color="error" fontWeight="medium" sx={{ mb: 2 }}>
              {error || 'Product not found'}
            </Typography>
            <Button variant="outlined" onClick={() => navigate('/sellerhub')}>
              Go to Seller Hub
            </Button>
          </Paper>
        </Box>
      </Box>
    );
  }

  const isTextileStyle =
    ['Textile', 'Lifestyle', 'Office Supply', 'Others'].includes(
      product?.ProductCategoryName
    ) || !product?.ProductCategoryName;

  const tableHeadings = [
    'Disc. MRP',
    'Sizes',
    'Min QTY',
    'Max QTY',
    'GST',
    'HSN',
    'Product Size',
    'Product ID',
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f8fafc',
        py: 3,
        pb: 6,
        px: { xs: 2, sm: 3, lg: 4 },
      }}
      data-testid="product-preview-page"
    >
      <Box sx={{ maxWidth: '100vw', mx: 'auto', width: '100%' }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            py: 3,
            borderBottom: '1px solid',
            borderColor: 'grey.100',
          }}
        >
          <IconButton
            onClick={() => navigate(-1)}
            sx={{
              position: 'absolute',
              left: 0,
              color: 'grey.600',
              '&:hover': { color: primaryColor },
            }}
          >
            <ArrowLeft size={24} />
          </IconButton>
          <Typography variant="h6" fontWeight="600" color="text.primary">
            Preview Page
          </Typography>
        </Box>

        {/* Main content */}
        <Grid container spacing={4} sx={{ mt: 3 }}>
          {/* Image carousel */}
          <Grid item xs={12} lg={6}>
            <Stack alignItems="center">
              {images?.length === 0 ? (
                <Box
                  sx={{
                    width: '100%',
                    maxWidth: 450,
                    aspectRatio: '1',
                    borderRadius: 2,
                    border: '2px dashed',
                    borderColor: 'grey.300',
                    bgcolor: 'grey.50',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography color="text.secondary" fontWeight="medium">
                    No Image Uploaded
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ width: '100%', maxWidth: 450, position: 'relative' }}>
                  <Box
                    sx={{
                      aspectRatio: '1',
                      borderRadius: 2,
                      backgroundSize: product?.ListingType === 'Product' ? 'cover' : 'contain',
                      backgroundPosition: product?.ListingType === 'Product' ? 'center' : 'center',
                      backgroundRepeat: product?.ListingType === 'Product' ? 'no-repeat' : 'no-repeat',
                      backgroundImage: `url(${images?.[carouselIndex]?.url || defaultImage})`,
                    }}
                  />
                  {images?.length > 1 && (
                    <>
                      <IconButton
                        onClick={() => setCarouselIndex((i) => (i === 0 ? images?.length - 1 : i - 1))}
                        sx={{
                          position: 'absolute',
                          left: 8,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          bgcolor: 'rgba(255,255,255,0.9)',
                          '&:hover': { bgcolor: 'white' },
                        }}
                      >
                        <ChevronLeft size={24} />
                      </IconButton>
                      <IconButton
                        onClick={() => setCarouselIndex((i) => (i === images?.length - 1 ? 0 : i + 1))}
                        sx={{
                          position: 'absolute',
                          right: 8,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          bgcolor: 'rgba(255,255,255,0.9)',
                          '&:hover': { bgcolor: 'white' },
                        }}
                      >
                        <ChevronRight size={24} />
                      </IconButton>
                    </>
                  )}
                </Box>
              )}
            </Stack>
          </Grid>

          {/* Product info */}
          <Grid item xs={12} lg={6}>
            <Stack spacing={2}>
              <Box>
                <Chip
                  label={product?.ProductUploadStatus || 'Draft'}
                  size="small"
                  sx={{
                    mb: 1,
                    bgcolor: product?.ProductUploadStatus === 'Approved' ? 'success.light' : 'warning.light',
                    color: product?.ProductUploadStatus === 'Approved' ? 'success.dark' : 'warning.dark',
                  }}
                />
                <Typography variant="h5" fontWeight="600" color="text.primary" data-testid="product-name" sx={{ mt: 1 }}>
                  {product?.ProductName}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {[product?.ProductCategoryName, product?.ProductSubCategoryName].filter(Boolean).join(' / ')}
                </Typography>
              </Box>

              {variants?.length > 1 && (
                <FormControl size="small" sx={{ minWidth: 280 }}>
                  <InputLabel>Select Variant</InputLabel>
                  <Select
                    value={selectedVariant ?? ''}
                    label="Select Variant"
                    onChange={(e) => setSelectedVariant(e.target.value)}
                  >
                    {variants?.map((v) => (
                      <MenuItem key={v._id ?? v.id} value={v._id ?? v.id}>
                        ID: {v.ProductIdType || 'N/A'} / {v.ProductSize || v.flavor || v.NutritionInfo || 'N/A'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              <DiscountedPriceDisplay
                regularPrice={selectedVariantData?.PricePerUnit}
                discountPrice={selectedVariantData?.DiscountedPrice}
                percentage={selectedVariantData?.GST}
              />

              {product?.ProductCategoryName !== 'QSR' &&
                product?.ProductCategoryName !== 'FMCG' &&
                selectedVariantData?.ProductColor && (
                  <Box>
                    <Typography variant="body2" fontWeight="medium" color="text.secondary" sx={{ mb: 1 }}>
                      Colors
                    </Typography>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        border: '2px solid',
                        borderColor: 'grey.300',
                        bgcolor: selectedVariantData.ProductColor,
                      }}
                    />
                  </Box>
                )}

              {product?.gender && (
                <Box>
                  <Typography variant="body2" fontWeight="medium" color="text.secondary">
                    Gender
                  </Typography>
                  <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                    {product.gender}
                  </Typography>
                </Box>
              )}

              {/* Variant table */}
              {selectedVariantData && (
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200', borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.100' }}>
                        {tableHeadings.map((heading) => (
                          <TableCell key={heading} align="center" sx={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary' }}>
                            {heading}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow hover sx={{ '&:hover': { bgcolor: 'grey.50' } }}>
                        <TableCell align="center" sx={{ py: 2 }}>
                          <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                            <Box component="span" sx={{ color: 'success.main', display: 'flex' }}>
                              <Check size={20} />
                            </Box>
                            <img src={BXIIcon} alt="BXI" style={{ height: 16, width: 16 }} />
                            <Typography variant="body2" fontWeight="600">
                              {formatPrice(selectedVariantData.DiscountedPrice) || 'N/A'}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell align="center" sx={{ py: 2 }}>
                          <Typography variant="body2">
                            {selectedVariantData.ShoeSize != null
                              ? `${selectedVariantData.ShoeSize} ${selectedVariantData.MeasurementUnit || ''}`
                              : selectedVariantData.ProductSize ||
                                selectedVariantData.NutritionInfo ||
                                (selectedVariantData?.length && selectedVariantData?.MeasurementUnit
                                  ? `${selectedVariantData?.length} ${selectedVariantData?.MeasurementUnit}`
                                  : 'N/A')}
                          </Typography>
                        </TableCell>
                        <TableCell align="center" sx={{ py: 2 }}>
                          <Chip label={selectedVariantData.MinOrderQuantity ?? 'N/A'} size="small" color="primary" variant="outlined" />
                        </TableCell>
                        <TableCell align="center" sx={{ py: 2 }}>
                          <Chip label={selectedVariantData.MaxOrderQuantity ?? 'N/A'} size="small" color="primary" variant="outlined" />
                        </TableCell>
                        <TableCell align="center" sx={{ py: 2 }}>
                          <Typography variant="body2">
                            {selectedVariantData.GST ? `${selectedVariantData.GST}%` : 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center" sx={{ py: 2 }}>
                          <Typography variant="body2">{selectedVariantData.HSN ?? 'N/A'}</Typography>
                        </TableCell>
                        <TableCell align="center" sx={{ py: 2 }}>
                          <Typography variant="body2">{selectedVariantData.ProductSize ?? 'N/A'}</Typography>
                        </TableCell>
                        <TableCell align="center" sx={{ py: 2 }}>
                          <Typography variant="body2">{selectedVariantData.ProductIdType ?? 'N/A'}</Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* Size chart */}
              {!isVoucherListing &&
                (isTextileStyle || product?.ProductCategoryName === 'Textile') && (
                <Box>
                  <Typography
                    component="button"
                    variant="body2"
                    fontWeight="600"
                    sx={{
                      color: '#1A56DB',
                      cursor: 'pointer',
                      border: 'none',
                      background: 'none',
                      '&:hover': { textDecoration: 'underline' },
                    }}
                    onMouseEnter={(e) => setSizeChartAnchor(e.currentTarget)}
                    onMouseLeave={() => setSizeChartAnchor(null)}
                  >
                    Size Chart
                  </Typography>
                  <Popover
                    open={Boolean(sizeChartAnchor)}
                    anchorEl={sizeChartAnchor}
                    onClose={() => setSizeChartAnchor(null)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                    onMouseEnter={() => setSizeChartAnchor(sizeChartAnchor)}
                    onMouseLeave={() => setSizeChartAnchor(null)}
                    slotProps={{ paper: { sx: { mt: 1.5, p: 1 } } }}
                  >
                    {sizeChartUrl ? (
                      <img
                        src={sizeChartUrl}
                        alt="Size chart"
                        style={{ maxHeight: 300, width: 'auto', maxWidth: 400, objectFit: 'contain' }}
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1 }}>
                        Size Chart Unavailable
                      </Typography>
                    )}
                  </Popover>
                </Box>
              )}
            </Stack>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper elevation={0} sx={{ mt: 5, border: '1px solid', borderColor: 'grey.200', borderRadius: 2, overflow: 'hidden' }}>
          <Tabs
            value={tabValue}
            onChange={(_, v) => setTabValue(v)}
            sx={{
              borderBottom: '1px solid',
              borderColor: 'divider',
              bgcolor: 'grey.50',
              px: 2,
              minHeight: 56,
              '& .MuiTab-root': { fontWeight: 500, textTransform: 'none' },
              '& .Mui-selected': { color: '#1E40AF', fontWeight: 600 },
              '& .MuiTabs-indicator': { backgroundColor: '#1E40AF', height: 3 },
            }}
          >
            <Tab label="Description" />
            <Tab label="Technical Information" />
            <Tab label="Key Features" />
          </Tabs>
          <Box sx={{ p: 3 }}>
            <TabPanel value={tabValue} index={0}>
              {(() => {
                const loc = product?.LocationDetails || product?.locationDetails || {};
                const hasLoc = loc.region || loc.state || loc.city || loc.landmark || loc.pincode;
                return (
                  <Stack spacing={3}>
                    <Box>
                      <Typography variant="body2" fontWeight="600" color="#1E40AF" sx={{ mb: 0.5 }}>
                        Product Description
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        {product?.ProductSubtittle ||
                          product?.ProductSubtitle ||
                          product?.ProductDescription ||
                          'No description available.'}
                      </Typography>
                    </Box>
                    {product?.ModelName && (
                      <Box>
                        <Typography variant="body2" fontWeight="600" color="#1E40AF" sx={{ mb: 0.5 }}>
                          Model Name
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          {product.ModelName}
                        </Typography>
                      </Box>
                    )}
                    <Box>
                      <Typography variant="body2" fontWeight="600" color="#1E40AF" sx={{ mb: 1 }}>
                        Sample Details
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        Sample Available : <Typography component="span" fontWeight="medium">{variants.some((v) => v.SampleAvailability) ? 'Yes' : 'No'}</Typography>
                      </Typography>
                    </Box>
                    {hasLoc && (
                      <Box>
                        <Typography variant="body2" fontWeight="600" color="#1E40AF" sx={{ mb: 2, mt: 2 }}>
                          Product Pickup Location & Pincode
                        </Typography>
                        <Grid container spacing={2}>
                          {loc.region && (
                            <Grid item xs={6} md={4}>
                              <Typography variant="caption" color="text.secondary">Region</Typography>
                              <Typography variant="body2" display="block">{loc.region}</Typography>
                            </Grid>
                          )}
                          {loc.state && (
                            <Grid item xs={6} md={4}>
                              <Typography variant="caption" color="text.secondary">State</Typography>
                              <Typography variant="body2" display="block">{loc.state}</Typography>
                            </Grid>
                          )}
                          {loc.city && (
                            <Grid item xs={6} md={4}>
                              <Typography variant="caption" color="text.secondary">City</Typography>
                              <Typography variant="body2" display="block">{loc.city}</Typography>
                            </Grid>
                          )}
                          {loc.landmark && (
                            <Grid item xs={6} md={4}>
                              <Typography variant="caption" color="text.secondary">Landmark</Typography>
                              <Typography variant="body2" display="block">{loc.landmark}</Typography>
                            </Grid>
                          )}
                          {loc.pincode && (
                            <Grid item xs={6} md={4}>
                              <Typography variant="caption" color="text.secondary">Pincode</Typography>
                              <Typography variant="body2" display="block">{loc.pincode}</Typography>
                            </Grid>
                          )}
                        </Grid>
                      </Box>
                    )}
                    {product?.listperiod && (
                      <Box>
                        <Typography variant="body2" fontWeight="600" color="#1E40AF" sx={{ mb: 0.5, mt: 2 }}>
                          This product is listed for
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          {product.listperiod} Days
                        </Typography>
                      </Box>
                    )}
                    <Box>
                      <Typography variant="body2" fontWeight="600" color="#1E40AF" sx={{ mb: 1 }}>
                        Additional Cost
                      </Typography>
                      {product?.OtherCost?.length > 0 ? (
                        <Stack spacing={1.5}>
                          {product.OtherCost.map((cost, i) => (
                            <Stack key={i} direction="row" flexWrap="wrap" spacing={2} useFlexGap>
                              <Typography variant="body2" color="text.secondary">
                                <Typography component="span" color="text.disabled">Applicable on:</Typography> {cost.AdCostApplicableOn}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                <Typography component="span" color="text.disabled">Reason:</Typography> {cost.ReasonOfCost}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                <Typography component="span" color="text.disabled">HSN:</Typography> {cost.AdCostHSN}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                <Typography component="span" color="text.disabled">GST:</Typography> {cost.AdCostGST}%
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                <Typography component="span" color="text.disabled">Cost:</Typography>{' '}
                                <Typography component="span" className="inline-flex items-center gap-1" fontWeight="medium">
                                  {formatPrice(cost.CostPrice)}
                                  {cost.currencyType === 'BXITokens' ? (
                                    <img src={BXITokenIcon} alt="BXI Token" className="w-4 h-4" />
                                  ) : (
                                    ' ₹'
                                  )}
                                </Typography>
                              </Typography>
                            </Stack>
                          ))}
                        </Stack>
                      ) : (
                        <Typography variant="body1" color="text.secondary">No</Typography>
                      )}
                    </Box>
                    {(product?.ManufacturingDate || product?.ManufacturingData) && (
                      <Stack direction="row" flexWrap="wrap" spacing={4}>
                        <Box>
                          <Typography variant="body2" fontWeight="600" color="#1E40AF" sx={{ mb: 0.5, mt: 2 }}>
                            Manufacturing Date
                          </Typography>
                          <Typography variant="body1" color="text.secondary">
                            {new Date(product.ManufacturingDate || product.ManufacturingData).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" fontWeight="600" color="#1E40AF" sx={{ mb: 0.5, mt: 2 }}>
                            Expiry Date
                          </Typography>
                          <Typography variant="body1" color="text.secondary">
                            {product?.ExpiryDate ? new Date(product.ExpiryDate).toLocaleDateString() : 'Not Given'}
                          </Typography>
                        </Box>
                      </Stack>
                    )}
                  </Stack>
                );
              })()}
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              {(() => {
                if (isVoucherListing) {
                  const inclusions = product?.Inclusions || product?.inclusions;
                  const exclusions = product?.Exclusions || product?.exclusions;
                  const termsAndConditions =
                    product?.TermConditions || product?.termsAndConditions;
                  const redemptionSteps =
                    product?.RedemptionSteps || product?.redemptionSteps;
                  const redemptionType = product?.redemptionType;
                  const redemptionUrl = product?.Link || product?.redemptionURL;
                  const tags = product?.ProductTags?.map((tag, index) => (
                    <span key={index}>{tag}</span>
                  ));

                  const hasVoucherTechInfo =
                    inclusions ||
                    exclusions ||
                    termsAndConditions ||
                    redemptionSteps ||
                    redemptionType ||
                    redemptionUrl ||
                    tags;

                  if (!hasVoucherTechInfo) {
                    return (
                      <Typography color="text.secondary">
                        No technical information available.
                      </Typography>
                    );
                  }

                  return (
                    <Stack spacing={3}>
                      {inclusions && (
                        <Box>
                          <Typography variant="body2" fontWeight="600" color="#1E40AF" sx={{ mb: 1 }}>
                            Inclusions
                          </Typography>
                          <Typography variant="body1" color="text.secondary">
                            {inclusions}
                          </Typography>
                        </Box>
                      )}
                      {exclusions && (
                        <Box>
                          <Typography variant="body2" fontWeight="600" color="#1E40AF" sx={{ mb: 1 }}>
                            Exclusions
                          </Typography>
                          <Typography variant="body1" color="text.secondary">
                            {exclusions}
                          </Typography>
                        </Box>
                      )}
                      {termsAndConditions && (
                        <Box>
                          <Typography variant="body2" fontWeight="600" color="#1E40AF" sx={{ mb: 1 }}>
                            Terms and Conditions
                          </Typography>
                          <Typography variant="body1" color="text.secondary">
                            {termsAndConditions}
                          </Typography>
                        </Box>
                      )}
                      {redemptionSteps && (
                        <Box>
                          <Typography variant="body2" fontWeight="600" color="#1E40AF" sx={{ mb: 1 }}>
                            Redemption Steps
                          </Typography>
                          <Typography variant="body1" color="text.secondary">
                            {redemptionSteps}
                          </Typography>
                        </Box>
                      )}
                      {redemptionType && (
                        <Box>
                          <Typography variant="body2" fontWeight="600" color="#1E40AF" sx={{ mb: 1 }}>
                            Redemption Type
                          </Typography>
                          <Typography fontWeight="500">{redemptionType}</Typography>
                        </Box>
                      )}
                      {redemptionUrl && (
                        <Box>
                          <Typography variant="body2" fontWeight="600" color="#1E40AF" sx={{ mb: 1 }}>
                            Redemption URL
                          </Typography>
                          <Typography
                            component="a"
                            href={redemptionUrl}
                            target="_blank"
                            rel="noreferrer"
                            sx={{ color: '#1A56DB', textDecoration: 'underline' }}
                          >
                            {redemptionUrl}
                          </Typography>
                        </Box>
                      )}
                      {tags.length > 0 && (
                        <Box>
                          <Typography variant="body2" fontWeight="600" color="#1E40AF" sx={{ mb: 1 }}>
                            Tags
                          </Typography>
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                            {tags.map((tag, index) => (
                              <Chip key={index} label={tag} size="small" />
                            ))}
                          </Box>
                        </Box>
                      )}
                    </Stack>
                  );
                }

                const ti = product?.ProductTechInfo;
                const t2 = product;
                const hasAny =
                  ti?.WeightBeforePackingPerUnit ||
                  ti?.WeightAfterPackingPerUnit ||
                  ti?.Height ||
                  ti?.Width ||
                  ti?.Length ||
                  ti?.Warranty ||
                  ti?.GuaranteePeriod ||
                  ti?.PackagingDetails ||
                  ti?.LegalCompliance ||
                  ti?.PackagingType ||
                  ti?.UsageInstructions ||
                  ti?.CareInstructions ||
                  ti?.SafetyWarnings ||
                  ti?.Certifications;
                if (!hasAny) {
                  return <Typography color="text.secondary">No technical information available.</Typography>;
                }
                return (
                  <Stack spacing={3}>
                    <Grid container spacing={2}>
                      {ti?.Warranty && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" fontWeight="600" color="#1E40AF" sx={{ mb: 1 }}>Warranty</Typography>
                          <Typography fontWeight="500">{ti.Warranty}</Typography>
                        </Grid>
                      )}
                      {ti?.Guarantee && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" fontWeight="600" color="#1E40AF" sx={{ mb: 1 }}>Guarantee Period</Typography>
                          <Typography fontWeight="500">{ti.Guarantee}</Typography>
                        </Grid>
                      )}
                    </Grid>
                    {product?.redemptionType && (
                      <Box>
                        <Typography variant="body2" fontWeight="600" color="#1E40AF" sx={{ mb: 1 }}>Redemption Type</Typography>
                        <Typography fontWeight="500">{product?.redemptionType}</Typography>
                      </Box>
                    ) }
                    {(ti?.Height || ti?.Width || ti?.Length) && (
                      <Box>
                        <Typography variant="body2" fontWeight="600" color="#1E40AF" sx={{ mb: 1 }}>Dimensions</Typography>
                        <Grid container spacing={2}>
                          {ti?.Height && (
                            <Grid item xs={4}>
                              <Typography variant="body2" color="text.secondary">Height</Typography>
                              <Typography fontWeight="500">{ti.Height}</Typography>
                            </Grid>
                          )}
                          {ti?.Width && (
                            <Grid item xs={4}>
                              <Typography variant="body2" color="text.secondary">Width</Typography>
                              <Typography fontWeight="500">{ti.Width}</Typography>
                            </Grid>
                          )}
                          {ti?.Length && (
                            <Grid item xs={4}>
                              <Typography variant="body2" color="text.secondary">Length</Typography>
                              <Typography fontWeight="500">{ti?.Length}</Typography>
                            </Grid>
                          )}
                        </Grid>
                      </Box>
                    )}
                    {ti?.WeightBeforePackingPerUnit && (
                      <Stack direction="row" spacing={2} alignItems="flex-start">
                        <Scale style={{ width: 40, height: 40, color: 'grey.500', flexShrink: 0 }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary">Product Weight Before Packaging</Typography>
                          <Typography fontWeight="500">
                            {ti.WeightBeforePackingPerUnit} {product.WeightBeforePackingPerUnitMeasurUnit || product.UnitOfWeight || 'Kg'}
                          </Typography>
                        </Box>
                        <Box sx={{ ml: 2 }}>
                          <Typography variant="body2" color="text.secondary">Product Weight After Packaging</Typography>
                          <Typography fontWeight="500">
                            {ti.WeightAfterPackingPerUnit} {product.WeightAfterPackingPerUnitMeasurUnit || product.UnitOfWeight || 'Kg'}
                          </Typography>
                        </Box>
                      </Stack>
                    )}
                    {ti?.InstructionsToUseProduct && (
                      <Box>
                        <Typography variant="body2" fontWeight="600" color="#1E40AF" sx={{ mb: 1 }}>Instructions to Use Product</Typography>
                        <Typography variant="body1" color="text.secondary">
                          {ti.InstructionsToUseProduct}
                        </Typography>
                      </Box>
                    )}
                    {ti?.PackagingAndDeliveryInstructionsIfAny && (
                      <Box>
                        <Typography variant="body2" fontWeight="600" color="#1E40AF" sx={{ mb: 1 }}>Packaging and Delivery Instructions</Typography>
                        <Typography variant="body1" color="text.secondary">
                          {ti.PackagingAndDeliveryInstructionsIfAny}
                        </Typography>
                      </Box>
                    )}
                    {ti.Tags && (
                      <Box>
                        <Typography
                          variant="body2"
                          fontWeight="600"
                          color="#1E40AF"
                          sx={{ mb: 1 }}
                        >
                          Tags
                        </Typography>

                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                          {ti.Tags.map((tag) => (
                            <Box
                              key={tag}
                              sx={{
                                px: 1.5,
                                py: 0.5,
                                borderRadius: "999px",
                                backgroundColor: "#FCE7F3",
                                color: "#C64091",
                                fontSize: "0.8rem",
                                fontWeight: 500,
                              }}
                            >
                              {tag}
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Stack>
                );
              })()}
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <Box>
                <Typography variant="body2" fontWeight="600" color="#156DB6" sx={{ mb: 2 }}>
                  Key Features
                </Typography>
                {product?.ProductFeatures?.length > 0 ? (
                  <Grid container spacing={3}>
                    {product.ProductFeatures.map((f, i) => (
                      <Grid item xs={12} sm={6} lg={4} key={i}>
                        <FeatureItem
                          name={f?.FeatureName || f?.name}
                          description={f?.FeatureDesc || f?.FeatureDescription || f?.description || ''}
                        />
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography color="text.secondary">No key features available.</Typography>
                )}
              </Box>
            </TabPanel>
          </Box>
        </Paper>

        {canShowUpload && (
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={uploading}
              sx={{
                bgcolor: primaryColor,
                px: 4,
                minWidth: 140,
                minHeight: 40,
                '&:hover': { bgcolor: primaryDark },
              }}
            >
              {uploading ? 'Uploading...' : uploadCtaLabel}
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}
