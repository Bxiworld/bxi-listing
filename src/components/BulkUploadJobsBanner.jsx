import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import { bulkUploadApi } from '../utils/api';
import { cn } from '../lib/utils';

/**
 * Recovery banner for bulk-upload jobs.
 *
 * The status page used to be reachable only via in-tab router state, so leaving the
 * page orphaned the job. This banner lists the company's recent bulk jobs (from the
 * server, keyed on company id) and links each to the URL-addressable status page, so a
 * seller can always get back to an in-flight or finished job instead of re-uploading.
 *
 * It is intentionally fail-safe: any error just hides the banner — it must never break
 * Seller Hub.
 */
const POLL_MS = 10000;

function statusMeta(job) {
  switch (job.status) {
    case 'completed':
      return { label: 'Ready', cls: 'bg-emerald-100 text-emerald-800', Icon: CheckCircle2 };
    case 'completed_with_errors':
      return { label: 'Finished with issues', cls: 'bg-amber-100 text-amber-800', Icon: AlertTriangle };
    case 'failed':
      return { label: 'Failed', cls: 'bg-red-100 text-red-800', Icon: AlertTriangle };
    default:
      return { label: 'Processing', cls: 'bg-[#FCE7F3] text-[#C64091]', Icon: Loader2 };
  }
}

function relativeTime(value) {
  if (!value) return '';
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return '';
  const diffSec = Math.round((Date.now() - then) / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  return `${diffDay}d ago`;
}

export default function BulkUploadJobsBanner() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const { data } = await bulkUploadApi.getMyBulkUploads();
        if (cancelled) return;
        const list = Array.isArray(data?.jobs) ? data.jobs : [];
        setJobs(list);
        setLoaded(true);

        // Keep polling only while something is still processing.
        const anyProcessing = list.some((j) => j.status === 'processing');
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        if (anyProcessing && !cancelled) {
          timerRef.current = setTimeout(load, POLL_MS);
        }
      } catch {
        // Fail-safe: never surface an error here.
        if (!cancelled) setLoaded(true);
      }
    };

    load();
    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Show only jobs from the last few days, newest first, capped — and only those we can
  // actually reopen (need a webhook id).
  const visible = jobs
    .filter((j) => j.webhook_id)
    .slice(0, 5);

  if (!loaded || visible.length === 0) return null;

  const resume = (job) => {
    navigate(`/bulkupload/status/${job.webhook_id}`, {
      state: {
        webhookId: job.webhook_id,
        jobId: job.job_id,
        fileName: job.file_name,
        category: job.category,
      },
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 pt-6" data-testid="bulk-jobs-banner">
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-4 sm:px-5 py-3 border-b border-gray-100 bg-gray-50/60">
          <h3 className="text-sm font-bold text-gray-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Your bulk uploads
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Resume processing or download finished files — you don&apos;t need to re-upload.
          </p>
        </div>
        <ul className="divide-y divide-gray-100">
          {visible.map((job) => {
            const { label, cls, Icon } = statusMeta(job);
            const processing = job.status === 'processing';
            return (
              <li
                key={job.webhook_id}
                className="flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-gray-50 cursor-pointer"
                onClick={() => resume(job)}
                data-testid="bulk-job-row"
              >
                <FileSpreadsheet className="h-5 w-5 shrink-0 text-[#C64091]" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {job.file_name || job.category || 'Bulk upload'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {job.category ? `${job.category} · ` : ''}
                    {relativeTime(job.submitted_at || job.created_at)}
                  </p>
                </div>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium shrink-0',
                    cls,
                  )}
                >
                  <Icon className={cn('h-3.5 w-3.5', processing && 'animate-spin')} />
                  {label}
                </span>
                <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
