import { CheckCircle2, AlertTriangle, ExternalLink, ChevronDown, ChevronUp, Info } from 'lucide-react';
import type { PredictResponse, PredictRequest } from '@/types';
import ConfidenceMeter from './ConfidenceMeter';
import { useState } from 'react';
import clsx from 'clsx';

interface PredictionCardProps {
  result: PredictResponse;
  request: PredictRequest;
  onAnalyzeNew?: () => void;
}

export default function PredictionCard({ result, request, onAnalyzeNew }: PredictionCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const isReal = result.prediction === 'REAL';
  const pct = Math.round(result.confidence * 100);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Main result banner */}
      <div
        className={clsx(
          'rounded-2xl border-2 p-6',
          isReal
            ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
            : 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800'
        )}
      >
        <div className="flex items-start gap-4">
          <div
            className={clsx(
              'p-3 rounded-xl flex-shrink-0',
              isReal
                ? 'bg-green-100 dark:bg-green-900/40'
                : 'bg-orange-100 dark:bg-orange-900/40'
            )}
          >
            {isReal
              ? <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
              : <AlertTriangle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Model Prediction
            </p>
            <h2
              className={clsx(
                'text-3xl font-extrabold',
                isReal
                  ? 'text-green-700 dark:text-green-400'
                  : 'text-orange-700 dark:text-orange-400'
              )}
            >
              {isReal ? '✓ LIKELY REAL' : '⚠ POSSIBLY FAKE'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Based on NLP pattern analysis and the trained ML classifier.
              This is <strong>not</strong> a factual verification.
            </p>
          </div>
        </div>

        {/* Confidence meter */}
        <div className="mt-5">
          <ConfidenceMeter confidence={result.confidence} prediction={result.prediction} size="lg" />
        </div>

        {/* Probability pills */}
        <div className="flex gap-3 mt-4">
          <div className="flex-1 bg-white/60 dark:bg-slate-800/60 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-500 mb-0.5">Real Probability</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              {Math.round(result.real_probability * 100)}%
            </p>
          </div>
          <div className="flex-1 bg-white/60 dark:bg-slate-800/60 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-500 mb-0.5">Fake Probability</p>
            <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
              {Math.round(result.fake_probability * 100)}%
            </p>
          </div>
        </div>
      </div>

      {/* Article metadata */}
      <div className="card p-5 space-y-3">
        <h3 className="font-semibold text-slate-800 dark:text-slate-200">Analyzed Article</h3>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-snug">
          {request.headline}
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          {request.source && <span>📰 {request.source}</span>}
          {request.author && <span>✍️ {request.author}</span>}
          {request.published_at && <span>📅 {request.published_at.slice(0, 10)}</span>}
        </div>
        {request.article_url && (
          <a
            href={request.article_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-primary-600 dark:text-primary-400 hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View original article
          </a>
        )}
      </div>

      {/* Why this prediction – expandable */}
      <div className="card overflow-hidden">
        <button
          onClick={() => setShowDetails((d) => !d)}
          className="flex items-center justify-between w-full px-5 py-4 text-left"
        >
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-primary-500" />
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
              Why this prediction?
            </span>
          </div>
          {showDetails ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {showDetails && (
          <div className="px-5 pb-5 space-y-4 border-t border-slate-100 dark:border-slate-700 pt-4 animate-fade-in">
            {/* Keywords */}
            {result.keywords.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Top Keywords
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.keywords.slice(0, 8).map(({ word, score }) => (
                    <span
                      key={word}
                      className="px-2.5 py-1 rounded-lg bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 text-xs font-medium"
                    >
                      {word}
                      <span className="ml-1 text-primary-400 opacity-70">
                        {(score * 100).toFixed(1)}%
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Processed preview */}
            {result.processed_text_preview && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Processed Text (NLP output)
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono bg-slate-50 dark:bg-slate-900 rounded-lg p-3 leading-relaxed">
                  {result.processed_text_preview}
                </p>
              </div>
            )}

            {/* Disclaimer */}
            <div className="rounded-xl bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 p-3">
              <p className="text-xs text-yellow-800 dark:text-yellow-300 leading-relaxed">
                <strong>Important:</strong> This result is produced by a machine-learning model trained on
                labeled datasets. It identifies linguistic patterns associated with fake news — it does{' '}
                <strong>not</strong> independently verify facts. Always cross-check with reliable sources.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {onAnalyzeNew && (
        <button onClick={onAnalyzeNew} className="btn-secondary w-full">
          Analyze Another Article
        </button>
      )}
    </div>
  );
}
