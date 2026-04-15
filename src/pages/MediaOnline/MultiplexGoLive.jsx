/**
 * Multiplex (Media Online) – Go Live step.
 * Same experience as Print Media go live and standard Media Online go live: 3–6 product images,
 * drag-and-drop, marketplace preview, FormData upload via product mutation, then redirect to
 * multiplex product preview.
 * Stepper back navigation uses pathname `multiplexgolive` → prev `mediamultiplextechinfo`
 * (see MEDIA_STEP_PATHS in categoryFormConfig).
 */
import { GoLive } from '../AddProduct/AddProductSteps';

export default function MultiplexGoLive() {
  return (
    <GoLive category="mediaonline" mediaOnlinePreviewPath="/multiplexmediaonlineproductpreview" />
  );
}
