import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

const AVAILABILITY_OPTIONS = [
  { id: 1, name: 'Single Upload', desc: 'Single Media / Branding Offering and Specific only That Needs to be Selected' },
  { id: 2, name: 'Bulk Upload', desc: 'Multiple Locations / Screens / Offerings / Pages / Spots' },
];

export default function MediaOnlinePhysical() {
  const [selectedType, setSelectedType] = useState(null); // 'online' | 'offline'
  const [selectedAvailability, setSelectedAvailability] = useState(null);

  const navigate = useNavigate();

  const handleListMedia = () => {
    if (!selectedType || !selectedAvailability) {
      toast.error('Please select both delivery type and availability.');
      return;
    }

    if (selectedType === 'online') {
      if (selectedAvailability?.name === 'Single Upload') {
        navigate('/mediaonline/general-info');
      } else {
        navigate('/mediaonlinebulkupload');
      }
    } else {
      if (selectedAvailability?.name === 'Single Upload') {
        navigate('/mediaoffline/general-info');
      } else {
        navigate('/mediaofflinebulkupload');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-12 px-6" data-testid="media-online-physical">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          className="mb-6 -ml-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </Button>

        <h1 className="text-2xl font-semibold text-[#393D5E] mb-2 text-center">
          How would you deliver this to buyer?
        </h1>
        <p className="text-[#6B7A99] text-center mb-8">
          Amplify Your Buyers Brand Message and Lets Make Some Noise!
        </p>

        {/* Online vs Offline */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <Button
            variant="outline"
            className={cn(
              'h-auto py-6 px-8 flex flex-col items-center border-2 transition-all',
              selectedType === 'online'
                ? 'border-[#C64091] bg-[#FCE7F3] text-[#C64091]'
                : 'border-[#EDEFF2] text-[#6B7A99] hover:border-[#C64091]'
            )}
            onClick={() => {
              setSelectedType('online');
              setSelectedAvailability(null);
            }}
          >
            <span className="text-2xl font-semibold">ON</span>
            <span className="text-xs mt-1">Line</span>
            <span className="text-xs">Screen</span>
            <span className="text-xs">Air</span>
          </Button>
          <Button
            variant="outline"
            className={cn(
              'h-auto py-6 px-8 flex flex-col items-center border-2 transition-all',
              selectedType === 'offline'
                ? 'border-[#C64091] bg-[#FCE7F3] text-[#C64091]'
                : 'border-[#EDEFF2] text-[#6B7A99] hover:border-[#C64091]'
            )}
            onClick={() => {
              setSelectedType('offline');
              setSelectedAvailability(null);
            }}
          >
            <span className="text-2xl font-semibold">OFF</span>
            <span className="text-xs mt-1">Line</span>
            <span className="text-xs">Screen</span>
            <span className="text-xs">Activation</span>
            <span className="text-xs">Hoardings</span>
            <span className="text-xs">Print</span>
          </Button>
        </div>

        {/* Single vs Bulk */}
        {selectedType && (
          <>
            <p className="text-sm text-[#6B7A99] text-center mb-4">
              Availability of Product SKU / TYPE
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {AVAILABILITY_OPTIONS.map((opt) => (
                <Button
                  key={opt.id}
                  variant="outline"
                  className={cn(
                    'h-auto py-6 px-6 w-full max-w-[250px] flex flex-col items-center border-2 transition-all',
                    selectedAvailability?.id === opt.id
                      ? 'border-[#C64091] bg-[#FCE7F3] text-[#C64091]'
                      : 'border-[#EDEFF2] text-[#6B7A99] hover:border-[#C64091]'
                  )}
                  onClick={() => setSelectedAvailability(opt)}
                >
                  <span className="font-medium">{opt.name}</span>
                  <span className="text-xs mt-1 text-center opacity-80">{opt.desc}</span>
                </Button>
              ))}
            </div>
          </>
        )}

        <div className="flex flex-col items-center gap-4">
          <Button
            className="bg-[#C64091] hover:bg-[#A03375] min-w-[200px]"
            onClick={handleListMedia}
          >
            List Media
          </Button>
          <Button variant="ghost" className="text-[#C64091]" onClick={() => navigate('/sellerhub')}>
            Skip To Explore
          </Button>
        </div>
      </div>
    </div>
  );
}
