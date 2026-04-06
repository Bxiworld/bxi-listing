import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Scale, Package, ArrowLeft, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import CloseIcon from '@mui/icons-material/Close';
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
  Dialog,
  DialogTitle,
  DialogContent,
  useMediaQuery,
  useTheme,
  Popover,
  Divider,
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

function getVariantSizesDisplay(v) {
  if (!v) return '';
  if (v.ShoeSize != null && v.ShoeSize !== '') {
    return `${v.ShoeSize} ${v.MeasurementUnit || ''}`.trim();
  }
  if (v.ProductSize != null && v.ProductSize !== '') return String(v.ProductSize);
  if (v.NutritionInfo != null && v.NutritionInfo !== '') return String(v.NutritionInfo);
  const lenDim = v?.Length ?? v?.length;
  if (lenDim != null && lenDim !== '' && v?.MeasurementUnit) {
    return `${lenDim} ${v.MeasurementUnit}`;
  }
  return '';
}

function variantQtyHasValue(q) {
  return q != null && q !== '' && !Number.isNaN(Number(q));
}

/** Columns for variant preview table: only shown when hasValue(variant); minWidth kept stable per column type. */
function getVariantPreviewTableColumns(selectedVariantData, BXIIconSrc) {
  if (!selectedVariantData) return [];
  const v = selectedVariantData;
  const cols = [];

  const discRaw = v.DiscountedPrice;
  const hasDisc =
    discRaw != null &&
    discRaw !== '' &&
    !(typeof discRaw === 'number' && Number.isNaN(discRaw));
  if (hasDisc) {
    cols.push({
      id: 'discountedMrp',
      heading: 'Disc. MRP',
      minWidth: 128,
      cell: (
        <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
          <img src={BXIIconSrc} alt="BXI" style={{ height: 16, width: 16 }} />
          <Typography variant="body2" fontWeight="600">
            {formatPrice(v.DiscountedPrice) || 'N/A'}
          </Typography>
        </Stack>
      ),
    });
  }

  const sizesText = getVariantSizesDisplay(v);
  if (sizesText) {
    cols.push({
      id: 'sizes',
      heading: 'Sizes',
      minWidth: 112,
      cell: <Typography variant="body2">{sizesText}</Typography>,
    });
  }

  if (variantQtyHasValue(v.MinOrderQuantity)) {
    cols.push({
      id: 'minQty',
      heading: 'Min QTY',
      minWidth: 96,
      cell: (
        <Chip label={v.MinOrderQuantity} size="small" color="primary" variant="outlined" />
      ),
    });
  }

  if (variantQtyHasValue(v.MaxOrderQuantity)) {
    cols.push({
      id: 'maxQty',
      heading: 'Max QTY',
      minWidth: 96,
      cell: (
        <Chip label={v.MaxOrderQuantity} size="small" color="primary" variant="outlined" />
      ),
    });
  }

  if (v.GST != null && v.GST !== '' && !(typeof v.GST === 'number' && Number.isNaN(v.GST))) {
    cols.push({
      id: 'gst',
      heading: 'GST',
      minWidth: 72,
      cell: <Typography variant="body2">{`${v.GST}%`}</Typography>,
    });
  }

  if (v.HSN != null && v.HSN !== '') {
    cols.push({
      id: 'hsn',
      heading: 'HSN',
      minWidth: 88,
      cell: <Typography variant="body2">{v.HSN}</Typography>,
    });
  }

  if (v.ProductSize != null && v.ProductSize !== '') {
    cols.push({
      id: 'productSize',
      heading: 'Product Size',
      minWidth: 112,
      cell: <Typography variant="body2">{v.ProductSize}</Typography>,
    });
  }

  if (v.ProductIdType != null && v.ProductIdType !== '') {
    cols.push({
      id: 'productId',
      heading: 'Product ID',
      minWidth: 120,
      cell: <Typography variant="body2">{v.ProductIdType}</Typography>,
    });
  }

  return cols;
}

export default function ProductPreview() {
  const theme = useTheme();
  const sizeChartFullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [sizeChartDialogOpen, setSizeChartDialogOpen] = useState(false);
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
        const rawVariants = data?.ProductsVariantions;
        const variants = Array.isArray(rawVariants) ? rawVariants : [];
        if (variants.length > 0) {
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

  const rawVariantsList = product?.ProductsVariantions;
  const variants = Array.isArray(rawVariantsList) ? rawVariantsList : [];
  const selectedVariantData = variants.find(
    (v) => (v._id ?? v.id) === selectedVariant
  );

  const isVoucherListing = product?.ListingType === 'Voucher';
  const rawImages =
    product?.ListingType === 'Product' || product?.ListingType === 'Media'
      ? product?.ProductImages
      : product?.VoucherImages;
  const images = Array.isArray(rawImages) ? rawImages : [];
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

  const variantPreviewColumns = getVariantPreviewTableColumns(selectedVariantData, BXIIcon);
  const variantTableMinTotal = variantPreviewColumns.reduce((sum, c) => sum + c.minWidth, 0);

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

              {!isVoucherListing &&
                product?.ProductCategoryName !== 'QSR' &&
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

              {/* Variant table — only columns with values; each column keeps a fixed minWidth */}
              {selectedVariantData && variantPreviewColumns.length > 0 && (
                <>
                  <Divider sx={{ borderColor: 'grey.200', my: 2 }} />
                  <TableContainer
                    component={Paper}
                    elevation={0}
                    sx={{
                      border: '1px solid',
                      borderColor: 'grey.200',
                      borderRadius: 2,
                      overflowX: 'auto',
                    }}
                  >
                    <Table
                      size="small"
                      sx={{
                        tableLayout: 'fixed',
                        width: '100%',
                        minWidth: Math.max(variantTableMinTotal, 320),
                      }}
                    >
                      <colgroup>
                        {variantPreviewColumns.map((col) => (
                          <col
                            key={col.id}
                            style={{
                              width: `${(col.minWidth / variantTableMinTotal) * 100}%`,
                            }}
                          />
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow hover sx={{ '&:hover': { bgcolor: 'grey.50' } }}>
                        <TableCell align="center" sx={{ py: 2 }}>
                          <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
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
                    type="button"
                    variant="body2"
                    fontWeight="600"
                    sx={{
                      color: '#1A56DB',
                      cursor: 'pointer',
                      border: 'none',
                      background: 'none',
                      '&:hover': { textDecoration: 'underline' },
                    }}
                    onClick={() => setSizeChartDialogOpen(true)}
                  >
                    Size Chart
                  </Typography>
                  <Dialog
                    open={sizeChartDialogOpen}
                    onClose={() => setSizeChartDialogOpen(false)}
                    fullScreen={sizeChartFullScreen}
                    maxWidth="md"
                    fullWidth
                    aria-labelledby="size-chart-dialog-title"
                    slotProps={{
                      paper: {
                        sx: sizeChartFullScreen
                          ? {
                              m: 0,
                              maxHeight: '100%',
                              height: '100%',
                              borderRadius: 0,
                              pt: 'env(safe-area-inset-top)',
                              pb: 'env(safe-area-inset-bottom)',
                            }
                          : undefined,
                      },
                    }}
                  >
                    <DialogTitle
                      id="size-chart-dialog-title"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1,
                        pr: 1,
                        flexShrink: 0,
                      }}
                    >
                      Size chart
                      <IconButton
                        type="button"
                        onClick={() => setSizeChartDialogOpen(false)}
                        aria-label="Close size chart"
                        size="large"
                        edge="end"
                      >
                        <CloseIcon />
                      </IconButton>
                    </DialogTitle>
                    <DialogContent
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                        overflow: 'auto',
                        pt: 1,
                        pb: 2,
                        minHeight: 0,
                      }}
                    >
                      {sizeChartUrl ? (
                        <Box
                          component="img"
                          src={sizeChartUrl}
                          alt="Size chart"
                          sx={{
                            maxWidth: '100%',
                            width: 'auto',
                            height: 'auto',
                            maxHeight: sizeChartFullScreen
                              ? 'calc(100vh - 140px - env(safe-area-inset-top) - env(safe-area-inset-bottom))'
                              : 'min(70vh, 520px)',
                            objectFit: 'contain',
                          }}
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                          Size Chart Unavailable
                        </Typography>
                      )}
                    </DialogContent>
                  </Dialog>
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
                      <Typography variant="body2" fontWeight="600" color="#1E40AF" sx={{ mb: 2, mt: 2 }}>
                        Additional Cost
                      </Typography>
                      {product?.OtherCost?.length > 0 ? (
                        <Stack spacing={3}>
                          {product.OtherCost.map((cost, i) => (
                            <Grid container spacing={2} key={i}>
                              {cost.AdCostApplicableOn != null && String(cost.AdCostApplicableOn).trim() !== '' && (
                                <Grid item xs={6} md={4}>
                                  <Typography variant="caption" color="text.secondary">Applicable on:</Typography>
                                  <Typography variant="body2" display="block">
                                    {cost.AdCostApplicableOn}
                                  </Typography>
                                </Grid>
                              )}
                              {cost.ReasonOfCost != null && String(cost.ReasonOfCost).trim() !== '' && (
                                <Grid item xs={6} md={4}>
                                  <Typography variant="caption" color="text.secondary">Reason:</Typography>
                                  <Typography variant="body2" display="block">
                                    {cost.ReasonOfCost}
                                  </Typography>
                                </Grid>
                              )}
                              {cost.AdCostHSN != null && String(cost.AdCostHSN).trim() !== '' && (
                                <Grid item xs={6} md={4}>
                                  <Typography variant="caption" color="text.secondary">HSN:</Typography>
                                  <Typography variant="body2" display="block">
                                    {cost.AdCostHSN}
                                  </Typography>
                                </Grid>
                              )}
                              {cost.AdCostGST != null && cost.AdCostGST !== '' && (
                                <Grid item xs={6} md={4}>
                                  <Typography variant="caption" color="text.secondary">GST:</Typography>
                                  <Typography variant="body2" display="block">
                                    {cost.AdCostGST}%
                                  </Typography>
                                </Grid>
                              )}
                              {cost.CostPrice != null && cost.CostPrice !== '' && (
                                <Grid item xs={6} md={4}>
                                  <Typography variant="caption" color="text.secondary">Cost:</Typography>
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 0.5,
                                      mt: 0.25,
                                    }}
                                  >
                                    <Typography variant="body2" component="span" fontWeight="medium">
                                      {formatPrice(cost.CostPrice)}
                                    </Typography>
                                    {cost.currencyType === 'BXITokens' ? (
                                      <Box component="img" src={BXITokenIcon} alt="BXI Token" sx={{ width: 16, height: 16 }} />
                                    ) : (
                                      <Typography variant="body2" component="span">
                                        ₹
                                      </Typography>
                                    )}
                                  </Box>
                                </Grid>
                              )}
                            </Grid>
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
                  const voucherTagsRaw = product?.ProductTags ?? product?.Tags;
                  const voucherTags = Array.isArray(voucherTagsRaw)
                    ? voucherTagsRaw
                    : voucherTagsRaw != null && String(voucherTagsRaw).trim()
                      ? [String(voucherTagsRaw).trim()]
                      : [];

                  const hasVoucherTechInfo =
                    inclusions ||
                    exclusions ||
                    termsAndConditions ||
                    redemptionSteps ||
                    redemptionType ||
                    redemptionUrl ||
                    voucherTags.length > 0;

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
                      {voucherTags.length > 0 && (
                        <Box>
                          <Typography variant="body2" fontWeight="600" color="#1E40AF" sx={{ mb: 1 }}>
                            Tags
                          </Typography>
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                            {voucherTags.map((tag, index) => (
                              <Chip key={index} label={String(tag)} size="small" />
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
                    {(ti?.WeightBeforePackingPerUnit || ti?.WeightAfterPackingPerUnit) && (
                      <Box>
                        <Typography variant="body2" fontWeight="600" color="#1E40AF" sx={{ mb: 1 }}>
                          Product weight
                        </Typography>
                        <Stack direction="row" spacing={2} alignItems="flex-start">
                          <Stack spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
                            {ti?.WeightBeforePackingPerUnit && (
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  Before packaging
                                </Typography>
                                <Typography fontWeight="500">
                                  {ti.WeightBeforePackingPerUnit}{' '}
                                  {product.WeightBeforePackingPerUnitMeasurUnit || product.UnitOfWeight || 'Kg'}
                                </Typography>
                              </Box>
                            )}
                            {ti?.WeightAfterPackingPerUnit &&  (
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  After packaging
                                </Typography>
                                <Typography fontWeight="500">
                                  {ti.WeightAfterPackingPerUnit}{' '}
                                  {product.WeightAfterPackingPerUnitMeasurUnit || product.UnitOfWeight || 'Kg'}
                                </Typography>
                              </Box>
                            )}
                          </Stack>
                        </Stack>
                      </Box>
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
                    {Array.isArray(ti?.Tags) && ti.Tags.length > 0 && (
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
                {Array.isArray(product?.ProductFeatures) && product.ProductFeatures.length > 0 ? (
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
