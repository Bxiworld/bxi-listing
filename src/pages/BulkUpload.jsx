import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileSpreadsheet, Download, ArrowLeft, X, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { bulkUploadApi } from '../utils/api';

export default function BulkUpload({ category = 'textile' }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    validateAndSetFile(droppedFile);
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    validateAndSetFile(selectedFile);
  };

  const validateAndSetFile = (selectedFile) => {
    if (!selectedFile) return;

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];

    if (!validTypes.includes(selectedFile.type)) {
      toast.error('Please upload an Excel (.xlsx, .xls) or CSV file');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('File size should be less than 10MB');
      return;
    }

    setFile(selectedFile);
    toast.success('File selected successfully');
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await bulkUploadApi.uploadBulkFile(formData);
      toast.success('File uploaded successfully! Products are being processed.');
      navigate('/sellerhub');
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    // TODO: Implement actual template download
    toast.info('Template download will be available soon');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-8" data-testid="bulk-upload-page">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/sellerhub')}
            className="mb-4 text-gray-600 hover:text-[#C64091]"
            data-testid="btn-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Seller Hub
          </Button>
          
          <h1 
            className="text-2xl font-bold text-gray-900"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            Bulk Upload - {categoryLabel}
          </h1>
          <p className="text-gray-600 mt-2">
            Upload multiple products at once using an Excel or CSV file.
          </p>
        </div>

        {/* Upload Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {/* Instructions */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Instructions:</h3>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Download the template file to see the required format</li>
              <li>Fill in your product details in the spreadsheet</li>
              <li>Upload the completed file (Excel or CSV)</li>
              <li>Maximum file size: 10MB</li>
            </ul>
          </div>

          {/* Template Download */}
          <Button
            variant="outline"
            onClick={handleDownloadTemplate}
            className="mb-6 text-[#C64091] border-[#C64091] hover:bg-[#FCE7F3]"
            data-testid="btn-download-template"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </Button>

          {/* Dropzone */}
          <div
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
              isDragging 
                ? 'border-[#C64091] bg-[#FCE7F3]' 
                : 'border-gray-300 hover:border-[#C64091] hover:bg-gray-50',
              file && 'border-emerald-400 bg-emerald-50'
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !file && fileInputRef.current?.click()}
            data-testid="dropzone"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".xlsx,.xls,.csv"
              className="hidden"
              data-testid="file-input"
            />

            {file ? (
              <div className="flex items-center justify-center gap-4">
                <FileSpreadsheet className="w-12 h-12 text-emerald-600" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile();
                  }}
                  className="text-gray-400 hover:text-red-600"
                  data-testid="btn-remove-file"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            ) : (
              <>
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">
                  <span className="font-medium text-[#C64091]">Click to upload</span> or drag and drop
                </p>
                <p className="text-sm text-gray-500">
                  Excel (.xlsx, .xls) or CSV files only
                </p>
              </>
            )}
          </div>

          {/* Upload Button */}
          {file && (
            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="bg-[#C64091] hover:bg-[#A03375]"
                data-testid="btn-upload"
              >
                {isUploading ? (
                  <>Processing...</>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Upload & Process
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
