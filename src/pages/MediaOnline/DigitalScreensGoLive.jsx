/**
 * Digital ADs (Media Online) – Go Live step.
 * Same experience as Media Online go live: 3–6 product images, drag-and-drop, marketplace preview,
 * FormData upload via product mutation, then redirect to preview.
 * DOOH listings (mediaCategory from tile: `dooh`) use the hoarding-style preview so screens + row
 * images can be reviewed on `/hoardingmediaofflineproductpreview/:id`.
 * Other digital-screen listings keep `/mediaonlineproductpreview/:id`.
 * Stepper back navigation uses pathname `digitalscreensgolive` → prev `mediaonlinedigitalscreenstechinfo`
 * (see MEDIA_STEP_PATHS in categoryFormConfig).
 */
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { GoLive } from '../AddProduct/AddProductSteps';
import { productApi } from '../../utils/api';

export default function DigitalScreensGoLive() {
  const { id } = useParams();
  const [previewPath, setPreviewPath] = useState(null);

  useEffect(() => {
    if (!id) {
      setPreviewPath('/mediaonlineproductpreview');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await productApi.getProductById(id);
        const data = res?.data?.body ?? res?.data ?? res;
        const mc = String(data?.mediaCategory || '').toLowerCase();
        if (cancelled) return;
        setPreviewPath(
          mc === 'dooh'
            ? '/hoardingmediaofflineproductpreview'
            : '/mediaonlineproductpreview',
        );
      } catch {
        if (!cancelled) setPreviewPath('/mediaonlineproductpreview');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!previewPath) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <p className="text-sm text-[#6B7A99]">Loading…</p>
      </div>
    );
  }

  return <GoLive category="mediaonline" mediaOnlinePreviewPath={previewPath} />;
}
