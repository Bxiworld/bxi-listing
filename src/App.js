import React from 'react';
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { store } from './redux/store';

const queryClient = new QueryClient();

// Layout
import { Layout } from './components/layout/Layout';
import ScrollToTop from './components/ScrollToTop';
import { ProductStepLayout } from './components/ProductStepLayout';

// Pages
import SellerHub from './pages/SellerHub';
import { GeneralInformation, ProductInfo, TechInfo, GoLive } from './pages/AddProduct/AddProductSteps';
import ProductPreview from './pages/ProductPreview';
import BulkUpload from './pages/BulkUpload';
import BulkUploadProcessing from './pages/BulkUploadProcessing';
import VoucherForm from './pages/VoucherForm';
import AddProductCategorySelect from './pages/AddProductCategorySelect';
import MediaOnlinePhysical from './pages/MediaOnlinePhysical';
import PhysicalDigital from './pages/PhysicalDigital';
import AddMediaCategoryPage from './pages/AddMediaCategoryPage';
import AllCategoriesAdmin from './pages/AllCategoriesAdmin';
import EePhysical from './pages/EePhysical';
import { AuthGuard } from './components/AuthGuard';
import ListingAccessGuard from './components/guards/ListingAccessGuard';

// Media Online Components
import MediaOnlineGeneralInfo from './pages/MediaOnline/MediaGeneralInfo';
import MediaOnlineProductInfo from './pages/MediaOnline/MediaOnlineProductInfo';
import MediaOnlineTechInfo from './pages/MediaOnline/MediaOnlineTechInfo';
import MediaMultiplexProductInfo from './pages/MediaOnline/MediaMultiplexProductInfo';
import MediaMultiplexTechInfo from './pages/MediaOnline/MediaMultiplexTechInfo';
import DigitalScreensProductInfo from './pages/MediaOnline/DigitalScreensProductInfo';
import DigitalScreensTechInfo from './pages/MediaOnline/DigitalScreensTechInfo';
import DigitalScreensGoLive from './pages/MediaOnline/DigitalScreensGoLive';

// Media Offline Components
import MediaOfflineGeneralInfo from './pages/MediaOffline/GeneralInformation';
import MediaOfflineProductInfo from './pages/MediaOffline/MediaOfflineProductInfo';
import HoardingProductInfo from './pages/MediaOffline/HoardingProductInfo';
import HoardingTechInfo from './pages/MediaOffline/HoardingTechInfo';
import HoardingsGoLive from './pages/MediaOffline/HoardingsGoLive';
import MediaOfflineTechInfo from './pages/MediaOffline/MediaOfflineTechInfo';

// Voucher Components
import HotelsProductInfo from './pages/Vouchers/HotelsProductInfo';
import VoucherTechInfo from './pages/Vouchers/VoucherTechInfo';
import VoucherDesign from './pages/Vouchers/EditVoucherTemplate/Voucher';
import VoucherGoLive from './pages/Vouchers/EditVoucherTemplate/Voucher';

// Product Categories
const productCategories = [
  'textile', 'electronics', 'fmcg', 'officesupply',
  'lifestyle', 'mobility', 'restaurant', 'others',
  'mediaonline', 'mediaoffline'
];

// Voucher Categories
const voucherCategories = [
  'electronicsVoucher', 'fmcgVoucher', 'mobilityVoucher', 'officesupplyVoucher',
  'eeVoucher', 'textileVoucher', 'lifestyleVoucher', 'airlineVoucher',
  'qsrVoucher', 'hotelsVoucher', 'otherVoucher'
];

// Bulk Upload Categories (matches spec Section 7.4; officesupply + path casing per bxi-dashboard)
const bulkUploadCategories = [
  { path: 'textilebulkupload', category: 'textile', showProductsPath: 'textileBulkuploadshowproducts' },
  { path: 'electronicbulkupload', category: 'electronics', showProductsPath: 'electronicBulkuploadshowproducts' },
  { path: 'fmcgbulkupload', category: 'fmcg', showProductsPath: 'fmcgBulkuploadshowproducts' },
  { path: 'officesupplybulkupload', category: 'officesupply', showProductsPath: 'officesupplyBulkuploadshowproducts' },
  { path: 'mobilitybulkupload', category: 'mobility', showProductsPath: 'mobilityBulkuploadshowproducts' },
  { path: 'otherbulkupload', category: 'others', showProductsPath: 'otherBulkuploadshowproducts' },
  { path: 'resturantbulkupload', category: 'restaurant', showProductsPath: 'resturantBulkuploadshowproducts' },
  { path: 'mediaonlinebulkupload', category: 'mediaonline', showProductsPath: 'mediaonlineBulkuploadshowproducts' },
  { path: 'mediaofflinebulkupload', category: 'mediaoffline' },
];

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <BrowserRouter>
          <Layout>
          <AuthGuard>
            <Routes>
              {/* Root redirect to Seller Hub */}
              <Route path="/" element={<Navigate to="/sellerhub" replace />} />

              {/* Seller Hub - Main listing page */}
              <Route path="/sellerhub" element={<SellerHub />} />
              <Route path="/myproduct" element={<Navigate to="/sellerhub" replace />} />

              {/* Add Product – category selection (admin: all 12, non-admin: by company type) */}
              <Route
                path="/add-product"
                element={
                  <ListingAccessGuard kind="product">
                    <AddProductCategorySelect />
                  </ListingAccessGuard>
                }
              />
              {/* Physical – Product vs Voucher choice (per bxi-dashboard /physical route) */}
              <Route
                path="/physical"
                element={
                  <ListingAccessGuard kind="listing">
                    <PhysicalDigital />
                  </ListingAccessGuard>
                }
              />
              {/* Admin All Categories – 12 category selection view (admin entry) */}
              <Route
                path="/allcategoriesadmin"
                element={
                  <ListingAccessGuard kind="listing">
                    <AllCategoriesAdmin />
                  </ListingAccessGuard>
                }
              />
              {/* EE Physical – Entertainment vs Events then voucher type (per bxi-dashboard /eephysical) */}
              <Route
                path="/eephysical"
                element={
                  <ListingAccessGuard kind="listing">
                    <EePhysical />
                  </ListingAccessGuard>
                }
              />
              {/* Media Physical – Online vs Offline, Single vs Bulk (per bxi-dashboard MediaOnlinePhysical) */}
              <Route
                path="/media-physical"
                element={
                  <ListingAccessGuard kind="product">
                    {/* <MediaOnlinePhysical /> */}
                    <AddMediaCategoryPage />
                  </ListingAccessGuard>
                }
              />
              <Route
                path="/allcategoriesadmin"
                element={
                  <ListingAccessGuard kind="product">
                    {/* <MediaOnlinePhysical /> */}
                    <AllCategoriesAdmin />
                  </ListingAccessGuard>
                }
              />

              {/* Add Product Routes - Non-Media Categories */}
              {productCategories.filter(cat => !['mediaonline', 'mediaoffline'].includes(cat)).map((category) => (
                <React.Fragment key={category}>
                  {/* General Info */}
                  <Route
                    path={`/${category}/general-info`}
                    element={
                      <ListingAccessGuard kind="product" category={category}>
                        <ProductStepLayout category={category}>
                          <GeneralInformation category={category} />
                        </ProductStepLayout>
                      </ListingAccessGuard>
                    }
                  />
                  <Route
                    path={`/${category}/general-info/:id`}
                    element={
                      <ListingAccessGuard kind="product" category={category}>
                        <ProductStepLayout category={category}>
                          <GeneralInformation category={category} />
                        </ProductStepLayout>
                      </ListingAccessGuard>
                    }
                  />

                  {/* Product Info */}
                  <Route
                    path={`/${category}/product-info`}
                    element={
                      <ListingAccessGuard kind="product" category={category}>
                        <ProductStepLayout category={category}>
                          <ProductInfo category={category} />
                        </ProductStepLayout>
                      </ListingAccessGuard>
                    }
                  />
                  <Route
                    path={`/${category}/product-info/:id`}
                    element={
                      <ListingAccessGuard kind="product" category={category}>
                        <ProductStepLayout category={category}>
                          <ProductInfo category={category} />
                        </ProductStepLayout>
                      </ListingAccessGuard>
                    }
                  />

                  {/* Tech Info */}
                  <Route
                    path={`/${category}/tech-info`}
                    element={
                      <ListingAccessGuard kind="product" category={category}>
                        <ProductStepLayout category={category}>
                          <TechInfo category={category} />
                        </ProductStepLayout>
                      </ListingAccessGuard>
                    }
                  />
                  <Route
                    path={`/${category}/tech-info/:id`}
                    element={
                      <ListingAccessGuard kind="product" category={category}>
                        <ProductStepLayout category={category}>
                          <TechInfo category={category} />
                        </ProductStepLayout>
                      </ListingAccessGuard>
                    }
                  />

                  {/* Go Live */}
                  <Route
                    path={`/${category}/go-live`}
                    element={
                      <ListingAccessGuard kind="product" category={category}>
                        <ProductStepLayout category={category}>
                          <GoLive category={category} />
                        </ProductStepLayout>
                      </ListingAccessGuard>
                    }
                  />
                  <Route
                    path={`/${category}/go-live/:id`}
                    element={
                      <ListingAccessGuard kind="product" category={category}>
                        <ProductStepLayout category={category}>
                          <GoLive category={category} />
                        </ProductStepLayout>
                      </ListingAccessGuard>
                    }
                  />
                </React.Fragment>
              ))}

              {/* Media Online Routes - Specialized Components */}
              <Route
                path="/mediaonline"
                element={
                  <ListingAccessGuard kind="product" category="mediaonline">
                    <ProductStepLayout category="mediaonline">
                      <MediaOnlineGeneralInfo />
                    </ProductStepLayout>
                  </ListingAccessGuard>
                }
              />
              <Route
                path="/mediaonline/general-info"
                element={
                  <ListingAccessGuard kind="product" category="mediaonline">
                    <ProductStepLayout category="mediaonline">
                      <MediaOnlineGeneralInfo />
                    </ProductStepLayout>
                  </ListingAccessGuard>
                }
              />
              <Route
                path="/mediaonline/general-info/:id"
                element={
                  <ListingAccessGuard kind="product" category="mediaonline">
                    <ProductStepLayout category="mediaonline">
                      <MediaOnlineGeneralInfo />
                    </ProductStepLayout>
                  </ListingAccessGuard>
                }
              />
              <Route
                path="/mediaonline/product-info/:id"
                element={
                  <ListingAccessGuard kind="product" category="mediaonline">
                    <ProductStepLayout category="mediaonline">
                      <MediaOnlineProductInfo />
                    </ProductStepLayout>
                  </ListingAccessGuard>
                }
              />
              <Route
                path="/mediaonline/tech-info/:id"
                element={
                  <ListingAccessGuard kind="product" category="mediaonline">
                    <ProductStepLayout category="mediaonline">
                      <MediaOnlineTechInfo />
                    </ProductStepLayout>
                  </ListingAccessGuard>
                }
              />
              <Route
                path="/mediaonline/go-live/:id"
                element={
                  <ListingAccessGuard kind="product" category="mediaonline">
                    <ProductStepLayout category="mediaonline">
                      <GoLive category="mediaonline" />
                    </ProductStepLayout>
                  </ListingAccessGuard>
                }
              />

              {/* Media Offline Routes - Specialized Components */}
              <Route
                path="/mediaoffline"
                element={
                  <ListingAccessGuard kind="product" category="mediaoffline">
                    <ProductStepLayout category="mediaoffline">
                      <MediaOfflineGeneralInfo />
                    </ProductStepLayout>
                  </ListingAccessGuard>
                }
              />
              <Route
                path="/mediaoffline/general-info"
                element={
                  <ListingAccessGuard kind="product" category="mediaoffline">
                    <ProductStepLayout category="mediaoffline">
                      <MediaOfflineGeneralInfo />
                    </ProductStepLayout>
                  </ListingAccessGuard>
                }
              />
              <Route
                path="/mediaoffline/general-info/:id"
                element={
                  <ListingAccessGuard kind="product" category="mediaoffline">
                    <ProductStepLayout category="mediaoffline">
                      <MediaOfflineGeneralInfo />
                    </ProductStepLayout>
                  </ListingAccessGuard>
                }
              />
              <Route
                path="/mediaoffline/product-info/:id"
                element={
                  <ListingAccessGuard kind="product" category="mediaoffline">
                    <ProductStepLayout category="mediaoffline">
                      <MediaOfflineProductInfo />
                    </ProductStepLayout>
                  </ListingAccessGuard>
                }
              />
              <Route
                path="/mediaoffline/tech-info/:id"
                element={
                  <ListingAccessGuard kind="product" category="mediaoffline">
                    <ProductStepLayout category="mediaoffline">
                      <MediaOfflineTechInfo />
                    </ProductStepLayout>
                  </ListingAccessGuard>
                }
              />
              <Route
                path="/mediaoffline/go-live/:id"
                element={
                  <ListingAccessGuard kind="product" category="mediaoffline">
                    <ProductStepLayout category="mediaoffline">
                      <GoLive category="mediaoffline" />
                    </ProductStepLayout>
                  </ListingAccessGuard>
                }
              />

              {/* Media-specific subcategory routes (multiplex, digital screens, hoarding) */}
              {/* These routes use specialized components for complex media flows */}
              <Route path="/mediaonline/mediaonlinemultiplexproductinfo/:id" element={<ListingAccessGuard kind="product" category="mediaonline"><MediaMultiplexProductInfo /></ListingAccessGuard>} />
              <Route path="/mediaonline/mediamultiplextechinfo/:id" element={<ListingAccessGuard kind="product" category="mediaonline"><MediaMultiplexTechInfo /></ListingAccessGuard>} />
              <Route path="/mediaonline/mediaonlinedigitalscreensinfo/:id" element={<ListingAccessGuard kind="product" category="mediaonline"><DigitalScreensProductInfo /></ListingAccessGuard>} />
              <Route path="/mediaonline/mediaonlinedigitalscreenstechinfo/:id" element={<ListingAccessGuard kind="product" category="mediaonline"><DigitalScreensTechInfo /></ListingAccessGuard>} />
              <Route path="/mediaonline/digitalscreensgolive/:id" element={<ListingAccessGuard kind="product" category="mediaonline"><DigitalScreensGoLive /></ListingAccessGuard>} />
              <Route path="/mediaoffline/mediaofflinehoardinginfo/:id" element={<ListingAccessGuard kind="product" category="mediaoffline"><HoardingProductInfo /></ListingAccessGuard>} />
              <Route path="/mediaoffline/mediaofflinehoardingtechinfo/:id" element={<ListingAccessGuard kind="product" category="mediaoffline"><HoardingTechInfo /></ListingAccessGuard>} />
              <Route path="/mediaoffline/hoardingsgolive/:id" element={<ListingAccessGuard kind="product" category="mediaoffline"><HoardingsGoLive /></ListingAccessGuard>} />
              <Route path="/mediaoffline/mediaofflineproductinfo/:id" element={<ListingAccessGuard kind="product" category="mediaoffline"><MediaOfflineProductInfo /></ListingAccessGuard>} />

              {/* Voucher Routes */}
              <Route
                path="/generalVoucherForm"
                element={
                  <ListingAccessGuard kind="voucher">
                    <VoucherForm />
                  </ListingAccessGuard>
                }
              />
              <Route
                path="/voucher/voucherinfo"
                element={
                  <ListingAccessGuard kind="voucher">
                    <VoucherForm />
                  </ListingAccessGuard>
                }
              />
              <Route
                path="/voucher/voucherinfo/:id"
                element={
                  <ListingAccessGuard kind="voucher">
                    <VoucherForm />
                  </ListingAccessGuard>
                }
              />

              {voucherCategories.map((category) => (
                <React.Fragment key={category}>
                  <Route
                    path={`/${category}/generalinformation`}
                    element={
                      <ListingAccessGuard kind="voucher" category={category}>
                        <ProductStepLayout category={category}>
                          <GeneralInformation category={category} />
                        </ProductStepLayout>
                      </ListingAccessGuard>
                    }
                  />
                  <Route
                    path={`/${category}/generalinformation/:id`}
                    element={
                      <ListingAccessGuard kind="voucher" category={category}>
                        <ProductStepLayout category={category}>
                          <GeneralInformation category={category} />
                        </ProductStepLayout>
                      </ListingAccessGuard>
                    }
                  />
                  {/* Voucher: techinfo shows ProductInfo (price/variants); then user goes to vouchertechinfo for Voucher Information */}
                  <Route
                    path={`/${category}/techinfo`}
                    element={
                      <ListingAccessGuard kind="voucher" category={category}>
                        <ProductStepLayout category={category}>
                          <ProductInfo category={category} />
                        </ProductStepLayout>
                      </ListingAccessGuard>
                    }
                  />
                  <Route
                    path={`/${category}/techinfo/:id`}
                    element={
                      <ListingAccessGuard kind="voucher" category={category}>
                        <ProductStepLayout category={category}>
                          <ProductInfo category={category} />
                        </ProductStepLayout>
                      </ListingAccessGuard>
                    }
                  />
                  <Route
                    path={`/${category}/vouchertechinfo`}
                    element={
                      <ListingAccessGuard kind="voucher" category={category}>
                        <ProductStepLayout category={category}>
                          <VoucherTechInfo category={category} />
                        </ProductStepLayout>
                      </ListingAccessGuard>
                    }
                  />
                  <Route
                    path={`/${category}/vouchertechinfo/:id`}
                    element={
                      <ListingAccessGuard kind="voucher" category={category}>
                        <ProductStepLayout category={category}>
                          <VoucherTechInfo category={category} />
                        </ProductStepLayout>
                      </ListingAccessGuard>
                    }
                  />
                  <Route
                    path={`/${category}/voucherdesign`}
                    element={
                      <ListingAccessGuard kind="voucher" category={category}>
                        <ProductStepLayout category={category}>
                          <VoucherDesign category={category} />
                        </ProductStepLayout>
                      </ListingAccessGuard>
                    }
                  />
                  <Route
                    path={`/${category}/voucherdesign/:id`}
                    element={
                      <ListingAccessGuard kind="voucher" category={category}>
                        <ProductStepLayout category={category}>
                          <VoucherDesign category={category} />
                        </ProductStepLayout>
                      </ListingAccessGuard>
                    }
                  />
                  <Route
                    path={`/${category}/vouchergolive`}
                    element={
                      <ListingAccessGuard kind="voucher" category={category}>
                        <ProductStepLayout category={category}>
                          <VoucherGoLive category={category} />
                        </ProductStepLayout>
                      </ListingAccessGuard>
                    }
                  />
                  <Route
                    path={`/${category}/vouchergolive/:id`}
                    element={
                      <ListingAccessGuard kind="voucher" category={category}>
                        <ProductStepLayout category={category}>
                          <VoucherGoLive category={category} />
                        </ProductStepLayout>
                      </ListingAccessGuard>
                    }
                  />
                  <Route
                    path={`/${category}/golive`}
                    element={
                      <ListingAccessGuard kind="voucher" category={category}>
                        <ProductStepLayout category={category}>
                          <GoLive category={category} />
                        </ProductStepLayout>
                      </ListingAccessGuard>
                    }
                  />
                  <Route
                    path={`/${category}/golive/:id`}
                    element={
                      <ListingAccessGuard kind="voucher" category={category}>
                        <ProductStepLayout category={category}>
                          <GoLive category={category} />
                        </ProductStepLayout>
                      </ListingAccessGuard>
                    }
                  />
                </React.Fragment>
              ))}

              {/* Hotel voucher specific routes - Using specialized HotelsProductInfo */}
              <Route path="/hotelsVoucher/hotelsproductinfo/:id" element={<ListingAccessGuard kind="voucher" category="hotelsVoucher"><ProductStepLayout category="hotelsVoucher"><HotelsProductInfo category="hotelsVoucher" /></ProductStepLayout></ListingAccessGuard>} />
              <Route path="/hotelsVoucher/hotelstechinfo/:id" element={<ListingAccessGuard kind="voucher" category="hotelsVoucher"><ProductStepLayout category="hotelsVoucher"><VoucherTechInfo category="hotelsVoucher" /></ProductStepLayout></ListingAccessGuard>} />
              <Route path="/hotelsVoucher/hotelsdesign/:id" element={<ListingAccessGuard kind="voucher" category="hotelsVoucher"><ProductStepLayout category="hotelsVoucher"><VoucherDesign category="hotelsVoucher" /></ProductStepLayout></ListingAccessGuard>} />
              <Route path="/hotelsVoucher/voucherdesign/:id" element={<ListingAccessGuard kind="voucher" category="hotelsVoucher"><ProductStepLayout category="hotelsVoucher"><VoucherDesign category="hotelsVoucher" /></ProductStepLayout></ListingAccessGuard>} />
              <Route path="/hotelsVoucher/hotelsgolive/:id" element={<ListingAccessGuard kind="voucher" category="hotelsVoucher"><ProductStepLayout category="hotelsVoucher"><VoucherGoLive category="hotelsVoucher" /></ProductStepLayout></ListingAccessGuard>} />

              {/* Bulk Upload Routes */}
              <Route
                path="/bulkuploadproduct"
                element={
                  <ListingAccessGuard kind="product">
                    <BulkUpload />
                  </ListingAccessGuard>
                }
              />
              <Route
                path="/productbulkupload"
                element={
                  <ListingAccessGuard kind="product">
                    <BulkUpload />
                  </ListingAccessGuard>
                }
              />
              <Route
                path="/bulkupload/status"
                element={
                  <ListingAccessGuard kind="product">
                    <BulkUploadProcessing />
                  </ListingAccessGuard>
                }
              />
              {bulkUploadCategories.map(({ path, category, showProductsPath }) => (
                <React.Fragment key={path}>
                  <Route
                    path={`/${path}`}
                    element={
                      <ListingAccessGuard kind="product" category={category}>
                        <BulkUpload category={category} />
                      </ListingAccessGuard>
                    }
                  />
                  {showProductsPath && (
                    <Route
                      path={`/${showProductsPath}`}
                      element={
                        <ListingAccessGuard kind="product" category={category}>
                          <BulkUpload category={category} />
                        </ListingAccessGuard>
                      }
                    />
                  )}
                </React.Fragment>
              ))}
              <Route
                path="/bulkuploadexcelpreview"
                element={
                  <ListingAccessGuard kind="product">
                    <BulkUpload />
                  </ListingAccessGuard>
                }
              />
              <Route
                path="/imageupload"
                element={
                  <ListingAccessGuard kind="product">
                    <BulkUpload category="textile" />
                  </ListingAccessGuard>
                }
              />

              {/* Preview Routes */}
              <Route path="/allproductpreview/:id" element={<ProductPreview />} />
              <Route path="/allvoucherpreview/:id" element={<ProductPreview />} />
              <Route path="/specificvoucherpreview/:id" element={<ProductPreview />} />
              <Route path="/electronicsproductpreview/:id" element={<ProductPreview />} />
              <Route path="/RestaurantProductPreview/:id" element={<ProductPreview />} />
              <Route path="/fmcgproductpreview/:id" element={<ProductPreview />} />
              <Route path="/mediaonlineproductpreview/:id" element={<ProductPreview />} />
              <Route path="/multiplexmediaonlineproductpreview/:id" element={<ProductPreview />} />
              <Route path="/mediaSheetsProductsPreview/:id" element={<ProductPreview />} />
              <Route path="/mobilityproductpreview/:id" element={<ProductPreview />} />
              <Route path="/textilepreviewpage/:id" element={<ProductPreview />} />
              <Route path="/valueandgiftvoucher/:id" element={<ProductPreview />} />
              <Route path="/spacificvoucher/:id" element={<ProductPreview />} />
              <Route path="/textilesvoucherprev/:id" element={<ProductPreview />} />

              {/* Fallback - redirect to seller hub */}
              <Route path="*" element={<Navigate to="/sellerhub" replace />} />
            </Routes>
          </AuthGuard>
          </Layout>
        </BrowserRouter>
      </Provider>
    </QueryClientProvider>
  );
}

export default App;
