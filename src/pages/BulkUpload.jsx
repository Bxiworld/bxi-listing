import React, { useState, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Upload, FileSpreadsheet, Download, ArrowLeft, X, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { bulkUploadApi } from '../utils/api';
import { downloadBulkUploadTemplate, downloadRemoteBulkTemplate } from '../utils/excelTemplates';

export default function BulkUpload({ category = 'textile' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const resolvedCategory = useMemo(
    () => location.state?.bulkUploadCategory || category,
    [location.state?.bulkUploadCategory, category],
  );
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const categoryLabel =
    resolvedCategory.charAt(0).toUpperCase() + resolvedCategory.slice(1);

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
      // BXI bulk_upload_controller expects category|subcategory|data (e.g. lifestyle → Product_Lifestyle)
      formData.append('category', resolvedCategory);
      const { data } = await bulkUploadApi.uploadBulkFile(formData);

      if (data?.success && data?.processing) {
        toast.success(
          data?.bulkUpload_response?.message ||
            'File submitted. AI is processing your spreadsheet.',
        );
        navigate('/bulkupload/status', {
          replace: true,
          state: {
            jobId: data?.bulkUpload_response?.job_id,
            webhookId: data?.webhook_response?._id,
            storeResponse: data?.storeResponse,
            fileName: file.name,
            category: resolvedCategory,
            initialMessage: data?.bulkUpload_response?.message,
          },
        });
        return;
      }

      toast.success('File uploaded successfully!');
      navigate('/sellerhub');
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    const remote = await downloadRemoteBulkTemplate(resolvedCategory);
    if (remote === 'saved') {
      toast.success('Template downloaded');
      return;
    }
    if (remote === 'opened') {
      toast.info('Opening template in a new tab');
      return;
    }
    const ok = downloadBulkUploadTemplate(resolvedCategory);
    if (ok) {
      toast.success('Template downloaded');
      return;
    }
    toast.info('Template download will be available soon');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-8" data-testid="bulk-upload-page">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span className="font-semibold text-gray-700">Flow:</span>
            <span
              className={cn(
                'rounded-full px-2.5 py-1 font-medium',
                'bg-emerald-100 text-emerald-800',
              )}
            >
              1 · Template
            </span>
            <span className="text-gray-300">→</span>
            <span
              className={cn(
                'rounded-full px-2.5 py-1 font-medium',
                file ? 'bg-emerald-100 text-emerald-800' : 'bg-[#FCE7F3] text-[#C64091]',
              )}
            >
              2 · Upload file
            </span>
            <span className="text-gray-300">→</span>
            <span className="rounded-full px-2.5 py-1 font-medium bg-gray-100 text-gray-500">
              3 · AI and validation
            </span>
          </div>
        </div>

        {/* Upload Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-gray-100 bg-gray-50/50">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#C64091]">Step 1</p>
            <h2
              className="text-lg font-bold text-gray-900 mt-1"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              Get the template
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              Use the official layout for {categoryLabel} so columns match what our system expects.
            </p>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside mt-4">
              <li>Download the template and fill in your product rows</li>
              <li>Maximum file size when you upload: 10MB</li>
            </ul>
            <Button
              variant="outline"
              onClick={handleDownloadTemplate}
              className="mt-5 text-[#C64091] border-[#C64091] hover:bg-[#FCE7F3]"
              data-testid="btn-download-template"
            >
              <Download className="w-4 h-4 mr-2" />
              Download template
            </Button>
          </div>

          <div className="p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#C64091]">Step 2</p>
            <h2
              className="text-lg font-bold text-gray-900 mt-1"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              Upload your completed file
            </h2>
            <p className="text-sm text-gray-600 mt-2 mb-6">
              Excel (.xlsx, .xls) or CSV. After upload you will move to the tracking page for AI
              processing and optional re-validation.
            </p>

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
                    Upload and go to step 3
                  </>
                )}
              </Button>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
