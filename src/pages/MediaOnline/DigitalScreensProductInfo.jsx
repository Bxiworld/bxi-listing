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
import * as XLSX from 'xlsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { DataGrid } from '@mui/x-data-grid';
import { toast } from 'sonner';
import api from '../../utils/api';
import StateData from '../../utils/StateCityArray.json';
import { Stepper } from '../AddProduct/AddProductSteps';

const ALL_STATES_VALUE = '__all_states__';

const schema = z.object({
  repetition: z.string().optional(),
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

function readDigitalScreens(payload) {
  const root = payload?.data ?? payload ?? {};
  const nested = root?.data && typeof root.data === 'object' ? root.data : root;
  const candidates = [
    nested?.digitalAdsScreens,
    nested?.screens,
    nested?.DigitalAdsScreens?.digitalAdsScreens,
    root?.digitalAdsScreens,
    root?.DigitalAdsScreens?.digitalAdsScreens,
  ];
  return candidates.find(Array.isArray) || [];
}

function mapDigitalScreensToGridRows(screens) {
  return screens.map((screen, index) => ({
    ...screen,
    id: screen._id?.toString?.() || screen.id || `digital-screen-${index}`,
    srNo: screen.srNo ?? screen.Sr_No ?? screen.SrNo ?? index + 1,
    location: screen.location ?? screen.Location ?? '',
    city: screen.city ?? screen.City ?? '',
    state: screen.state ?? screen.State ?? '',
    propertyName: screen.propertyName ?? screen.PropertyName ?? '',
    mediaSiteCode: screen.mediaSiteCode ?? screen.MediaSiteCode ?? screen.Media_Site_Code ?? '',
    numberOfScreens: screen.numberOfScreens ?? screen.NumberOfScreens ?? '',
    remarks: screen.remarks ?? screen.Remarks ?? '',
    mrp: screen.mrp ?? screen.MRP ?? screen.PricePerUnit ?? '',
    discountedPrice: screen.discountedPrice ?? screen.DiscountedPrice ?? '',
  }));
}

async function parseDigitalScreensExcel(file) {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const sourceRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  const normalizeKey = (key) => String(key).trim().toLowerCase();
  const getValue = (row, names) => {
    const key = Object.keys(row).find((name) => names.includes(normalizeKey(name)));
    return key ? row[key] : '';
  };
  const rows = sourceRows
    .filter((row) => Object.values(row).some((value) => String(value).trim() !== ''))
    .map((row, index) => ({
      srNo: getValue(row, ['sr no', 'sr_no']) || index + 1,
      location: getValue(row, ['location']),
      city: getValue(row, ['city']),
      state: getValue(row, ['state']),
      propertyName: getValue(row, ['property name', 'propertyname']),
      mediaSiteCode: getValue(row, ['media/site code', 'media site code', 'media_site_code']),
      numberOfScreens: getValue(row, ['number of screens', 'numberofscreens']),
      remarks: getValue(row, ['remark (addittional section)', 'remarks', 'remark']),
      mrp: getValue(row, ['mrp']),
      discountedPrice: getValue(row, ['discounted mrp', 'discountedprice']),
    }));
  if (!rows.length) throw new Error('The Excel file has no screen rows');
  return mapDigitalScreensToGridRows(rows);
}

export default function DigitalScreensProductInfo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productData, setProductData] = useState(null);
  const [dataGridRows, setDataGridRows] = useState([]);
  const [selectedState, setSelectedState] = useState(ALL_STATES_VALUE);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [excelFile, setExcelFile] = useState(null);
  const [isUploadingExcel, setIsUploadingExcel] = useState(false);
  const fileInputRef = useRef(null);

  const filteredRows = selectedState === ALL_STATES_VALUE
    ? dataGridRows
    : dataGridRows.filter(
      (row) => String(row.state || '').trim().toLowerCase() === selectedState.toLowerCase(),
    );

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
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
        let screens = [];
        if (data?.DigitalAds_screen_id) {
          try {
            const screensRes = await api.get(`/product/DigitalAdsScreenGetById/${data.DigitalAds_screen_id}`);
            screens = readDigitalScreens(screensRes?.data);
          } catch {
            // Try the product-level endpoint below if the screen-list endpoint is unavailable.
          }
        }
        if (!screens.length) {
          try {
            const productScreensRes = await api.get(`/product/get_digitalads_products/${id}`);
            screens = readDigitalScreens(productScreensRes?.data);
          } catch {
            screens = [];
          }
        }
        setDataGridRows(mapDigitalScreensToGridRows(screens));
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

  const onExcelChange = async (e) => {
    const file = e.target.files?.[0];
    // Clear the input so selecting the same file again still triggers change.
    e.target.value = '';
    if (!file) return;
    if (/\.(xlsx|xls)$/i.test(file.name)) {
      setExcelFile(file);
      try {
        const parsedRows = await parseDigitalScreensExcel(file);
        setDataGridRows(parsedRows);
      } catch (error) {
        toast.error(error?.message || 'Failed to read the Excel file');
        return;
      }
      await handleUploadExcel(file);
    } else {
      toast.error('Please upload a valid Excel file (.xls or .xlsx)');
    }
  };

  const handleUploadExcel = async (fileToUpload = excelFile) => {
    if (!fileToUpload || !id) {
      toast.error('Please select an Excel file');
      return;
    }
    const formData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('ProductId', id);
    formData.append('ProductType', 'Media');
    formData.append('ProductSubCategory', 'Digital ADs');
    formData.append('ProductCategory', 'MediaOnline');
    formData.append('ProductUploadStatus', 'productinformation');
    formData.append('ListingType', 'Media');
    setIsUploadingExcel(true);
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
      let screens = readDigitalScreens(uploadRes?.data);
      if (screens.length) {
        setDataGridRows(mapDigitalScreensToGridRows(screens));
      }
      let product = null;
      try {
        const productRes = await api.get(`/product/get_product_byId/${id}`);
        product = productRes?.data;
        setProductData(product);
      } catch {
        // Rows from the upload response remain visible if the product refresh fails.
      }
      if (product?.DigitalAds_screen_id) {
        try {
          const screensRes = await api.get(`/product/DigitalAdsScreenGetById/${product.DigitalAds_screen_id}`);
          const fetchedScreens = readDigitalScreens(screensRes?.data);
          if (fetchedScreens.length) screens = fetchedScreens;
        } catch {
          // Use the product-level endpoint fallback below.
        }
      }
      if (!screens.length) {
        try {
          const productScreensRes = await api.get(`/product/get_digitalads_products/${id}`);
          screens = readDigitalScreens(productScreensRes?.data);
        } catch {
          screens = [];
        }
      }
      if (screens.length) setDataGridRows(mapDigitalScreensToGridRows(screens));
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Upload failed');
    } finally {
      setIsUploadingExcel(false);
    }
  };

  const onSubmit = async (data) => {
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
              <a
                href="https://mediajourneyexcel.sfo3.cdn.digitaloceanspaces.com/Digital_Screens_Media_Template.xlsx"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#C64091] text-sm flex items-center gap-1"
              >
                <Download className="w-4 h-4" /> Download template
              </a>
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="border-[#C64091] text-[#C64091]">
                <Upload className="w-4 h-4 mr-2" /> {excelFile ? 'Change File' : 'Upload Excel'}
              </Button>
              {excelFile && <div className="flex items-center gap-2 text-sm text-[#6B7A99]">
                <Badge variant="secondary">{excelFile.name}</Badge>
                <button type="button" onClick={() => setExcelFile(null)} className="text-[#C64091] hover:underline">Remove</button>
              </div>}
            </div>
            <p className="text-sm text-[#6B7A99] mt-4">Note: Inside uploaded excel rates should be as per min no. of days listed.</p>
          </div>
          {dataGridRows.length > 0 && (
            <div className="mb-6 space-y-4">
              <div className="space-y-2">
                <Label>Filter by State</Label>
                <Select value={selectedState} onValueChange={setSelectedState}>
                  <SelectTrigger>
                    <SelectValue placeholder="All States" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_STATES_VALUE}>All States</SelectItem>
                    {StateData.map((state) => (
                      <SelectItem key={state.name} value={state.name}>{state.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Label>Digital Screens ({filteredRows.length})</Label>
              <div className="h-[400px] w-full">
                <DataGrid
                  rows={filteredRows}
                  columns={DIGITAL_SCREENS_COLUMNS}
                  pageSize={5}
                  disableSelectionOnClick
                  getRowId={(row) => row.id ?? row.srNo}
                />
              </div>
            </div>
          )}
          {isUploadingExcel && (
            <p className="mb-4 text-sm text-[#6B7A99]">Uploading Excel and saving screen details…</p>
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
