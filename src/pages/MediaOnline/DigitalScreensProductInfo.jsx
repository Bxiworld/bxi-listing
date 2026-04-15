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
import { Stepper } from '../AddProduct/AddProductSteps';

const schema = z.object({
  repetition: z.string().min(1, 'Repetition is required'),
});

/** Min positive MRP and min discounted price across Excel rows (same rule as multiplex / hoarding). */
function computeMinDigitalScreenListingPrices(rows) {
  const parsePositive = (v) => {
    if (v === undefined || v === null || v === '') return NaN;
    const n = Number(String(v).replace(/,/g, '').trim());
    return Number.isFinite(n) && n > 0 ? n : NaN;
  };
  const mrps = rows.map((r) => parsePositive(r.mrp)).filter(Number.isFinite);
  const discs = rows
    .map((r) => parsePositive(r.discountedPrice))
    .filter(Number.isFinite);
  return {
    minMRP: mrps.length ? Math.min(...mrps) : null,
    minDiscounted: discs.length ? Math.min(...discs) : null,
  };
}

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
      repetition: '',
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
          setValue('repetition', data.mediaVariation.repetition || '');
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
      const uploadRes = await api.post('/product/DigitalAds_Excel_Process', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const listingPrices = uploadRes?.data?.listingPriceFromScreens;
      if (
        listingPrices &&
        (listingPrices.PricePerUnit != null || listingPrices.DiscountedPrice != null)
      ) {
        toast.success(
          'Excel uploaded. Listing price set from minimum MRP / discounted values in the sheet.',
        );
      } else {
        toast.success('File uploaded successfully');
      }
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
    if (dataGridRows.length === 0) {
      toast.error('Upload the Digital Screens Excel file to add screen rows');
      return;
    }

    const { minMRP, minDiscounted } = computeMinDigitalScreenListingPrices(dataGridRows);
    if (minMRP == null || minDiscounted == null) {
      toast.error(
        'Each Excel row needs valid MRP and discounted price so we can set listing prices (minimums across rows).',
      );
      return;
    }

    const first = dataGridRows[0] || {};
    const prevMv = productData?.mediaVariation || {};
    const mediaVariation = {
      location: first.location ?? '',
      city: first.city ?? '',
      state: first.state ?? '',
      propertyName: first.propertyName ?? '',
      mediaSiteCode: first.mediaSiteCode != null ? String(first.mediaSiteCode) : '',
      numberOfScreens: Number(first.numberOfScreens) || 1,
      remarks: first.remarks ?? '',
      mrp: minMRP,
      discountedPrice: minDiscounted,
      repetition: data.repetition,
      dimensionSize: prevMv.dimensionSize || '',
      minOrderQuantityunit: Number(prevMv.minOrderQuantityunit) || 1,
      maxOrderQuantityunit: Number(prevMv.maxOrderQuantityunit) || 1,
      GST: prevMv.GST != null && prevMv.GST !== '' ? String(prevMv.GST) : '18',
      HSN: prevMv.HSN || '',
      PricePerUnit: minMRP,
      DiscountedPrice: minDiscounted,
      Timeline: 'Day',
      unit: 'Screen',
    };

    setIsSubmitting(true);
    try {
      const payload = {
        id,
        ProductId: id,
        ProductUploadStatus: 'productinformation',
        ListingType: 'Media',
        tags,
        mediaVariation,
        ProductsVariantions: [mediaVariation],
        ProductQuantity: mediaVariation.maxOrderQuantityunit,
        PricePerUnit: minMRP,
        DiscountedPrice: minDiscounted,
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
      <div className="form-container">
        <div className="stepper-layout">
          <aside className="stepper-rail">
            <Stepper currentStep={2} category="mediaonline" completedSteps={[1]} />
          </aside>
          <main className="stepper-content">
      <div className="max-w-5xl mx-auto px-4">
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
            {dataGridRows.length > 0 && (
              <p className="text-sm text-[#6B7A99] rounded-md border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2">
                MRP and discounted listing prices are taken as the{' '}
                <strong>lowest</strong> value in each column across all Excel rows. Full detail stays in the table
                above.
              </p>
            )}

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
          </main>
        </div>
      </div>
    </div>
  );
}
