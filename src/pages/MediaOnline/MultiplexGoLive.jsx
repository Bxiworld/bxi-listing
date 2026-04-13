import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, Check, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Checkbox } from '../../components/ui/checkbox';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { toast } from 'sonner';
import api, { productApi } from '../../utils/api';

const PREVIEW_PATH = '/multiplexmediaonlineproductpreview';

function screenKey(screen) {
  return String(screen._id);
}

function screenTitle(screen, index) {
  const t = screen.cinema?.trim() || screen.location?.trim();
  return t || `Screen ${index + 1}`;
}

function screenSubtitleLine(screen) {
  const parts = [screen.city, screen.location].filter(Boolean);
  const base = parts.join(', ') || '—';
  return screen.audiNum ? `${base} · Audi ${screen.audiNum}` : base;
}

function screenSubtitleDetail(screen) {
  const parts = [screen.location, screen.city].filter(Boolean);
  const uniq = [...new Set(parts)];
  return uniq.join(', ') || '—';
}

export default function MultiplexGoLive() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [screensList, setScreensList] = useState([]);
  const [productData, setProductData] = useState(null);
  const [selectedScreens, setSelectedScreens] = useState([]);
  const [screenImages, setScreenImages] = useState({});
  const [goLiveTab, setGoLiveTab] = useState('bulk');
  const bulkUploadRef = useRef(null);
  const individualUploadRefs = useRef({});

  useEffect(() => {
    fetchScreens();
  }, [id]);

  const uniqueFileCount = useMemo(() => {
    const seen = new Set();
    for (const s of screensList) {
      const key = screenKey(s);
      for (const img of screenImages[key] || []) {
        if (img?.file) {
          seen.add(`${img.file.name}-${img.file.size}-${img.file.lastModified}`);
        }
      }
    }
    return seen.size;
  }, [screensList, screenImages]);

  const fetchScreens = async () => {
    setIsLoading(true);
    try {
      const productRes = await api.get(`product/get_product_byId/${id}`);
      setProductData(productRes?.data || null);

      const listRes = await api.get(`product/MultiplexScreenGetById/${id}`);
      const doc = listRes?.data?.data;
      const screens = doc?.screens || [];

      if (screens.length === 0) {
        toast.error('No multiplex screens found. Please complete the screen list step first.');
        navigate(`/mediaonline/mediaonlinemultiplexproductinfo/${id}`);
        return;
      }

      const processed = screens.map((s, index) => ({
        ...s,
        _id: s._id ?? `temp-${index}`,
      }));

      setScreensList(processed);

      const imagesState = {};
      processed.forEach((s) => {
        imagesState[screenKey(s)] = [];
      });
      setScreenImages(imagesState);

      toast.success(`Loaded ${processed.length} screens`);
    } catch (error) {
      console.error('Error fetching:', error);
      toast.error('Failed to load multiplex screens');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectScreen = (sid, checked) => {
    if (checked) {
      setSelectedScreens([...selectedScreens, sid]);
    } else {
      setSelectedScreens(selectedScreens.filter((x) => x !== sid));
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedScreens(screensList.map((s) => screenKey(s)));
    } else {
      setSelectedScreens([]);
    }
  };

  const handleBulkImageUpload = (e) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) return;

    if (files.length > 3) {
      toast.error('Maximum 3 images allowed per screen');
      return;
    }

    if (selectedScreens.length === 0) {
      toast.error('Please select at least one screen first');
      return;
    }

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

    const imagePromises = validImages.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ file, preview: reader.result });
        reader.readAsDataURL(file);
      });
    });

    Promise.all(imagePromises).then((images) => {
      const newImagesState = { ...screenImages };
      selectedScreens.forEach((sid) => {
        newImagesState[sid] = [
          ...(newImagesState[sid] || []),
          ...images.slice(0, 3 - (newImagesState[sid]?.length || 0)),
        ];
      });
      setScreenImages(newImagesState);

      toast.success(`${validImages.length} images added to ${selectedScreens.length} screens`);
    });
    e.target.value = '';
  };

  const handleIndividualImageUpload = (sid, e) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) return;

    const currentImages = screenImages[sid] || [];
    const remainingSlots = 3 - currentImages.length;

    if (remainingSlots === 0) {
      toast.error('Maximum 3 images already uploaded for this screen');
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);

    const imagePromises = filesToUpload
      .map((file) => {
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
      })
      .filter(Boolean);

    Promise.all(imagePromises).then((images) => {
      setScreenImages({
        ...screenImages,
        [sid]: [...currentImages, ...images],
      });
      toast.success(`${images.length} image(s) added`);
    });
    e.target.value = '';
  };

  const handleRemoveImage = (sid, imageIndex) => {
    const currentImages = screenImages[sid] || [];
    setScreenImages({
      ...screenImages,
      [sid]: currentImages.filter((_, idx) => idx !== imageIndex),
    });
  };

  const collectUniqueFiles = () => {
    const seen = new Set();
    const out = [];
    for (const s of screensList) {
      const sid = screenKey(s);
      for (const img of screenImages[sid] || []) {
        if (!img?.file) continue;
        const k = `${img.file.name}-${img.file.size}-${img.file.lastModified}`;
        if (!seen.has(k)) {
          seen.add(k);
          out.push(img.file);
        }
      }
    }
    return out;
  };

  const handlePublish = async () => {
    const uniqueFiles = collectUniqueFiles();

    if (goLiveTab === 'individual') {
      const withoutImages = screensList.filter((s) => !(screenImages[screenKey(s)]?.length > 0));
      if (withoutImages.length > 0) {
        toast.error(
          `${withoutImages.length} screen(s) have no images. Upload up to 3 standard images per screen.`
        );
        return;
      }
      if (uniqueFiles.length < 3) {
        toast.error('Individual upload: add at least 3 standard listing images in total across screens.');
        return;
      }
    }

    if (uniqueFiles.length > 10) {
      toast.error(
        'Too many unique images (max 10). Use bulk upload to reuse the same images across screens where possible.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('id', id);
      formData.append('ProductUploadStatus', 'golive');
      formData.append('listperiod', '1');
      formData.append('ListingType', productData?.ListingType || 'Media');
      formData.append('productName', productData?.ProductName || '');
      formData.append('productSubCategory', productData?.ProductSubCategory || '');
      formData.append('productDescription', productData?.ProductDescription || '');
      uniqueFiles.forEach((f) => formData.append('files', f));

      await productApi.productMutationFormData(formData);

      toast.success('Listing images saved. Opening preview…');
      navigate(`${PREVIEW_PATH.replace(/\/$/, '')}/${id}`);
    } catch (error) {
      console.error('Error:', error);
      toast.error(error?.response?.data?.message || error?.message || 'Failed to publish');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C64091] mx-auto mb-4"></div>
          <p className="text-[#6B7A99]">Loading screens...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-bold text-[#111827] mb-2">Multiplex Go Live</h2>
          <p className="text-sm text-[#6B7A99]">
            Upload images for each screen and continue to preview ({screensList.length} screens)
          </p>
        </div>

        <Tabs value={goLiveTab} onValueChange={setGoLiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
            <TabsTrigger value="individual">Individual Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="bulk">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold text-[#111827] mb-4">Bulk Image Upload</h3>
              <p className="text-sm text-[#6B7A99] mb-4">
                Select multiple screens and upload same images to all selected
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Checkbox
                    id="select-all-screens"
                    checked={
                      screensList.length > 0 && selectedScreens.length === screensList.length
                    }
                    onCheckedChange={handleSelectAll}
                  />
                  <label htmlFor="select-all-screens" className="text-sm font-medium cursor-pointer">
                    Select All ({selectedScreens.length}/{screensList.length})
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {screensList.map((screen, index) => {
                    const sid = screenKey(screen);
                    return (
                      <div
                        key={sid}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          selectedScreens.includes(sid)
                            ? 'border-[#C64091] bg-[#FCE7F3]'
                            : 'border-[#E5E8EB]'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            id={`cb-${sid}`}
                            checked={selectedScreens.includes(sid)}
                            onCheckedChange={(checked) => handleSelectScreen(sid, !!checked)}
                          />
                          <div className="flex-1">
                            <label htmlFor={`cb-${sid}`} className="font-medium text-sm cursor-pointer block">
                              {screenTitle(screen, index)}
                            </label>
                            <p className="text-xs text-[#6B7A99] mt-1">{screenSubtitleLine(screen)}</p>
                            <Badge variant="secondary" className="mt-2">
                              {screenImages[sid]?.length || 0}/3 images
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
                    disabled={selectedScreens.length === 0}
                    className="bg-[#C64091] hover:bg-[#A03375]"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Images to Selected ({selectedScreens.length})
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="individual">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-[#111827] mb-4">Individual Image Upload</h3>
              <p className="text-sm text-[#6B7A99] mb-4">
                Upload specific images for each screen (max 3 per screen)
              </p>

              <div className="space-y-4">
                {screensList.map((screen, index) => {
                  const sid = screenKey(screen);
                  return (
                    <div key={sid} className="p-4 border border-[#E5E8EB] rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-[#111827]">{screenTitle(screen, index)}</h4>
                          <p className="text-sm text-[#6B7A99]">{screenSubtitleDetail(screen)}</p>
                        </div>
                        <Badge>{screenImages[sid]?.length || 0}/3 images</Badge>
                      </div>

                      {screenImages[sid]?.length > 0 && (
                        <div className="flex gap-2 mb-3 flex-wrap">
                          {screenImages[sid].map((img, idx) => (
                            <div key={idx} className="relative group">
                              <img
                                src={img.preview}
                                alt={`Screen ${idx + 1}`}
                                className="w-24 h-24 object-cover rounded border"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(sid, idx)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <input
                        ref={(el) => {
                          individualUploadRefs.current[sid] = el;
                        }}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleIndividualImageUpload(sid, e)}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        onClick={() => individualUploadRefs.current[sid]?.click()}
                        variant="outline"
                        size="sm"
                        disabled={(screenImages[sid]?.length || 0) >= 3}
                      >
                        <ImageIcon className="w-4 h-4 mr-2" />
                        {(screenImages[sid]?.length || 0) >= 3
                          ? 'Max Images Uploaded'
                          : 'Upload Images'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="bg-gradient-to-r from-[#C64091] to-[#8B2F6F] rounded-lg shadow-lg p-8 mt-6">
          <div className="text-center text-white">
            <h3 className="text-2xl font-bold mb-2">Ready to Publish?</h3>
            <p className="text-sm opacity-90 mb-4">
              {screensList.filter((s) => (screenImages[screenKey(s)]?.length || 0) > 0).length} of{' '}
              {screensList.length} screens have images · {uniqueFileCount} unique listing image
              {uniqueFileCount === 1 ? '' : 's'} (need 3–10)
            </p>

            <div className="flex justify-center gap-4">
              <Button
                variant="secondary"
                type="button"
                onClick={() => navigate(`/mediaonline/mediamultiplextechinfo/${id}`)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                type="button"
                onClick={handlePublish}
                disabled={
                  isSubmitting ||
                  screensList.some((s) => !(screenImages[screenKey(s)]?.length > 0)) ||
                  uniqueFileCount < 3 ||
                  uniqueFileCount > 10
                }
                className="bg-white text-[#C64091] hover:bg-gray-100"
              >
                {isSubmitting ? (
                  'Publishing...'
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Publish All Screens
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
