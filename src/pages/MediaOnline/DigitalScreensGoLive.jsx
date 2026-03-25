/**
 * Digital ADs (Media Online) – Go Live step.
 * Replicates bxi DigitalScreensGoLive (IsMedia=true): review, submit ProductUploadStatus golive, redirect to sellerhub.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import api from '../../utils/api';

export default function DigitalScreensGoLive() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productData, setProductData] = useState(null);

  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      try {
        const res = await api.get(`product/get_product_byId/${id}`);
        setProductData(res?.data);
      } catch (e) {
        toast.error('Failed to load product');
      }
    };
    fetchProduct();
  }, [id]);

  const handleGoLive = async () => {
    setIsSubmitting(true);
    try {
      await api.post('/product/product_mutation', {
        _id: id,
        ProductUploadStatus: 'golive',
      });
      toast.success('Product submitted for go live!');
      navigate('/sellerhub');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to go live');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-[#111827] mb-2">Review & Go Live – Digital Screens</h2>
          <p className="text-sm text-[#6B7A99] mb-4">
            Review your digital screens listing and submit to go live.
          </p>
          {productData && (
            <div className="space-y-2 text-sm">
              <p><span className="font-medium text-[#6B7A99]">Product:</span> {productData.ProductName}</p>
              {productData.mediaVariation && (
                <p><span className="font-medium text-[#6B7A99]">Location:</span> {productData.mediaVariation.location}, {productData.mediaVariation.city}</p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => navigate(`/mediaonline/mediaonlinedigitalscreenstechinfo/${id}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <Button onClick={handleGoLive} disabled={isSubmitting} className="bg-[#C64091] hover:bg-[#A03375]">
            {isSubmitting ? 'Submitting...' : 'Go Live'}
          </Button>
        </div>
      </div>
    </div>
  );
}
