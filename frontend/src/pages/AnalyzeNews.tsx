import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, X, Sparkles, Info } from 'lucide-react';
import { predictionApi } from '@/services/api';
import type { PredictRequest, PredictResponse, NewsArticle } from '@/types';
import PredictionCard from '@/components/PredictionCard';
import { Spinner, ErrorBanner } from '@/components/Loading';
import toast from 'react-hot-toast';

const MIN_HEADLINE = 5;
const MIN_CONTENT  = 20;

interface LocationState {
  article?: NewsArticle;
}

export default function AnalyzeNews() {
  const location = useLocation();
  const incoming = (location.state as LocationState)?.article;

  const [headline, setHeadline] = useState('');
  const [content,  setContent]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [result,   setResult]   = useState<PredictResponse | null>(null);
  const [request,  setRequest]  = useState<PredictRequest | null>(null);
  const [errors,   setErrors]   = useState<{ headline?: string; content?: string }>({});

  // Pre-fill from NewsSearch navigation
  useEffect(() => {
    if (incoming) {
      setHeadline(incoming.title ?? '');
      setContent(
        incoming.content ||
        incoming.description ||
        ''
      );
      setResult(null);
      setRequest(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [incoming]);

  const validate = () => {
    const e: typeof errors = {};
    if (!headline.trim() || headline.trim().length < MIN_HEADLINE)
      e.headline = `Headline must be at least ${MIN_HEADLINE} characters.`;
    if (!content.trim() || content.trim().length < MIN_CONTENT)
      e.content = `Content must be at least ${MIN_CONTENT} characters.`;
    return e;
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setError('');
    setLoading(true);

    const req: PredictRequest = {
      headline: headline.trim(),
      content:  content.trim(),
      source:      incoming?.source_name,
      article_url: incoming?.url,
      image_url:   incoming?.url_to_image ?? undefined,
      author:      incoming?.author ?? undefined,
      published_at: incoming?.published_at ?? undefined,
    };

    try {
      const res = await predictionApi.predict(req);
      setResult(res);
      setRequest(req);
      toast.success('Analysis complete');
      // Scroll to result
      setTimeout(() => {
        document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setHeadline('');
    setContent('');
    setResult(null);
    setRequest(null);
    setError('');
    setErrors({});
  };

  const handleAnalyzeNew = () => {
    setResult(null);
    setRequest(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="page-container">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="section-title">Analyze News</h1>
          <p className="section-subtitle">
            Paste a headline and article content — the NLP pipeline and ML model will predict
            whether it shows patterns consistent with real or fake news.
          </p>
        </div>

        {/* Info banner */}
        <div className="flex gap-3 p-4 rounded-xl bg-primary-50 dark:bg-primary-950/30 border border-primary-100 dark:border-primary-900 text-sm text-primary-700 dark:text-primary-300">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>
            This tool uses a trained ML classifier (Logistic Regression / SVM) with TF-IDF features.
            Results are <strong>model predictions</strong>, not factual verification. Always
            cross-check with trusted sources.
          </p>
        </div>

        {/* Pre-filled banner */}
        {incoming && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 text-sm text-green-700 dark:text-green-400">
            <Sparkles className="w-4 h-4 flex-shrink-0" />
            <span>Pre-filled from <strong>{incoming.source_name}</strong>. Review or edit before analyzing.</span>
          </div>
        )}

        {/* Input form */}
        {!result && (
          <form onSubmit={handleAnalyze} className="card p-6 space-y-5" noValidate>
            {/* Headline */}
            <div>
              <label htmlFor="headline" className="label">
                News Headline <span className="text-red-400">*</span>
              </label>
              <input
                id="headline"
                type="text"
                value={headline}
                onChange={(e) => { setHeadline(e.target.value); setErrors((p) => ({ ...p, headline: undefined })); }}
                placeholder="e.g. Scientists discover new renewable energy source…"
                className={`input-field ${errors.headline ? 'border-red-400 focus:ring-red-400' : ''}`}
                maxLength={500}
              />
              <div className="flex justify-between mt-1">
                {errors.headline
                  ? <p className="text-xs text-red-500">{errors.headline}</p>
                  : <span />
                }
                <span className="text-xs text-slate-400 ml-auto">{headline.length}/500</span>
              </div>
            </div>

            {/* Content */}
            <div>
              <label htmlFor="content" className="label">
                Article Content <span className="text-red-400">*</span>
              </label>
              <textarea
                id="content"
                rows={8}
                value={content}
                onChange={(e) => { setContent(e.target.value); setErrors((p) => ({ ...p, content: undefined })); }}
                placeholder="Paste the full article text or description here. More content leads to a better prediction…"
                className={`input-field resize-none ${errors.content ? 'border-red-400 focus:ring-red-400' : ''}`}
              />
              <div className="flex justify-between mt-1">
                {errors.content
                  ? <p className="text-xs text-red-500">{errors.content}</p>
                  : <span />
                }
                <span className="text-xs text-slate-400 ml-auto">
                  {wordCount} word{wordCount !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* API error */}
            {error && <ErrorBanner message={error} />}

            {/* Buttons */}
            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1 py-3 text-sm"
              >
                {loading ? (
                  <>
                    <Spinner size="sm" />
                    <span>Analyzing…</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Analyze Article
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleClear}
                disabled={loading}
                className="btn-secondary px-4 py-3 text-sm"
                aria-label="Clear form"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            </div>

            {/* Loading overlay hint */}
            {loading && (
              <div className="text-center py-4 space-y-2 animate-fade-in">
                <div className="flex justify-center gap-2 text-xs text-slate-400">
                  <span className="px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700">NLP preprocessing…</span>
                  <span className="px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700">TF-IDF transform…</span>
                  <span className="px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700">ML inference…</span>
                </div>
              </div>
            )}
          </form>
        )}

        {/* Result */}
        {result && request && (
          <div id="result-section" className="animate-slide-up">
            <PredictionCard
              result={result}
              request={request}
              onAnalyzeNew={handleAnalyzeNew}
            />
          </div>
        )}

        {/* Tips */}
        {!result && (
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              Tips for accurate predictions
            </h3>
            <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
              {[
                'Paste the full article text rather than just a snippet.',
                'The model was trained on English-language news — other languages may give unreliable results.',
                'Satire, opinion pieces, and editorials may be misclassified.',
                'Very short content (&lt; 50 words) reduces accuracy.',
                'Combine with manual verification from established fact-check sites (Snopes, PolitiFact, FactCheck.org).',
              ].map((tip, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-primary-400 flex-shrink-0">→</span>
                  <span dangerouslySetInnerHTML={{ __html: tip }} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
