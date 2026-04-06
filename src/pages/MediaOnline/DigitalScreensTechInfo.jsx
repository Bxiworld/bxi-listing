/**
 * Digital ADs (Media Online) – Tech Info step.
 * Replicates bxi DigitalScreensTechInfo: submit to product_mutation_digitalads with ProductUploadStatus technicalinformation, next → digitalscreensgolive.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { toast } from 'sonner';
import api from '../../utils/api';
import { Stepper } from '../AddProduct/AddProductSteps';

export default function DigitalScreensTechInfo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productData, setProductData] = useState(null);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: {
      uploadLink: '',
      supportingDocs: '',
      repetition: '',
      dimensionSize: '',
      adType: '',
    },
  });

  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/product/get_product_byId/${id}`);
        setProductData(res?.data);
        const d = res?.data;
        if (d?.uploadLink) setValue('uploadLink', d.uploadLink);
        if (d?.mediaVariation) {
          setValue('repetition', d.mediaVariation.repetition || '');
          setValue('dimensionSize', d.mediaVariation.dimensionSize || '');
        }
      } catch (e) {
        toast.error('Failed to load product');
      }
    };
    fetchProduct();
  }, [id, setValue]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ProductId: id,
        _id: id,
        ProductUploadStatus: 'technicalinformation',
        UploadLink: data.uploadLink || '',
        repetition: data.repetition || productData?.mediaVariation?.repetition,
        dimensionSize: data.dimensionSize || productData?.mediaVariation?.dimensionSize,
        adType: data.adType || 'BMP',
      };
      await api.post('/product/product_mutation_digitalads', payload);
      toast.success('Technical information saved!');
      navigate(`/mediaonline/digitalscreensgolive/${id}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-8">
      <div className="form-container">
        <div className="stepper-layout">
          <aside className="stepper-rail">
            <Stepper currentStep={3} category="mediaonline" completedSteps={[1, 2]} />
          </aside>
          <main className="stepper-content">
      <div className="max-w-2xl mx-auto px-4">
        <div className="form-section bg-white rounded-lg shadow-sm p-6">
          <h2 className="form-section-title mb-6">Digital Screens – Technical Information</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Upload Link</Label>
              <Input {...register('uploadLink')} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Repetition</Label>
              <Input {...register('repetition')} />
            </div>
            <div className="space-y-2">
              <Label>Dimension Size</Label>
              <Input {...register('dimensionSize')} />
            </div>
            <div className="space-y-2">
              <Label>Ad Type</Label>
              <Input {...register('adType')} placeholder="e.g. BMP" />
            </div>

            <div className="flex justify-between pt-6">
              <Button type="button" variant="outline" onClick={() => navigate(`/mediaonline/mediaonlinedigitalscreensinfo/${id}`)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-[#C64091] hover:bg-[#A03375]">
                {isSubmitting ? 'Saving...' : 'Save & Next'} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </form>

          <Button variant="ghost" className="mt-4 text-[#6B7A99]" onClick={() => window.confirm('Cancel product?') && navigate('/sellerhub')}>
            Cancel
          </Button>
        </div>
      </div>
          </main>
        </div>
      </div>
    </div>
  );
}
