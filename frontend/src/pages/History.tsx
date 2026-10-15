import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  History as HistoryIcon, Search, Filter, Trash2, ExternalLink,
  CheckCircle2, AlertTriangle, ChevronLeft, ChevronRight,
  RefreshCw, X, AlertCircle,
} from 'lucide-react';
import { historyApi } from '@/services/api';
import type { PredictionHistoryItem } from '@/types';
import ConfidenceMeter from '@/components/ConfidenceMeter';
import { Spinner, EmptyState, ErrorBanner, CardSkeleton } from '@/components/Loading';
import { useDebounce } from '@/hooks/useDebounce';
import { formatDistanceToNow, format } from 'date-fns';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const PAGE_SIZE = 15;

type FilterBy = '' | 'REAL' | 'FAKE';

interface DeleteDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
  count?: number;
}
function DeleteDialog({ onConfirm, onCancel, count }: DeleteDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="card p-6 max-w-sm w-full space-y-4 animate-slide-up">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-900/30">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white">
            {count ? 'Clear All History' : 'Delete Prediction'}
          </h3>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {count
            ? `This will permanently delete all ${count} prediction${count !== 1 ? 's' : ''} from your history. This cannot be undone.`
            : 'This prediction will be permanently removed from your history.'}
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={onConfirm}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            {count ? 'Clear All' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function History() {
  const navigate = useNavigate();
  const [items,    setItems]    = useState<PredictionHistoryItem[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [page,     setPage]     = useState(1);
  const [total,    setTotal]    = useState(0);
  const [search,   setSearch]   = useState('');
  const [filterBy, setFilterBy] = useState<FilterBy>('');

  // Delete dialog
  const [deleteId,    setDeleteId]    = useState<number | null>(null);
  const [clearingAll, setClearingAll] = useState(false);

  const debouncedSearch = useDebounce(search, 400);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    setError('');
    try {
      const data = await historyApi.getHistory({
        page: p,
        page_size: PAGE_SIZE,
        filter_by: filterBy || undefined,
        search: debouncedSearch || undefined,
      });
      setItems(data);
      // Back-calculate total from count endpoint once on first load
      if (p === 1) {
        const counts = await historyApi.getCount();
        setTotal(
          filterBy === 'REAL' ? counts.real
          : filterBy === 'FAKE' ? counts.fake
          : counts.total
        );
      }
      setPage(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [filterBy, debouncedSearch]);

  useEffect(() => { load(1); }, [load]);

  // Single delete
  const handleDelete = async (id: number) => {
    try {
      await historyApi.delete(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      setTotal((t) => Math.max(0, t - 1));
      setDeleteId(null);
      toast.success('Prediction deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  // Clear all
  const handleClearAll = async () => {
    try {
      await historyApi.clearAll();
      setItems([]);
      setTotal(0);
      setClearingAll(false);
      toast.success('History cleared');
    } catch {
      toast.error('Failed to clear history');
    }
  };

  const handlePageChange = (p: number) => {
    load(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="section-title">Prediction History</h1>
          <p className="section-subtitle">
            All your past analyses — search, filter, and re-examine results.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => load(page)} className="btn-secondary text-sm gap-1.5">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          {total > 0 && (
            <button
              onClick={() => setClearingAll(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Clear All
            </button>
          )}
        </div>
      </div>

      {/* Search + filter bar */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by headline…"
            className="input-field pl-9"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Filter className="w-4 h-4 text-slate-400" />
          {(['', 'REAL', 'FAKE'] as FilterBy[]).map((f) => (
            <button
              key={f || 'all'}
              onClick={() => setFilterBy(f)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                filterBy === f
                  ? f === 'REAL' ? 'bg-green-600 text-white'
                  : f === 'FAKE' ? 'bg-orange-600 text-white'
                  : 'bg-primary-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              )}
            >
              {f || 'All'}
            </button>
          ))}
        </div>

        {/* Total count */}
        <span className="text-xs text-slate-400 flex-shrink-0">
          {total} result{total !== 1 ? 's' : ''}
        </span>
      </div>

      {error && <ErrorBanner message={error} onRetry={() => load(page)} />}

      {/* Table / card list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<HistoryIcon className="w-8 h-8" />}
          title={debouncedSearch || filterBy ? 'No matching results' : 'No predictions yet'}
          description={
            debouncedSearch || filterBy
              ? 'Try clearing your search or filter.'
              : 'Analyze news articles to build up your history.'
          }
          action={
            !debouncedSearch && !filterBy
              ? <Link to="/analyze" className="btn-primary text-sm">Analyze Now</Link>
              : undefined
          }
        />
      ) : (
        <div className="space-y-3 animate-fade-in">
          {items.map((item) => (
            <HistoryRow
              key={item.id}
              item={item}
              onDelete={() => setDeleteId(item.id)}
              onReAnalyze={() =>
                navigate('/analyze', {
                  state: {
                    article: {
                      title:        item.headline,
                      description:  '',
                      content:      '',
                      url:          item.article_url ?? '',
                      url_to_image: item.image_url,
                      source_name:  item.source ?? '',
                      author:       item.author,
                      published_at: item.published_at,
                    },
                  },
                })
              }
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className="btn-secondary px-3 py-2 text-sm disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-slate-500 dark:text-slate-400 px-2">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages}
            className="btn-secondary px-3 py-2 text-sm disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Delete single dialog */}
      {deleteId !== null && (
        <DeleteDialog
          onConfirm={() => handleDelete(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      )}

      {/* Clear all dialog */}
      {clearingAll && (
        <DeleteDialog
          count={total}
          onConfirm={handleClearAll}
          onCancel={() => setClearingAll(false)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single history row
// ---------------------------------------------------------------------------
interface HistoryRowProps {
  item: PredictionHistoryItem;
  onDelete: () => void;
  onReAnalyze: () => void;
}

function HistoryRow({ item, onDelete, onReAnalyze }: HistoryRowProps) {
  const [expanded, setExpanded] = useState(false);
  const isReal = item.prediction === 'REAL';

  const pubDate = (() => {
    try { return formatDistanceToNow(new Date(item.created_at), { addSuffix: true }); }
    catch { return ''; }
  })();
  const fullDate = (() => {
    try { return format(new Date(item.created_at), 'dd MMM yyyy, HH:mm'); }
    catch { return ''; }
  })();

  return (
    <div className="card overflow-hidden">
      {/* Main row */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
        onClick={() => setExpanded((e) => !e)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setExpanded((p) => !p)}
        aria-expanded={expanded}
      >
        {/* Prediction icon */}
        <div
          className={clsx(
            'flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center',
            isReal
              ? 'bg-green-100 dark:bg-green-900/30'
              : 'bg-orange-100 dark:bg-orange-900/30'
          )}
        >
          {isReal
            ? <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            : <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          }
        </div>

        {/* Headline */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
            {item.headline}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            <span title={fullDate}>{pubDate}</span>
            {item.source && <> · {item.source}</>}
          </p>
        </div>

        {/* Badge + confidence */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="hidden sm:flex flex-col items-end gap-1 min-w-[90px]">
            <span className={isReal ? 'badge-real' : 'badge-fake'}>
              {item.prediction}
            </span>
            <span className="text-xs text-slate-400 tabular-nums">
              {Math.round(item.confidence * 100)}% confidence
            </span>
          </div>
          <span className="sm:hidden text-xs font-bold">
            {Math.round(item.confidence * 100)}%
          </span>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-slate-100 dark:border-slate-700 px-4 pb-4 pt-3 space-y-4 animate-fade-in">
          <ConfidenceMeter
            confidence={item.confidence}
            prediction={item.prediction}
            size="md"
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {item.source && (
              <div>
                <p className="text-slate-400 mb-0.5">Source</p>
                <p className="font-medium text-slate-700 dark:text-slate-300 truncate">{item.source}</p>
              </div>
            )}
            {item.author && (
              <div>
                <p className="text-slate-400 mb-0.5">Author</p>
                <p className="font-medium text-slate-700 dark:text-slate-300 truncate">{item.author}</p>
              </div>
            )}
            {item.published_at && (
              <div>
                <p className="text-slate-400 mb-0.5">Published</p>
                <p className="font-medium text-slate-700 dark:text-slate-300">
                  {item.published_at.slice(0, 10)}
                </p>
              </div>
            )}
            <div>
              <p className="text-slate-400 mb-0.5">Analyzed</p>
              <p className="font-medium text-slate-700 dark:text-slate-300">{fullDate}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onReAnalyze(); }}
              className="btn-secondary text-xs py-1.5 px-3"
            >
              Re-analyze
            </button>
            {item.article_url && (
              <a
                href={item.article_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="btn-secondary text-xs py-1.5 px-3"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View Article
              </a>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="inline-flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors ml-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
