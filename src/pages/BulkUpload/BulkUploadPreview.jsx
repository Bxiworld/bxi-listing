import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { ArrowLeft, Upload, Check, X, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import api from '../../utils/api';

export default function BulkUploadPreview() {
  const navigate = useNavigate();
  const location = useLocation();
  const [file, setFile] = useState(null);
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const category = location.state?.category || 'unknown';

  // Required fields by category
  const REQUIRED_FIELDS = {
    electronics: ['Product Name*', 'Product Description*', 'Price*', 'Min Order Quantity*', 'GST*', 'Stock Quantity*', 'Manufacturing Date (YYYY-MM-DD)*'],
    fmcg: ['Product Name*', 'Product Description*', 'Product Form (Dry/Wet)*', 'Size/Volume*', 'Measurement Unit*', 'Price*', 'Min Order Quantity*', 'GST*', 'Stock Quantity*', 'Manufacturing Date (YYYY-MM-DD)*', 'Expiry Date (YYYY-MM-DD)*'],
    officesupply: ['Product Name*', 'Product Description*', 'Price*', 'Min Order Quantity*', 'GST*', 'Stock Quantity*'],
    restaurant: ['Product Name*', 'Product Description*', 'Price*', 'Min Order Quantity*', 'GST*'],
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      toast.error('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setFile(selectedFile);
    parseExcel(selectedFile);
  };

  const parseExcel = (file) => {
    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        if (jsonData.length < 2) {
          toast.error('Excel file is empty or has no data rows');
          setIsProcessing(false);
          return;
        }

        const headers = jsonData[0];
        const rows = jsonData.slice(1).filter((row) => row.some((cell) => cell));

        setHeaders(headers);
        setData(rows);
        validateData(headers, rows);
        toast.success(`Loaded ${rows.length} products from Excel`);
      } catch (error) {
        console.error('Error parsing Excel:', error);
        toast.error('Failed to parse Excel file');
      } finally {
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      toast.error('Failed to read file');
      setIsProcessing(false);
    };

    reader.readAsArrayBuffer(file);
  };

  const validateData = (headers, rows) => {
    const errors = [];
    const requiredFields = REQUIRED_FIELDS[category] || [];

    // Check if all required headers are present
    const missingHeaders = requiredFields.filter((field) => !headers.includes(field));
    if (missingHeaders.length > 0) {
      errors.push({
        type: 'header',
        message: `Missing required columns: ${missingHeaders.join(', ')}`,
      });
    }

    // Validate each row
    rows.forEach((row, rowIndex) => {
      const rowErrors = [];

      // Check required fields
      requiredFields.forEach((field) => {
        const colIndex = headers.indexOf(field);
        if (colIndex === -1) return; // Header missing, already caught above

        const value = row[colIndex];
        if (value === undefined || value === null || value === '') {
          rowErrors.push(`${field.replace('*', '')} is empty`);
        }
      });

      // Validate price
      const priceIndex = headers.indexOf('Price*');
      if (priceIndex !== -1 && row[priceIndex]) {
        const price = parseFloat(row[priceIndex]);
        if (isNaN(price) || price <= 0) {
          rowErrors.push('Price must be a positive number');
        }
      }

      // Validate GST
      const gstIndex = headers.indexOf('GST*');
      if (gstIndex !== -1 && row[gstIndex]) {
        const gst = parseFloat(row[gstIndex]);
        if (isNaN(gst) || gst < 0 || gst > 100) {
          rowErrors.push('GST must be between 0 and 100');
        }
      }

      // Validate dates
      if (category === 'electronics' || category === 'fmcg') {
        const mfgDateIndex = headers.indexOf('Manufacturing Date (YYYY-MM-DD)*');
        if (mfgDateIndex !== -1 && row[mfgDateIndex]) {
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (!dateRegex.test(row[mfgDateIndex])) {
            rowErrors.push('Manufacturing Date must be in YYYY-MM-DD format');
          }
        }
      }

      if (category === 'fmcg') {
        const expiryDateIndex = headers.indexOf('Expiry Date (YYYY-MM-DD)*');
        if (expiryDateIndex !== -1 && row[expiryDateIndex]) {
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (!dateRegex.test(row[expiryDateIndex])) {
            rowErrors.push('Expiry Date must be in YYYY-MM-DD format');
          }
        }
      }

      if (rowErrors.length > 0) {
        errors.push({
          type: 'row',
          rowIndex: rowIndex + 1,
          message: rowErrors.join(', '),
        });
      }
    });

    setValidationErrors(errors);

    if (errors.length === 0) {
      toast.success('All data validated successfully!');
    } else {
      toast.warning(`Found ${errors.length} validation issues`);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('No file selected');
      return;
    }

    if (validationErrors.length > 0) {
      toast.error('Please fix validation errors before uploading');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('bulkFile', file);
      formData.append('category', category);

      await api.post('/product/bulk_upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success(`${data.length} products uploaded successfully!`);
      
      // Navigate to products list
      const showProductsPath = getCategoryShowProductsPath(category);
      navigate(`/${showProductsPath}`);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to upload products');
    } finally {
      setIsUploading(false);
    }
  };

  const getCategoryShowProductsPath = (cat) => {
    const pathMap = {
      electronics: 'electronicBulkuploadshowproducts',
      fmcg: 'fmcgBulkuploadshowproducts',
      officesupply: 'officesupplyBulkuploadshowproducts',
      restaurant: 'resturantBulkuploadshowproducts',
    };
    return pathMap[cat] || 'sellerhub';
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-[#111827]">Bulk Upload Preview</h2>
              <p className="text-sm text-[#6B7A99]">
                Review and validate your data before uploading
              </p>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Badge>
          </div>

          {/* File Upload */}
          {!file && (
            <div className="border-2 border-dashed border-[#E5E8EB] rounded-lg p-12 text-center">
              <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 text-[#6B7A99]" />
              <h3 className="text-lg font-semibold text-[#111827] mb-2">
                Upload your Excel file
              </h3>
              <p className="text-sm text-[#6B7A99] mb-6">
                Drag and drop or click to browse (.xlsx or .xls, max 10MB)
              </p>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button asChild className="bg-[#C64091] hover:bg-[#A03375]">
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </span>
                </Button>
              </label>
            </div>
          )}

          {/* File Info & Re-upload */}
          {file && (
            <div className="mb-6 p-4 bg-[#F8F9FA] rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-6 h-6 text-[#C64091]" />
                  <div>
                    <p className="font-semibold text-[#111827]">{file.name}</p>
                    <p className="text-sm text-[#6B7A99]">
                      {(file.size / 1024).toFixed(2)} KB • {data.length} products
                    </p>
                  </div>
                </div>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-reupload"
                />
                <label htmlFor="file-reupload">
                  <Button variant="outline" asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      Change File
                    </span>
                  </Button>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <h3 className="text-lg font-semibold text-[#111827]">
                Validation Errors ({validationErrors.length})
              </h3>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {validationErrors.map((error, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-red-50 border border-red-200 rounded text-sm"
                >
                  {error.type === 'header' ? (
                    <p className="text-red-700">
                      <strong>Header Error:</strong> {error.message}
                    </p>
                  ) : (
                    <p className="text-red-700">
                      <strong>Row {error.rowIndex}:</strong> {error.message}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Data Preview */}
        {data.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#111827]">
                Data Preview ({data.length} products)
              </h3>
              {validationErrors.length === 0 && (
                <Badge className="bg-green-500">
                  <Check className="w-4 h-4 mr-1" />
                  Validated
                </Badge>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-[#F8F9FA]">
                    <th className="text-left p-3 font-semibold text-[#6B7A99] border">#</th>
                    {headers.map((header, idx) => (
                      <th
                        key={idx}
                        className="text-left p-3 font-semibold text-[#6B7A99] border whitespace-nowrap"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0, 50).map((row, rowIdx) => (
                    <tr key={rowIdx} className="hover:bg-[#F8F9FA]">
                      <td className="p-3 border text-[#6B7A99]">{rowIdx + 1}</td>
                      {row.map((cell, cellIdx) => (
                        <td key={cellIdx} className="p-3 border text-[#111827]">
                          {cell || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.length > 50 && (
                <p className="text-center text-sm text-[#6B7A99] mt-4">
                  Showing first 50 rows. Total: {data.length} rows
                </p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        {file && (
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={handleUpload}
              disabled={isUploading || validationErrors.length > 0 || data.length === 0}
              className="bg-[#C64091] hover:bg-[#A03375]"
            >
              {isUploading ? (
                'Uploading...'
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Upload {data.length} Products
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
