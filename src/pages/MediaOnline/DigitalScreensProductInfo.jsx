/**
 * Digital ADs (Media Online) – Product Info step.
 * Replicates bxi-dashboard DigitalScreensProductInfo: DataGrid, Excel upload, submit to product_mutation_digitalads, next → mediaonlinedigitalscreenstechinfo.
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, Upload, Download, X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { DataGrid } from '@mui/x-data-grid';
import { toast } from 'sonner';
import api from '../../utils/api';

const schema = z.object({
  location: z.string().min(1, 'Location is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  propertyName: z.string().min(1, 'Property Name is required'),
  mediaSiteCode: z.string().min(1, 'Media/Site Code is required'),
  numberOfScreens: z.coerce.number().min(1, 'Number of screens required'),
  remarks: z.string().optional(),
  mrp: z.coerce.number().min(1, 'MRP is required'),
  discountedPrice: z.coerce.number().min(0, 'Discounted price required'),
  repetition: z.string().min(1, 'Repetition is required'),
  dimensionSize: z.string().min(1, 'Dimension size is required'),
  minOrderQuantity: z.coerce.number().min(1),
  maxOrderQuantity: z.coerce.number().min(1),
  GST: z.string().min(1),
  HSN: z.string().optional(),
});

const DIGITAL_SCREENS_COLUMNS = [
  { field: 'srNo', headerName: 'Sr No', width: 80 },
  { field: 'location', headerName: 'Location', width: 130 },
  { field: 'city', headerName: 'City', width: 120 },
  { field: 'state', headerName: 'State', width: 100 },
  { field: 'propertyName', headerName: 'Property Name', width: 150 },
  { field: 'mediaSiteCode', headerName: 'Media/Site Code', width: 130 },
  { field: 'numberOfScreens', headerName: 'Number Of Screens', width: 130 },
  { field: 'remarks', headerName: 'Remarks', width: 150 },
  { field: 'mrp', headerName: 'MRP', width: 100 },
  { field: 'discountedPrice', headerName: 'Discounted Price', width: 140 },
];

export default function DigitalScreensProductInfo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productData, setProductData] = useState(null);
  const [dataGridRows, setDataGridRows] = useState([]);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [excelFile, setExcelFile] = useState(null);
  const fileInputRef = useRef(null);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      location: '',
      city: '',
      state: '',
      propertyName: '',
      mediaSiteCode: '',
      numberOfScreens: 1,
      remarks: '',
      mrp: '',
      discountedPrice: '',
      repetition: '',
      dimensionSize: '',
      minOrderQuantity: 1,
      maxOrderQuantity: 1,
      GST: '18',
      HSN: '',
    },
  });

  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      try {
        const res = await api.get(`product/get_product_byId/${id}`);
        const data = res?.data;
        setProductData(data);
        if (data?.tags?.length) setTags(data.tags);
        if (data?.mediaVariation) {
          setValue('location', data.mediaVariation.location || '');
          setValue('city', data.mediaVariation.city || '');
          setValue('state', data.mediaVariation.state || '');
          setValue('propertyName', data.mediaVariation.propertyName || '');
          setValue('mediaSiteCode', data.mediaVariation.mediaSiteCode || '');
          setValue('numberOfScreens', data.mediaVariation.numberOfScreens ?? 1);
          setValue('remarks', data.mediaVariation.remarks || '');
          setValue('mrp', data.mediaVariation.mrp ?? '');
          setValue('discountedPrice', data.mediaVariation.discountedPrice ?? '');
          setValue('repetition', data.mediaVariation.repetition || '');
          setValue('dimensionSize', data.mediaVariation.dimensionSize || '');
          setValue('minOrderQuantity', data.mediaVariation.minOrderQuantityunit ?? 1);
          setValue('maxOrderQuantity', data.mediaVariation.maxOrderQuantityunit ?? 1);
          setValue('GST', data.mediaVariation.GST ?? '18');
          setValue('HSN', data.mediaVariation.HSN || '');
        }
        if (data?.DigitalAds_screen_id) {
          const screensRes = await api.get(`/product/DigitalAdsScreenGetById/${data.DigitalAds_screen_id}`);
          const screens = screensRes?.data?.data?.digitalAdsScreens || [];
          setDataGridRows(screens.map((s, i) => ({ id: i + 1, srNo: i + 1, ...s })));
        }
      } catch (e) {
        toast.error('Failed to load product');
      }
    };
    fetchProduct();
  }, [id, setValue]);

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag) => setTags(tags.filter((t) => t !== tag));

  const onExcelChange = (e) => {
    const file = e.target.files?.[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      setExcelFile(file);
    } else {
      setExcelFile(null);
      toast.error('Please upload a valid Excel file (.xls or .xlsx)');
    }
  };

  const handleUploadExcel = async () => {
    if (!excelFile || !id) {
      toast.error('Please select an Excel file');
      return;
    }
    const formData = new FormData();
    formData.append('file', excelFile);
    formData.append('ProductId', id);
    formData.append('ProductType', 'Media');
    formData.append('ProductSubCategory', 'Digital ADs');
    formData.append('ProductCategory', 'MediaOnline');
    formData.append('ProductUploadStatus', 'productinformation');
    formData.append('ListingType', 'Media');
    try {
      await api.post('/product/DigitalAds_Excel_Process', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('File uploaded successfully');
      setExcelFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      const res = await api.get(`/product/get_product_byId/${id}`);
      const data = res?.data;
      if (data?.DigitalAds_screen_id) {
        const screensRes = await api.get(`/product/DigitalAdsScreenGetById/${data.DigitalAds_screen_id}`);
        const screens = screensRes?.data?.data?.digitalAdsScreens || [];
        setDataGridRows(screens.map((s, i) => ({ id: i + 1, srNo: i + 1, ...s })));
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Upload failed');
    }
  };

  const onSubmit = async (data) => {
    if (tags.length === 0) {
      toast.error('Add at least one tag');
      return;
    }
    if (dataGridRows.length === 0 && !data.location) {
      toast.error('Add screen data manually or upload Excel');
      return;
    }

    setIsSubmitting(true);
    try {
      const mediaVariation = {
        location: data.location,
        city: data.city,
        state: data.state,
        propertyName: data.propertyName,
        mediaSiteCode: data.mediaSiteCode,
        numberOfScreens: Number(data.numberOfScreens),
        remarks: data.remarks || '',
        mrp: Number(data.mrp),
        discountedPrice: Number(data.discountedPrice),
        repetition: data.repetition,
        dimensionSize: data.dimensionSize,
        minOrderQuantityunit: Number(data.minOrderQuantity),
        maxOrderQuantityunit: Number(data.maxOrderQuantity),
        GST: data.GST,
        HSN: data.HSN || '',
        PricePerUnit: Number(data.mrp),
        DiscountedPrice: Number(data.discountedPrice),
        Timeline: 'Day',
        unit: 'Screen',
      };

      const payload = {
        id,
        ProductId: id,
        ProductUploadStatus: 'productinformation',
        ListingType: 'Media',
        tags,
        mediaVariation,
        ProductsVariantions: [mediaVariation],
        ProductQuantity: mediaVariation.maxOrderQuantityunit,
        PricePerUnit: mediaVariation.mrp,
        DiscountedPrice: mediaVariation.discountedPrice,
        GST: mediaVariation.GST,
      };

      await api.post('/product/product_mutation_digitalads', payload);
      toast.success('Product information saved!');
      navigate(`/mediaonline/mediaonlinedigitalscreenstechinfo/${id}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-8">
      <div className="form-container max-w-5xl mx-auto px-4">
        <div className="form-section bg-white rounded-lg shadow-sm p-6">
          <h2 className="form-section-title mb-6">Digital Screens – Media Information</h2>

          {/* Excel upload (bxi pattern) */}
          <div className="space-y-2 mb-6">
            <Label>Upload Excel (Digital Screens template)</Label>
            <div className="flex flex-wrap gap-2 items-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={onExcelChange}
                className="hidden"
                id="digital-excel"
              />
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" /> Choose file
              </Button>
              {excelFile && (
                <>
                  <span className="text-sm text-[#6B7A99]">{excelFile.name}</span>
                  <Button type="button" variant="outline" size="sm" onClick={handleUploadExcel}>
                    Upload
                  </Button>
                </>
              )}
              <a
                href="https://mediajourneyexcel.sfo3.cdn.digitaloceanspaces.com/Digital_Screens_Media_Template.xlsx"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#C64091] text-sm flex items-center gap-1"
              >
                <Download className="w-4 h-4" /> Download template
              </a>
            </div>
          </div>

          {dataGridRows.length > 0 && (
            <div className="mb-6 overflow-x-auto">
              <div className="h-[300px]">
                <DataGrid
                  rows={dataGridRows}
                  columns={DIGITAL_SCREENS_COLUMNS}
                  pageSize={5}
                  disableSelectionOnClick
                  getRowId={(row) => row.id ?? row.srNo}
                />
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Location *</Label>
                <Input {...register('location')} className={errors.location ? 'border-red-500' : ''} />
                {errors.location && <p className="text-sm text-red-500">{errors.location.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>City *</Label>
                <Input {...register('city')} className={errors.city ? 'border-red-500' : ''} />
                {errors.city && <p className="text-sm text-red-500">{errors.city.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>State *</Label>
                <Input {...register('state')} className={errors.state ? 'border-red-500' : ''} />
                {errors.state && <p className="text-sm text-red-500">{errors.state.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Property Name *</Label>
                <Input {...register('propertyName')} className={errors.propertyName ? 'border-red-500' : ''} />
                {errors.propertyName && <p className="text-sm text-red-500">{errors.propertyName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Media/Site Code *</Label>
                <Input {...register('mediaSiteCode')} className={errors.mediaSiteCode ? 'border-red-500' : ''} />
                {errors.mediaSiteCode && <p className="text-sm text-red-500">{errors.mediaSiteCode.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Number Of Screens *</Label>
                <Input type="number" {...register('numberOfScreens')} className={errors.numberOfScreens ? 'border-red-500' : ''} />
                {errors.numberOfScreens && <p className="text-sm text-red-500">{errors.numberOfScreens.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Remarks</Label>
                <Input {...register('remarks')} />
              </div>
              <div className="space-y-2">
                <Label>MRP *</Label>
                <Input type="number" {...register('mrp')} className={errors.mrp ? 'border-red-500' : ''} />
                {errors.mrp && <p className="text-sm text-red-500">{errors.mrp.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Discounted Price *</Label>
                <Input type="number" {...register('discountedPrice')} className={errors.discountedPrice ? 'border-red-500' : ''} />
                {errors.discountedPrice && <p className="text-sm text-red-500">{errors.discountedPrice.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Repetition *</Label>
                <Input {...register('repetition')} className={errors.repetition ? 'border-red-500' : ''} />
                {errors.repetition && <p className="text-sm text-red-500">{errors.repetition.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Dimension Size *</Label>
                <Input {...register('dimensionSize')} className={errors.dimensionSize ? 'border-red-500' : ''} />
                {errors.dimensionSize && <p className="text-sm text-red-500">{errors.dimensionSize.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Min Order Qty</Label>
                <Input type="number" {...register('minOrderQuantity')} />
              </div>
              <div className="space-y-2">
                <Label>Max Order Qty</Label>
                <Input type="number" {...register('maxOrderQuantity')} />
              </div>
              <div className="space-y-2">
                <Label>GST *</Label>
                <Input {...register('GST')} />
              </div>
              <div className="space-y-2">
                <Label>HSN</Label>
                <Input {...register('HSN')} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tags *</Label>
              <Input
                placeholder="Type and press Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveTag(tag)}>
                    {tag} <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
              </div>
              {tags.length === 0 && <p className="text-sm text-red-500">Add at least one tag</p>}
            </div>

            <div className="flex justify-between pt-6">
              <Button type="button" variant="outline" onClick={() => navigate(`/mediaonline/general-info/${id}`)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <Button type="submit" disabled={isSubmitting || tags.length === 0} className="bg-[#C64091] hover:bg-[#A03375]">
                {isSubmitting ? 'Saving...' : 'Save & Next'} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </form>

          <Button variant="ghost" className="mt-4 text-[#6B7A99]" onClick={() => window.confirm('Cancel product?') && navigate('/sellerhub')}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
