import {
  Box,
  Button,
  Chip,
  Grid,
  IconButton,
  Paper,
  Typography,
  Tab,
  Tabs,
} from '@mui/material';
import { Stack } from '@mui/system';
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { DataGrid } from '@mui/x-data-grid';
import BXITokenIcon from '../../assets/bxi-token.svg';
import api, { productApi, keyFeatureApi } from '../../utils/api';


const fontFamily =
  'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
const accent = '#C64091';
const pageBg = '#F4F5F7';
const borderSubtle = '#E8EAEF';
const textPrimary = '#111827';
const textMuted = '#64748B';
const surface = '#FFFFFF';
const surfaceMuted = '#F8F9FB';
const radiusMd = 12;
const radiusLg = 16;
const shadowCard = '0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 24px rgba(15, 23, 42, 0.06)';
const contentMaxWidth = 1180;

function CommaSeprator({ Price }) {
  const formatted = useMemo(() => {
    const n = Number(Price);
    if (Number.isNaN(n)) return '';
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  }, [Price]);
  return formatted;
}

function FeatureName({ name }) {
  const [iconUrl, setIconUrl] = useState(null);
  useEffect(() => {
    if (!name) return;
    keyFeatureApi
      .getByName(name)
      .then((res) => {
        const d = res?.data ?? res;
        setIconUrl(d?.URL ?? d?.url ?? null);
      })
      .catch(() => {});
  }, [name]);
  return (
    <Box
      sx={{
        width: 44,
        height: 44,
        borderRadius: 2,
        bgcolor: surfaceMuted,
        border: `1px solid ${borderSubtle}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <img
        alt=""
        src={iconUrl || BXITokenIcon}
        style={{ height: 28, width: 28, objectFit: 'contain' }}
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = BXITokenIcon;
        }}
      />
    </Box>
  );
}

function MultiplexImageCarousel({ ImageDataArray }) {
  const [idx, setIdx] = useState(0);
  const images = useMemo(
    () =>
      (Array.isArray(ImageDataArray) ? ImageDataArray : [])
        .map((x) => x?.url)
        .filter(Boolean),
    [ImageDataArray]
  );
  if (images.length === 0) return null;
  const safe = ((idx % images.length) + images.length) % images.length;
  const arrowBtn = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 1,
    border: 'none',
    background: surface,
    borderRadius: '10px',
    p: 0.85,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: textMuted,
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
    transition: 'color 0.15s, box-shadow 0.15s',
    '&:hover': {
      color: accent,
      boxShadow: '0 4px 12px rgba(15, 23, 42, 0.1)',
    },
  };
  return (
    <Box sx={{ width: '100%', maxWidth: 480, mx: 'auto' }}>
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          aspectRatio: '4 / 3',
          maxHeight: { xs: 280, sm: 360 },
          borderRadius: `${radiusMd}px`,
          bgcolor: surfaceMuted,
          border: `1px solid ${borderSubtle}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <Box
          component="button"
          type="button"
          aria-label="Previous image"
          sx={{ ...arrowBtn, left: 10 }}
          onClick={() => setIdx((i) => (i === 0 ? images.length - 1 : i - 1))}
        >
          <ChevronLeft size={22} strokeWidth={2} />
        </Box>
        <Box
          component="img"
          src={images[safe]}
          alt=""
          sx={{
            maxHeight: '100%',
            maxWidth: '82%',
            objectFit: 'contain',
            py: 2,
            px: 1,
          }}
        />
        <Box
          component="button"
          type="button"
          aria-label="Next image"
          sx={{ ...arrowBtn, right: 10 }}
          onClick={() => setIdx((i) => (i >= images.length - 1 ? 0 : i + 1))}
        >
          <ChevronRight size={22} strokeWidth={2} />
        </Box>
      </Box>
      {images.length > 1 && (
        <Stack
          direction="row"
          spacing={0.75}
          justifyContent="center"
          sx={{ mt: 1.5 }}
        >
          {images.map((_, i) => (
            <Box
              key={i}
              onClick={() => setIdx(i)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setIdx(i);
              }}
              role="button"
              tabIndex={0}
              sx={{
                width: i === safe ? 22 : 6,
                height: 6,
                borderRadius: 3,
                bgcolor: i === safe ? accent : borderSubtle,
                cursor: 'pointer',
                transition: 'width 0.2s, background-color 0.2s',
              }}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
}
function DiscountedPrice({
  regularPrice,
  discountPrice,
  GetProductByIdData,
  percentage,
}) {
  const reg = Number(regularPrice) || 0;
  const disc = Number(discountPrice) || 0;
  const pct = Number(percentage) || 0;
  if (!reg && !disc) return null;
  const discountPct = reg > 0 ? ((reg - disc) / reg) * 100 : 0;
  const gstPrice = (disc * pct) / 100;
  const variant = GetProductByIdData?.ProductsVariantions?.[0];

  return (
    <Stack spacing={1} sx={{ mt: 0.5 }}>
      <Stack direction="row" flexWrap="wrap" alignItems="center" gap={1.5}>
        {discountPct > 0 && (
          <Typography variant="body2" fontWeight={600} color="error.main">
            −{discountPct.toFixed(1)}%
          </Typography>
        )}
        <Stack direction="row" alignItems="center" gap={0.75}>
          <Typography variant="h6" fontWeight={700} sx={{ color: textPrimary }}>
            <CommaSeprator Price={disc} />
          </Typography>
          <Box
            component="img"
            src={BXITokenIcon}
            alt=""
            sx={{ width: 18, height: 18 }}
          />
        </Stack>
        {pct > 0 && (
          <Typography variant="body2" color="text.secondary">
            + <CommaSeprator Price={gstPrice} /> ₹{' '}
            <Box component="span" sx={{ fontSize: '0.75rem' }}>
              GST
            </Box>
          </Typography>
        )}
      </Stack>
      {reg > disc && reg > 0 && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textDecoration: 'line-through' }}
        >
          MRP <CommaSeprator Price={reg} />
        </Typography>
      )}
      {variant?.unit && (
        <Typography variant="caption" color="text.secondary">
          Per {variant.unit}
          {variant.Timeline ? ` · ${variant.Timeline}` : ''}
        </Typography>
      )}
      <Typography variant="caption" color="text.secondary">
        Prices shown; taxes as applicable
      </Typography>
    </Stack>
  );
}


export default function MultiplexMediaProductPreview() {
  const { id } = useParams();

  const navigate = useNavigate();
  const bulkuploadnavigate = localStorage.getItem('bulkuploadnavigate');

  const [TabValue, setTabValue] = React.useState('1');

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  const [GetProductByIdData, setGetProductByIdData] = useState();
  const [ProductFeatures, setProfuctFeatures] = useState([]);
  const [storeVariationData, setStoreVariationData] = useState();
  const [dataGridrows, setDataGridRows] = useState([]);

  const ImageDataArray = GetProductByIdData?.ProductImages;

  async function GetProductByid() {
    if (!id) return;
    try {
      const res = await productApi.getProductById(id);
      const data = res?.data?.body ?? res?.data ?? res;
      setGetProductByIdData(data);
      setStoreVariationData(data?.ProductsVariantions?.[0]?._id);
      setProfuctFeatures(data?.ProductFeatures);
    } catch {
      toast.error('Failed to load product');
    }
  }

  useEffect(() => {
    GetProductByid();
  }, [id]);

  const uploadProduct = () => {
    const confirm = window.confirm(
      'Are you sure you want to upload this product?',
    );
    if (confirm !== true) return;
    productApi
      .productMutation({ id, ProductUploadStatus: 'pendingapproval' })
      .then((res) => {
        const body = res?.data?.body ?? res?.data ?? res;
        toast.success('Once uploaded, changes are subject to approval.');
        if (body?.ProductUploadStatus === 'pendingapproval') {
          setTimeout(() => navigate('/sellerhub'), 1200);
        }
      })
      .catch((err) => {
        toast.error(
          err?.response?.data?.message || err?.message || 'Upload failed',
        );
      });
  };

  const getMutiplexScreensById = async () => {
    const key = GetProductByIdData?.MultiplexScreenId || id;
    if (!key) return;
    try {
      const response = await api.get(`product/MultiplexScreenGetById/${key}`);
      const screens = response.data?.data?.screens;
      if (!Array.isArray(screens)) {
        setDataGridRows([]);
        return;
      }
      const sortedByPrice = [...screens].sort(
        (a, b) => (a.DiscountedPrice || 0) - (b.DiscountedPrice || 0),
      );
      const screensWithId = sortedByPrice.map((screen, index) => ({
        id: screen._id?.toString?.() || `row-${index}`,
        ...screen,
      }));
      setDataGridRows(screensWithId);
    } catch {
      setDataGridRows([]);
    }
  };

  const columns = [
    { field: 'srNo', headerName: 'Sr No', width: 80 },
    { field: 'city', headerName: 'City', width: 130 },
    { field: 'location', headerName: 'Location', width: 200 },
    { field: 'cinema', headerName: 'Cinema', width: 200 },
    { field: 'audiNum', headerName: 'Audi #', width: 100 },
    { field: 'seatingCapacity', headerName: 'Seats', width: 120 },
    { field: 'screenCode', headerName: 'Screen Code', width: 150 },
    { field: 'casCodes', headerName: 'CAS Codes', width: 130 },
    { field: 'uploadCodes', headerName: 'Upload Codes', width: 130 },
    { field: 'PricePerUnit', headerName: 'Price', width: 100 },
    { field: 'DiscountedPrice', headerName: 'Discounted Price', width: 150 },
  ];

  useEffect(() => {
    if (GetProductByIdData?.MultiplexScreenId || id) {
      getMutiplexScreensById();
    }
  }, [GetProductByIdData?.MultiplexScreenId, id]);

  const handleBack = () => {
    if (bulkuploadnavigate) {
      navigate('/bulkuploadexcelpreview');
      localStorage.removeItem('bulkuploadnavigate');
    } else {
      navigate(-1);
    }
  };

  const uploadStatus = GetProductByIdData?.ProductUploadStatus || 'Draft';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: pageBg,
        pb: { xs: 5, md: 8 },
        px: { xs: 1.5, sm: 2.5, md: 3 },
        fontFamily,
      }}
    >
      <Box sx={{ maxWidth: contentMaxWidth, mx: 'auto' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1.25,
            py: { xs: 2, md: 2.5 },
            mb: { xs: 1, md: 0.5 },
          }}
        >
          {uploadStatus !== 'Approved' && (
            <IconButton
              onClick={handleBack}
              aria-label="Back"
              size="small"
              sx={{
                color: textMuted,
                bgcolor: surface,
                border: `1px solid ${borderSubtle}`,
                borderRadius: 2,
                mt: 0.25,
                '&:hover': { color: accent, bgcolor: surface, borderColor: accent },
              }}
            >
              <ArrowLeft size={20} />
            </IconButton>
          )}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h5"
              component="h1"
              sx={{
                color: textPrimary,
                fontWeight: 700,
                letterSpacing: '-0.03em',
                fontSize: { xs: '1.25rem', sm: '1.5rem' },
                lineHeight: 1.25,
              }}
            >
              Multiplex preview
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: textMuted, mt: 0.5, fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}
            >
              Review your listing before you submit for approval
            </Typography>
          </Box>
        </Box>

        <Paper
          elevation={0}
          sx={{
            mt: { xs: 1, md: 2 },
            borderRadius: `${radiusLg}px`,
            border: `1px solid ${borderSubtle}`,
            overflow: 'hidden',
            mb: 2,
            bgcolor: surface,
            boxShadow: shadowCard,
          }}
        >
          <Grid container>
            <Grid
              item
              xs={12}
              md={5}
              sx={{
                bgcolor: surfaceMuted,
                borderRight: { md: `1px solid ${borderSubtle}` },
                borderBottom: { xs: `1px solid ${borderSubtle}`, md: 'none' },
                p: { xs: 2.5, sm: 3, md: 3.5 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {!ImageDataArray?.length ? (
                <Box
                  sx={{
                    width: '100%',
                    maxWidth: 480,
                    aspectRatio: '4 / 3',
                    maxHeight: 280,
                    borderRadius: `${radiusMd}px`,
                    border: `1px dashed ${borderSubtle}`,
                    bgcolor: surface,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                    px: 2,
                  }}
                >
                  <Typography sx={{ color: textMuted, fontWeight: 500, fontSize: '0.9rem' }}>
                    No images yet
                  </Typography>
                  <Typography sx={{ color: textMuted, fontSize: '0.75rem', textAlign: 'center' }}>
                    Add images on the Go Live step to show them here
                  </Typography>
                </Box>
              ) : (
                <MultiplexImageCarousel ImageDataArray={ImageDataArray} />
              )}
            </Grid>
            <Grid item xs={12} md={7} sx={{ p: { xs: 2.5, sm: 3, md: 3.5 } }}>
              <Chip
                label={uploadStatus}
                size="small"
                sx={{
                  mb: 2,
                  height: 26,
                  textTransform: 'capitalize',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  borderRadius: '8px',
                  ...(uploadStatus === 'Approved'
                    ? { bgcolor: '#DCFCE7', color: '#166534', border: 'none' }
                    : uploadStatus === 'pendingapproval'
                      ? { bgcolor: '#DBEAFE', color: '#1D4ED8', border: 'none' }
                      : { bgcolor: '#FEF3C7', color: '#B45309', border: 'none' }),
                }}
              />
              <Typography
                variant="h5"
                component="h2"
                sx={{
                  color: textPrimary,
                  fontWeight: 700,
                  mb: 1,
                  lineHeight: 1.3,
                  fontSize: { xs: '1.15rem', sm: '1.35rem', md: '1.5rem' },
                }}
              >
                {GetProductByIdData?.ProductName || '—'}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: textMuted,
                  mb: 2.5,
                  lineHeight: 1.55,
                  fontSize: '0.875rem',
                }}
              >
                {GetProductByIdData?.ProductSubtitle ||
                  [
                    GetProductByIdData?.ProductCategoryName,
                    GetProductByIdData?.ProductSubCategoryName,
                  ]
                    .filter(Boolean)
                    .join(' · ') ||
                  'Media · Multiplex'}
              </Typography>
              <DiscountedPrice
                regularPrice={
                  GetProductByIdData?.ProductsVariantions?.at(0)?.PricePerUnit
                }
                discountPrice={
                  GetProductByIdData?.ProductsVariantions?.at(0)?.DiscountedPrice
                }
                percentage={
                  GetProductByIdData?.ProductsVariantions?.at(0)?.GST
                }
                GetProductByIdData={GetProductByIdData}
              />
            </Grid>
          </Grid>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            borderRadius: `${radiusLg}px`,
            border: `1px solid ${borderSubtle}`,
            overflow: 'hidden',
            bgcolor: surface,
            boxShadow: shadowCard,
          }}
        >
          <Box
            sx={{
              px: { xs: 1, sm: 2 },
              pt: { xs: 1, sm: 1.5 },
              pb: 0,
              bgcolor: surfaceMuted,
              borderBottom: `1px solid ${borderSubtle}`,
            }}
          >
            <Tabs
              value={TabValue}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              aria-label="Product preview tabs"
              sx={{
                minHeight: 44,
                '& .MuiTabs-flexContainer': { gap: { xs: 0.5, sm: 1 } },
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                  minHeight: 44,
                  px: { xs: 1.25, sm: 2 },
                  py: 1,
                  color: textMuted,
                  borderRadius: '10px 10px 0 0',
                  minWidth: 'unset',
                  '&.Mui-selected': {
                    color: `${textPrimary} !important`,
                    bgcolor: surface,
                  },
                },
                '& .MuiTabs-indicator': {
                  display: 'none',
                },
              }}
            >
              <Tab label="Description" value="1" disableRipple />
              <Tab label="Product info" value="2" disableRipple />
              <Tab label="Technical" value="3" disableRipple />
              <Tab label="Features" value="4" disableRipple />
            </Tabs>
          </Box>

            {TabValue === '1' && (
            <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
              <Grid container>
                <Grid item xl={12} lg={12} md={12} sm={12} xs={12}>
                  <Box>
                    <Typography sx={TypographyTitleText}>
                      {GetProductByIdData?.ProductSubtitle}
                    </Typography>
                    <Typography sx={DescriptionAnswerText}>
                      {GetProductByIdData?.ProductDescription}
                    </Typography>

                    <Typography sx={{ ...semi, color: textPrimary }}>
                      Product Information
                    </Typography>
                    <Box
                      sx={{
                        width: '100%',
                        mx: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        flexDirection: 'row',
                        gap: '5px',
                      }}
                    >
                      <DiscountedPrice
                        regularPrice={
                          GetProductByIdData?.ProductsVariantions?.at(0)
                            ?.PricePerUnit
                        }
                        discountPrice={
                          GetProductByIdData?.ProductsVariantions?.at(0)
                            ?.DiscountedPrice
                        }
                        percentage={
                          GetProductByIdData?.ProductsVariantions?.at(0)?.GST
                        }
                        GetProductByIdData={GetProductByIdData}
                      />
                    </Box>

                    <Box
                      mt={4}
                      sx={{
                        width: '100%',
                        mx: 'auto',
                      }}
                    >
                      <Grid container sx={{ width: { xs: '100%', md: '95%', lg: '90%' } }}>
                        {GetProductByIdData?.medianame ? (
                          <Grid item xl={2} lg={2} md={3} sm={6} xs={12}>
                            <Typography sx={tableHeader}>Brand Name</Typography>
                            <Typography
                              sx={{ ...fetchValue, wordBreak: 'break-all' }}
                            >
                              {GetProductByIdData?.medianame}
                            </Typography>
                          </Grid>
                        ) : null}
                        {GetProductByIdData?.multiplexScreenName ? (
                          <Grid item xl={2} lg={2} md={3} sm={6} xs={12}>
                            <Typography sx={tableHeader}>Name</Typography>
                            <Typography sx={fetchValue}>
                              {GetProductByIdData?.multiplexScreenName}
                            </Typography>
                          </Grid>
                        ) : null}

                        <Box
                          sx={{
                            width: '100%',
                            mt: 2,
                            borderRadius: `${radiusMd}px`,
                            border: `1px solid ${borderSubtle}`,
                            overflow: 'hidden',
                            bgcolor: surface,
                            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
                          }}
                        >
                          <DataGrid
                            rows={dataGridrows}
                            columns={columns}
                            disableSelectionOnClick
                            hideFooterSelectedRowCount
                            disableColumnMenu
                            autoHeight
                            columnHeaderHeight={40}
                            rowHeight={44}
                            sx={{
                              border: 'none',
                              fontSize: '0.8125rem',
                              '& .MuiDataGrid-columnHeaders': {
                                fontSize: '0.6875rem',
                                fontWeight: 700,
                                letterSpacing: '0.04em',
                                textTransform: 'uppercase',
                                color: textMuted,
                                bgcolor: surfaceMuted,
                                borderBottom: `1px solid ${borderSubtle}`,
                              },
                              '& .MuiDataGrid-columnSeparator': { display: 'none' },
                              '& .MuiDataGrid-cell': {
                                fontSize: '0.8125rem',
                                color: textPrimary,
                                borderColor: borderSubtle,
                              },
                              '& .MuiDataGrid-row:hover': {
                                bgcolor: 'rgba(198, 64, 145, 0.03)',
                              },
                              '& .MuiDataGrid-footerContainer': {
                                borderTop: `1px solid ${borderSubtle}`,
                                bgcolor: surfaceMuted,
                                minHeight: 48,
                              },
                              '& .MuiTablePagination-root': { color: textMuted },
                            }}
                          />
                        </Box>
                        <Grid item xl={2} lg={2} md={3} sm={6} xs={12}>
                          {GetProductByIdData?.offerningbrandat ? (
                            <>
                              <Typography sx={tableHeader}>
                                {' '}
                                Offering At
                              </Typography>
                              <Typography
                                sx={{ ...fetchValue, wordBreak: 'break-all' }}
                              >
                                {GetProductByIdData?.offerningbrandat}
                              </Typography>
                            </>
                          ) : (
                            <>
                              <Typography sx={tableHeader}>
                                {' '}
                                Position of the Ad ?
                              </Typography>
                              <Typography
                                sx={{
                                  ...fetchValue,
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {GetProductByIdData?.adPosition}
                              </Typography>
                            </>
                          )}
                        </Grid>
                      </Grid>
                      <Grid container sx={{ mt: 4, width: { xs: '100%', md: '95%', lg: '90%' } }}>
                        {GetProductByIdData?.ProductsVariantions.at(0)
                          ?.location ? (
                            <Grid item xl={2} lg={2} md={3} sm={6} xs={12}>
                              <Typography sx={tableHeader}>Ad Type</Typography>
                              <Typography sx={fetchValue}>
                                {GetProductByIdData?.ProductsVariantions.at(0)
                                  ?.location ||
                                GetProductByIdData?.ProductsVariantions.at(0)
                                  ?.adType}
                              </Typography>
                            </Grid>
                          ) : null}
                        {GetProductByIdData?.ProductsVariantions.at(0)?.Type ? (
                          <Grid item xl={2} lg={2} md={3} sm={6} xs={12}>
                            <Typography sx={tableHeader}>Type</Typography>
                            <Typography sx={fetchValue}>
                              {
                                GetProductByIdData?.ProductsVariantions.at(0)
                                  ?.Type
                              }
                            </Typography>
                          </Grid>
                        ) : null}

                        {GetProductByIdData?.ProductsVariantions.at(0)
                          ?.repetition ? (
                            <Grid item xl={2} lg={2} md={3} sm={6} xs={12}>
                              <>
                                <Typography sx={tableHeader}>
                                  {' '}
                                Repetition
                                </Typography>
                                <Typography sx={fetchValue}>
                                  {
                                    GetProductByIdData?.ProductsVariantions.at(0)
                                      ?.repetition
                                  }
                                </Typography>
                              </>
                            </Grid>
                          ) : null}
                        <Grid item xl={2} lg={2} md={3} sm={6} xs={12}>
                          <Typography sx={tableHeader}>
                            Dimension Size
                          </Typography>
                          <Typography sx={fetchValue}>
                            {
                              GetProductByIdData?.ProductsVariantions.at(0)
                                ?.dimensionSize
                            }
                          </Typography>
                        </Grid>
                        <Grid item xl={2} lg={2} md={3} sm={6} xs={12}>
                          <Typography sx={tableHeader}>GST</Typography>
                          <Typography sx={fetchValue}>
                            {GetProductByIdData?.mediaVariation?.GST} %
                          </Typography>
                        </Grid>
                      </Grid>
                      <Grid container sx={{ mt: 4, width: { xs: '100%', md: '95%', lg: '90%' } }}>
                        <Grid item xl={4} lg={4} md={6} sm={12} xs={12}>
                          <Typography sx={tableHeader}>
                            {' '}
                            Min - Max Order Quantity Timeline
                          </Typography>
                          <Typography sx={fetchValue}>
                            {GetProductByIdData?.ProductsVariantions.at(0)
                              ?.minOrderQuantitytimeline
                              ? `${GetProductByIdData?.ProductsVariantions.at(0)
                                ?.minOrderQuantitytimeline
                              } - ${GetProductByIdData?.ProductsVariantions?.at(0)
                                ?.maxOrderQuantitytimeline
                              }`
                              : 'N/A'}{' '}
                            {''} /{' '}
                            {
                              GetProductByIdData?.ProductsVariantions.at(0)
                                ?.Timeline
                            }
                          </Typography>
                        </Grid>
                        

                        {GetProductByIdData?.ProductsVariantions?.at(0)
                          ?.minTimeslotSeconds ? (
                            <Grid item xl={4} lg={4} md={6} sm={12} xs={12}>
                              <Typography sx={tableHeader}>
                                {' '}
                              Min - Max Timeslot
                              </Typography>
                              <Typography sx={fetchValue}>
                                {
                                  GetProductByIdData?.ProductsVariantions.at(0)
                                    ?.minTimeslotSeconds
                                }{' '}
                              -
                                {
                                  GetProductByIdData?.ProductsVariantions?.at(0)
                                    ?.maxTimeslotSeconds
                                }
                              / Seconds {''}{' '}
                              </Typography>
                            </Grid>
                          ) : null}
                        {GetProductByIdData?.ProductsVariantions?.at(0)
                          ?.seatingCapacity ? (
                            <Grid item xl={4} lg={4} md={6} sm={12} xs={12}>
                              <Typography sx={tableHeader}>
                                {' '}
                              Seating Capacity
                              </Typography>
                              <Typography sx={fetchValue}>
                                {
                                  GetProductByIdData?.ProductsVariantions?.at(0)
                                    ?.seatingCapacity
                                }
                              </Typography>
                            </Grid>
                          ) : null}
                      </Grid>
                      <Grid container sx={{ mt: 5, width: { xs: '100%', md: '95%', lg: '90%' } }}>
                        <Grid item xl={2.4} lg={2.4} md={4} sm={6} xs={12}>
                          <Typography sx={tableHeader}>Region</Typography>
                          <Typography sx={fetchValue}>
                            {GetProductByIdData?.GeographicalData?.region}
                          </Typography>
                        </Grid>
                        {GetProductByIdData?.GeographicalData?.state ===
                          undefined ||
                          GetProductByIdData?.GeographicalData?.state === null ||
                          GetProductByIdData?.GeographicalData?.state ===
                          '' ? null : (
                            <Grid
                              item
                              xl={2.4}
                              lg={2.4}
                              md={4}
                              sm={6}
                              xs={12}
                            >
                              <Typography sx={tableHeader}> State</Typography>
                              <Typography sx={fetchValue}>
                                {GetProductByIdData?.GeographicalData?.state}
                              </Typography>
                            </Grid>
                          )}
                        {GetProductByIdData?.GeographicalData?.city ===
                          undefined ||
                          GetProductByIdData?.GeographicalData?.city === null ||
                          GetProductByIdData?.GeographicalData?.city ===
                          '' ? null : (
                            <Grid
                              item
                              xl={2.4}
                              lg={2.4}
                              md={4}
                              sm={6}
                              xs={12}
                            >
                              <Typography sx={tableHeader}>City</Typography>
                              <Typography sx={fetchValue}>
                                {GetProductByIdData?.GeographicalData?.city}
                              </Typography>
                            </Grid>
                          )}
                        {GetProductByIdData?.GeographicalData?.landmark ===
                          undefined ||
                          GetProductByIdData?.GeographicalData?.landmark ===
                          null ||
                          GetProductByIdData?.GeographicalData?.landmark ===
                          '' ? null : (
                            <Grid
                              item
                              xl={2.4}
                              lg={2.4}
                              md={4}
                              sm={6}
                              xs={12}
                            >
                              <Typography sx={tableHeader}> Landmark</Typography>
                              <Typography sx={fetchValue}>
                                {GetProductByIdData?.GeographicalData?.landmark}
                              </Typography>
                            </Grid>
                          )}
                      </Grid>
                    </Box>

                    {GetProductByIdData?.OtherCost &&
                      GetProductByIdData?.OtherCost?.length !== 0 ? (
                        <Box mt={2}>
                          <Typography
                            sx={{
                              ...product,
                              fontWeight: 600,
                              fontSize: '18px',
                              lineHeight: '30px',
                            }}
                          >
                          Additional Cost
                          </Typography>
                          {GetProductByIdData?.OtherCost?.length === 0
                            ? ''
                            : GetProductByIdData?.OtherCost?.map((cost) => {
                              const newValue = cost?.CostPrice.toFixed(2);
                              return (
                                <>
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      gap: '60px',
                                      mt: 1,
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        minWidth: '160px',
                                      }}
                                    >
                                      <Typography
                                        sx={{
                                          ...fetchValue,
                                        }}
                                      >
                                        {' '}
                                        {cost?.ReasonOfCost}{' '}
                                      </Typography>
                                    </Box>
                                    <Box
                                      sx={{
                                        minWidth: '160px',
                                      }}
                                    >
                                      <Typography
                                        sx={{
                                          ...fetchValue,
                                        }}
                                      >
                                      HSN - {cost?.AdCostHSN}{' '}
                                      </Typography>
                                    </Box>
                                    <Box
                                      sx={{
                                        minWidth: '160px',
                                      }}
                                    >
                                      <Typography
                                        sx={{
                                          ...fetchValue,
                                        }}
                                      >
                                      GST - {cost?.AdCostGST} %
                                      </Typography>
                                    </Box>
                                    <Box
                                      sx={{
                                        minWidth: '160px',
                                      }}
                                    >
                                      <Typography
                                        sx={{
                                          ...fetchValue,
                                        }}
                                      >
                                        {cost?.AdCostApplicableOn === 'All'
                                          ? 'One Time Cost'
                                          : 'Per Unit'}
                                      </Typography>
                                    </Box>
                                    <Box
                                      sx={{
                                        gap: '5px',
                                        minWidth: '160px',
                                        display: 'flex',
                                      }}
                                    >
                                      <Typography
                                        sx={{
                                          ...fetchValue,
                                        }}
                                      >
                                        {newValue}
                                      </Typography>
                                      <Typography>
                                        {cost.currencyType === 'BXITokens' ? (
                                          <Box
                                            component="img"
                                            src={BXITokenIcon}
                                            alt="token"
                                            sx={{
                                              height: 'auto',
                                              width: '15px',
                                              marginTop: '6px',
                                            }}
                                          />
                                        ) : (
                                          <Typography
                                            sx={{
                                              fontSize: '20px',
                                              ml: 1,
                                            }}
                                          >
                                          ₹
                                          </Typography>
                                        )}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </>
                              );
                            })}
                        </Box>
                      ) : null}

                    {GetProductByIdData?.OtherInformationBuyerMustKnowOrRemarks
                      .length === 0 ? null : (
                        <>
                          <Box sx={{ mt: 3 }}>
                            <Typography sx={cost}>Remarks </Typography>
                            <Box
                              sx={{
                                display: 'flex',
                                width: '95%',
                                gap: '10px',
                                mt: 1,
                              }}
                            >
                              {GetProductByIdData?.OtherInformationBuyerMustKnowOrRemarks.map(
                                (item, id) => {
                                  return (
                                    <>
                                      <Typography sx={{ ...otherCostText, width:'80vw', wordWrap:'break-word' }}>
                                        {id + 1}) {item},{' '}
                                      </Typography>
                                    </>
                                  );
                                },
                              )}
                            </Box>
                          </Box>
                        </>
                      )}

                    <Box mt={4}>
                      <Typography sx={{ ...pack, color: textPrimary }}>
                        Technical Information
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px',
                        }}
                      >
                        <Typography sx={inclusiveheader}>
                          Supporting you would give to buyer
                        </Typography>
                        {GetProductByIdData?.WhatSupportingYouWouldGiveToBuyer
                          ? Object?.keys(
                            GetProductByIdData?.WhatSupportingYouWouldGiveToBuyer,
                          ).map((el, idx) => {
                            if (
                              GetProductByIdData
                                ?.WhatSupportingYouWouldGiveToBuyer[el] ===
                              'on'
                            ) {
                              return (
                                <>
                                  <Typography
                                    sx={{
                                      ...packHead,
                                      color: '#6B7A99',
                                      fontWeight: 400,
                                      fontSize: '16px',
                                      display: 'flex',
                                      gap: '10px',
                                    }}
                                  >
                                    {el === 'ExhibitionCertificate'
                                      ? 'Exhibition Certificate'
                                      : el}
                                  </Typography>
                                </>
                              );
                            } else {
                              return null;
                            }
                          })
                          : null}{' '}
                      </Box>

                      <Box>
                        <Typography sx={inclusiveheader}>
                          Dimensions of Ad / Content Needed
                        </Typography>
                        <Box>
                          <Typography sx={dots}>
                            {GetProductByIdData?.Dimensions}
                          </Typography>
                        </Box>
                      </Box>

                      <Box>
                        <Typography sx={inclusiveheader}>
                          Content Upload Link
                        </Typography>
                        <Box>
                          <a
                            style={{
                              fontFamily: fontFamily,
                              fontStyle: 'normal',
                              fontWeight: 400,
                              fontSize: '16px',
                              color: '#445FD2',
                            }}
                          >
                            {GetProductByIdData?.UploadLink}
                          </a>
                          <br />
                        </Box>
                      </Box>

                      {/* Calendar display removed - calendar module no longer used */}
                    </Box>

                    <Box mt={4}>
                      <Typography sx={{ ...pack, color: textPrimary }}>
                        Key Features
                      </Typography>
                      <Box
                        sx={{
                          width: '100%',
                          display: 'flex',
                          flexDirection: 'row',
                        }}
                      >
                        <Grid
                          container
                          mt={0.5}
                          sx={{
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'flex-start',
                            width: '100%',
                          }}
                        >
                          {ProductFeatures?.map((res, featIdx) => {
                            return (
                              <Grid
                                item
                                key={res?._id != null ? String(res._id) : `feature-${featIdx}-${res?.name ?? ''}`}
                                xl={3}
                                lg={3}
                                md={4}
                                sm={6}
                                xs={6}
                              >
                                <Box
                                  sx={{
                                    // px: 2,
                                    display: 'flex',
                                    // flexWrap: "wrap",
                                    textAlign: 'start',
                                    flexDirection: 'row',
                                    gap: { xs: '12px', sm: '24px', md: '48px', lg: '72px' },
                                    mt: 1.5,
                                  }}
                                >
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      justifyContent: 'flex-start',
                                      gap: '20px',
                                      width: '100%',
                                    }}
                                  >
                                    {/* <Box
                                        component="img"
                                        src={bxifeature}
                                        sx={{ height: "80px", width: "30px" }}
                                      /> */}
                                    <FeatureName name={res?.name} />
                                    <Box
                                      sx={{
                                        width: '80%',
                                        maxWidth: '825px',
                                        height: 'auto',
                                        wordWrap: 'break-word',
                                      }}
                                    >
                                      <Typography sx={packHead}>
                                        {res.name}
                                      </Typography>
                                      <Typography
                                        sx={{
                                          ...packVal,
                                          fontSize: { xs: '0.9375rem', sm: '1rem' },
                                        }}
                                      >
                                        {res.description}{' '}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Box>
                              </Grid>
                            );
                          })}
                        </Grid>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              </Grid>{' '}
            </Box>
            )}
            {TabValue === '2' && (
            <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
              {/* Price & Availability */}
              <Grid container>
                <Grid item xl={12} lg={12} md={12} sm={12} xs={12}>
                  <Typography sx={{ ...semi, color: textPrimary }}>
                    {/* {GetProductByIdData?.ProductName} */}
                    Product Information
                  </Typography>
                  <Box
                    sx={{
                      width: '100%',
                      mx: 'auto',
                      display: 'flex',
                      alignItems: 'center',
                      flexDirection: 'row',
                      gap: '5px',
                    }}
                  >
                    <DiscountedPrice
                      regularPrice={
                        GetProductByIdData?.ProductsVariantions?.at(0)
                          ?.PricePerUnit
                      }
                      discountPrice={
                        GetProductByIdData?.ProductsVariantions?.at(0)
                          ?.DiscountedPrice
                      }
                      percentage={
                        GetProductByIdData?.ProductsVariantions?.at(0)?.GST
                      }
                      GetProductByIdData={GetProductByIdData}
                    // regularPrice={10000}
                    // discountPrice={5000}
                    />
                  </Box>

                  <Box
                    mt={4}
                    sx={{
                      width: '100%',
                      mx: 'auto',
                    }}
                  >
                    <Grid container sx={{ width: { xs: '100%', md: '95%', lg: '90%' } }}>
                      {GetProductByIdData?.medianame ? (
                        <Grid item xl={2} lg={2} md={3} sm={6} xs={12}>
                          <Typography sx={tableHeader}>Brand Name</Typography>
                          <Typography
                            sx={{ ...fetchValue, wordBreak: 'break-all' }}
                          >
                            {GetProductByIdData?.medianame}
                          </Typography>
                        </Grid>
                      ) : null}
                      {GetProductByIdData?.multiplexScreenName ? (
                        <Grid item xl={2} lg={2} md={3} sm={6} xs={12}>
                          <Typography sx={tableHeader}>
                            Multiplex Name
                          </Typography>
                          <Typography sx={fetchValue}>
                            {GetProductByIdData?.multiplexScreenName}
                          </Typography>
                        </Grid>
                      ) : null}
                      <Grid item xl={2} lg={2} md={3} sm={6} xs={12}>
                        {GetProductByIdData?.offerningbrandat ? (
                          <>
                            <Typography sx={tableHeader}>
                              {' '}
                              Offering At
                            </Typography>
                            <Typography
                              sx={{ ...fetchValue, wordBreak: 'break-all' }}
                            >
                              {GetProductByIdData?.offerningbrandat}
                            </Typography>
                          </>
                        ) : (
                          <>
                            <Typography sx={tableHeader}>
                              {' '}
                              Position of the Ad ?
                            </Typography>
                            <Typography
                              sx={{
                                ...fetchValue,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {GetProductByIdData?.adPosition}
                            </Typography>
                          </>
                        )}
                      </Grid>
                    </Grid>
                    <Grid container sx={{ mt: 4, width: { xs: '100%', md: '95%', lg: '90%' } }}>
                      {GetProductByIdData?.ProductsVariantions.at(0)
                        ?.location ? (
                          <Grid item xl={2} lg={2} md={3} sm={6} xs={12}>
                            <Typography sx={tableHeader}>Ad Type</Typography>
                            <Typography sx={fetchValue}>
                              {GetProductByIdData?.ProductsVariantions.at(0)
                                ?.location ||
                              GetProductByIdData?.ProductsVariantions.at(0)
                                ?.adType}
                            </Typography>
                          </Grid>
                        ) : null}
                      {GetProductByIdData?.ProductsVariantions.at(0)?.Type ? (
                        <Grid item xl={2} lg={2} md={3} sm={6} xs={12}>
                          <Typography sx={tableHeader}>Type</Typography>
                          <Typography sx={fetchValue}>
                            {
                              GetProductByIdData?.ProductsVariantions.at(0)
                                ?.Type
                            }
                          </Typography>
                        </Grid>
                      ) : null}
                      <Grid item xl={2} lg={2} md={3} sm={6} xs={12}>
                        {GetProductByIdData?.ProductsVariantions.at(0)?.unit ? (
                          <>
                            <Typography sx={tableHeader}>Unit</Typography>
                            <Typography sx={fetchValue}>
                              Per{' '}
                              {
                                GetProductByIdData?.ProductsVariantions.at(0)
                                  ?.unit
                              }
                            </Typography>
                          </>
                        ) : (
                          <>
                            <Typography sx={tableHeader}>
                              Release Details
                            </Typography>
                            <Typography sx={fetchValue}>
                              {
                                GetProductByIdData?.ProductsVariantions.at(0)
                                  ?.releasedetails
                              }
                            </Typography>
                          </>
                        )}
                      </Grid>
                      <Grid item xl={2} lg={2} md={3} sm={6} xs={12}>
                        {GetProductByIdData?.ProductsVariantions.at(0)
                          ?.Timeline ? (
                            <>
                              <Typography sx={tableHeader}> Timeline</Typography>
                              <Typography sx={fetchValue}>
                              Per{' '}
                                {
                                  GetProductByIdData?.ProductsVariantions.at(0)
                                    ?.Timeline
                                }
                              </Typography>
                            </>
                          ) : (
                            <>
                              <Typography sx={tableHeader}> Edition</Typography>
                              <Typography sx={fetchValue}>
                                {
                                  GetProductByIdData?.ProductsVariantions.at(0)
                                    ?.edition
                                }
                              </Typography>
                            </>
                          )}
                      </Grid>
                      {GetProductByIdData?.ProductsVariantions.at(0)
                        ?.repetition ? (
                          <Grid item xl={2} lg={2} md={3} sm={6} xs={12}>
                            <>
                              <Typography sx={tableHeader}>
                                {' '}
                              Repetition
                              </Typography>
                              <Typography sx={fetchValue}>
                                {
                                  GetProductByIdData?.ProductsVariantions.at(0)
                                    ?.repetition
                                }
                              </Typography>
                            </>
                          </Grid>
                        ) : null}
                      <Grid item xl={2} lg={2} md={3} sm={6} xs={12}>
                        <Typography sx={tableHeader}>Dimension Size</Typography>
                        <Typography sx={fetchValue}>
                          {
                            GetProductByIdData?.ProductsVariantions.at(0)
                              ?.dimensionSize
                          }
                        </Typography>
                      </Grid>
                      <Grid item xl={2} lg={2} md={3} sm={6} xs={12}>
                        <Typography sx={tableHeader}>GST</Typography>
                        <Typography sx={fetchValue}>
                          {GetProductByIdData?.ProductsVariantions.at(0)?.GST} %
                        </Typography>
                      </Grid>
                    </Grid>
                    <Grid container sx={{ mt: 4, width: { xs: '100%', md: '95%', lg: '90%' } }}>
                      <Grid item xl={4} lg={4} md={6} sm={12} xs={12}>
                        <Typography sx={tableHeader}>
                          {' '}
                          Min - Max Order Quantity Timeline
                        </Typography>
                        <Typography sx={fetchValue}>
                          {GetProductByIdData?.ProductsVariantions.at(0)
                            ?.minOrderQuantitytimeline
                            ? `${GetProductByIdData?.ProductsVariantions.at(0)
                              ?.minOrderQuantitytimeline
                            } - ${GetProductByIdData?.ProductsVariantions?.at(0)
                              ?.maxOrderQuantitytimeline
                            }`
                            : 'N/A'}{' '}
                          {''} /{' '}
                          {
                            GetProductByIdData?.ProductsVariantions.at(0)
                              ?.Timeline
                          }
                        </Typography>
                      </Grid>

                      {GetProductByIdData?.ProductSubCategory ===
                        '643cda0c53068696706e3951' ? null : (
                          <Grid item xl={4} lg={4} md={6} sm={12} xs={12}>
                            <Typography sx={tableHeader}>
                              {' '}
                            Min - Max Order Quantity Unit
                            </Typography>
                            <Typography sx={fetchValue}>
                              {
                                GetProductByIdData?.ProductsVariantions.at(0)
                                  ?.minOrderQuantityunit
                              }{' '}
                            -
                              {
                                GetProductByIdData?.ProductsVariantions?.at(0)
                                  ?.maxOrderQuantityunit
                              }
                            /{' '}
                              {
                                GetProductByIdData?.ProductsVariantions.at(0)
                                  ?.unit
                              }
                            </Typography>
                          </Grid>
                        )}

                      {GetProductByIdData?.ProductsVariantions?.at(0)
                        ?.minTimeslotSeconds ? (
                          <Grid item xl={4} lg={4} md={6} sm={12} xs={12}>
                            <Typography sx={tableHeader}>
                              {' '}
                            Min - Max Timeslot
                            </Typography>
                            <Typography sx={fetchValue}>
                              {
                                GetProductByIdData?.ProductsVariantions.at(0)
                                  ?.minTimeslotSeconds
                              }{' '}
                            -
                              {
                                GetProductByIdData?.ProductsVariantions?.at(0)
                                  ?.maxTimeslotSeconds
                              }
                            / Seconds {''}{' '}
                            </Typography>
                          </Grid>
                        ) : null}
                      {GetProductByIdData?.ProductsVariantions?.at(0)
                        ?.seatingCapacity ? (
                          <Grid item xl={4} lg={4} md={6} sm={12} xs={12}>
                            <Typography sx={tableHeader}>
                              {' '}
                            Seating Capacity
                            </Typography>
                            <Typography sx={fetchValue}>
                              {
                                GetProductByIdData?.ProductsVariantions?.at(0)
                                  ?.seatingCapacity
                              }
                            </Typography>
                          </Grid>
                        ) : null}
                    </Grid>
                    <Grid container sx={{ mt: 5, width: { xs: '100%', md: '95%', lg: '90%' } }}>
                      <Grid item xl={2.4} lg={2.4} md={4} sm={6} xs={12}>
                        <Typography sx={tableHeader}>Region</Typography>
                        <Typography sx={fetchValue}>
                          {GetProductByIdData?.GeographicalData?.region}
                        </Typography>
                      </Grid>
                      {GetProductByIdData?.GeographicalData?.state ===
                        undefined ||
                        GetProductByIdData?.GeographicalData?.state === null ||
                        GetProductByIdData?.GeographicalData?.state ===
                        '' ? null : (
                          <Grid item xl={2.4} lg={2.4} md={4} sm={6} xs={12}>
                            <Typography sx={tableHeader}> State</Typography>
                            <Typography sx={fetchValue}>
                              {GetProductByIdData?.GeographicalData?.state}
                            </Typography>
                          </Grid>
                        )}
                      {GetProductByIdData?.GeographicalData?.city ===
                        undefined ||
                        GetProductByIdData?.GeographicalData?.city === null ||
                        GetProductByIdData?.GeographicalData?.city ===
                        '' ? null : (
                          <Grid item xl={2.4} lg={2.4} md={4} sm={6} xs={12}>
                            <Typography sx={tableHeader}>City</Typography>
                            <Typography sx={fetchValue}>
                              {GetProductByIdData?.GeographicalData?.city}
                            </Typography>
                          </Grid>
                        )}
                      {GetProductByIdData?.GeographicalData?.landmark ===
                        undefined ||
                        GetProductByIdData?.GeographicalData?.landmark === null ||
                        GetProductByIdData?.GeographicalData?.landmark ===
                        '' ? null : (
                          <Grid item xl={2.4} lg={2.4} md={4} sm={6} xs={12}>
                            <Typography sx={tableHeader}> Landmark</Typography>
                            <Typography sx={fetchValue}>
                              {GetProductByIdData?.GeographicalData?.landmark}
                            </Typography>
                          </Grid>
                        )}
                    </Grid>
                  </Box>

                  {GetProductByIdData?.OtherCost &&
                    GetProductByIdData?.OtherCost?.length !== 0 ? (
                      <Box mt={2}>
                        <Typography
                          sx={{
                            ...product,
                            fontWeight: 600,
                            fontSize: '18px',
                            lineHeight: '30px',
                          }}
                        >
                        Additional Cost
                        </Typography>
                        {GetProductByIdData?.OtherCost?.length === 0
                          ? ''
                          : GetProductByIdData?.OtherCost?.map((cost) => {
                            const newValue = cost?.CostPrice.toFixed(2);
                            return (
                              <>
                                <Box
                                  sx={{
                                    display: 'flex',
                                    gap: '60px',
                                    mt: 1,
                                  }}
                                >
                                  <Box
                                    sx={{
                                      minWidth: '160px',
                                    }}
                                  >
                                    <Typography
                                      sx={{
                                        ...fetchValue,
                                      }}
                                    >
                                      {' '}
                                      {cost?.ReasonOfCost}{' '}
                                    </Typography>
                                  </Box>
                                  <Box
                                    sx={{
                                      minWidth: '160px',
                                    }}
                                  >
                                    <Typography
                                      sx={{
                                        ...fetchValue,
                                      }}
                                    >
                                    HSN - {cost?.AdCostHSN}{' '}
                                    </Typography>
                                  </Box>
                                  <Box
                                    sx={{
                                      minWidth: '160px',
                                    }}
                                  >
                                    <Typography
                                      sx={{
                                        ...fetchValue,
                                      }}
                                    >
                                    GST - {cost?.AdCostGST} %
                                    </Typography>
                                  </Box>
                                  <Box
                                    sx={{
                                      minWidth: '160px',
                                    }}
                                  >
                                    <Typography
                                      sx={{
                                        ...fetchValue,
                                      }}
                                    >
                                      {cost?.AdCostApplicableOn === 'All'
                                        ? 'One Time Cost '
                                        : 'Per Unit'}
                                    </Typography>
                                  </Box>
                                  <Box
                                    sx={{
                                      gap: '5px',
                                      minWidth: '160px',
                                      display: 'flex',
                                    }}
                                  >
                                    <Typography
                                      sx={{
                                        ...fetchValue,
                                      }}
                                    >
                                      {newValue}
                                    </Typography>
                                    <Typography>
                                      {cost.currencyType === 'BXITokens' ? (
                                        <Box
                                          component="img"
                                          src={BXITokenIcon}
                                          alt="token"
                                          sx={{
                                            height: 'auto',
                                            width: '15px',
                                            marginTop: '6px',
                                          }}
                                        />
                                      ) : (
                                        <Typography
                                          sx={{
                                            fontSize: '20px',
                                            ml: 1,
                                          }}
                                        >
                                        ₹
                                        </Typography>
                                      )}
                                    </Typography>
                                  </Box>
                                </Box>
                              </>
                            );
                          })}
                      </Box>
                    ) : null}

                  {GetProductByIdData?.OtherInformationBuyerMustKnowOrRemarks
                    .length === 0 ? null : (
                      <>
                        <Box sx={{ mt: 3 }}>
                          <Typography sx={cost}>Remarks </Typography>
                          <Box
                            sx={{
                              display: 'flex',
                              width: '95%',
                              gap: '10px',
                              mt: 1,
                            }}
                          >
                            {GetProductByIdData?.OtherInformationBuyerMustKnowOrRemarks.map(
                              (item) => {
                                return (
                                  <>
                                    <Typography sx={otherCostText}>
                                      {item}
                                    </Typography>
                                  </>
                                );
                              },
                            )}
                          </Box>
                        </Box>
                      </>
                    )}
                </Grid>
              </Grid>
            </Box>
            )}
            {TabValue === '3' && (
            <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
              <Box>
                <Typography sx={{ ...pack, color: textPrimary }}>
                  Technical Information
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}
                >
                  <Typography sx={inclusiveheader}>
                    Supporting you would give to buyer
                  </Typography>
                  {GetProductByIdData?.WhatSupportingYouWouldGiveToBuyer
                    ? Object?.keys(
                      GetProductByIdData?.WhatSupportingYouWouldGiveToBuyer,
                    ).map((el, idx) => {
                      if (
                        GetProductByIdData?.WhatSupportingYouWouldGiveToBuyer[
                          el
                        ] === 'on'
                      ) {
                        return (
                          <>
                            <Typography
                              sx={{
                                ...packHead,
                                color: '#6B7A99',
                                fontWeight: 400,
                                fontSize: '16px',
                                display: 'flex',
                                gap: '10px',
                              }}
                            >
                              {' '}
                              {el}
                            </Typography>
                          </>
                        );
                      } else {
                        return null;
                      }
                    })
                    : null}{' '}
                </Box>

                <Box>
                  <Typography sx={inclusiveheader}>
                    Dimensions of Ad / Content Needed
                  </Typography>
                  <Box>
                    <Typography sx={dots}>
                      {GetProductByIdData?.Dimensions}
                    </Typography>
                  </Box>
                </Box>

                <Box>
                  <Typography sx={inclusiveheader}>
                    Content Upload Link
                  </Typography>
                  <Box>
                    <a
                      style={{
                        fontFamily: fontFamily,
                        fontStyle: 'normal',
                        fontWeight: 400,
                        fontSize: '16px',
                        color: '#445FD2',
                      }}
                    >
                      {GetProductByIdData?.UploadLink}
                    </a>
                    <br />
                  </Box>
                </Box>

                <Box>
                  <Typography sx={inclusiveheader}>
                    Inventory Available Dates
                  </Typography>
                  <Box sx={{ pt: '0.8%', display: 'flex', gap: '10%' }}>
                    <Typography sx={dateMonth}>Start Date</Typography>
                    <Typography sx={dateMonth}>End Date</Typography>
                  </Box>

                  <Box
                    sx={{
                      overflow: 'auto',
                      marginRight: '900px',
                      '::-webkit-scrollbar': {
                        display: 'flex',
                      },
                      '::-webkit-scrollbar-thumb': {
                        dynamic: '#8d8e90',
                        minHeight: '10px',
                        borderRadius: '8px',
                      },
                      '::-webkit-scrollbar-thumb:vertical': {
                        maxHeight: '10px',
                      },
                      maxHeight: 'auto',
                      height: 'auto',
                    }}
                  >
                    <Stack>
                      <Box sx={{ pt: '0.8%', display: 'flex', gap: '10%' }}>
                        <Typography sx={valDateMonth}>
                          {/* Calendar display removed - calendar module no longer used */}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                </Box>
              </Box>
            </Box>
            )}
            {TabValue === '4' && (
            <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
              <Box>
                <Typography sx={{ ...pack, color: textPrimary }}>
                  Key Features
                </Typography>
                <Box
                  sx={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'row',
                  }}
                >
                  <Grid
                    container
                    mt={0.5}
                    sx={{
                      display: 'flex',
                      flexDirection: 'row',
                      justifyContent: 'flex-start',
                      width: '100%',
                    }}
                  >
                    {ProductFeatures?.map((res, featIdx) => {
                      return (
                        <Grid
                          item
                          key={res?._id != null ? String(res._id) : `feature-tab-${featIdx}-${res?.name ?? ''}`}
                          xl={3}
                          lg={3}
                          md={4}
                          sm={6}
                          xs={6}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              textAlign: 'start',
                              flexDirection: 'row',
                              gap: { xs: '12px', sm: '24px', md: '48px', lg: '72px' },
                              mt: 1.5,
                            }}
                          >
                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: 'flex-start',
                                gap: '20px',
                                width: '100%',
                              }}
                            >
                              <FeatureName name={res?.name} />
                              <Box
                                sx={{
                                  width: '80%',
                                  maxWidth: '825px',
                                  height: 'auto',
                                  wordWrap: 'break-word',
                                }}
                              >
                                <Typography sx={packHead}>
                                  {res.name}
                                </Typography>
                                <Typography
                                  sx={{
                                    ...packVal,
                                    fontSize: { xs: '0.9375rem', sm: '1rem' },
                                  }}
                                >
                                  {res.description}{' '}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
              </Box>
            </Box>
            )}
          {(GetProductByIdData?.ProductUploadStatus &&
            GetProductByIdData?.ProductUploadStatus === 'Approved') ||
            GetProductByIdData?.ProductUploadStatus === 'pendingapproval' ||
            ImageDataArray?.length <= 0 ||
            !ImageDataArray ? null : (
              <Box
                sx={{
                  textAlign: 'center',
                  py: { xs: 2.5, md: 3 },
                  px: 2,
                  borderTop: `1px solid ${borderSubtle}`,
                  bgcolor: surfaceMuted,
                }}
              >
                <Button
                  variant="contained"
                  onClick={uploadProduct}
                  size="large"
                  sx={{
                    borderRadius: `${radiusMd}px`,
                    px: { xs: 3, sm: 5 },
                    py: 1.35,
                    fontWeight: 600,
                    fontSize: '0.9375rem',
                    textTransform: 'none',
                    bgcolor: accent,
                    boxShadow: '0 4px 14px rgba(198, 64, 145, 0.35)',
                    '&:hover': {
                      bgcolor: '#A03375',
                      boxShadow: '0 6px 20px rgba(198, 64, 145, 0.4)',
                    },
                  }}
                >
                  Upload product
                </Button>
              </Box>
            )}
        </Paper>
      </Box>
    </Box>
  );
}

const inclusiveheader = {
  fontFamily: fontFamily,
  fontStyle: 'normal',
  fontWeight: 600,
  fontSize: { xs: '0.8125rem', sm: '0.875rem', md: '0.9375rem' },
  color: textMuted,
  width: '100%',
  pt: { xs: 1.5, md: 2 },
  letterSpacing: '0.02em',
};
const otherCostText = {
  fontFamily: fontFamily,
  fontStyle: 'normal',
  fontWeight: 400,
  fontSize: { xs: '0.875rem', sm: '0.9375rem' },
  color: textMuted,
  lineHeight: 1.55,
};
const dateMonth = {
  fontFamily: fontFamily,
  fontStyle: 'normal',
  fontWeight: 600,
  fontSize: 16,
  color: '#6B7A99',
};
const valDateMonth = {
  fontFamily: fontFamily,
  fontStyle: 'normal',
  fontWeight: 400,
  fontSize: 14,
  color: '#6B7A99',
};
const cost = {
  fontFamily: fontFamily,
  fontStyle: 'normal',
  fontWeight: 700,
  fontSize: { xs: '1rem', sm: '1.05rem' },
  color: textPrimary,
  letterSpacing: '-0.02em',
};

const dots = {
  display: 'flex',
  gap: '8px',
  fontFamily: fontFamily,
  fontStyle: 'normal',
  fontWeight: 400,
  fontSize: {
    xs: '20px',
    sm: '15px',
    md: '16px',
    lg: '16px',
    xl: '16px',
  },
  textAlign: 'justify',
  color: '#6B7A99',
};

const pack = {
  fontFamily: fontFamily,
  fontStyle: 'normal',
  fontWeight: 700,
  fontSize: { xs: '1.05rem', sm: '1.15rem', md: '1.25rem' },
  letterSpacing: '-0.02em',
  textAlign: {
    xl: 'start',
    lg: 'start',
    md: 'start',
    sm: 'start',
    xs: 'start',
  },
  color: textPrimary,
};

const packHead = {
  fontFamily: fontFamily,
  fontStyle: 'normal',
  fontWeight: 600,
  fontSize: '0.8125rem',
  color: textMuted,
  letterSpacing: '0.02em',
};

const packVal = {
  fontFamily: fontFamily,
  fontStyle: 'normal',
  fontWeight: 500,
  fontSize: { xs: '0.9375rem', sm: '1rem' },
  color: textPrimary,
  lineHeight: 1.55,
};

const fetchValue = {
  fontFamily: fontFamily,
  fontStyle: 'normal',
  fontWeight: 500,
  fontSize: { xs: '0.875rem', sm: '0.9375rem' },
  color: textPrimary,
  marginTop: '6px',
  lineHeight: 1.5,
};
const tableHeader = {
  fontFamily: fontFamily,
  fontStyle: 'normal',
  fontWeight: 600,
  fontSize: { xs: '0.6875rem', sm: '0.75rem' },
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: textMuted,
  textAlign: {
    xl: 'start',
    lg: 'start',
    md: 'start',
    sm: 'start',
    xs: 'start',
  },
};

const mainText = {
  fontFamily: fontFamily,
  fontStyle: 'normal',
  fontWeight: 600,
  fontSize: '24px',
  color: '#6B7A99',
  p: 3,
};

const HeaderContainerStyle = { px: '2rem' };
const PageHeader = {
  display: 'flex',
  background: '#fff',
  width: '100%',
  py: '20px',
  position: 'relative',
  justifyContent: 'space-between',
  alignItems: 'center',
  alignContent: 'center',
};

const AppBarTypoStyle = {
  fontFamily: fontFamily,
  fontStyle: 'normal',
  fontWeight: 700,
  fontSize: {
    xl: '24px',
    lg: '24px',
    md: '20px',
    sm: '16px',
    xs: '12px',
  },
  textAlign: 'center',
  display: 'flex',
  justifyContent: 'center',
  width: '100%',
  px: '15%',
  color: '#4D4D4D',
};

const MainTabStyle = {
  width: '100%',
};

const TabTextStyle = {
  color: '#B1B1B1',
  fontFamily: fontFamily,
  fontStyle: 'normal',
  fontWeight: 500,
  fontSize: {
    xl: '18px',
    lg: '18px',
    md: '14px',
    sm: '12px',
    xs: '10px',
  },
  letterSpacing: '0.02em',
  textTransform: 'none',
};

const TypographyTitleText = {
  fontFamily: fontFamily,
  fontStyle: 'normal',
  fontWeight: 700,
  fontSize: { xs: '1.05rem', sm: '1.15rem', md: '1.25rem' },
  letterSpacing: '-0.02em',
  color: textPrimary,
};

const DescriptionAnswerText = {
  fontFamily: fontFamily,
  fontStyle: 'normal',
  fontWeight: 400,
  fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' },
  textAlign: 'left',
  color: textMuted,
  lineHeight: 1.65,
  py: { xs: 1.5, sm: 2 },
  maxWidth: '72ch',
};

const semi = {
  fontFamily: fontFamily,
  fontStyle: 'normal',
  fontWeight: 700,
  fontSize: { xs: '1.05rem', sm: '1.15rem', md: '1.25rem' },
  letterSpacing: '-0.02em',
  color: textPrimary,
  textAlign: {
    xl: 'start',
    lg: 'start',
    md: 'start',
    sm: 'start',
    xs: 'start',
  },
  mt: { xs: 2, md: 3 },
  mb: 1,
};

const product = {
  fontFamily: fontFamily,
  fontStyle: 'normal',
  fontWeight: 700,
  fontSize: { xs: '1rem', sm: '1.05rem', md: '1.1rem' },
  color: textPrimary,
  letterSpacing: '-0.01em',
};
