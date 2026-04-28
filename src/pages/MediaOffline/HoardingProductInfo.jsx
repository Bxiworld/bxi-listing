import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Download, Upload, FileSpreadsheet, X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { DataGrid } from '@mui/x-data-grid';
import api from '../../utils/api';
import StateData from '../../utils/StateCityArray.json';
import { Stepper } from '../AddProduct/AddProductSteps';

/** Official hoarding bulk-upload template (same as BXI-frontend). */
const HOARDING_EXCEL_TEMPLATE_URL =
  'https://mediajourneyexcel.sfo3.cdn.digitaloceanspaces.com/HoardingExcelTemplate.xlsx';

/**
 * Min positive MRP and min positive discounted price across Excel rows (same rule as multiplex screens).
 *
 * TODO (business rule pending): **10-day hoarding cost** — product wants a dedicated calculation for
 * short-window (e.g. 10-day) pricing vs calendar-month rules. When finance confirms the formula,
 * implement it here and/or in the backend `Hoarding_Excel_Process` pipeline without changing row keys.
 */
function computeMinListingPricesFromHoardingRows(rows) {
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
    PricePerUnit: mrps.length ? Math.min(...mrps) : undefined,
    DiscountedPrice: discs.length ? Math.min(...discs) : undefined,
  };
}

// 29 States for visual selector
const INDIAN_STATES = [
  'Andaman and Nicobar', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar',
  'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli', 'Daman and Diu', 'Delhi',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir',
  'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan',
  'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal'
];

export default function HoardingProductInfo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedState, setSelectedState] = useState('');
  const [excelFile, setExcelFile] = useState(null);
  const [hoardingData, setHoardingData] = useState([]);
  const [hoardingListId, setHoardingListId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [productSubCategory, setProductSubCategory] = useState('650296faeaa5251874e8c716');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!id) return;
    api
      .get(`product/get_product_byId/${id}`)
      .then((res) => {
        const sub = res?.data?.ProductSubCategory;
        if (sub) setProductSubCategory(sub);
      })
      .catch(() => {});
  }, [id]);

  // DataGrid columns — titles aligned with hoarding Excel template (multiplex-style wording)
  const columns = [
    { field: 'id', headerName: 'Sr No', width: 70 },
    { field: 'name', headerName: 'Media', width: 150 },
    { field: 'area', headerName: 'Site name / location', width: 180 },
    { field: 'width', headerName: 'Width (ft.)', width: 100 },
    { field: 'height', headerName: 'Height (ft.)', width: 100 },
    { field: 'size', headerName: 'Total sq. ft', width: 110 },
    { field: 'landmark', headerName: 'Traffic', width: 120 },
    { field: 'mediaType', headerName: 'Type', width: 110 },
    { field: 'latitude', headerName: 'Latitude', width: 100 },
    { field: 'longitude', headerName: 'Longitude', width: 100 },
    { field: 'state', headerName: 'State', width: 120 },
    { field: 'city', headerName: 'City', width: 120 },
    { field: 'mediaVehicle', headerName: 'Media vehicle', width: 130 },
    { field: 'mediaCategory', headerName: 'Media category', width: 130 },
    { field: 'quantity', headerName: 'Quantity', width: 90 },
    { field: 'mrp', headerName: 'MRP', width: 100 },
    { field: 'discountedPrice', headerName: 'Discounted MRP', width: 130 },
  ];

  const handleStateSelect = (state) => {
    setSelectedState(state);
    toast.success(`${state} selected`);
  };

  const handleDownloadTemplate = () => {
    window.open(HOARDING_EXCEL_TEMPLATE_URL, '_blank', 'noopener,noreferrer');
    toast.success('Opening official hoarding template…');
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    if (!selectedState) {
      toast.error('Please select a state first');
      return;
    }

    setExcelFile(file);
    parseExcelFile(file);
  };

  const parseExcelFile = (file) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        if (jsonData.length === 0) {
          toast.error('Excel file is empty');
          return;
        }

        const num = (v) => {
          if (v === undefined || v === null || v === '') return 0;
          const n = Number(String(v).replace(/,/g, '').trim());
          return Number.isFinite(n) ? n : 0;
        };
        const str = (...vals) => {
          for (const v of vals) {
            if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
          }
          return '';
        };
        /** Match Excel column regardless of underscores/spaces/case (align with BXI Hoarding_Excel_Process). */
        const normHeader = (h) =>
          String(h || '')
            .replace(/^\ufeff/, '')
            .replace(/\u00a0/g, ' ')
            .replace(/[\\／∕]/g, '/')
            .replace(/_/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
        const buildNormRow = (row) => {
          const map = {};
          for (const [k, v] of Object.entries(row)) {
            map[normHeader(k)] = v;
          }
          return map;
        };
        const cellByNorm = (row, ...aliases) => {
          const map = buildNormRow(row);
          for (const a of aliases) {
            const v = map[normHeader(a)];
            if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
          }
          return '';
        };
        const cellMediaName = (row) => {
          const v = cellByNorm(row, 'Media', 'media', 'Name*', 'Name', 'media name');
          if (v) return v;
          const map = buildNormRow(row);
          for (const [nk, val] of Object.entries(map)) {
            if (nk === 'media' || nk === 'media name') {
              if (val !== undefined && val !== null && String(val).trim() !== '') return String(val).trim();
            }
          }
          return '';
        };
        const cellSiteLocation = (row) => {
          const v = cellByNorm(
            row,
            'Site_Name/Location',
            'Site Name/Location',
            'Site name / location',
            'Area*',
            'Area'
          );
          if (v) return v;
          const map = buildNormRow(row);
          for (const [nk, val] of Object.entries(map)) {
            if (nk.includes('site') && nk.includes('location')) {
              if (val !== undefined && val !== null && String(val).trim() !== '') return String(val).trim();
            }
          }
          return '';
        };
        // Map and validate data (legacy * columns + new template: Sr_No, Media, Site_Name/Location, …)
        const mappedData = jsonData.map((row, index) => {
          const w = num(row['Width (ft.)*'] ?? row['Width (ft.)'] ?? row.Width ?? row.width ?? row['Width']);
          const h = num(row['Height (ft.)*'] ?? row['Height (ft.)'] ?? row.Height ?? row.height ?? row['Height']);
          const totalSq = num(
            row['Total Sq. ft'] ?? row['Total sq. ft'] ?? row['Size (Sq.Ft)*'] ?? row['Size'] ?? row.size
          );
          const sizeVal = totalSq > 0 ? totalSq : w > 0 && h > 0 ? w * h : 0;
          return {
            id: index + 1,
            name: str(cellMediaName(row), row['Name*'], row.Name, row.Media, row.media),
            area: str(cellSiteLocation(row), row['Area*'], row.Area, row['Site_Name/Location']),
            landmark: str(row.Landmark, row.Traffic, row.traffic),
            state: str(row['State*'], row.State, row.state) || selectedState,
            city: str(row['City*'], row.City, row.city),
            latitude: str(row.Latitude, row.Lat, row.lat),
            longitude: str(row.Longitude, row.Long, row.long),
            mediaVehicle: str(row['Media Vehicle*'], row['Media Vehicle'], row['Media vehicle']) || 'Hoarding',
            mediaCategory: str(row['Media Category*'], row['Media Category'], row['Media category']) || 'Outdoor',
            mediaType: str(row['Media Type*'], row['Media Type'], row.Type, row.type) || 'Static',
            quantity: row['Quantity*'] ?? row['Quantity'] ?? row.quantity ?? 1,
            size: sizeVal,
            width: w,
            height: h,
            mrp: num(row['MRP*'] ?? row.MRP ?? row.mrp),
            discountedPrice: num(
              row['Discounted MRP*'] ??
                row['Discounted MRP'] ??
                row['Discounted_MRP'] ??
                row['Counted_M'] ??
                row.counted_m
            ),
          };
        });

        setHoardingData(mappedData);
        toast.success(`${mappedData.length} hoardings loaded from Excel`);
      } catch (error) {
        toast.error('Failed to parse Excel file');
      }
    };

    reader.onerror = () => {
      toast.error('Failed to read file');
    };

    reader.readAsArrayBuffer(file);
  };

  const handleUploadExcel = async () => {
    if (!excelFile || hoardingData.length === 0) {
      toast.error('Please upload a valid Excel file first');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      // BXI multer expects field name "file" (see product_routes Hoarding_Excel_Process).
      formData.append('file', excelFile);
      formData.append('ProductId', id);
      formData.append('ProductType', 'Media');
      formData.append('ProductCategory', 'MediaOffline');
      formData.append('ProductSubCategory', productSubCategory);
      formData.append('ProductUploadStatus', 'productinformation');
      formData.append('ListingType', 'Media');

      const response = await api.post('/product/Hoarding_Excel_Process', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const listId =
        response?.data?.data?._id ||
        response?.data?.Hoarding_list_id ||
        response?.data?.data?.Hoarding_list_id;
      
      if (listId) {
        setHoardingListId(listId);
        const listingPrices = response?.data?.listingPriceFromScreens;
        if (
          listingPrices &&
          (listingPrices.PricePerUnit != null ||
            listingPrices.DiscountedPrice != null)
        ) {
          toast.success(
            'Hoarding data uploaded. Listing price set from minimum row values.',
          );
        } else {
          toast.success('Hoarding data uploaded successfully!');
        }
      } else {
        toast.error('Failed to get Hoarding List ID from response');
      }
    } catch (error) {
      console.error('Error uploading:', error);
      toast.error(error?.response?.data?.message || 'Failed to upload hoarding data');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async () => {
    if (!hoardingListId) {
      toast.error('Please upload hoarding Excel file first');
      return;
    }

    if (tags.length === 0) {
      toast.error('Please add at least one tag');
      return;
    }

    setIsSubmitting(true);
    try {
      const listing = computeMinListingPricesFromHoardingRows(hoardingData);
      // HoardingsController uses req.body.id (not _id) to choose update vs create.
      const payload = {
        id,
        ProductUploadStatus: 'technicalinformation',
        ListingType: 'Media',
        Hoarding_list_id: hoardingListId,
        hoardings_list: hoardingData,
        GeographicalData: {
          state: selectedState,
          region: '',
          city: '',
          landmark: '',
        },
        mediaVariation: {
          unit: 'Screen',
          Timeline: 'Week',
          MinOrderQuantity: '1',
          MaxOrderQuantity: '1',
          ...(listing.PricePerUnit != null && {
            PricePerUnit: listing.PricePerUnit,
          }),
          ...(listing.DiscountedPrice != null && {
            DiscountedPrice: listing.DiscountedPrice,
          }),
        },
        tags,
      };

      await api.post('/product/product_mutation_hoardings', payload);
      toast.success('Hoarding product information saved!');
      navigate(`/mediaoffline/mediaofflinehoardingtechinfo/${id}`);
    } catch (error) {
      console.error('Error:', error);
      toast.error(error?.response?.data?.message || 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-8">
      <div className="form-container">
        <div className="stepper-layout">
          <aside className="stepper-rail">
            <Stepper currentStep={2} category="mediaoffline" completedSteps={[1]} />
          </aside>
          <main className="stepper-content">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-bold text-[#111827] mb-2">Hoarding Product Information</h2>
          <p className="text-sm text-[#6B7A99]">
            Select state, download template, upload hoarding data
          </p>
        </div>

        {/* Step 1: State Selection */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-[#111827] mb-4">
            Step 1: Select State <span className="text-red-500">*</span>
          </h3>
          {selectedState && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-sm text-green-800">
                Selected State: <strong>{selectedState}</strong>
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {INDIAN_STATES.map((state) => (
              <button
                key={state}
                type="button"
                onClick={() => handleStateSelect(state)}
                className={`p-3 text-sm rounded-lg border-2 transition-all ${
                  selectedState === state
                    ? 'border-[#C64091] bg-[#FCE7F3] text-[#C64091] font-semibold'
                    : 'border-[#E5E8EB] hover:border-[#C64091] hover:bg-[#F8F9FA]'
                }`}
              >
                {state}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Download Template */}
        {selectedState && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-[#111827] mb-4">
              Step 2: Download Excel Template
            </h3>
            <p className="text-sm text-[#6B7A99] mb-4">
              Download the Excel template, fill in your hoarding details, and upload it back.
            </p>
            <Button
              onClick={handleDownloadTemplate}
              variant="outline"
              className="border-[#C64091] text-[#C64091]"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Hoarding Template
            </Button>
          </div>
        )}

        {/* Step 3: Upload Excel */}
        {selectedState && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-[#111827] mb-4">
              Step 3: Upload Filled Excel File
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="border-[#C64091] text-[#C64091]"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose Excel File
                </Button>
                {excelFile && (
                  <div className="flex items-center gap-2 text-sm">
                    <FileSpreadsheet className="w-4 h-4 text-[#C64091]" />
                    <span>{excelFile.name}</span>
                  </div>
                )}
              </div>

              {hoardingListId && (
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-sm text-green-800">
                    ✓ {hoardingData.length} hoardings uploaded successfully! (List ID: {hoardingListId})
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Preview Data */}
        {hoardingData.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6 mb-4">
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-[#111827]">
                  Hoarding Data Preview ({hoardingData.length} hoardings)
                </h3>
                <p className="text-sm text-[#6B7A99] mt-1">
                  Review the grid below, then upload to save this list to your product.
                </p>
              </div>
              {!hoardingListId && (
                <Button
                  type="button"
                  onClick={handleUploadExcel}
                  disabled={isUploading}
                  className="shrink-0 w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#C64091] hover:bg-[#A03375] text-white font-semibold rounded-lg px-5 py-2.5 shadow-sm"
                >
                  {isUploading ? (
                    'Uploading...'
                  ) : (
                    <>
                      Upload {hoardingData.length} hoardings
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
            <div className="rounded-lg border border-[#E5E8EB] overflow-hidden" style={{ height: 400, width: '100%' }}>
              <DataGrid
                rows={hoardingData}
                columns={columns}
                pageSize={10}
                rowsPerPageOptions={[10, 25, 50]}
                disableSelectionOnClick
                sx={{
                  border: 'none',
                  '& .MuiDataGrid-cell': { fontSize: '0.875rem' },
                  '& .MuiDataGrid-columnHeaders': { backgroundColor: '#F8F9FA', fontWeight: 600 },
                }}
              />
            </div>
          </div>
        )}
        

        {/* Tags */}
        {hoardingListId && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-[#111827] mb-4">
              Tags <span className="text-red-500">*</span>
            </h3>
            <Input
              placeholder="Type a tag and press Enter"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
            />
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {tags.map((tag, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag} <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}
            {tags.length === 0 && (
              <p className="text-sm text-[#6B7A99] mt-2">Add at least one tag before proceeding</p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => navigate(`/mediaoffline/general-info/${id}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !hoardingListId || tags.length === 0}
            className="bg-[#C64091] hover:bg-[#A03375]"
          >
            {isSubmitting ? 'Saving...' : 'Save & Next'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
          </main>
        </div>
      </div>
    </div>
  );
}
