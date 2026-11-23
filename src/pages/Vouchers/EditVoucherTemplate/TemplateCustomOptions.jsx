import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, FormControlLabel, Switch, Typography } from '@mui/material';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import GlobalToast from '../../../components/Toasts/GlobalToast';

const PHOTO_SLOTS = [
  { id: 'cover', title: 'Cover photo', description: 'Shown at the top of the voucher card.' },
  { id: 'product', title: 'Product photo', description: 'Shows what the voucher is for.' },
  { id: 'extra', title: 'Extra photo', description: 'Any other photo that sells the offer.' },
];

const colors = [
  '#FFE5E580','#FFE5CC80','#FFF9E580','#E5FFE580','#E5F9FF80','#E5E5FF80','#FFE5F980','#F0F0F080','#E5FFCC80',
  '#FF6B9D','#FF8C42','#FFD93D','#6BCF7F','#4ECDC4','#5B8DEF','#A78BFA','#EC4899','#F59E0B',
  '#DC2626','#EA580C','#CA8A04','#16A34A','#0891B2','#2563EB','#7C3AED','#BE185D','#64748B',
  '#92400E','#78350F','#713F12','#365314','#134E4A','#1E3A8A','#581C87','#831843','#1E293B',
  '#F8FAFC','#E2E8F0','#94A3B8','#475569','#1F2937','#111827','#000000',
];
const gradientPresets = [
  ['#7c3aed','#3b82f6'], ['#ec4899','#f97316'], ['#10b981','#14b8a6'], ['#ef4444','#ec4899'],
  ['#0ea5e9','#3b82f6'], ['#c026d3','#6366f1'], ['#f59e0b','#f97316'], ['#1e293b','#581c87'],
];

function readPhoto(slot, file, onLoaded) {
  if (!file) return;
  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    GlobalToast('Choose a JPEG or PNG image.', 'error');
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    GlobalToast('Each image must be 2 MB or smaller.', 'error');
    return;
  }
  const reader = new FileReader();
  reader.onload = () => onLoaded({ id: slot, file, preview: reader.result });
  reader.onerror = () => GlobalToast('The selected image could not be loaded.', 'error');
  reader.readAsDataURL(file);
}

export function VoucherImageThumbnails({ photos, updatePreview }) {
  return (
    <Box sx={{ mt: 2.5, width: '100%' }}>
      <Typography sx={{ fontSize: 14, fontWeight: 700, mb: .5 }}>Images on this voucher</Typography>
      <Typography sx={{ fontSize: 12, color: '#64748b', mb: 1 }}>Click a thumbnail to preview it.</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 1.25 }}>
        {PHOTO_SLOTS.map((slot, index) => {
          const photo = photos.find(item => item.id === slot.id);
          return <Box key={slot.id} onClick={() => photo?.preview && updatePreview(photo.preview)} sx={{ minWidth: 0, cursor: 'pointer' }}>
            <Box sx={{ height: 76, borderRadius: 2, overflow: 'hidden', border: `1px ${photo ? 'solid #cc3185' : 'dashed #b8c2d3'}`, bgcolor: '#f3f5fa', display: 'grid', placeItems: 'center' }}>
              {photo?.preview ? <img src={photo.preview} alt={`${slot.title} thumbnail`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Typography sx={{ fontSize: 12, color: '#64748b' }}>Empty</Typography>}
            </Box>
            <Typography sx={{ mt: .5, fontSize: 12, fontWeight: 600, color: photo ? '#c02c82' : '#64748b' }}>{index + 1} {slot.title.replace(' photo', '')}</Typography>
          </Box>;
        })}
      </Box>
    </Box>
  );
}

export function VoucherDesignControls({ updateBGColor, updateTextColor, updateGradientColors }) {
  const [activeColor, setActiveColor] = useState('#134E4A');
  const [cardBgColor, setCardBgColor] = useState('#134E4A');
  const [invertText, setInvertText] = useState(true);
  const [gradient, setGradient] = useState({ start: '#ec4899', end: '#f97316' });
  useEffect(() => { updateBGColor(cardBgColor); }, [cardBgColor, updateBGColor]);
  useEffect(() => { updateTextColor(invertText); }, [invertText, updateTextColor]);
  useEffect(() => { updateGradientColors(gradient); }, [gradient, updateGradientColors]);

  return (
    <Box sx={{ mt: 2.5, width: '100%' }}>
      <Box sx={{ borderTop: '1px solid #e5eaf1', pt: 2 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 1 }}>Choose background color</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(9, minmax(20px, 1fr))', gap: .65 }}>
          {colors.map(color => <button key={color} aria-label={`Background ${color}`} onClick={() => { setActiveColor(color); setCardBgColor(color); }} style={{ height: 32, borderRadius: 8, background: color, border: activeColor === color ? '2px solid #315794' : '1px solid #d9dfeb', cursor: 'pointer' }} />)}
          <button aria-label="No background color" onClick={() => { setActiveColor(null); setCardBgColor(''); }} style={{ borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', fontSize: 10 }}>None</button>
        </Box>
        <FormControlLabel sx={{ mt: .75 }} control={<Switch checked={invertText} onChange={event => setInvertText(event.target.checked)} />} label={<Typography sx={{ fontSize: 14 }}>Invert text color</Typography>} />
      </Box>

      <Box sx={{ mt: 1.5 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 1 }}>Value Box Gradient Colors</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.25 }}>{gradientPresets.map(([start, end]) => <button key={start} aria-label={`Gradient ${start} to ${end}`} onClick={() => { setCardBgColor(''); setActiveColor(null); setGradient({ start, end }); }} style={{ width: 48, height: 28, borderRadius: 8, border: gradient.start === start && gradient.end === end ? '2px solid #315794' : '1px solid #fff', background: `linear-gradient(135deg, ${start}, ${end})`, cursor: 'pointer' }} />)}</Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>{[['Start Color','start'],['End Color','end']].map(([label,key]) => <label key={key} style={{ color: '#64748b', fontSize: 12 }}>{label}<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, border: '1px solid #cbd5e1', borderRadius: 2, p: .75, mt: .5, bgcolor: '#fff' }}><input type="color" value={gradient[key]} onChange={event => { setCardBgColor(''); setActiveColor(null); setGradient(previous => ({ ...previous, [key]: event.target.value })); }} style={{ border: 0, padding: 0, width: 28, height: 28, cursor: 'pointer' }} /><span style={{ color: '#1e293b', fontSize: 13 }}>{gradient[key]}</span></Box></label>)}</Box>
        <Typography sx={{ fontSize: 12, color: '#64748b', mt: 1.25, mb: .5 }}>Preview</Typography>
        <Box sx={{ height: 48, borderRadius: 2, background: `linear-gradient(100deg, ${gradient.start}, ${gradient.end})`, display: 'grid', placeItems: 'center', color: '#10213b', fontSize: 14, fontWeight: 700 }}>Value box preview</Box>
      </Box>
    </Box>
  );
}

const TemplateCustomOptions = ({ photos, updateFile, updateBGColor, updateTextColor, updateGradientColors }) => {
  const inputs = useRef({});
  const uploadedCount = photos.length;
  const setPhoto = (slot, file) => readPhoto(slot, file, photo => updateFile(previous => [...previous.filter(item => item.id !== slot), photo]));

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 1 }}>
        <Box><Typography sx={{ fontSize: 16, fontWeight: 700 }}>Upload voucher images</Typography><Typography sx={{ fontSize: 13, color: '#64748b' }}>Add all 3 images. JPEG or PNG, max 2 MB each, best at 1200 × 800.</Typography></Box>
        <Typography sx={{ bgcolor: '#fceaf4', color: '#b6267e', px: 1.5, py: .7, borderRadius: 5, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>{uploadedCount} of 3 uploaded</Typography>
      </Box>
      <Box sx={{ height: 6, borderRadius: 5, bgcolor: '#e3e7ef', mb: 1.5 }}><Box sx={{ width: `${uploadedCount / 3 * 100}%`, height: '100%', borderRadius: 5, bgcolor: '#c5358b', transition: 'width .2s' }} /></Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 1.5 }}>
        {PHOTO_SLOTS.map((slot, index) => {
          const photo = photos.find(item => item.id === slot.id);
          return <Box key={slot.id} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); setPhoto(slot.id, event.dataTransfer.files?.[0]); }} sx={{ minHeight: 265, p: 1.5, border: `2px ${photo ? 'solid #159451' : 'dashed #5682ff'}`, borderRadius: 3, bgcolor: photo ? '#f5fbf7' : '#f7f8fd', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}><Box sx={{ width: 24, height: 24, borderRadius: '50%', color: '#fff', bgcolor: photo ? '#198f50' : '#c5358b', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700 }}>{index + 1}</Box><Typography sx={{ fontSize: 14, fontWeight: 700 }}>{slot.title}</Typography></Box>
            <Typography sx={{ fontSize: 12, lineHeight: 1.4, color: '#64748b', minHeight: 36 }}>{slot.description}</Typography>
            {photo ? <><Box sx={{ height: 110, borderRadius: 2, overflow: 'hidden', mt: 1, position: 'relative' }}><img src={photo.preview} alt={slot.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /><Typography sx={{ position: 'absolute', bottom: 6, left: 6, maxWidth: '90%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', bgcolor: '#15304e', color: '#fff', px: .75, borderRadius: 1, fontSize: 11 }}>{photo.file.name}</Typography></Box><Box sx={{ display: 'flex', gap: .75, mt: 1 }}><Button size="small" variant="outlined" onClick={() => inputs.current[slot.id]?.click()}>Replace</Button><Button size="small" color="error" variant="outlined" startIcon={<DeleteOutlineIcon />} onClick={() => updateFile(previous => previous.filter(item => item.id !== slot.id))}>Remove</Button></Box></> : <Box role="button" tabIndex={0} onClick={() => inputs.current[slot.id]?.click()} onKeyDown={event => event.key === 'Enter' && inputs.current[slot.id]?.click()} sx={{ flex: 1, display: 'grid', placeContent: 'center', justifyItems: 'center', color: '#315794', cursor: 'pointer', '&:hover': { color: '#1d4ed8' } }}><CloudUploadOutlinedIcon sx={{ fontSize: 30, mb: .5 }} /><Typography sx={{ fontSize: 13, fontWeight: 600 }}>Click or drop image</Typography><Typography sx={{ mt: 3, alignSelf: 'end', color: '#c5358b', fontSize: 12, fontWeight: 700 }}>Required</Typography></Box>}
            <input ref={element => { inputs.current[slot.id] = element; }} type="file" accept="image/jpeg,image/png" hidden onChange={event => { setPhoto(slot.id, event.target.files?.[0]); event.target.value = ''; }} />
          </Box>;
        })}
      </Box>
      <VoucherDesignControls
        updateBGColor={updateBGColor}
        updateTextColor={updateTextColor}
        updateGradientColors={updateGradientColors}
      />
    </Box>
  );
};

export default TemplateCustomOptions;
