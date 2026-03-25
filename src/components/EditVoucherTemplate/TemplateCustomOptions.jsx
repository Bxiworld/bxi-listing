import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';

const COLORS = [
  '#FFE5E580', '#FFE5CC80', '#FFF9E580', '#E5FFE580', '#E5F9FF80', '#E5E5FF80',
  '#FF6B9D', '#FF8C42', '#FFD93D', '#6BCF7F', '#4ECDC4', '#5B8DEF', '#A78BFA', '#EC4899', '#F59E0B',
  '#DC2626', '#2563EB', '#7C3AED', '#BE185D', '#64748B', '#92400E', '#1a1a2e', '#ffffff',
];

const GRADIENT_PRESETS = [
  { name: 'Purple/Blue', start: '#7c3aed', end: '#3b82f6' },
  { name: 'Pink/Orange', start: '#ec4899', end: '#f97316' },
  { name: 'Green/Teal', start: '#10b981', end: '#14b8a6' },
  { name: 'Red/Pink', start: '#ef4444', end: '#ec4899' },
  { name: 'Blue/Cyan', start: '#3b82f6', end: '#06b6d4' },
  { name: 'Purple/Pink', start: '#a855f7', end: '#ec4899' },
  { name: 'Gold/Orange', start: '#f59e0b', end: '#f97316' },
  { name: 'Dark/Purple', start: '#1e293b', end: '#7c3aed' },
];

export default function TemplateCustomOptions({
  cardImage,
  onCardImageChange,
  onClearCardImage,
  cardBgColor,
  updateBGColor,
  textInverted,
  updateTextColor,
  gradientColors,
  updateGradientColors,
  fileInputRef,
}) {
  const [gradientStart, setGradientStart] = useState(gradientColors?.start ?? '#7c3aed');
  const [gradientEnd, setGradientEnd] = useState(gradientColors?.end ?? '#3b82f6');

  useEffect(() => {
    if (updateGradientColors) {
      updateGradientColors({ start: gradientStart, end: gradientEnd });
    }
  }, [gradientStart, gradientEnd, updateGradientColors]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Only image files are accepted (jpg, jpeg, png).');
      return;
    }
    onCardImageChange?.(file);
    toast.success('Card image added');
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E3E3E3] shadow-sm p-6 space-y-6">
      {/* Upload card image */}
      <div className="bg-white rounded-xl border border-[#E3E3E3] p-4 shadow-sm">
        <Label className="text-sm font-medium text-[#6B7A99] mb-2 block">Upload Image</Label>
        <p className="text-xs text-[#6B7A99] mb-2">
          Drag & drop to upload or browse to choose a file. Supported: JPEG, PNG. Product related photo (Compulsory) *
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef?.current?.click()}
            className="border-[#C64091] text-[#C64091]"
          >
            <Upload className="w-4 h-4 mr-2" />
            {cardImage ? 'Change' : 'Upload'}
          </Button>
          {cardImage && (
            <span className="text-sm text-[#6B7A99] flex items-center gap-1">
              <img src={typeof cardImage === 'string' ? cardImage : (cardImage?.preview || (cardImage instanceof File ? URL.createObjectURL(cardImage) : ''))} alt="Card" className="h-8 w-12 object-cover rounded" />
              <button type="button" onClick={onClearCardImage} className="text-[#6B7A99] hover:text-red-500">
                <X className="w-4 h-4" />
              </button>
            </span>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpg,image/jpeg,image/png"
          onChange={(e) => { handleFileChange(e); e.target.value = ''; }}
          className="hidden"
        />
      </div>

      {/* Background colour */}
      <div className="bg-white rounded-xl border border-[#E3E3E3] p-4 shadow-sm">
        <Label className="text-sm font-medium text-[#6B7A99] mb-2 block">Choose Background color</Label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => updateBGColor?.(c)}
              className="w-8 h-8 rounded-full border-2 border-gray-200 hover:border-[#C64091] transition-colors"
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
          <button
            type="button"
            onClick={() => updateBGColor?.('#ffffff')}
            className="w-8 h-8 rounded-full border-2 border-gray-200 hover:border-[#C64091] bg-white text-xs text-gray-500 flex items-center justify-center"
          >
            None
          </button>
        </div>
      </div>

      {/* Invert text (light text on dark background) */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="textInvert"
          checked={textInverted}
          onChange={(e) => updateTextColor?.(e.target.checked)}
          className="rounded"
        />
        <Label htmlFor="textInvert" className="text-sm text-[#6B7A99] cursor-pointer">Invert Text Color (light text on dark background)</Label>
      </div>

      {/* Gradient (value section) – presets + custom */}
      <div className="bg-white rounded-xl border border-[#E3E3E3] p-4 shadow-sm">
        <Label className="text-sm font-medium text-[#6B7A99] mb-2 block">Value Box Gradient Colors</Label>
        <div className="flex flex-wrap gap-2 mb-3">
          {GRADIENT_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => {
                setGradientStart(preset.start);
                setGradientEnd(preset.end);
              }}
              className="w-20 h-10 rounded-md border-2 transition-all hover:scale-105"
              style={{
                background: `linear-gradient(135deg, ${preset.start}, ${preset.end})`,
                borderColor: gradientStart === preset.start && gradientEnd === preset.end ? '#2d8ae0' : '#e5e7eb',
              }}
              title={preset.name}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <Label className="text-xs text-[#6B7A99] mb-1 block">Start Color</Label>
            <input
              type="color"
              value={gradientStart}
              onChange={(e) => setGradientStart(e.target.value)}
              className="w-full h-10 rounded border border-gray-200 cursor-pointer"
            />
          </div>
          <div className="flex-1">
            <Label className="text-xs text-[#6B7A99] mb-1 block">End Color</Label>
            <input
              type="color"
              value={gradientEnd}
              onChange={(e) => setGradientEnd(e.target.value)}
              className="w-full h-10 rounded border border-gray-200 cursor-pointer"
            />
          </div>
        </div>
        <div className="mt-2 h-12 rounded-lg border border-gray-200 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})` }}>
          <span className="text-white font-semibold text-lg drop-shadow">1000</span>
        </div>
      </div>
    </div>
  );
}
