import { useState } from 'react';
import { ExternalLink, Search, Bookmark, BookmarkCheck, Calendar, User } from 'lucide-react';
import type { NewsArticle } from '@/types';
import { newsApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

interface NewsCardProps {
  article: NewsArticle;
  onAnalyze: (article: NewsArticle) => void;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&q=80';

export default function NewsCard({ article, onAnalyze }: NewsCardProps) {
  const { isAuthenticated } = useAuth();
  const [saved, setSaved] = useState(false);
  const [imgError, setImgError] = useState(false);

  const pubDate = article.published_at
    ? (() => {
        try {
          return formatDistanceToNow(new Date(article.published_at), { addSuffix: true });
        } catch {
          return article.published_at;
        }
      })()
    : null;

  const handleSave = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to save articles');
      return;
    }
    try {
      await newsApi.saveArticle({
        title: article.title,
        description: article.description ?? undefined,
        source: article.source_name,
        author: article.author ?? undefined,
        url: article.url,
        image_url: article.url_to_image ?? undefined,
        published_at: article.published_at ?? undefined,
      });
      setSaved(true);
      toast.success('Article saved');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not save article';
      if (msg.includes('already saved')) {
        setSaved(true);
        toast('Already in your saved list');
      } else {
        toast.error(msg);
      }
    }
  };

  return (
    <article className="card-hover flex flex-col overflow-hidden group">
      {/* Image */}
      <div className="relative h-44 bg-slate-100 dark:bg-slate-700 overflow-hidden flex-shrink-0">
        <img
          src={imgError || !article.url_to_image ? FALLBACK_IMAGE : article.url_to_image}
          alt={article.title}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        {/* Source badge */}
        <div className="absolute bottom-2 left-2">
          <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-black/60 text-white backdrop-blur-sm">
            {article.source_name}
          </span>
        </div>
        {/* Save button */}
        <button
          onClick={handleSave}
          aria-label={saved ? 'Saved' : 'Save article'}
          className={clsx(
            'absolute top-2 right-2 p-1.5 rounded-lg backdrop-blur-sm transition-all',
            saved
              ? 'bg-primary-600/90 text-white'
              : 'bg-black/40 text-white hover:bg-black/60'
          )}
        >
          {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        <h3 className="font-semibold text-slate-900 dark:text-white text-sm leading-snug line-clamp-3">
          {article.title}
        </h3>

        {article.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {article.description}
          </p>
        )}

        {/* Meta */}
        <div className="flex flex-wrap gap-2 text-xs text-slate-400 dark:text-slate-500 mt-auto">
          {article.author && (
            <span className="flex items-center gap-1 truncate max-w-[160px]">
              <User className="w-3 h-3 flex-shrink-0" />
              {article.author}
            </span>
          )}
          {pubDate && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 flex-shrink-0" />
              {pubDate}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onAnalyze(article)}
            className="btn-primary flex-1 text-xs py-2"
          >
            <Search className="w-3.5 h-3.5" />
            Analyze
          </button>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary flex-1 text-xs py-2 text-center"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Read
          </a>
        </div>
      </div>
    </article>
  );
}
