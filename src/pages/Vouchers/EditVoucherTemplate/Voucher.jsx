import {
  Box,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  TextField,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import { Stack } from '@mui/system';
import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import api from '../../../utils/api';
import ToolTip from '../../../components/ToolTip';
import { Stepper } from '../../AddProduct/AddProductSteps';
import Template from './Template';
import { voucherStyle } from './EditVoucherStyle';
import { styles } from './commonStyle';
import TemplateCustomOptions from './TemplateCustomOptions';
import EditVoucherForm from './EditVoucherForm';
import EditIcon from '@mui/icons-material/Edit';
import * as htmlToImage from 'html-to-image';

function dataUrlToBlob(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return null;
  const commaIndex = dataUrl.indexOf(',');
  const meta = dataUrl.substring(0, commaIndex);
  const base64 = dataUrl.substring(commaIndex + 1);
  const mimeMatch = meta.match(/data:([^;]+);base64/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mimeType });
}

function asFileFromData(data, fileName) {
  let blob = null;
  if (typeof data === 'string') {
    blob = data.startsWith('data:') ? dataUrlToBlob(data) : null;
  } else if (data instanceof Blob) {
    blob = data;
  }
  if (!blob) return null;
  return new File([blob], fileName, { type: blob.type || 'image/png' });
}

async function uploadVoucherImages(frontData, backData) {
  const uploads = [];
  // Front
  const frontFile = asFileFromData(frontData, 'front.png');
  if (!frontFile) throw new Error('Front image not prepared');

  {
    const leftForm = new FormData();
    leftForm.append('file', frontFile, 'front.png');

    const resFront = await api.post('file/upload', leftForm);

    if (!resFront?.data?.file) throw new Error('Front upload failed');
    uploads.push({ id: 'front', url: resFront.data.file, typeOfFile: 'image' });
  }

  // Back
  const backFile = asFileFromData(backData, 'back.png');
  if (!backFile) throw new Error('Back image not prepared');

  {
    const rightForm = new FormData();
    rightForm.append('file', backFile, 'back.png');

    // Use full URL to bypass proxy issues
    const resBack = await api.post('file/upload', rightForm);

    if (!resBack?.data?.file) throw new Error('Back upload failed');
    uploads.push({ id: 'back', url: resBack.data.file, typeOfFile: 'image' });
  }
  return uploads;
}

const VoucherCard = () => {
  let id;
  id = useParams().id;
  const navigate = useNavigate();
  const myRefFront = useRef(null);
  const myRefBack = useRef(null);


  const classes = voucherStyle();
  const cls = styles();

  const [gradientColors, setGradientColors] = useState({
    start: '#7c3aed',
    end: '#3b82f6',
  });

  const buildEndToEndVoucherHtml = () => {
    const productName = 'Product';
    const credited = '';
    const dateStr = new Date().toLocaleDateString();
    return `
    <html><body style="font-family: Arial, sans-serif; padding:20px;">
      <h1 style="text-align:center; color:#c64091;">Trade Terms Voucher</h1>
      <p><strong>Product:</strong> ${productName}</p>
      <p><strong>Credited Amount:</strong> ${credited}</p>
      <p><strong>Date:</strong> ${dateStr}</p>
    </body></html>
    `;
  };

  const captureLiveVoucherHtml = () => {
    let liveRoot = null;
    if (value === 'Template1') {
      liveRoot = document.getElementById('voucher-live-preview-front');
    }

    if (liveRoot) {
      return liveRoot.outerHTML;
    }

    liveRoot = document.getElementById('voucher-live-preview');
    return liveRoot ? liveRoot.outerHTML : buildEndToEndVoucherHtml();
  };
  
  const [dataUrlFront, setDataUrlFront] = useState('');
  const [dataUrlBack, setDataUrlBack] = useState('');
  const [files, setFiles] = useState([]);
  const [cardBgColor, setCardBgColor] = useState('');
  const [category, setCategory] = useState('');
  const [value, setValue] = useState('Template1');
  const [error, setError] = useState(false);
  const [helperText, setHelperText] = useState('Choose wisely');
  const [open, setOpen] = useState(false);
  const [hoveredText, setHoveredText] = useState('');
  const [productData, setProductData] = useState(null);
  const [checked, setChecked] = useState(null);
  const [invertIconChecked, setInvertIconChecked] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const [ListThisProductForAmount, setListThisProductForAmount] =
    useState(null);
  const [ListThisProductForUnitOfTime, setListThisProductForUnitOfTime] =
    useState('Days');
  const [hasStartedTyping, setHasStartedTyping] = useState(false);
  // Left Card

  const handleChange = event => {
    const inputValue = event.target.value;
    setListThisProductForAmount(inputValue);
    setHasStartedTyping(true);
  };

  const validateInput = value => {
    const parsedValue = parseInt(value, 10);
    return parsedValue > 0 && parsedValue <= 365;
  };

  useEffect(() => {
    GetProductByid();
  }, []);


  const handleRadioChange = event => {
    setValue(event.target.value);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const downloadCardFront = () => {
    if (!myRefFront.current) {
      toast.error('Failed to generate voucher front image');
      return;
    }
    
    setTimeout(() => {
      const options = {
        quality: 1,
        width: 480,
        height: 320,
        pixelRatio: 2,
        style: {
          transform: 'none',
          backdropFilter: 'none',
        },
        filter: element => {
          if (element.tagName === 'SCRIPT') return false;
          if (
            element.hasAttribute &&
            element.hasAttribute('data-html-to-image')
          ) {
            element.style.backdropFilter = 'none';
            element.style.transform = 'none';
            element.style.transition = 'none';
            element.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
            element.style.removeProperty('transform');
            element.style.removeProperty('box-shadow');
          }
          return true;
        },
        useCORS: true,
        allowTaint: false,
        foreignObjectRendering: false,
      };

      htmlToImage
        .toBlob(myRefFront.current, options)
        .then(blob => {
          if (!blob || blob.size === 0) {
            toast.error(
              'Generated image is empty. Please check the voucher preview.'
            );
            setShowSpinner(false);
            return;
          }
          setDataUrlFront(blob);
        })
        .catch(error => {
          toast.error(
            'Failed to generate voucher front image: ' + error.message
          );
          setShowSpinner(false);
        });
    }, 500); // 500ms delay to ensure rendering is complete
  };
  const downloadCardFront2 = () => {
    if (!myRefFront.current) {
      toast.error('Failed to generate voucher front image');
      return;
    }

    setTimeout(() => {
      const options = {
        quality: 1,
        width: 480,
        height: 320,
        pixelRatio: 2,
        style: {
          transform: 'none',
          backdropFilter: 'none',
        },
        filter: element => {
          if (element.tagName === 'SCRIPT') return false;
          if (
            element.hasAttribute &&
            element.hasAttribute('data-html-to-image')
          ) {
            element.style.backdropFilter = 'none';
            element.style.transform = 'none';
            element.style.transition = 'none';
            element.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
            element.style.removeProperty('transform');
            element.style.removeProperty('box-shadow');
          }
          return true;
        },
        useCORS: true,
        allowTaint: false,
        foreignObjectRendering: false,
      };

      htmlToImage
        .toBlob(myRefFront.current, options)
        .then(blob => {
          setDataUrlFront(blob);
        })
        .catch(error => {
          toast.error('Failed to generate voucher front image');
          setShowSpinner(false);
        });
    }, 500); // 500ms delay to ensure rendering is complete
  };
  const downloadCardBack = () => {
    if (!myRefBack.current) {
      toast.error('Failed to generate voucher back image');
      return;
    }

    // Add delay to ensure component fully renders with all images/fonts
    setTimeout(() => {
      const options = {
        quality: 1,
        width: 480,
        height: 320,
        pixelRatio: 2,
        style: {
          transform: 'none',
          backdropFilter: 'none',
        },
        filter: element => {
          if (element.tagName === 'SCRIPT') return false;
          if (
            element.hasAttribute &&
            element.hasAttribute('data-html-to-image')
          ) {
            element.style.backdropFilter = 'none';
            element.style.transform = 'none';
            element.style.transition = 'none';
            element.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
            element.style.removeProperty('transform');
            element.style.removeProperty('box-shadow');
          }
          return true;
        },
        useCORS: true,
        allowTaint: false,
        foreignObjectRendering: false,
      };

      htmlToImage
        .toBlob(myRefBack.current, options)
        .then(blob => {
          setDataUrlBack(blob);
        })
        .catch(error => {
          toast.error('Failed to generate voucher back image');
          setShowSpinner(false);
        });
    }, 500); // 500ms delay to ensure rendering is complete
  };
  const downloadCardBack2 = () => {
    if (!myRefBack.current) {
      toast.error('Failed to generate voucher back image');
      return;
    }

    // Add delay to ensure component fully renders with all images/fonts
    setTimeout(() => {
      const options = {
        quality: 1,
        width: 480,
        height: 320,
        pixelRatio: 2,
        style: {
          transform: 'none',
          backdropFilter: 'none',
        },
        filter: element => {
          if (element.tagName === 'SCRIPT') return false;
          if (
            element.hasAttribute &&
            element.hasAttribute('data-html-to-image')
          ) {
            element.style.backdropFilter = 'none';
            element.style.transform = 'none';
            element.style.transition = 'none';
            element.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
            element.style.removeProperty('transform');
            element.style.removeProperty('box-shadow');
          }
          return true;
        },
        useCORS: true,
        allowTaint: false,
        foreignObjectRendering: false,
      };

      htmlToImage
        .toBlob(myRefBack.current, options)
        .then(blob => {
          setDataUrlBack(blob);
        })
        .catch(error => {
          toast.error('Failed to generate voucher back image');
          setShowSpinner(false);
        });
    }, 500); // 500ms delay to ensure rendering is complete
  };

  async function GetProductByid() {
    await api
      .get(`product/get_product_byId/${id}`)
      .then(res => {
        if (res?.data?.ProductsVariantions?.at(0)?.validityOfVoucherValue) {
          setShowSpinner(false);
        }
        if (res?.data) {
          let response = res?.data;
          let productDetails = {
            productName: response?.ProductName,
            productSubtitle: response?.ProductSubtitle,
            validityOfVoucherUnit: '',
            validityOfVoucherValue:
              res?.data?.ProductsVariantions?.at(0)?.validityOfVoucherValue,
            pricePerUnit: '',
            redemptionType: response.redemptionType,
            inclusions: response.Inclusions,
            exclusions: response.Exclusions,
            redemptionURL: response?.Link,
            termsAndConditions: response?.TermConditions,
            voucherType:
              localStorage.getItem('digitalData') == 'Offer Specific'
                ? 'Offer Specific'
                : 'Gift Card',
          };
          setListThisProductForAmount(
            res?.data?.ProductsVariantions?.at(0)?.validityOfVoucherValue
          );
          if (response?.ProductsVariantions?.length > 0) {
            let variations = response.ProductsVariantions[0];
            productDetails.pricePerUnit = variations.PricePerUnit;
            productDetails.validityOfVoucherUnit =
              variations?.validityOfVoucherUnit;
            productDetails.validityOfVoucherValue =
              variations?.validityOfVoucherValue;
          }
          setProductData(productDetails);
        }
      });
  }

  useEffect(() => {
    if (dataUrlFront && dataUrlBack && isSubmitted) {
      setShowSpinner(true);
      // Use the single, unified uploader to render and upload images
      uploadVoucherImages(dataUrlFront, dataUrlBack)
        .then(uploaded => {
          // Create properly formatted VoucherImages array from uploaded data
          const voucherImages = uploaded.map(u => ({
            id: u.id,
            url: u.url,
            typeOfFile: u.typeOfFile
          }));
          
          // Update state for UI
          setFiles(voucherImages);

          const dataTopass = {
            ListThisProductForAmount: ListThisProductForAmount,
            ListThisProductForUnitOfTime: ListThisProductForUnitOfTime,
            VoucherImages: voucherImages,
            id: id,
          };

          return api.post('product/product_mutation', dataTopass);
        })
        .then(response => {
          if (response?.data._id) {
            toast.success('Voucher images uploaded successfully!');
            if (localStorage.getItem('digitalData') === 'Offer Specific') {
              navigate(`/spacificvoucher/${response?.data._id}`);
            } else {
              navigate(`/valueandgiftvoucher/${response?.data._id}`);
            }
          } else {
            throw new Error('Product mutation failed - no ID returned');
          }
        })
        .catch(err => {
          toast.error('Failed to upload voucher images. Please try again.');
          setShowSpinner(false);
          setIsSubmitted(false);
          setDataUrlFront('');
          setDataUrlBack('');
        });
    }
  }, [dataUrlFront, dataUrlBack]);
  const styleTag = document.createElement('style');
  styleTag.innerHTML = styles2;
  document.head.appendChild(styleTag);
  const uploadTemplate = async () => {
    // First show the SweetAlert confirmation
    const result = await Swal.fire({
      title: 'Note',
      html: 'Once you upload a voucher image, it cannot be changed later.<br><br>Are you sure you want to continue?',
      showCancelButton: true,
      confirmButtonColor: '#c64091',
      cancelButtonColor: '#ffffff',
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
      allowOutsideClick: false,
      allowEscapeKey: false,
      customClass: {
        popup: 'large-swal-container',
        cancelButton: 'cancel-button-custom',
        confirmButton: 'confirm-button-custom',
        title: 'swal-title',
        htmlContainer: 'swal-text',
      },
      buttonsStyling: true,
      width: '40em',
      padding: '3em',
    });

    // Only proceed if user confirmed
    if (result.isConfirmed) {
      setShowSpinner(true);
      setDataUrlFront('');
      setIsSubmitted(false);

      if (value == 'Template1') {
        setIsSubmitted(true);
        downloadCardFront();
        downloadCardBack();
      }
      if (value == 'Template3') {
        setIsSubmitted(true);
        downloadCardFront2();
        downloadCardBack2();
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-8">
      <div className="form-container">
        <div className="stepper-layout">
          <aside className="stepper-rail">
            <Stepper currentStep={4} completedSteps={[1, 2, 3]} />
          </aside>
          <main className="stepper-content">
            <div className="form-section">
              <Box
                sx={{
                  width: '100%',
                  mx: 'auto',
                  display: 'flex',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  gap: '0',
                  mb: '12px',
                }}
              >
                <Typography
                  className="form-section-title"
                  sx={{
                    fontFamily: 'Inter, sans-serif',
                    fontStyle: 'normal',
                    fontWeight: 600,
                  }}
                >
                  Voucher Design & Preview - {category || 'Voucher'}
                </Typography>
                <ToolTip
                  sx={{ ml: '10px' }}
                  info={
                    'Go to preview time at which something becomes available to use and purchased by other members on the platform.'
                  }
                />
              </Box>
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  maxHeight: '100%',
                  overflowY: 'auto',
                  // bgcolor: "red",
                }}
              >
            <Stack
              sx={{
                overflow: 'auto',
                '::-webkit-scrollbar': {
                  display: 'flex',
                },
                '::-webkit-scrollbar-thumb': {
                  dynamic: '#8d8e90',
                  minHeight: '10px',
                  borderRadius: '8px',
                },
                '::-webkit-scrollbar-thumb:vertical': {
                  maxHeight: '30px',
                },
                maxHeight: 'auto',
                height: 'auto',
                p: 1,
                display: 'flex',
                flexDirection: 'row',
                gap: '10px',
              }}
            >
              <Box>
                <Box className={classes.templateHeader}>
                  <Typography
                    className={classes.templateLabel}
                    sx={{ fontSize: '20px', color: '#315794', fontWeight: 600 }}
                  >
                    Voucher Template
                  </Typography>
                  <button
                    className={classes.templateEditIconButton}
                    onClick={() => {
                      setOpen(true);
                    }}
                  >
                    <EditIcon fontSize={'large'} />
                  </button>
                </Box>
                <Box sx={{ width: '100%' }}>
                  <div id='voucher-live-preview-front'>
                    <Template
                      cardBgColor={cardBgColor}
                      cardImage={files[0]?.preview}
                      category={category ? category : 0}
                      templateId='Template1'
                      productData={productData}
                      textInverted={checked}
                      iconInverted={invertIconChecked}
                      myRefBack={myRefBack}
                      myRefFront={myRefFront}
                      gradientColors={gradientColors}
                    />
                  </div>
                </Box>
              </Box>
              <Box>
                <TemplateCustomOptions
                  updateFile={e => {
                    setFiles(e);
                  }}
                  updateBGColor={e => {
                    setCardBgColor(e);
                  }}
                  updateIcon={e => {
                    setCategory(e);
                  }}
                  updateTextColor={e => {
                    setChecked(e);
                  }}
                  updateInvertIcon={e => {
                    setInvertIconChecked(e);
                  }}
                  updateGradientColors={colors => {
                    setGradientColors(colors);
                  }}
                />
              </Box>
            </Stack>
            <Box className={cls.fieldBox} sx={{ width: '550px', ml: '10px' }}>
              <Box sx={{ display: 'block', marginBottom: 1 }}>
                <label className={cls.fieldLabel} style={{ fontSize: '16px', display: 'block' }}>
                  List this voucher for number of days ( maximum 365 days )
                  <span style={{ color: 'red' }}> *</span>
                </label>
                <label
                  style={{
                    fontSize: '12px',
                    color: '#6B7A99',
                    fontWeight: 400,
                    fontFamily: 'Poppins',
                    display: 'block',
                    marginTop: '4px',
                  }}
                >
                  Note: Activation of Voucher after you sell is when the expiry should start
                </label>
              </Box>
              {productData?.validityOfVoucherValue && (
                <Typography
                  className={cls.fieldLabel}
                  sx={{
                    fontSize: '14px',
                    color: '#C64091',
                    marginBottom: '8px',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  You have already added validity of Voucher of {productData.validityOfVoucherValue}
                </Typography>
              )}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'stretch',
                  border: '1px solid #E3E3E3',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  backgroundColor: '#FFFFFF',
                  maxWidth: '200px',
                }}
              >
                <TextField
                  variant='standard'
                  type='number'
                  name='ListThisProductForAmount'
                  placeholder='30'
                  InputProps={{
                    disableUnderline: true,
                    style: {
                      fontSize: '14px',
                      padding: '10px 12px',
                      color: '#C64091',
                    },
                  }}
                  value={
                    ListThisProductForAmount ??
                    productData?.validityOfVoucherValue ??
                    ''
                  }
                  onChange={handleChange}
                  className={cls.goLivetextField}
                  error={
                    hasStartedTyping && !validateInput(ListThisProductForAmount)
                  }
                  helperText={
                    hasStartedTyping && !validateInput(ListThisProductForAmount)
                      ? 'Please enter valid days (1–365)!'
                      : ''
                  }
                  sx={{
                    flex: '1 1 auto',
                    minWidth: 0,
                    '& .MuiFormHelperText-root': { marginTop: '4px' },
                  }}
                />
                <Select
                  className={cls.goLiveSelectBox}
                  value={ListThisProductForUnitOfTime || 'Days'}
                  name='ListThisProductForUnitOfTime'
                  onChange={e => setListThisProductForUnitOfTime(e.target.value)}
                  sx={{
                    minWidth: '90px',
                    fontFamily: 'Poppins',
                    fontSize: '14px',
                    color: '#C64091',
                    '& .MuiOutlinedInput-notchedOutline': { border: 0 },
                    '&.MuiOutlinedInput-root': {
                      borderLeft: '1px solid #E3E3E3',
                      borderRadius: 0,
                    },
                  }}
                >
                  <MenuItem className={cls.goLiveMenuItems} value='Days'>
                    Days
                  </MenuItem>
                </Select>
              </Box>
            </Box>

            <Dialog
              fullWidth
              maxWidth='md'
              open={open}
              onClose={handleClose}
              sx={{ zIndex: 100 }}
            >
              <DialogTitle style={{ background: '#EEF1F6' }}>
                Edit Content on Voucher
              </DialogTitle>
              <DialogContent style={{ background: '#EEF1F6' }}>
                <Box>
                  <EditVoucherForm
                    cardData={productData}
                    closePopup={() => {
                      setOpen(false);
                    }}
                    updateFormData={e => {
                      setProductData(e);
                    }}
                  />
                </Box>
              </DialogContent>
              {/* <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button onClick={null}>Save</Button>
          </DialogActions> */}
            </Dialog>
              </Box>
              <div className={cls.formNavigation}>
                <div
                  className={cls.formNavigationBar}
                  style={{ padding: '0' }}
                >
                  <button className={cls.resetLabel} type="button">
                    &nbsp;
                  </button>
                  <Box
                    sx={{
                      padding: '10px',
                      display: 'flex',
                      gap: '16px',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                    }}
                  >
                <Button
                  variant="outlined"
                  type="button"
                  onClick={() => {
                    const confirmLeave = window.confirm(
                      'Are you sure you want to cancel the product?'
                    );
                    if (confirmLeave) {
                      navigate('/home/sellerhub');
                    }
                  }}
                  sx={{
                    minWidth: 120,
                    height: 40,
                    borderRadius: '10px',
                    borderColor: '#636161',
                    color: '#636161',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 600,
                    fontSize: '14px',
                    textTransform: 'none',
                    boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
                    '&:hover': {
                      borderColor: '#000',
                      color: '#000',
                      backgroundColor: '#FAFBFD',
                    },
                  }}
                >
                  Cancel
                </Button>
                <Button
                  disabled={
                    !value ||
                    !ListThisProductForAmount ||
                    !validateInput(ListThisProductForAmount) ||
                    files.length === 0
                  }
                  onClick={() => uploadTemplate()}
                  sx={{
                    minWidth: 120,
                    height: 40,
                    borderRadius: '10px',
                    backgroundColor: '#C64091',
                    color: '#fff',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 600,
                    fontSize: '14px',
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: '#A03375',
                      color: '#fff',
                    },
                    '&.Mui-disabled': {
                      backgroundColor: '#C64091',
                      color: '#fff',
                      opacity: 0.5,
                      pointerEvents: 'none',
                    },
                  }}
                >
                  {showSpinner ? <CircularProgress size={20} color="inherit" /> : 'Next'}
                </Button>
                  </Box>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default React.memo(VoucherCard);

const styles2 = `
  .large-swal-container {
    font-family: 'Poppins', sans-serif !important;
    border-radius: 8px !important;
  }
  .swal-title {
    font-size: 24px !important;
    font-weight: 600 !important;
    color: #c64091 !important;
    padding: 1em 0 0.5em !important;
  }
  .swal-text {
    font-size: 18px !important;
    line-height: 1 !important;
    color: #6B7A99 !important;
    padding: 0.5em 2em 1.5em !important;
  }
  .cancel-button-custom {
    font-family: 'Poppins', sans-serif !important;
    font-size: 18px !important;
    padding: 12px 32px !important;
    color: #000000 !important;
    background: #ffffff !important;
    border: 1px solid #c64091 !important;
    border-radius: 4px !important;
    min-width: 120px !important;
    max-height: 48px !important;
  }
  .confirm-button-custom {
    font-family: 'Poppins', sans-serif !important;
    font-size: 18px !important;
    padding: 12px 32px !important;
    border-radius: 4px !important;
    min-width: 120px !important;
    max-height: 48px !important;
  }
  .cancel-button-custom:hover {
    background: #f5f5f5 !important;
  }
  .confirm-button-custom:hover {
    background: #b13a80 !important;
  }
`;