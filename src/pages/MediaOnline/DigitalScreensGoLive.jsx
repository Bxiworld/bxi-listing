/**
 * Digital ADs (Media Online) – Go Live step.
 * Same experience as Media Online go live: 3–6 product images, drag-and-drop, marketplace preview,
 * FormData upload via product mutation, then redirect to media online product preview.
 * Stepper back navigation uses pathname `digitalscreensgolive` → prev `mediaonlinedigitalscreenstechinfo`
 * (see MEDIA_STEP_PATHS in categoryFormConfig).
 */
import { GoLive } from '../AddProduct/AddProductSteps';

export default function DigitalScreensGoLive() {
  return (
    <GoLive category="mediaonline" mediaOnlinePreviewPath="/mediaonlineproductpreview" />
  );
}
