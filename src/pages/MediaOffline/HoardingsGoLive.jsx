import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, Eye, Check, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Checkbox } from '../../components/ui/checkbox';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { toast } from 'sonner';
import api from '../../utils/api';
import { Stepper } from '../AddProduct/AddProductSteps';

export default function HoardingsGoLive() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoardingsList, setHoardingsList] = useState([]);
  const [hoardingListId, setHoardingListId] = useState(null);
  const [selectedHoardings, setSelectedHoardings] = useState([]);
  const [hoardingImages, setHoardingImages] = useState({});
  const [bulkImages, setBulkImages] = useState([]);
  const [previewHoarding, setPreviewHoarding] = useState(null);
  const bulkUploadRef = useRef(null);
  const individualUploadRefs = useRef({});

  // Fetch hoarding list
  useEffect(() => {
    fetchHoardingList();
  }, [id]);

  const fetchHoardingList = async () => {
    setIsLoading(true);
    try {
      // First get product to find Hoarding_list_id
      const productRes = await api.get(`product/get_product_byId/${id}`);
      const listId = productRes?.data?.Hoarding_list_id;

      if (!listId) {
        toast.error('Hoarding List ID not found. Please complete previous steps.');
        navigate(`/mediaoffline/mediaofflinehoardinginfo/${id}`);
        return;
      }

      setHoardingListId(listId);

      // Fetch hoarding list
      const listRes = await api.get(`/product/HoardingListGetById/${listId}`);
      const hoardings = listRes?.data?.hoardings_list || listRes?.data?.data?.hoardings_list || [];

      if (hoardings.length === 0) {
        toast.error('No hoardings found in the list');
        return;
      }

      // Initialize with IDs and uploaded status
      const processedHoardings = hoardings.map((h, index) => ({
        ...h,
        _id: h._id || `temp-${index}`,
        uploadedImages: h.images || [],
      }));

      setHoardingsList(processedHoardings);
      
      // Initialize hoarding images state
      const imagesState = {};
      processedHoardings.forEach((h) => {
        imagesState[h._id] = h.uploadedImages || [];
      });
      setHoardingImages(imagesState);

      toast.success(`Loaded ${processedHoardings.length} hoardings`);
    } catch (error) {
      console.error('Error fetching:', error);
      toast.error('Failed to load hoarding list');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectHoarding = (hoardingId, checked) => {
    if (checked) {
      setSelectedHoardings([...selectedHoardings, hoardingId]);
    } else {
      setSelectedHoardings(selectedHoardings.filter((id) => id !== hoardingId));
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedHoardings(hoardingsList.map((h) => h._id));
    } else {
      setSelectedHoardings([]);
    }
  };

  const handleBulkImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;

    if (files.length > 3) {
      toast.error('Maximum 3 images allowed per hoarding');
      return;
    }

    if (selectedHoardings.length === 0) {
      toast.error('Please select at least one hoarding first');
      return;
    }

    // Validate images
    const validImages = files.filter((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 5MB`);
        return false;
      }
      return true;
    });

    if (validImages.length === 0) return;

    // Convert to base64 for preview
    const imagePromises = validImages.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ file, preview: reader.result });
        reader.readAsDataURL(file);
      });
    });

    Promise.all(imagePromises).then((images) => {
      setBulkImages(images);
      
      // Apply to selected hoardings
      const newImagesState = { ...hoardingImages };
      selectedHoardings.forEach((hoardingId) => {
        newImagesState[hoardingId] = [
          ...(newImagesState[hoardingId] || []),
          ...images.slice(0, 3 - (newImagesState[hoardingId]?.length || 0)),
        ];
      });
      setHoardingImages(newImagesState);

      toast.success(`${validImages.length} images added to ${selectedHoardings.length} hoardings`);
    });
  };

  const handleIndividualImageUpload = (hoardingId, e) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;

    const currentImages = hoardingImages[hoardingId] || [];
    const remainingSlots = 3 - currentImages.length;

    if (remainingSlots === 0) {
      toast.error('Maximum 3 images already uploaded for this hoarding');
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);

    // Validate and convert to base64
    const imagePromises = filesToUpload.map((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`);
        return null;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 5MB`);
        return null;
      }

      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ file, preview: reader.result });
        reader.readAsDataURL(file);
      });
    }).filter(Boolean);

    Promise.all(imagePromises).then((images) => {
      setHoardingImages({
        ...hoardingImages,
        [hoardingId]: [...currentImages, ...images],
      });
      toast.success(`${images.length} image(s) added`);
    });
  };

  const handleRemoveImage = (hoardingId, imageIndex) => {
    const currentImages = hoardingImages[hoardingId] || [];
    setHoardingImages({
      ...hoardingImages,
      [hoardingId]: currentImages.filter((_, idx) => idx !== imageIndex),
    });
  };

  const handlePublish = async () => {
    // Validate that all hoardings have at least one image
    const hoardingsWithoutImages = hoardingsList.filter(
      (h) => !(hoardingImages[h._id]?.length > 0)
    );

    if (hoardingsWithoutImages.length > 0) {
      toast.error(`${hoardingsWithoutImages.length} hoarding(s) have no images. Please upload images for all hoardings.`);
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare form data with images
      const formData = new FormData();
      formData.append('_id', id);
      formData.append('ProductUploadStatus', 'completed');
      formData.append('IsActive', 'true');
      formData.append('Hoarding_list_id', hoardingListId);

      // Add images for each hoarding
      hoardingsList.forEach((hoarding) => {
        const images = hoardingImages[hoarding._id] || [];
        images.forEach((img, idx) => {
          if (img.file) {
            formData.append(`hoarding_${hoarding._id}_image_${idx}`, img.file);
          }
        });
      });

      await api.post('/product/product_mutation_hoardings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('All hoardings published successfully! 🎉');
      setTimeout(() => {
        navigate('/sellerhub');
      }, 1500);
    } catch (error) {
      console.error('Error:', error);
      toast.error(error?.response?.data?.message || 'Failed to publish hoardings');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C64091] mx-auto mb-4"></div>
          <p className="text-[#6B7A99]">Loading hoardings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-8">
      <div className="form-container">
        <div className="stepper-layout">
          <aside className="stepper-rail">
            <Stepper currentStep={4} category="mediaoffline" completedSteps={[1, 2, 3]} />
          </aside>
          <main className="stepper-content">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-bold text-[#111827] mb-2">Hoarding Go Live</h2>
          <p className="text-sm text-[#6B7A99]">
            Upload images for each hoarding and publish ({hoardingsList.length} hoardings)
          </p>
        </div>

        <Tabs defaultValue="bulk" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
            <TabsTrigger value="individual">Individual Upload</TabsTrigger>
          </TabsList>

          {/* Bulk Upload Tab */}
          <TabsContent value="bulk">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold text-[#111827] mb-4">
                Bulk Image Upload
              </h3>
              <p className="text-sm text-[#6B7A99] mb-4">
                Select multiple hoardings and upload same images to all selected
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Checkbox
                    id="select-all"
                    checked={selectedHoardings.length === hoardingsList.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                    Select All ({selectedHoardings.length}/{hoardingsList.length})
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {hoardingsList.map((hoarding) => (
                    <div
                      key={hoarding._id}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        selectedHoardings.includes(hoarding._id)
                          ? 'border-[#C64091] bg-[#FCE7F3]'
                          : 'border-[#E5E8EB]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id={hoarding._id}
                          checked={selectedHoardings.includes(hoarding._id)}
                          onCheckedChange={(checked) => handleSelectHoarding(hoarding._id, checked)}
                        />
                        <div className="flex-1">
                          <label htmlFor={hoarding._id} className="font-medium text-sm cursor-pointer block">
                            {hoarding.name}
                          </label>
                          <p className="text-xs text-[#6B7A99] mt-1">
                            {hoarding.city}, {hoarding.state}
                          </p>
                          <Badge variant="secondary" className="mt-2">
                            {hoardingImages[hoarding._id]?.length || 0}/3 images
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <input
                    ref={bulkUploadRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleBulkImageUpload}
                    className="hidden"
                  />
                  <Button
                    onClick={() => bulkUploadRef.current?.click()}
                    disabled={selectedHoardings.length === 0}
                    className="bg-[#C64091] hover:bg-[#A03375]"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Images to Selected ({selectedHoardings.length})
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Individual Upload Tab */}
          <TabsContent value="individual">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-[#111827] mb-4">
                Individual Image Upload
              </h3>
              <p className="text-sm text-[#6B7A99] mb-4">
                Upload specific images for each hoarding (max 3 per hoarding)
              </p>

              <div className="space-y-4">
                {hoardingsList.map((hoarding) => (
                  <div key={hoarding._id} className="p-4 border border-[#E5E8EB] rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-[#111827]">{hoarding.name}</h4>
                        <p className="text-sm text-[#6B7A99]">
                          {hoarding.area}, {hoarding.city}, {hoarding.state}
                        </p>
                      </div>
                      <Badge>
                        {hoardingImages[hoarding._id]?.length || 0}/3 images
                      </Badge>
                    </div>

                    {/* Image Preview */}
                    {hoardingImages[hoarding._id]?.length > 0 && (
                      <div className="flex gap-2 mb-3 flex-wrap">
                        {hoardingImages[hoarding._id].map((img, idx) => (
                          <div key={idx} className="relative group">
                            <img
                              src={img.preview}
                              alt={`Hoarding ${idx + 1}`}
                              className="w-24 h-24 object-cover rounded border"
                            />
                            <button
                              onClick={() => handleRemoveImage(hoarding._id, idx)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Upload Button */}
                    <input
                      ref={(el) => (individualUploadRefs.current[hoarding._id] = el)}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleIndividualImageUpload(hoarding._id, e)}
                      className="hidden"
                    />
                    <Button
                      onClick={() => individualUploadRefs.current[hoarding._id]?.click()}
                      variant="outline"
                      size="sm"
                      disabled={(hoardingImages[hoarding._id]?.length || 0) >= 3}
                    >
                      <ImageIcon className="w-4 h-4 mr-2" />
                      {(hoardingImages[hoarding._id]?.length || 0) >= 3
                        ? 'Max Images Uploaded'
                        : 'Upload Images'}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Summary & Publish */}
        <div className="bg-gradient-to-r from-[#C64091] to-[#8B2F6F] rounded-lg shadow-lg p-8 mt-6">
          <div className="text-center text-white">
            <h3 className="text-2xl font-bold mb-2">Ready to Publish?</h3>
            <p className="text-sm opacity-90 mb-4">
              {hoardingsList.filter((h) => (hoardingImages[h._id]?.length || 0) > 0).length} of{' '}
              {hoardingsList.length} hoardings have images
            </p>

            <div className="flex justify-center gap-4">
              <Button
                variant="secondary"
                onClick={() => navigate(`/mediaoffline/mediaofflinehoardingtechinfo/${id}`)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handlePublish}
                disabled={
                  isSubmitting ||
                  hoardingsList.some((h) => !(hoardingImages[h._id]?.length > 0))
                }
                className="bg-white text-[#C64091] hover:bg-gray-100"
              >
                {isSubmitting ? (
                  'Publishing...'
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Publish All Hoardings
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
          </main>
        </div>
      </div>
    </div>
  );
}
