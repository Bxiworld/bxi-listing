import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Eye, Calendar, MapPin, Gift, Tag } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { toast } from 'sonner';
import api, { productApi } from '../../utils/api';
import QRCode from 'react-qr-code';
import { getPrevNextStepPaths } from '../../config/categoryFormConfig';
import { Stepper } from '../AddProduct/AddProductSteps';

export default function VoucherGoLive({ category }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productData, setProductData] = useState(null);
  const [loading, setLoading] = useState(true);

  const { prev: prevStepPath } = getPrevNextStepPaths(category, 'goLive');
  const prevPath = prevStepPath || 'voucherdesign';

  // Fetch product data
  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      try {
        const res = await productApi.getProductById(id);
        setProductData(res?.data);
      } catch (error) {
        console.error('Error fetching product:', error);
        toast.error('Failed to load product data');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  // Aligned with bxi-dashboard: voucher submit uses ProductUploadStatus 'pendingapproval' (VoucherTypeOne uploadProduct)
  const handleGoLive = async () => {
    if (!id) {
      toast.error('Product ID missing');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/product/product_mutation', {
        _id: id,
        ProductUploadStatus: 'pendingapproval',
      });

      toast.success('Once uploaded, changes are subject to approval.');
      setTimeout(() => {
        navigate('/sellerhub');
      }, 2000);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to publish. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C64091] mx-auto mb-4"></div>
          <p className="text-[#6B7A99]">Loading voucher details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-8">
      <div className="form-container">
        <div className="stepper-layout">
          <aside className="stepper-rail">
            <Stepper currentStep={4} completedSteps={[1, 2, 3]} />
          </aside>
          <main className="stepper-content">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-bold text-[#111827] mb-2">Review & Go Live</h2>
          <p className="text-sm text-[#6B7A99]">
            Review your voucher details before publishing
          </p>
        </div>

        <Tabs defaultValue="details" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="redemption">Redemption</TabsTrigger>
            <TabsTrigger value="variations">Variations</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="bg-white rounded-lg shadow-sm p-6">
            {/* voucher Images */}
            <h3 className="text-lg font-semibold text-[#111827] mb-4">Voucher Images</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {productData?.VoucherImages?.length > 0 && (
                  <div>
                    <p className="text-sm text-[#6B7A99] mb-1">Voucher Image</p>
                    <img src={productData?.VoucherImages[0].url} alt="Voucher Image" className="w-full h-full object-cover" />
                    <img src={productData?.VoucherImages[1].url} alt="Voucher Image" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
            <h3 className="text-lg font-semibold text-[#111827] mb-4">Voucher Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-[#6B7A99] mb-1">Product Name</p>
                  <p className="font-semibold text-[#111827]">{productData?.ProductName}</p>
                </div>
                <div>
                  <p className="text-sm text-[#6B7A99] mb-1">Category</p>
                  <Badge variant="secondary">{productData?.ProductType}</Badge>
                </div>
                <div>
                  <p className="text-sm text-[#6B7A99] mb-1">Sub Category</p>
                  <Badge variant="secondary">{productData?.ProductSubCategoryName}</Badge>
                </div>
                <div>
                  <p className="text-sm text-[#6B7A99] mb-1">Description</p>
                  <p className="text-sm text-[#111827]">{productData?.ProductDescription}</p>
                </div>
                {productData?.Gender && (
                  <div>
                    <p className="text-sm text-[#6B7A99] mb-1">Gender</p>
                    <Badge variant="secondary">{productData.Gender}</Badge>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-[#6B7A99] mb-1">Product Code</p>
                  <p className="font-mono font-semibold text-[#111827]">{productData?.ProductCode}</p>
                </div>
                <div>
                  <p className="text-sm text-[#6B7A99] mb-1">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {productData?.ProductTags?.length > 0 ? productData.ProductTags.map((tag, idx) => (
                      <Badge key={idx} variant="outline">
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </Badge>
                    )) : <span className="text-sm text-[#6B7A99]">No tags</span>}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-[#6B7A99] mb-1">Voucher Type</p>
                  <Badge className="bg-[#C64091]">{productData?.VoucherType || 'Standard'}</Badge>
                </div>
                {productData?.ExpiryDate && (
                  <div>
                    <p className="text-sm text-[#6B7A99] mb-1 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Valid Until
                    </p>
                    <p className="font-semibold text-[#111827]">{productData.ExpiryDate}</p>
                  </div>
                )}
                {productData?.fromLocation && (
                  <div>
                    <p className="text-sm text-[#6B7A99] mb-1">Route</p>
                    <p className="text-sm text-[#111827]">{productData.fromLocation} → {productData.destinationLocation}</p>
                  </div>
                )}
                {productData?.redeemedValue && (
                  <div>
                    <p className="text-sm text-[#6B7A99] mb-1">Redeemed Value</p>
                    <Badge variant="secondary">{productData.redeemedValue}</Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Product Features */}
            {productData?.ProductFeatures?.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="text-base font-semibold text-[#111827] mb-3">Product Features ({productData.ProductFeatures.length})</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {productData.ProductFeatures.map((f, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-3 bg-[#F9FAFB] rounded-lg border border-[#E5E8EB]">
                      <div className="w-5 h-5 mt-0.5 flex-shrink-0 rounded-full bg-[#C64091] text-white text-xs flex items-center justify-center">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-medium text-[#111827] text-sm">{f.name}</p>
                        {f.description && f.description !== f.name && (
                          <p className="text-xs text-[#6B7A99] mt-0.5">{f.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Other Costs */}
            {productData?.OtherCost?.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="text-base font-semibold text-[#111827] mb-3">Additional Costs</h4>
                <div className="overflow-x-auto rounded-md border border-[#E5E8EB]">
                  <table className="w-full border-collapse bg-white text-sm">
                    <thead className="bg-[#F9FAFB] text-[#374151]">
                      <tr>
                        <th className="px-3 py-2 text-center font-medium">Applicable On</th>
                        <th className="px-3 py-2 text-center font-medium">Cost</th>
                        <th className="px-3 py-2 text-center font-medium">HSN</th>
                        <th className="px-3 py-2 text-center font-medium">GST</th>
                        <th className="px-3 py-2 text-center font-medium">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productData.OtherCost.map((oc, idx) => (
                        <tr key={idx} className="border-t border-[#E5E8EB] text-center">
                          <td className="px-3 py-2">{oc.AdCostApplicableOn === 'All' ? 'One Time' : 'Per Unit'}</td>
                          <td className="px-3 py-2 font-medium">{oc.currencyType === 'BXITokens' ? 'BXI ' : '₹'}{oc.CostPrice}</td>
                          <td className="px-3 py-2">{oc.AdCostHSN}</td>
                          <td className="px-3 py-2">{oc.AdCostGST}%</td>
                          <td className="px-3 py-2">{oc.ReasonOfCost}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Redemption Tab */}
          <TabsContent value="redemption" className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-[#111827] mb-4">Redemption Information</h3>
            <div className="space-y-6">
              <div>
                <p className="text-sm text-[#6B7A99] mb-2">Redemption Type</p>
                <Badge className="bg-[#C64091]">{productData?.RedemptionType}</Badge>
              </div>

              {(productData?.RedemptionType === 'Online' || productData?.RedemptionType === 'Both') && (
                <div>
                  <p className="text-sm text-[#6B7A99] mb-2">Online Redemption URL</p>
                  <a
                    href={productData?.OnlineRedemptionURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#C64091] hover:underline"
                  >
                    {productData?.OnlineRedemptionURL}
                  </a>
                </div>
              )}

              {(productData?.RedemptionType === 'Offline' || productData?.RedemptionType === 'Both') && productData?.OfflineAddress && (
                <div>
                  <p className="text-sm text-[#6B7A99] mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Offline Address
                  </p>
                  <div className="bg-[#F8F9FA] p-4 rounded-lg">
                    <p className="text-sm text-[#111827]">
                      {JSON.parse(productData.OfflineAddress).address}, {JSON.parse(productData.OfflineAddress).area}
                      {JSON.parse(productData.OfflineAddress).landmark && `, ${JSON.parse(productData.OfflineAddress).landmark}`}
                      <br />
                      {JSON.parse(productData.OfflineAddress).city}, {JSON.parse(productData.OfflineAddress).state}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm text-[#6B7A99] mb-2">Redemption Steps</p>
                <div className="bg-[#F8F9FA] p-4 rounded-lg">
                  <p className="text-sm text-[#111827] whitespace-pre-line">{productData?.RedemptionSteps}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-[#6B7A99] mb-2 flex items-center gap-2">
                  <Gift className="w-4 h-4" />
                  Inclusions
                </p>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-sm text-[#111827] whitespace-pre-line">{productData?.Inclusions}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-[#6B7A99] mb-2">Exclusions</p>
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <p className="text-sm text-[#111827] whitespace-pre-line">{productData?.Exclusions}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-[#6B7A99] mb-2">Terms & Conditions</p>
                <div className="bg-[#F8F9FA] p-4 rounded-lg max-h-60 overflow-y-auto">
                  <p className="text-xs text-[#111827] whitespace-pre-line">{productData?.TermConditions}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-[#6B7A99] mb-2">Code Generation</p>
                <Badge variant="outline">{productData?.CodeGenerationType === 'BXI' ? 'BXI Auto-Generated' : 'Uploaded by Seller'}</Badge>
              </div>
            </div>
          </TabsContent>

          {/* Variations Tab */}
          <TabsContent value="variations" className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-[#111827] mb-4">Voucher Variations</h3>
            {productData?.ProductsVariantions && productData.ProductsVariantions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {productData.ProductsVariantions.map((variant, idx) => {
                  const price = variant.PricePerUnit || variant.ProductPrice || 0;
                  const discPrice = variant.DiscountedPrice || variant.ProductDiscountedPrice || 0;
                  const gst = variant.GST || variant.ProductGST;
                  return (
                    <div key={idx} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm text-[#6B7A99]">Value</p>
                          <p className="text-lg font-bold text-[#111827]">₹{Number(price).toLocaleString()}</p>
                        </div>
                        {discPrice > 0 && discPrice < price && (
                          <Badge variant="secondary">
                            {Math.round(((price - discPrice) / price) * 100)}% OFF
                          </Badge>
                        )}
                      </div>
                      {discPrice > 0 && (
                        <div>
                          <p className="text-sm text-[#6B7A99]">Discounted Price</p>
                          <p className="text-lg font-bold text-[#C64091]">₹{Number(discPrice).toLocaleString()}</p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-[#6B7A99]">Min Order</p>
                          <p className="font-semibold">{variant.MinOrderQuantity || 1}</p>
                        </div>
                        <div>
                          <p className="text-[#6B7A99]">Max Order</p>
                          <p className="font-semibold">{variant.MaxOrderQuantity || '∞'}</p>
                        </div>
                      </div>
                      {variant.TotalAvailableQty && (
                        <div className="text-xs">
                          <p className="text-[#6B7A99]">Available Qty</p>
                          <p className="font-semibold">{variant.TotalAvailableQty}</p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {gst && (
                          <div>
                            <p className="text-[#6B7A99]">GST</p>
                            <p className="font-semibold">{gst}%</p>
                          </div>
                        )}
                        {variant.HSN && (
                          <div>
                            <p className="text-[#6B7A99]">HSN</p>
                            <p className="font-semibold">{variant.HSN}</p>
                          </div>
                        )}
                      </div>
                      {variant.validityOfVoucherValue && (
                        <div className="text-xs">
                          <p className="text-[#6B7A99]">Validity</p>
                          <p className="font-semibold">{variant.validityOfVoucherValue} {variant.validityOfVoucherUnit || 'Months'}</p>
                        </div>
                      )}
                      {variant.ProductSize && (
                        <div className="text-xs">
                          <p className="text-[#6B7A99]">Size</p>
                          <p className="font-semibold">{variant.ProductSize}</p>
                        </div>
                      )}
                      {variant.ProductColor && variant.ProductColor !== '#ffffff' && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="w-3 h-3 rounded-full border border-gray-300" style={{ backgroundColor: variant.ProductColor }} />
                          <span>{variant.ProductColor}</span>
                        </div>
                      )}
                      {variant.Flavor && (
                        <div className="text-xs">
                          <p className="text-[#6B7A99]">Flavor</p>
                          <p className="font-semibold">{variant.Flavor}</p>
                        </div>
                      )}
                      {variant.OfferingType && (
                        <div className="text-xs">
                          <p className="text-[#6B7A99]">Offering</p>
                          <p className="font-semibold">{variant.OfferingType}</p>
                        </div>
                      )}
                      {variant.DateOfTheEvent && (
                        <div className="text-xs">
                          <p className="text-[#6B7A99]">Event Date</p>
                          <p className="font-semibold">{variant.DateOfTheEvent}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-[#6B7A99] py-8">No variations added</p>
            )}
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-[#111827] mb-4">Voucher Preview</h3>
            <div className="flex justify-center">
              {productData?._id ? (
                <div className="bg-[#F8F9FA] p-8 rounded-lg">
                  {console.log("productData", productData)}
                  <QRCode value={productData._id} size={200} />
                  <p className="text-center text-sm text-[#6B7A99] mt-4">
                    Scan to view voucher
                  </p>
                </div>
              ) : (
                <p className="text-[#6B7A99]">Preview not available</p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Go Live Section */}
        <div className="bg-gradient-to-r from-[#C64091] to-[#8B2F6F] rounded-lg shadow-lg p-8 mt-6">
          <div className="text-center text-white">
            <h3 className="text-2xl font-bold mb-2">Ready to Go Live?</h3>
            <p className="text-sm opacity-90 mb-6">
              Your voucher is ready to be published. Once live, customers can start purchasing.
            </p>
            <div className="flex justify-center gap-4">
              <Button
                variant="secondary"
                onClick={() => navigate(`/${category}/${prevPath}/${id}`)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleGoLive}
                disabled={isSubmitting}
                className="bg-white text-[#C64091] hover:bg-gray-100"
              >
                {isSubmitting ? (
                  'Publishing...'
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Publish Voucher
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
          </main>
        </div>
      </div>
    </div>
  );
}
