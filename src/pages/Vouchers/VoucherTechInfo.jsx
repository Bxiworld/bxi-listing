import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, Upload, FileText, X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { toast } from 'sonner';
import api, { productApi } from '../../utils/api';
import StateData from '../../utils/StateCityArray.json';
import { getPrevNextStepPaths } from '../../config/categoryFormConfig';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '../../components/ui/tooltip';
import { Info } from 'lucide-react';
import { Stepper } from '../AddProduct/AddProductSteps';
import { useScrollToTopOnStepEnter } from '../../hooks/useScrollToTopOnStepEnter';

// Validation aligned with bxi-dashboard TechInfoTemplate: all text fields max 500 characters
const schema = z.object({
  inclusions: z.string().min(1, 'This field is required').max(500, 'This field cannot exceed 500 characters'),
  exclusions: z.string().min(1, 'This field is required').max(500, 'This field cannot exceed 500 characters'),
  termsAndConditions: z.string().min(1, 'This field is required').max(500, 'This field cannot exceed 500 characters'),
  redemptionSteps: z.string().min(1, 'This field is required').max(500, 'This field cannot exceed 500 characters'),
  redemptionType: z.enum(['online', 'offline', 'both']),
  codeGenerationType: z.enum(['bxi', 'self']),
  onlineRedemptionUrl: z.string().optional().or(z.literal('')),
});

export default function VoucherTechInfo({ category }) {
  useScrollToTopOnStepEnter();
  const navigate = useNavigate();
  const { id } = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productData, setProductData] = useState(null);
  const [codeFile, setCodeFile] = useState(null);
  const [storeListFile, setStoreListFile] = useState(null);
  const [offlineAddress, setOfflineAddress] = useState({
    address: '',
    area: '',
    landmark: '',
    city: '',
    state: '',
  });
  const [cities, setCities] = useState([]);
  const codeFileRef = useRef(null);
  const storeFileRef = useRef(null);

  const { prev: prevStepPath, next: nextStepPath } = getPrevNextStepPaths(category, 'techInfo');
  const prevPath = prevStepPath || 'hotelsproductinfo';
  const nextPath = 'voucherdesign';

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      inclusions: '',
      exclusions: '',
      termsAndConditions: '',
      redemptionSteps: '',
      redemptionType: 'online',
      codeGenerationType: 'bxi',
      onlineRedemptionUrl: '',
    },
  });

  const redemptionType = watch('redemptionType');
  const codeGenerationType = watch('codeGenerationType');
  const inclusions = watch('inclusions');
  const exclusions = watch('exclusions');
  const termsAndConditions = watch('termsAndConditions');
  const redemptionSteps = watch('redemptionSteps');
  const onlineRedemptionUrl = watch('onlineRedemptionUrl');

  const urlRegex = /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/g;
  const hasRequiredText =
    (inclusions ?? '').trim().length > 0 &&
    (exclusions ?? '').trim().length > 0 &&
    (termsAndConditions ?? '').trim().length > 0 &&
    (redemptionSteps ?? '').trim().length > 0;
  const redemptionTypeValue = (redemptionType || 'online').toLowerCase();
  const onlineOk =
    redemptionTypeValue === 'offline' ||
    (() => {
      const url = (onlineRedemptionUrl ?? '').trim();
      return url.length > 0 && !!url.match(urlRegex) && !url.toLowerCase().includes('bxiworld');
    })();
  const hasOfflineOk =
    redemptionTypeValue === 'online' ||
    (() => {
      const hasAddress =
        offlineAddress.address?.trim() &&
        offlineAddress.area?.trim() &&
        offlineAddress.landmark?.trim() &&
        offlineAddress.city?.trim() &&
        offlineAddress.state?.trim();
      return !!hasAddress || !!storeListFile;
    })();
  const codeGenOk =
    (codeGenerationType || 'bxi') !== 'self' || !!codeFile;
  const canSubmit = hasRequiredText && onlineOk && hasOfflineOk && codeGenOk;

  // Fetch product data
  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      try {
        const res = await productApi.getProductById(id);
        setProductData(res?.data);
      } catch (error) {
        console.error('Error fetching product:', error);
      }
    };
    fetchProduct();
  }, [id]);

  // Update cities when state changes
  useEffect(() => {
    if (offlineAddress.state) {
      const stateObj = StateData.find((s) => s.name === offlineAddress.state);
      setCities(stateObj?.data || []);
    } else {
      setCities([]);
    }
  }, [offlineAddress.state]);

  const handleCodeFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Please upload an Excel file (.xlsx or .xls)');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }
    
    setCodeFile(file);
    toast.success('Code file added');
  };

  const handleStoreListChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Please upload an Excel file (.xlsx or .xls)');
      return;
    }
    
    setStoreListFile(file);
    toast.success('Store list file added');
  };

  const onSubmit = async (data) => {
    if (!id) {
      toast.error('Product ID missing');
      return;
    }

    const redemptionTypeValue = (data.redemptionType || redemptionType || '').toLowerCase();

    // bxi TechInfoTemplate: URL must not contain bxiworld
    const url = (data.onlineRedemptionUrl || '').trim();
    if (url && url.toLowerCase().includes('bxiworld')) {
      toast.error('You can not use BXI world in Website Link');
      return;
    }

    // bxi: online/both require valid Link (URL)
    if (redemptionTypeValue === 'online' || redemptionTypeValue === 'both') {
      if (!url) {
        toast.error('This field is required');
        return;
      }
      const urlRegex = /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/g;
      if (!url.match(urlRegex)) {
        toast.error('Please enter valid URL.');
        return;
      }
    }

    // bxi: offline/both require "Complete store address or Store list is required"
    if (redemptionTypeValue === 'offline' || redemptionTypeValue === 'both') {
      const hasAddress = offlineAddress.address?.trim() && offlineAddress.area?.trim() && offlineAddress.landmark?.trim() && offlineAddress.city?.trim() && offlineAddress.state?.trim();
      if (!hasAddress && !storeListFile) {
        toast.error('Complete store address or Store list is required.');
        return;
      }
      if (offlineAddress.address?.trim() && (!offlineAddress.area?.trim() || !offlineAddress.landmark?.trim() || !offlineAddress.city?.trim() || !offlineAddress.state?.trim())) {
        toast.error('Complete store address is required.');
        return;
      }
    }

    // bxi: CodeGenerationType 'self' requires voucher files
    if ((data.codeGenerationType || codeGenerationType) === 'self' && !codeFile) {
      toast.error('Please upload voucher codes Excel file');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('_id', id);
      formData.append('ProductUploadStatus', 'voucherdesign');
      formData.append('Inclusions', data.inclusions);
      formData.append('Exclusions', data.exclusions);
      formData.append('TermConditions', data.termsAndConditions);
      formData.append('RedemptionSteps', data.redemptionSteps);
      formData.append('redemptionType', redemptionTypeValue);
      formData.append('CodeGenerationType', data.codeGenerationType === 'self' ? 'self' : 'bxi');

      if (url) formData.append('Link', url);

      if (redemptionTypeValue === 'offline' || redemptionTypeValue === 'both') {
        formData.append('Address', offlineAddress.address || '');
        formData.append('Area', offlineAddress.area || '');
        formData.append('Landmark', offlineAddress.landmark || '');
        formData.append('City', offlineAddress.city || '');
        formData.append('State', offlineAddress.state || '');
        if (storeListFile) formData.append('HotelLocations', storeListFile);
      }

      if ((data.codeGenerationType || codeGenerationType) === 'self' && codeFile) {
        formData.append('voucherCodes', codeFile);
      }

      await api.post('/product/product_mutation', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Voucher technical information saved!');
      navigate(`/${category}/${nextPath}/${id}`);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to save. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-8">
      <div className="form-container">
        <div className="stepper-layout">
          <aside className="stepper-rail">
            <Stepper currentStep={3} completedSteps={[1, 2]} />
          </aside>
          <main className="stepper-content">
        <div className="form-section">
          <div className="flex items-center gap-2">
          <h2 className="form-section-title">Technical Information - {category.replace(/voucher$/i, '').charAt(0).toUpperCase() + category.replace(/voucher$/i, '').slice(1)}</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <button type="button" className="text-[#6B7A99] hover:text-[#C64091]">
                  <Info className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Voucher Information refers to the details of the voucher, including the inclusions, exclusions, terms and conditions, redemption steps and redemption type.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Inclusions */}
            <div className="space-y-2">
              <Label htmlFor="inclusions">
                Inclusions <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="inclusions"
                placeholder="Inclusions"
                rows={4}
                maxLength={501}
                {...register('inclusions')}
                className={errors.inclusions ? 'border-red-500' : ''}
              />
              {errors.inclusions && (
                <p className="text-sm text-red-500">{errors.inclusions.message}</p>
              )}
              <p className="text-xs text-[#6B7A99]">Maximum 500 characters</p>
            </div>

            {/* Exclusions */}
            <div className="space-y-2">
              <Label htmlFor="exclusions">
                Exclusions <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="exclusions"
                placeholder="Exclusions"
                rows={4}
                maxLength={501}
                {...register('exclusions')}
                className={errors.exclusions ? 'border-red-500' : ''}
              />
              {errors.exclusions && (
                <p className="text-sm text-red-500">{errors.exclusions.message}</p>
              )}
              <p className="text-xs text-[#6B7A99]">Maximum 500 characters</p>
            </div>

            {/* Terms & Conditions – bxi TermConditions */}
            <div className="space-y-2">
              <Label htmlFor="termsAndConditions">
                Terms & Conditions <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="termsAndConditions"
                placeholder="Terms & Conditions"
                rows={4}
                maxLength={501}
                {...register('termsAndConditions')}
                className={errors.termsAndConditions ? 'border-red-500' : ''}
              />
              {errors.termsAndConditions && (
                <p className="text-sm text-red-500">{errors.termsAndConditions.message}</p>
              )}
              <p className="text-xs text-[#6B7A99]">Maximum 500 characters</p>
            </div>

            {/* Redemption Steps */}
            <div className="space-y-2">
              <Label htmlFor="redemptionSteps">
                Redemption Steps <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="redemptionSteps"
                placeholder="Redemption Steps"
                rows={4}
                maxLength={501}
                {...register('redemptionSteps')}
                className={errors.redemptionSteps ? 'border-red-500' : ''}
              />
              {errors.redemptionSteps && (
                <p className="text-sm text-red-500">{errors.redemptionSteps.message}</p>
              )}
              <p className="text-xs text-[#6B7A99]">Maximum 500 characters</p>
            </div>

            {/* Redemption Type – bxi: "How can it be redeemed by buyer ?" */}
            <div className="space-y-4 pt-4 border-t border-[#E5E8EB]">
              <div className="space-y-2">
                <Label>How can it be redeemed by buyer ? <span className="text-red-500">*</span></Label>
                <RadioGroup
                  value={redemptionType || 'online'}
                  onValueChange={(value) => setValue('redemptionType', value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="online" id="online" />
                    <Label htmlFor="online" className="cursor-pointer font-normal">Online</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="offline" id="offline" />
                    <Label htmlFor="offline" className="cursor-pointer font-normal">Offline</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="both" id="both" />
                    <Label htmlFor="both" className="cursor-pointer font-normal">Both</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Link (online URL) – bxi LINKName = 'Link' */}
              {(redemptionType === 'online' || redemptionType === 'both') && (
                <div className="space-y-2">
                  <Label htmlFor="onlineRedemptionUrl">
                    Add URL <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="onlineRedemptionUrl"
                    type="text"
                    placeholder="Add URL"
                    {...register('onlineRedemptionUrl')}
                    className={errors.onlineRedemptionUrl ? 'border-red-500' : ''}
                  />
                  {errors.onlineRedemptionUrl && (
                    <p className="text-sm text-red-500">{errors.onlineRedemptionUrl.message}</p>
                  )}
                </div>
              )}

              {/* Offline: Address ( If Single ) Type Below, Area, Landmark, City, State, Upload Store List */}
              {(redemptionType === 'offline' || redemptionType === 'both') && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Address ( If Single ) Type Below <span className="text-red-500">*</span></Label>
                      <Input
                        placeholder="Address ( If Single ) Type Below"
                        value={offlineAddress.address}
                        onChange={(e) => setOfflineAddress({ ...offlineAddress, address: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Area <span className="text-red-500">*</span></Label>
                      <Input
                        placeholder="Area"
                        value={offlineAddress.area}
                        onChange={(e) => setOfflineAddress({ ...offlineAddress, area: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Landmark <span className="text-red-500">*</span></Label>
                      <Input
                        placeholder="Landmark"
                        value={offlineAddress.landmark}
                        onChange={(e) => setOfflineAddress({ ...offlineAddress, landmark: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>State <span className="text-red-500">*</span></Label>
                      <Select
                        value={offlineAddress.state}
                        onValueChange={(v) => {
                          setOfflineAddress({ ...offlineAddress, state: v, city: '' });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {StateData.map((s) => (
                            <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>City <span className="text-red-500">*</span></Label>
                      <Select
                        value={offlineAddress.city}
                        onValueChange={(v) => setOfflineAddress({ ...offlineAddress, city: v })}
                        disabled={!offlineAddress.state}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select city" />
                        </SelectTrigger>
                        <SelectContent>
                          {cities.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Upload Store List ( If Multiple Locations) </Label>
                    <p className="text-xs text-[#6B7A99]">Optional when both. Upload Excel with store locations.</p>
                    <div className="flex gap-4 items-center">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => storeFileRef.current?.click()}
                        className="border-[#C64091] text-[#C64091]"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {storeListFile ? 'Change File' : 'Upload Store List'}
                      </Button>
                      {storeListFile && (
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="w-4 h-4 text-[#C64091]" />
                          <span>{storeListFile.name}</span>
                          <button
                            type="button"
                            onClick={() => setStoreListFile(null)}
                            className="text-[#6B7A99] hover:text-[#C64091]"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <input
                      ref={storeFileRef}
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleStoreListChange}
                      className="hidden"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Code Generation – bxi: "How do you want to upload your voucher codes? (Bxi will generate them for you or you can upload them)" */}
            <div className="space-y-4 pt-4 border-t border-[#E5E8EB]">
              <div className="space-y-2">
                <Label>How do you want to upload your voucher codes? (Bxi will generate them for you or you can upload them) <span className="text-red-500">*</span></Label>
                <RadioGroup
                  value={codeGenerationType || 'bxi'}
                  onValueChange={(value) => setValue('codeGenerationType', value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="bxi" id="bxi-generate" />
                    <Label htmlFor="bxi-generate" className="cursor-pointer font-normal">BXI</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="self" id="upload-codes" />
                    <Label htmlFor="upload-codes" className="cursor-pointer font-normal">Upload Now</Label>
                  </div>
                </RadioGroup>
              </div>

              {codeGenerationType === 'self' && (
                <div className="space-y-2">
                  <Label>Voucher Codes File <span className="text-red-500">*</span></Label>
                  <p className="text-xs text-[#6B7A99]">
                    Upload Excel with voucher codes. Must have one column per product variation.
                  </p>
                  <div className="flex gap-4 items-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => codeFileRef.current?.click()}
                      className="border-[#C64091] text-[#C64091]"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {codeFile ? 'Change File' : 'Upload Codes'}
                    </Button>
                    {codeFile && (
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="w-4 h-4 text-[#C64091]" />
                        <span>{codeFile.name}</span>
                        <button
                          type="button"
                          onClick={() => setCodeFile(null)}
                          className="text-[#6B7A99] hover:text-[#C64091]"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <input
                    ref={codeFileRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleCodeFileChange}
                    className="hidden"
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/${category}/${prevPath}/${id}`)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !canSubmit}
                className="bg-[#C64091] hover:bg-[#A03375] disabled:opacity-50 disabled:pointer-events-none"
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
