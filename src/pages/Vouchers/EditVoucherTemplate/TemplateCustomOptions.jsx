import React, { useState, useRef } from 'react';
import { Box, Typography, FormControlLabel, Switch } from '@mui/material';
import UploadtoCloud from '../../../assets/UploadtoCloud.svg';
import LightIcon1 from '../../../assets/voucher-preview/light-icon1.svg';
import LightIcon2 from '../../../assets/voucher-preview/light-icon2.svg';
import LightIcon3 from '../../../assets/voucher-preview/light-icon3.svg';
import LightIcon4 from '../../../assets/voucher-preview/light-icon4.svg';
import LightIcon5 from '../../../assets/voucher-preview/light-icon5.svg';
import LightIcon6 from '../../../assets/voucher-preview/light-icon6.svg';
import LightIcon7 from '../../../assets/voucher-preview/light-icon7.svg';
import LightIcon8 from '../../../assets/voucher-preview/light-icon8.svg';
import LightIcon9 from '../../../assets/voucher-preview/light-icon9.svg';
import LightIcon10 from '../../../assets/voucher-preview/light-icon10.svg';
import LightIcon11 from '../../../assets/voucher-preview/light-icon11.svg';
import LightIcon12 from '../../../assets/voucher-preview/light-icon12.svg';
import LightIcon13 from '../../../assets/voucher-preview/light-icon13.svg';
import LightIcon14 from '../../../assets/voucher-preview/light-icon14.svg';
import LightIcon15 from '../../../assets/voucher-preview/light-icon15.svg';
import LightIcon16 from '../../../assets/voucher-preview/light-icon16.svg';
import LightIcon17 from '../../../assets/voucher-preview/light-icon17.svg';
import LightIcon18 from '../../../assets/voucher-preview/light-icon18.svg';
import LightIcon19 from '../../../assets/voucher-preview/light-icon19.svg';
import LightIcon20 from '../../../assets/voucher-preview/light-icon20.svg';
import LightIcon21 from '../../../assets/voucher-preview/light-icon21.svg';
import LightIcon22 from '../../../assets/voucher-preview/light-icon22.svg';
import LightIcon23 from '../../../assets/voucher-preview/light-icon23.svg';
import LightIcon24 from '../../../assets/voucher-preview/light-icon24.svg';
import LightIcon25 from '../../../assets/voucher-preview/light-icon25.svg';
import LightIcon26 from '../../../assets/voucher-preview/light-icon26.svg';

import { useEffect } from 'react';
import GlobalToast from '../../../components/Toasts/GlobalToast';

const TemplateCustomOptions = ({
  updateFile,
  updateBGColor,
  updateIcon,
  updateTextColor,
  updateInvertIcon,
  updateGradientColors,
}) => {
  const [files, setFiles] = useState([]);
  const [cardBgColor, setCardBgColor] = useState(null);
  const [activeColor, setActiveColor] = useState(null);
  const [activeAction, setActiveAction] = useState('');
  const [category, setCategory] = useState('');
  const [checked, handleChange] = useState(true);
  const [invertIconChecked, setInvertIconChecked] = useState(true);
  const [gradientStart, setGradientStart] = useState('#7c3aed'); // Purple
  const [gradientEnd, setGradientEnd] = useState('#3b82f6'); // Blue

  const handleClickNonColor = () => {
    setActiveColor(null);
    setCardBgColor('#ffffff');
  };

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const chosen = e.target.files;
    if (!chosen?.length) return;
    const file = chosen[0];
    const type = file.type?.toLowerCase() || '';
    if (!type.startsWith('image/') || !['image/jpg', 'image/jpeg', 'image/png'].includes(type)) {
      GlobalToast('Only image files are accepted (jpg, jpeg, png).', 'error');
      e.target.value = '';
      return;
    }
    setFiles([
      Object.assign(file, {
        preview: URL.createObjectURL(file),
      }),
    ]);
    e.target.value = '';
  };
  const colors = [
    // PASTELS - Light & Soft
    '#FFE5E580', // Soft Pink
    '#FFE5CC80', // Peach
    '#FFF9E580', // Cream
    '#E5FFE580', // Mint
    '#E5F9FF80', // Sky Blue
    '#E5E5FF80', // Lavender
    '#FFE5F980', // Rose
    '#F0F0F080', // Light Gray
    '#E5FFCC80', // Lime

    // VIBRANT - Medium Intensity
    '#FF6B9D', // Hot Pink
    '#FF8C42', // Coral Orange
    '#FFD93D', // Golden Yellow
    '#6BCF7F', // Fresh Green
    '#4ECDC4', // Turquoise
    '#5B8DEF', // Ocean Blue
    '#A78BFA', // Purple
    '#EC4899', // Magenta
    '#F59E0B', // Amber

    // RICH & DEEP
    '#DC2626', // Red
    '#EA580C', // Orange
    '#CA8A04', // Gold
    '#16A34A', // Green
    '#0891B2', // Cyan
    '#2563EB', // Blue
    '#7C3AED', // Purple
    '#BE185D', // Pink
    '#64748B', // Slate

    // EARTH TONES
    '#92400E', // Brown
    '#78350F', // Coffee
    '#713F12', // Bronze
    '#365314', // Olive
    '#134E4A', // Teal
    '#1E3A8A', // Navy
    '#581C87', // Plum
    '#831843', // Wine
    '#1E293B', // Charcoal

    // NEUTRALS
    '#F8FAFC', // Off White
    '#E2E8F0', // Light Gray
    '#94A3B8', // Medium Gray
    '#475569', // Dark Gray
    '#1F2937', // Graphite
    '#111827', // Almost Black
    '#000000', // Black
  ];

  const imageIcons = [
    LightIcon1,
    LightIcon2,
    LightIcon3,
    LightIcon4,
    LightIcon5,
    LightIcon6,
    LightIcon7,
    LightIcon8,
    LightIcon9,
    LightIcon10,
    LightIcon11,
    LightIcon12,
    LightIcon13,
    LightIcon14,
    LightIcon15,
    LightIcon16,
    LightIcon17,
    LightIcon18,
    LightIcon19,
    LightIcon20,
    LightIcon21,
    LightIcon22,
    LightIcon23,
    LightIcon24,
    LightIcon25,
    LightIcon26,
  ];

  function chunk(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  useEffect(() => {
    updateBGColor(cardBgColor);
  }, [cardBgColor]);

  useEffect(() => {
    updateIcon(category);
  }, [category]);

  useEffect(() => {
    updateFile(files);
  }, [files]);

  useEffect(() => {
    updateTextColor(checked);
  }, [checked]);

  useEffect(() => {
    updateInvertIcon(invertIconChecked);
  }, [invertIconChecked]);

  useEffect(() => {
    if (updateGradientColors) {
      updateGradientColors({ start: gradientStart, end: gradientEnd });
    }
  }, [gradientStart, gradientEnd]);

  const gradientPresets = [
    { name: 'Purple/Blue', start: '#7c3aed', end: '#3b82f6' },
    { name: 'Pink/Orange', start: '#ec4899', end: '#f97316' },
    { name: 'Green/Teal', start: '#10b981', end: '#14b8a6' },
    { name: 'Red/Pink', start: '#ef4444', end: '#ec4899' },
    { name: 'Blue/Cyan', start: '#3b82f6', end: '#06b6d4' },
    { name: 'Purple/Pink', start: '#a855f7', end: '#ec4899' },
    { name: 'Gold/Orange', start: '#f59e0b', end: '#f97316' },
    { name: 'Dark/Purple', start: '#1e293b', end: '#7c3aed' },
  ];

  return (
    <Box sx={{ ml: '20px' }}>
      <Box
        role="button"
        tabIndex={0}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
        sx={{ marginTop: '10px', cursor: 'pointer' }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,image/jpg,image/jpeg,image/png"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          aria-hidden
        />
        <Typography
          sx={{
            fontFamily: 'Poppins',
            fontWeight: 400,
            color: '#6B7A99',
            fontSize: '14px',
            marginBottom: '10px',
            marginTop: '10px',
          }}
        >
          Upload Image
        </Typography>
        <Box
          border={'2px dashed '}
          sx={{
            padding: '3rem',
            marginTop: '1rem',
            textAlign: 'center',
            '&:hover': { cursor: 'pointer' },
            borderColor: '#2d8ae0',
          }}
        >
          <Box component="img" src={UploadtoCloud} sx={{}} />
          <Typography
            sx={{
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 400,
              fontSize: '10px',
              color: '#6B7A99',
              cursor: 'pointer',
              '&:hover': {
                color: 'blue',
              },
            }}
          >
            Drag & drop to upload or browse to choose a file
            <span style={{ color: 'red' }}> *</span>
          </Typography>
          <Typography
            sx={{
              fontFamily: 'Mulish',
              fontStyle: 'normal',
              fontWeight: 400,
              fontSize: '8px',
              color: '#676767',
              textAlign: 'center',
            }}
          >
            Supported format : JPEG, PNG
          </Typography>
          <Typography
            sx={{
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 400,
              fontSize: '12px',
              color: '#445FD2',
              textAlign: 'center',
            }}
          >
            Mandatory Photos : Product related photo ( Compulsory){' '}
          </Typography>
        </Box>
      </Box>

      <Typography
        sx={{
          fontFamily: 'Inter, sans-serif',
          fontWeight: 400,
          color: '#6B7A99',
          fontSize: '14px',
          marginBottom: '10px',
          marginTop: '10px',
        }}
      >
        Choose Background color
      </Typography>

      <Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
          {chunk(colors, 9).map((rowColors, index) => (
            <Box key={index} sx={{ display: 'flex' }}>
              {rowColors.map((color) => (
                <Box
                  onClick={() => {
                    setActiveColor(color);
                    setCardBgColor(color);
                  }}
                  className={activeColor === color ? 'active' : ''}
                  key={color}
                  sx={{
                    width: '2rem',
                    height: '2rem',
                    backgroundColor: color,
                    borderRadius: '2px',
                    border: '1px solid lightgray',
                    margin: '0.5rem',
                    cursor: 'pointer',
                    '&:hover': {
                      border: '1px solid blue',
                    },
                    '&.active': {
                      border: '1.5px solid blue',
                    },
                  }}
                />
              ))}
            </Box>
          ))}
          <Box
            onClick={handleClickNonColor}
            className={activeColor === null ? 'active' : ''}
            sx={{
              width: '2rem',
              height: '2rem',
              backgroundColor: '#ffffff',
              borderRadius: '2px',
              border: '1px solid lightgray',
              margin: '0.5rem',
              cursor: 'pointer',
              fontFamily: 'Poppins',
              fontSize: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              '&:hover': {
                border: '1px solid blue',
              },
              '&.active': {
                border: '1.5px solid blue',
              },
            }}
          >
            None
          </Box>
        </Box>
      </Box>

      {/* Invert Text Toggle */}
      <Box sx={{ marginTop: '10px', marginBottom: '10px' }}>
        <FormControlLabel
          control={
            
            <Switch
              checked={checked}
              defaultChecked
              onChange={(e) => handleChange(!checked)}
            />
          }
          label="Invert Text Color"
        />
      </Box>

      {/* Gradient Color Selection */}
      <Box sx={{ marginTop: '20px' }}>
        <Typography
          sx={{
            fontFamily: 'Poppins',
            fontWeight: 400,
            color: '#6B7A99',
            fontSize: '14px',
            marginBottom: '10px',
          }}
        >
          Value Box Gradient Colors
        </Typography>

        {/* Gradient Presets */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '15px' }}>
          {gradientPresets.map((preset, idx) => (
            <Box
              key={idx}
              onClick={() => {
                setGradientStart(preset.start);
                setGradientEnd(preset.end);
              }}
              sx={{
                width: '40px',
                height: '20px',
                background: `linear-gradient(135deg, ${preset.start}, ${preset.end})`,
                borderRadius: '6px',
                border: gradientStart === preset.start && gradientEnd === preset.end
                  ? '2px solid #2d8ae0'
                  : '1px solid lightgray',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                '&:hover': {
                  border: '2px solid #2d8ae0',
                  transform: 'scale(1.05)',
                },
              }}
              title={preset.name}
            />
          ))}
        </Box>

        {/* Custom Color Pickers */}
        <Box sx={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
          <Box sx={{ flex: 1 }}>
            <Typography
              sx={{
                fontFamily: 'Poppins',
                fontSize: '12px',
                color: '#6B7A99',
                marginBottom: '5px',
              }}
            >
              Start Color
            </Typography>
            <input
              type="color"
              value={gradientStart}
              onChange={(e) => setGradientStart(e.target.value)}
              style={{
                width: '100%',
                height: '40px',
                border: '1px solid lightgray',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography
              sx={{
                fontFamily: 'Poppins',
                fontSize: '12px',
                color: '#6B7A99',
                marginBottom: '5px',
              }}
            >
              End Color
            </Typography>
            <input
              type="color"
              value={gradientEnd}
              onChange={(e) => setGradientEnd(e.target.value)}
              style={{
                width: '100%',
                height: '40px',
                border: '1px solid lightgray',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            />
          </Box>
        </Box>

        {/* Preview */}
        <Box sx={{ marginTop: '15px' }}>
          <Typography
            sx={{
              fontFamily: 'Poppins',
              fontSize: '12px',
              color: '#6B7A99',
              marginBottom: '5px',
            }}
          >
            Preview
          </Typography>
          <Box
            sx={{
              width: '100%',
              height: '50px',
              background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
              borderRadius: '8px',
              border: '1px solid lightgray',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography
              sx={{
                fontFamily: 'Inter',
                fontWeight: 600,
                fontSize: '20px',
                background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              1000
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default TemplateCustomOptions;


