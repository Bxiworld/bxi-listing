import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, Download, Upload, X, Info } from 'lucide-react';
import { DataGrid } from '@mui/x-data-grid';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import api, { mediaApi } from '../../utils/api';
import StateData from '../../utils/StateCityArray.json';
import { Stepper } from '../AddProduct/AddProductSteps';

/** Radix Select forbids SelectItem value=""; use sentinel for “show all states”. */
const ALL_STATES_VALUE = '__all_states__';

const columns = [
  { field: 'srNo', headerName: 'Sr No', width: 80 },
  { field: 'city', headerName: 'City', width: 130 },
  { field: 'location', headerName: 'Location', width: 200 },
  { field: 'cinema', headerName: 'Cinema', width: 200 },
  { field: 'audiNum', headerName: 'Audi #', width: 100 },
  { field: 'seatingCapacity', headerName: 'Seats', width: 120 },
  { field: 'screenCode', headerName: 'Screen Code', width: 150 },
  { field: 'casCodes', headerName: 'CAS Codes', width: 130 },
  { field: 'uploadCodes', headerName: 'Upload Codes', width: 130 },
  { field: 'PricePerUnit', headerName: 'Price', width: 100 },
  { field: 'DiscountedPrice', headerName: 'Discounted Price', width: 150 },
];

/** API returns { screens: [...] } (Mongo subdocs use lowercase geo fields). */
function mapMultiplexDocToGridRows(doc) {
  if (!doc) return [];
  const list = Array.isArray(doc.screens)
    ? doc.screens
    : Array.isArray(doc)
      ? doc
      : [];
  return list.map((s, idx) => ({
    id: s._id?.toString?.() || `row-${idx}-${s.screenCode || ''}`,
    srNo: s.srNo ?? idx + 1,
    city: s.city || '',
    location: s.location || '',
    cinema: s.cinema || '',
    audiNum: s.audiNum ?? '',
    seatingCapacity: s.seatingCapacity ?? '',
    screenCode: s.screenCode || '',
    casCodes: s.casCodes ?? s.CASCodes ?? '',
    uploadCodes: s.uploadCodes ?? s.UploadCodes ?? '',
    PricePerUnit: s.PricePerUnit ?? 0,
    DiscountedPrice: s.DiscountedPrice ?? 0,
  }));
}

const schema = z.object({
  GST: z.string().min(1, 'GST is required'),
  location: z.string().min(1, 'Location is required'),
  repetition: z.string().min(1, 'Repetition is required'),
  dimensionSize: z.string().min(1, 'Dimension size is required'),
  minOrderQuantity: z.coerce.number().positive('Must be positive').min(1),
  maxOrderQuantity: z.coerce.number().positive('Must be positive').min(1),
});

export default function MediaMultiplexProductInfo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [file, setFile] = useState(null);
  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [selectedState, setSelectedState] = useState(ALL_STATES_VALUE);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [mediaVariations, setMediaVariations] = useState([]);
  const [productData, setProductData] = useState(null);
  const fileInputRef = useRef(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      GST: '18',
      location: '',
      repetition: '',
      dimensionSize: '',
      minOrderQuantity: 1,
      maxOrderQuantity: 100,
    },
  });

  // Fetch existing product data
  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/product/get_product_byId/${id}`);
        setProductData(res?.data);
        if (res?.data?.tags) setTags(res.data.tags);
      } catch (error) {
        console.error('Error fetching product:', error);
      }
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    setSelectedState(ALL_STATES_VALUE);
  }, [id]);

  // Fetch multiplex screens (id = productId; API resolves MultiplexScreen by ProductId)
  useEffect(() => {
    if (!id) return;
    const fetchScreens = async () => {
      try {
        const res = await mediaApi.getMultiplexScreensById(id);
        const mappedRows = mapMultiplexDocToGridRows(res?.data?.data);
        setRows(mappedRows);
        setFilteredRows(mappedRows);
      } catch (error) {
        const status = error?.response?.status;
        // No MultiplexScreen doc yet (user has not uploaded Excel) — expected, not an error.
        if (status === 404) {
          setRows([]);
          setFilteredRows([]);
          return;
        }
        console.error('Error fetching screens:', error);
      }
    };
    fetchScreens();
  }, [id]);

  // Filter rows by state
  useEffect(() => {
    if (!selectedState || selectedState === ALL_STATES_VALUE) {
      setFilteredRows(rows);
    } else {
      setFilteredRows(rows.filter((r) => {
        const cityObj = StateData.find((s) => s.name === selectedState);
        return cityObj?.data?.some((c) => c.toLowerCase() === r.city.toLowerCase());
      }));
    }
  }, [selectedState, rows]);

  const handleExcelUpload = async (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('ProductId', id);

    try {
      toast.loading('Processing Excel file...');
      const res = await mediaApi.uploadMultiplexExcel(formData);
      toast.dismiss();
      toast.success('Excel processed successfully!');

      let mappedRows = mapMultiplexDocToGridRows(res?.data?.data);
      if (mappedRows.length === 0 && id) {
        try {
          const screensRes = await mediaApi.getMultiplexScreensById(id);
          mappedRows = mapMultiplexDocToGridRows(screensRes?.data?.data);
        } catch (refetchErr) {
          if (refetchErr?.response?.status !== 404) {
            throw refetchErr;
          }
        }
      }
      setRows(mappedRows);
      setFilteredRows(mappedRows);
      setFile(selectedFile);
    } catch (error) {
      toast.dismiss();
      toast.error(error?.response?.data?.message || 'Failed to process Excel');
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

  const handleAddMediaVariation = (data) => {
    const variation = {
      location: data.location,
      repetition: data.repetition,
      dimensionSize: data.dimensionSize,
      minOrderQuantity: data.minOrderQuantity,
      maxOrderQuantity: data.maxOrderQuantity,
    };
    setMediaVariations([...mediaVariations, variation]);
    setValue('location', '');
    setValue('repetition', '');
    setValue('dimensionSize', '');
    toast.success('Media variation added successfully');
  };

  const handleRemoveMediaVariation = (idx) => {
    setMediaVariations(mediaVariations.filter((_, i) => i !== idx));
  };

  const onSubmit = async (data) => {
    if (rows.length === 0) {
      toast.error('Please upload Excel with multiplex screens');
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
        GST: data.GST,
        tags: tags,
        MediaVariation: mediaVariations.length > 0 ? mediaVariations : [{
          location: data.location,
          repetition: data.repetition,
          dimensionSize: data.dimensionSize,
          minOrderQuantity: data.minOrderQuantity,
          maxOrderQuantity: data.maxOrderQuantity,
        }],
      };

      await api.post('/product/product_mutation', payload);
      toast.success('Multiplex product information saved!');
      navigate(`/mediaonline/mediamultiplextechinfo/${id}`);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  // download template funtion with aws url
  const handleDownloadTemplate = () => {
    const fileUrl = 'https://bxidevelopment1.s3.ap-south-1.amazonaws.com/Excels/TemplateOfScreensforMultiplexAds.xlsx';
    window.open(fileUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-8">
      <div className="form-container">
        <div className="stepper-layout">
          <aside className="stepper-rail">
            <Stepper currentStep={2} category="mediaonline" completedSteps={[1]} />
          </aside>
          <main className="stepper-content">
        <div className="form-section">
          <h2 className="form-section-title">Multiplex Product Information</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
            {/* Excel Upload Section */}
            <div className="space-y-4 p-6 border border-[#E5E8EB] rounded-lg bg-white">
              <h3 className="text-base font-semibold text-[#111827]">Upload Multiplex Screens</h3>
              <p className="text-sm text-[#6B7A99]">
                Download the template, fill in screen details, and upload the Excel file
              </p>
              
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDownloadTemplate}
                  className="border-[#C64091] text-[#C64091]"
                >

                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="border-[#C64091] text-[#C64091]"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {file ? 'Change File' : 'Upload Excel'}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleExcelUpload}
                  className="hidden"
                />
              </div>

              {file && (
                <div className="flex items-center gap-2 text-sm text-[#6B7A99]">
                  <Badge variant="secondary">{file.name}</Badge>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="text-[#C64091] hover:underline"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* State Filter */}
            {rows.length > 0 && (
              <div className="space-y-2">
                <Label>Filter by State</Label>
                <Select value={selectedState} onValueChange={setSelectedState}>
                  <SelectTrigger>
                    <SelectValue placeholder="All states" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_STATES_VALUE}>All States</SelectItem>
                    {StateData.map((s) => (
                      <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* DataGrid */}
            {rows.length > 0 && (
              <div className="space-y-2">
                <Label>Multiplex Screens ({filteredRows.length})</Label>
                <div style={{ height: 400, width: '100%' }}>
                  <DataGrid
                    rows={filteredRows}
                    columns={columns}
                    pageSize={5}
                    rowsPerPageOptions={[5, 10, 20]}
                    disableSelectionOnClick
                  />
                </div>
              </div>
            )}

            {/* GST */}
            <div className="space-y-2">
              <Label>GST <span className="text-red-500">*</span></Label>
              <Select
                value={watch('GST')}
                onValueChange={(value) => setValue('GST', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0, 5, 12, 18, 28].map((rate) => (
                    <SelectItem key={rate} value={String(rate)}>{rate}%</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Media Variation */}
            <div className="space-y-4 pt-4 border-t border-[#E5E8EB]">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Location <span className="text-red-500">*</span></Label>
                  <Input placeholder="e.g. Mumbai" {...register('location')} />
                  {errors.location && <p className="text-sm text-red-500">{errors.location.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Repetition <span className="text-red-500">*</span></Label>
                  <Input placeholder="e.g. 10 times/day" {...register('repetition')} />
                  {errors.repetition && <p className="text-sm text-red-500">{errors.repetition.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Dimension Size <span className="text-red-500">*</span></Label>
                  <Input placeholder="e.g. 1920x1080" {...register('dimensionSize')} />
                  {errors.dimensionSize && <p className="text-sm text-red-500">{errors.dimensionSize.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Min Order Qty Timeline</Label>
                  <Input type="number" {...register('minOrderQuantity')} />
                </div>
                <div className="space-y-2">
                  <Label>Max Order Qty Timeline</Label>
                  <Input type="number" {...register('maxOrderQuantity')} />
                </div>
              </div>

              {mediaVariations.length > 0 && (
                <div className="space-y-2">
                  <Label>Added Variations ({mediaVariations.length})</Label>
                  <div className="space-y-2">
                    {mediaVariations.map((v, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border border-[#E5E8EB] rounded-md bg-white">
                        <span className="text-sm">
                          {v.location} | {v.repetition} | {v.dimensionSize} | Min: {v.minOrderQuantity} | Max: {v.maxOrderQuantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMediaVariation(idx)}
                          className="text-[#6B7A99] hover:text-[#C64091]"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags <span className="text-red-500">*</span></Label>
              <Input
                placeholder="Type a tag and press Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
              />
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveTag(tag)}>
                      {tag} <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}
              {tags.length === 0 && <p className="text-sm text-red-500">Add at least one tag</p>}
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/mediaonline/general-info/${id}`)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || rows.length === 0}
                className="bg-[#C64091] hover:bg-[#A03375]"
              >
                {isSubmitting ? 'Saving...' : 'Save & Next'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </form>
        </div>
          </main>
        </div>
      </div>
    </div>
  );
}
