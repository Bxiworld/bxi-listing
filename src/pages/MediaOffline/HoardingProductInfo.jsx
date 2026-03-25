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
  const fileInputRef = useRef(null);

  // DataGrid columns matching bxi-dashboard
  const columns = [
    { field: 'id', headerName: 'Sr No', width: 70 },
    { field: 'name', headerName: 'Name', width: 150 },
    { field: 'area', headerName: 'Area', width: 130 },
    { field: 'landmark', headerName: 'Landmark', width: 130 },
    { field: 'state', headerName: 'State', width: 120 },
    { field: 'city', headerName: 'City', width: 120 },
    { field: 'latitude', headerName: 'Latitude', width: 100 },
    { field: 'longitude', headerName: 'Longitude', width: 100 },
    { field: 'mediaVehicle', headerName: 'Media Vehicle', width: 130 },
    { field: 'mediaCategory', headerName: 'Media Category', width: 130 },
    { field: 'mediaType', headerName: 'Media Type', width: 130 },
    { field: 'quantity', headerName: 'Quantity', width: 90 },
    { field: 'size', headerName: 'Size (Sq.Ft)', width: 110 },
    { field: 'mrp', headerName: 'MRP', width: 100 },
    { field: 'discountedPrice', headerName: 'Discounted Price', width: 140 },
  ];

  const handleStateSelect = (state) => {
    setSelectedState(state);
    toast.success(`${state} selected`);
  };

  const handleDownloadTemplate = () => {
    // Create Excel template for hoarding bulk upload
    const wb = XLSX.utils.book_new();
    
    const headers = [
      'Name*', 'Area*', 'Landmark', 'State*', 'City*', 
      'Latitude', 'Longitude', 'Media Vehicle*', 'Media Category*', 
      'Media Type*', 'Quantity*', 'Size (Sq.Ft)*', 'MRP*', 'Discounted Price*'
    ];
    
    const sampleData = [
      [
        'Main Road Hoarding',
        'Andheri West',
        'Near Railway Station',
        selectedState || 'Maharashtra',
        'Mumbai',
        '19.1136',
        '72.8697',
        'Hoarding',
        'Outdoor',
        'Static',
        '1',
        '100',
        '50000',
        '45000'
      ]
    ];
    
    const wsData = [headers, ...sampleData];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Set column widths
    ws['!cols'] = headers.map(() => ({ wch: 18 }));
    
    XLSX.utils.book_append_sheet(wb, ws, 'Hoardings');
    
    // Add instructions sheet
    const instructionsData = [
      ['Hoarding Bulk Upload Instructions'],
      [''],
      ['Important Notes:'],
      ['1. Fields marked with * are mandatory'],
      ['2. Do not modify the header row'],
      ['3. State must match the selected state'],
      ['4. Latitude/Longitude are optional but recommended'],
      ['5. Size should be in Square Feet'],
      ['6. MRP and Discounted Price in INR'],
      ['7. Quantity is typically 1 per hoarding'],
      ['8. Delete the sample row before uploading'],
      ['9. Maximum 500 hoardings per upload'],
      [''],
      [selectedState ? `Selected State: ${selectedState}` : 'Please select a state first'],
    ];
    const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);
    wsInstructions['!cols'] = [{ wch: 60 }];
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');
    
    // Generate and download
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Hoarding_Template_${selectedState || 'India'}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Template downloaded successfully!');
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

        // Map and validate data
        const mappedData = jsonData.map((row, index) => ({
          id: index + 1,
          name: row['Name*'] || row['Name'] || '',
          area: row['Area*'] || row['Area'] || '',
          landmark: row['Landmark'] || '',
          state: row['State*'] || row['State'] || selectedState,
          city: row['City*'] || row['City'] || '',
          latitude: row['Latitude'] || '',
          longitude: row['Longitude'] || '',
          mediaVehicle: row['Media Vehicle*'] || row['Media Vehicle'] || 'Hoarding',
          mediaCategory: row['Media Category*'] || row['Media Category'] || 'Outdoor',
          mediaType: row['Media Type*'] || row['Media Type'] || 'Static',
          quantity: row['Quantity*'] || row['Quantity'] || 1,
          size: row['Size (Sq.Ft)*'] || row['Size'] || 0,
          mrp: row['MRP*'] || row['MRP'] || 0,
          discountedPrice: row['Discounted Price*'] || row['Discounted Price'] || 0,
        }));

        // Validate required fields
        const invalidRows = mappedData.filter(
          (row) => !row.name || !row.area || !row.state || !row.city || !row.size || !row.mrp
        );

        if (invalidRows.length > 0) {
          toast.error(`${invalidRows.length} rows have missing required fields`);
          return;
        }

        setHoardingData(mappedData);
        toast.success(`${mappedData.length} hoardings loaded from Excel`);
      } catch (error) {
        console.error('Error parsing Excel:', error);
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
      formData.append('excelFile', excelFile);
      formData.append('productId', id);
      formData.append('state', selectedState);
      formData.append('hoardingData', JSON.stringify(hoardingData));

      const response = await api.post('/product/Hoarding_Excel_Process', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const listId = response?.data?.Hoarding_list_id || response?.data?.data?.Hoarding_list_id;
      
      if (listId) {
        setHoardingListId(listId);
        toast.success('Hoarding data uploaded successfully!');
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
      const payload = {
        _id: id,
        ProductUploadStatus: 'technicalinformation',
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
        },
        ProductTags: tags,
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
              Download Hoarding Template ({selectedState})
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

              {hoardingData.length > 0 && !hoardingListId && (
                <Button
                  onClick={handleUploadExcel}
                  disabled={isUploading}
                  className="bg-[#C64091] hover:bg-[#A03375]"
                >
                  {isUploading ? 'Uploading...' : `Upload ${hoardingData.length} Hoardings`}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}

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
            <h3 className="text-lg font-semibold text-[#111827] mb-4">
              Hoarding Data Preview ({hoardingData.length} hoardings)
            </h3>
            <div style={{ height: 400, width: '100%' }}>
              <DataGrid
                rows={hoardingData}
                columns={columns}
                pageSize={10}
                rowsPerPageOptions={[10, 25, 50]}
                disableSelectionOnClick
                sx={{
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
    </div>
  );
}
