import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  Mail,
  AlertTriangle,
  ExternalLink,
  Upload,
  X,
  Circle,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { bulkUploadApi } from '../utils/api';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

function formatValidationError(err) {
  if (err == null) return '';
  if (typeof err === 'string') return err;
  if (typeof err === 'object') {
    return (
      err.message ||
      err.error ||
      err.msg ||
      [err.row, err.field, err.detail].filter(Boolean).join(' — ') ||
      JSON.stringify(err)
    );
  }
  return String(err);
}

const POLL_MS = 5000;

/** @typedef {'complete' | 'active' | 'upcoming' | 'error'} StepStatus */

function connectorClassAfterStep(leftStepStatus) {
  if (leftStepStatus === 'complete') return 'bg-emerald-400';
  if (leftStepStatus === 'error') return 'bg-amber-400';
  return 'bg-gray-200';
}

function HorizontalStepTrack({ steps }) {
  return (
    <div
      className="rounded-xl border border-gray-100 bg-white px-3 py-5 sm:px-6 sm:py-6 overflow-x-auto"
      role="list"
      aria-label="Bulk upload progress"
    >
      <div className="flex items-center w-full min-w-[300px] sm:min-w-[520px]">
        {steps.map((step, i) => (
          <React.Fragment key={step.key}>
            <div
              className="flex flex-col items-center shrink-0 w-[4.25rem] sm:w-28"
              role="listitem"
            >
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors',
                  step.status === 'complete' &&
                    'border-emerald-200 bg-emerald-50 text-emerald-700',
                  step.status === 'active' &&
                    'border-[#C64091]/50 bg-[#FCE7F3] text-[#C64091] ring-2 ring-[#C64091]/15',
                  step.status === 'error' &&
                    'border-amber-200 bg-amber-50 text-amber-800',
                  step.status === 'upcoming' && 'border-gray-200 bg-gray-50 text-gray-400',
                )}
              >
                {step.status === 'complete' ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : step.status === 'active' ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : step.status === 'error' ? (
                  <AlertTriangle className="h-5 w-5" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
              </div>
              <span className="text-[10px] sm:text-xs font-semibold text-center mt-2.5 leading-tight text-gray-800 px-0.5">
                {step.shortLabel}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-1 mx-1 sm:mx-2 rounded-full min-w-[0.75rem] shrink',
                  connectorClassAfterStep(step.status),
                )}
                aria-hidden
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function StepDetailCard({ stepNumber, title, description, status, children }) {
  return (
    <section
      className={cn(
        'rounded-xl border bg-white p-4 sm:p-5 shadow-sm flex flex-col min-h-0 min-w-0 h-full',
        status === 'active' && 'border-[#C64091]/35 shadow-md ring-1 ring-[#C64091]/10',
        status === 'error' && 'border-amber-200/80',
        status === 'complete' && 'border-emerald-100',
        status === 'upcoming' && 'border-gray-100 bg-gray-50/40',
      )}
      aria-current={status === 'active' ? 'step' : undefined}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            Step {stepNumber}
          </p>
          <h2
            className="text-base font-bold text-gray-900 mt-0.5 leading-snug"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            {title}
          </h2>
          {description && (
            <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">{description}</p>
          )}
        </div>
        {status === 'complete' && (
          <span className="text-[10px] font-medium text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full shrink-0">
            Done
          </span>
        )}
        {status === 'active' && (
          <span className="text-[10px] font-medium text-[#C64091] bg-[#FCE7F3] px-2 py-0.5 rounded-full shrink-0">
            In progress
          </span>
        )}
        {status === 'error' && (
          <span className="text-[10px] font-medium text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full shrink-0">
            Needs attention
          </span>
        )}
        {status === 'upcoming' && (
          <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full shrink-0">
            Waiting
          </span>
        )}
      </div>
      {children != null && children !== false && (
        <div className="mt-3 text-sm flex-1 min-w-0 w-full">{children}</div>
      )}
    </section>
  );
}

export default function BulkUploadProcessing() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state;

  const jobId = state?.jobId;
  const webhookId = state?.webhookId;
  const storeResponse = state?.storeResponse;
  const fileName = state?.fileName;
  const category = state?.category || 'product';

  const categoryLabel = useMemo(
    () => category.charAt(0).toUpperCase() + category.slice(1),
    [category],
  );

  const [processingPayload, setProcessingPayload] = useState(null);
  const [pollError, setPollError] = useState(null);
  const [registerError, setRegisterError] = useState(null);
  const createSentRef = useRef(false);

  const [correctedFile, setCorrectedFile] = useState(null);
  const [correctedUploading, setCorrectedUploading] = useState(false);
  const [correctedValidationErrors, setCorrectedValidationErrors] = useState([]);
  const [correctedUploadOk, setCorrectedUploadOk] = useState(false);
  const [validationMeta, setValidationMeta] = useState(null);
  const [issuesModalOpen, setIssuesModalOpen] = useState(false);
  const correctedInputRef = useRef(null);

  const hasTracking = Boolean(webhookId || jobId);

  useEffect(() => {
    if (!storeResponse?._id || createSentRef.current) return;
    createSentRef.current = true;
    bulkUploadApi
      .createCompanyUpload(storeResponse)
      .catch((err) => {
        createSentRef.current = false;
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          'Could not register upload with your company profile.';
        setRegisterError(msg);
      });
  }, [storeResponse]);

  useEffect(() => {
    if (!hasTracking) return undefined;

    let cancelled = false;
    let intervalId = null;

    const poll = async () => {
      try {
        const body = webhookId
          ? { webhook_id: webhookId }
          : { job_id: jobId };
        const { data } = await bulkUploadApi.checkProcessingStatus(body);
        if (cancelled) return;
        setProcessingPayload(data);
        setPollError(null);

        const done =
          data?.can_proceed === true ||
          data?.needs_retry === true ||
          data?.status === 'completed_with_errors' ||
          (data?.processing_complete && data?.can_proceed !== true);
        if (done && intervalId != null) {
          clearInterval(intervalId);
          intervalId = null;
        }
      } catch (err) {
        if (cancelled) return;
        setPollError(
          err?.response?.data?.message ||
            err?.message ||
            'Could not check processing status.',
        );
      }
    };

    poll();
    intervalId = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      if (intervalId != null) clearInterval(intervalId);
    };
  }, [hasTracking, webhookId, jobId]);

  const isComplete = processingPayload?.can_proceed === true;
  const isFailed = processingPayload?.needs_retry === true;
  const completedWithIssues =
    processingPayload?.status === 'completed_with_errors' ||
    (processingPayload?.processing_complete && !isComplete && !isFailed);

  const showCorrectedUpload =
    Boolean(webhookId) &&
    !isFailed &&
    (isComplete ||
      (completedWithIssues && Boolean(processingPayload?.download_url)));

  useEffect(() => {
    if (!webhookId || !showCorrectedUpload) return undefined;
    let cancelled = false;
    const syncLinkAndErrors = async () => {
      try {
        await bulkUploadApi.fetchCompanyUpload();
      } catch {
        /* best-effort: row may already be linked */
      }
      if (cancelled) return;
      try {
        const { data } = await bulkUploadApi.getBulkValidationErrors(webhookId);
        if (cancelled || !data?.hasErrors) return;
        const list = data.validationErrors || [];
        if (list.length) setCorrectedValidationErrors(list);
      } catch {
        /* ignore */
      }
    };
    syncLinkAndErrors();
    return () => {
      cancelled = true;
    };
  }, [webhookId, showCorrectedUpload]);

  const handleCorrectedFile = (f) => {
    if (!f) return;
    const ok =
      f.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      f.type === 'application/vnd.ms-excel' ||
      /\.(xlsx|xls)$/i.test(f.name);
    if (!ok) {
      toast.error('Please choose an Excel file (.xlsx or .xls)');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error('File must be 10MB or smaller');
      return;
    }
    setCorrectedFile(f);
    setCorrectedUploadOk(false);
    setCorrectedValidationErrors([]);
    setValidationMeta(null);
    setIssuesModalOpen(false);
  };

  const submitCorrectedFile = async () => {
    if (!correctedFile || !webhookId) {
      toast.error('Select a file first');
      return;
    }
    setCorrectedUploading(true);
    setCorrectedValidationErrors([]);
    setCorrectedUploadOk(false);
    setValidationMeta(null);
    setIssuesModalOpen(false);
    try {
      try {
        await bulkUploadApi.fetchCompanyUpload();
      } catch {
        /* ensure bulk_upload_files.webhook_response_id is set when possible */
      }
      const formData = new FormData();
      formData.append('file', correctedFile);
      formData.append('webhook_id', webhookId);
      formData.append('category', category);
      const { data } = await bulkUploadApi.uploadCorrectedBulkFile(formData);
      if (data?.file_Uploaded) {
        setCorrectedUploadOk(true);
        setCorrectedValidationErrors([]);
        setIssuesModalOpen(false);
        setValidationMeta({
          totalRows: data.totalRows,
          validatedRows: data.validatedRows,
        });
        toast.success(data.message || 'File passed validation and was saved.');
      }
    } catch (err) {
      const res = err?.response?.data;
      const errors = res?.errors;
      if (Array.isArray(errors) && errors.length > 0) {
        setCorrectedValidationErrors(errors);
        setIssuesModalOpen(true);
        setValidationMeta({
          totalRows: res.totalRows,
          validatedRows: res.validatedRows,
        });
        toast.error(res.message || `Validation found ${errors.length} issue(s).`);
      } else {
        toast.error(res?.message || err?.message || 'Upload failed');
      }
    } finally {
      setCorrectedUploading(false);
    }
  };

  if (!state || !hasTracking) {
    return <Navigate to="/sellerhub" replace />;
  }

  const stillProcessing =
    hasTracking &&
    processingPayload &&
    !isComplete &&
    !isFailed &&
    !completedWithIssues &&
    processingPayload.status === 'processing';
  const showSpinner =
    !processingPayload ||
    stillProcessing ||
    (!isComplete && !isFailed && !completedWithIssues && !pollError);

  const aiTerminal = Boolean(processingPayload) && !showSpinner;
  const hasDownload =
    Boolean(processingPayload?.download_url) &&
    (isComplete || completedWithIssues);

  /** @type {StepStatus} */
  const step1Status = 'complete';
  /** @type {StepStatus} */
  const step2Status = isFailed
    ? 'error'
    : showSpinner
      ? 'active'
      : aiTerminal
        ? 'complete'
        : 'active';
  /** @type {StepStatus} */
  const step3Status = showSpinner
    ? 'upcoming'
    : isFailed
      ? 'error'
      : hasDownload || isComplete || completedWithIssues
        ? 'complete'
        : 'active';
  /** @type {StepStatus} */
  const step4Status = !showCorrectedUpload
    ? 'upcoming'
    : correctedUploadOk
      ? 'complete'
      : correctedUploading
        ? 'active'
        : correctedValidationErrors.length > 0
          ? 'error'
          : 'active';

  const railBase = [
    {
      key: 'submitted',
      shortLabel: 'Submitted',
      status: 'complete',
    },
    {
      key: 'ai',
      shortLabel: 'AI',
      status:
        step2Status === 'complete'
          ? 'complete'
          : step2Status === 'error'
            ? 'error'
            : 'active',
    },
    {
      key: 'output',
      shortLabel: 'Output',
      status:
        step3Status === 'upcoming'
          ? 'upcoming'
          : step3Status === 'error'
            ? 'error'
            : 'complete',
    },
  ];
  const railSteps = showCorrectedUpload
    ? [
        ...railBase,
        {
          key: 'validate',
          shortLabel: 'Validate',
          status:
            step4Status === 'complete'
              ? 'complete'
              : step4Status === 'error'
                ? 'error'
                : step4Status === 'active'
                  ? 'active'
                  : 'upcoming',
        },
      ]
    : railBase;

  const headline = isComplete
    ? 'Processing complete'
    : isFailed
      ? 'Processing failed'
      : completedWithIssues
        ? 'Finished with issues'
        : 'Your file is being processed';

  return (
    <>
    <div className="min-h-screen bg-[#F8F9FA] py-8" data-testid="bulk-upload-processing">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/sellerhub')}
          className="mb-4 text-gray-600 hover:text-[#C64091]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Seller Hub
        </Button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-gray-100 bg-gradient-to-br from-[#FCE7F3]/40 to-white">
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  'flex h-14 w-14 shrink-0 items-center justify-center rounded-full',
                  isComplete
                    ? 'bg-emerald-100 text-emerald-700'
                    : isFailed || completedWithIssues
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-[#FCE7F3] text-[#C64091]',
                )}
              >
                {isComplete ? (
                  <CheckCircle2 className="h-7 w-7" />
                ) : isFailed || completedWithIssues ? (
                  <AlertTriangle className="h-7 w-7" />
                ) : showSpinner ? (
                  <Loader2 className="h-7 w-7 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-7 w-7" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#C64091]">
                  Bulk upload · {categoryLabel}
                </p>
                <h1
                  className="text-2xl font-bold text-gray-900 mt-1"
                  style={{ fontFamily: 'Manrope, sans-serif' }}
                >
                  {headline}
                </h1>
                {fileName && (
                  <p className="text-sm text-gray-500 mt-2 font-mono truncate">
                    {fileName}
                  </p>
                )}
                {jobId && (
                  <p className="text-xs text-gray-400 mt-1">Job ID: {jobId}</p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Progress
              </p>
              <HorizontalStepTrack steps={railSteps} />
            </div>

            {/* <div className="flex flex-wrap gap-3 mt-6">
              <Button
                className="bg-[#C64091] hover:bg-[#A03375]"
                onClick={() => navigate('/sellerhub')}
              >
                Go to Seller Hub
              </Button>
              {(isComplete || completedWithIssues) && (
                <Button variant="outline" onClick={() => navigate('/sellerhub')}>
                  Continue listing
                </Button>
              )}
            </div> */}
          </div>

          <div className="p-6 sm:p-8 bg-[#FAFBFC]">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Step details
            </p>
            <div
              className={cn(
                'grid gap-4 items-stretch',
                showCorrectedUpload
                  ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4'
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
              )}
            >
              <StepDetailCard
                stepNumber={1}
                title="File submitted"
                description="Your spreadsheet is saved and linked to your company profile for this bulk job."
                status={step1Status}
              >
                {registerError ? (
                  <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-2">
                    {registerError} You can still wait for the email notification.
                  </p>
                ) : (
                  <p className="text-xs text-gray-500">Registered for this job.</p>
                )}
              </StepDetailCard>

              <StepDetailCard
                stepNumber={2}
                title="AI processing"
                description="Data is cleaned and transformed off-site. Status refreshes every few seconds in this tab."
                status={step2Status}
              >
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                  {processingPayload?.message ||
                    state?.initialMessage ||
                    'Waiting for the first status update…'}
                </p>
                {pollError && <p className="text-xs text-red-600 mt-2">{pollError}</p>}
                <p className="text-[11px] text-gray-400 mt-2 flex items-start gap-1.5">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-[#C64091] mt-0.5" />
                  You may also get an email when the file is ready.
                </p>
              </StepDetailCard>

              <StepDetailCard
                stepNumber={3}
                title="Download Excel"
                description="Fix highlighted cells, then validate in the next column when available."
                status={step3Status}
              >
                {showSpinner && (
                  <p className="text-xs text-gray-500">Unlocks when AI processing finishes.</p>
                )}
                {isFailed && !showSpinner && (
                  <p className="text-xs text-amber-900">
                    No output file for this run. Try uploading again from Seller Hub or contact support.
                  </p>
                )}
                {!showSpinner && !isFailed && hasDownload && (
                  <a
                    href={processingPayload.download_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-[#C64091] font-medium text-xs sm:text-sm hover:underline"
                  >
                    <ExternalLink className="h-4 w-4 shrink-0" />
                    Download processed file
                  </a>
                )}
                {!showSpinner &&
                  !isFailed &&
                  (isComplete || completedWithIssues) &&
                  !processingPayload?.download_url && (
                    <p className="text-xs text-gray-600">
                      Download link not ready yet—check email or refresh this page.
                    </p>
                  )}
              </StepDetailCard>

              {showCorrectedUpload && (
                <StepDetailCard
                  stepNumber={4}
                  title="BXI validation"
                  description="Re-upload your corrected file. No second AI pass—checks run on BXI only."
                  status={step4Status}
                >
                  <div className="flex flex-col gap-3">
                    <input
                      ref={correctedInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={(e) => handleCorrectedFile(e.target.files?.[0])}
                    />
                    <div className="flex flex-col gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-[#C64091] text-[#C64091] hover:bg-[#FCE7F3] w-full sm:w-auto"
                        onClick={() => correctedInputRef.current?.click()}
                        disabled={correctedUploading}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Choose Excel
                      </Button>
                      {correctedFile && (
                        <div className="flex items-center gap-2 text-xs text-gray-700 min-w-0">
                          <FileSpreadsheet className="w-4 h-4 shrink-0 text-emerald-600" />
                          <span className="truncate font-mono">{correctedFile.name}</span>
                          <button
                            type="button"
                            className="p-1 rounded hover:bg-gray-200 text-gray-500"
                            onClick={() => {
                              setCorrectedFile(null);
                              setCorrectedUploadOk(false);
                              if (correctedInputRef.current) correctedInputRef.current.value = '';
                            }}
                            aria-label="Remove file"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        className="bg-[#C64091] hover:bg-[#A03375] w-full sm:w-auto"
                        disabled={!correctedFile || correctedUploading}
                        onClick={submitCorrectedFile}
                      >
                        {correctedUploading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Validating…
                          </>
                        ) : (
                          'Validate upload'
                        )}
                      </Button>
                    </div>

                    {validationMeta &&
                      (validationMeta.totalRows != null || validationMeta.validatedRows != null) && (
                        <p className="text-[11px] text-gray-500">
                          {validationMeta.validatedRows != null && (
                            <>Rows checked: {validationMeta.validatedRows}</>
                          )}
                          {validationMeta.totalRows != null && (
                            <>
                              {validationMeta.validatedRows != null ? ' · ' : null}
                              Total rows: {validationMeta.totalRows}
                            </>
                          )}
                        </p>
                      )}

                    {correctedUploadOk && (
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
                        Validation passed. File saved—continue from Seller Hub when ready.
                      </div>
                    )}

                    {correctedValidationErrors.length > 0 && (
                      <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex flex-col gap-3 w-full min-w-0">
                        <p className="text-xs text-red-900 font-medium leading-relaxed min-w-0">
                          {correctedValidationErrors.length} validation issue
                          {correctedValidationErrors.length === 1 ? '' : 's'} found. Open the full list
                          to review row and field details.
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          className="bg-red-700 hover:bg-red-800 text-white w-full justify-center"
                          onClick={() => setIssuesModalOpen(true)}
                        >
                          <AlertTriangle className="w-4 h-4 mr-2 shrink-0" />
                          View all issues
                        </Button>
                      </div>
                    )}
                  </div>
                </StepDetailCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

    <Dialog open={issuesModalOpen} onOpenChange={setIssuesModalOpen}>
      <DialogContent
        className={cn(
          'max-w-[min(96vw,56rem)] w-full gap-0 p-0 flex flex-col max-h-[min(90vh,900px)]',
          'sm:rounded-xl border-red-100',
        )}
      >
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-red-100 shrink-0 text-left space-y-2 pr-12">
          <DialogTitle
            className="text-xl text-red-950 flex items-center gap-2 font-bold"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            <AlertTriangle className="h-6 w-6 shrink-0 text-red-600" />
            Validation issues ({correctedValidationErrors.length})
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600 text-left">
            Correct the highlighted problems in your Excel file, then save and use &quot;Validate upload&quot;
            again. This list is scrollable if you have many rows to fix.
          </DialogDescription>
          {validationMeta &&
            (validationMeta.totalRows != null || validationMeta.validatedRows != null) && (
              <p className="text-xs text-gray-500 pt-1">
                {validationMeta.validatedRows != null && (
                  <>Rows checked: {validationMeta.validatedRows}</>
                )}
                {validationMeta.totalRows != null && (
                  <>
                    {validationMeta.validatedRows != null ? ' · ' : null}
                    Total rows: {validationMeta.totalRows}
                  </>
                )}
              </p>
            )}
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 bg-red-50/30">
          <ol className="space-y-3 list-none m-0 p-0">
            {correctedValidationErrors.map((item, idx) => (
              <li
                key={idx}
                className="rounded-lg border border-red-100 bg-white px-4 py-3 text-sm text-red-950 shadow-sm"
              >
                <span className="text-xs font-semibold text-red-600/80 tabular-nums mr-2">
                  {idx + 1}.
                </span>
                <span className="leading-relaxed">{formatValidationError(item)}</span>
              </li>
            ))}
          </ol>
        </div>
        <DialogFooter className="px-6 py-4 border-t border-gray-100 shrink-0 bg-gray-50/90 sm:justify-between gap-2">
          <p className="text-xs text-gray-500 text-left w-full sm:w-auto mr-auto">
            Close this window to return to the upload step.
          </p>
          <Button
            type="button"
            className="bg-[#C64091] hover:bg-[#A03375] w-full sm:w-auto"
            onClick={() => setIssuesModalOpen(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
