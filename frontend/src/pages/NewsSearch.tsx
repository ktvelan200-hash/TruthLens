import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, RefreshCw, ChevronLeft, ChevronRight, Globe } from 'lucide-react';
import { newsApi } from '@/services/api';
import type { NewsArticle, NewsSearchParams } from '@/types';
import { NEWS_CATEGORIES, NEWS_COUNTRIES } from '@/types';
import NewsCard from '@/components/NewsCard';
import { NewsCardSkeleton, EmptyState, ErrorBanner } from '@/components/Loading';

const PAGE_SIZE = 12;

export default function NewsSearch() {
  const navigate = useNavigate();
  const [query, setQuery]       = useState('');
  const [category, setCategory] = useState('');
  const [country, setCountry]   = useState('us');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate]     = useState('');
  const [page, setPage]         = useState(1);

  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [searched, setSearched] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const fetchNews = useCallback(async (p = 1) => {
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const params: NewsSearchParams = {
        country,
        page: p,
        page_size: PAGE_SIZE,
      };
      if (query.trim()) params.q = query.trim();
      if (category)     params.category = category;
      if (fromDate)     params.from_date = fromDate;
      if (toDate)       params.to_date = toDate;

      const res = await newsApi.getNews(params);
      setArticles(res.articles);
      setTotal(res.total_results);
      setPage(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch news');
    } finally {
      setLoading(false);
    }
  }, [query, category, country, fromDate, toDate]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchNews(1);
  };

  const handleAnalyze = (article: NewsArticle) => {
    navigate('/analyze', { state: { article } });
  };

  const handlePageChange = (p: number) => {
    fetchNews(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <div>
        <h1 className="section-title">News Search</h1>
        <p className="section-subtitle">
          Browse live headlines from NewsAPI and send any article straight to the ML analyzer.
        </p>
      </div>

      {/* Search form */}
      <div className="card p-5 space-y-4">
        <form onSubmit={handleSearch} className="space-y-4">
          {/* Search bar row */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search headlines… (leave empty for top headlines)"
                className="input-field pl-9"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters((f) => !f)}
              className={`btn-secondary px-3 gap-1.5 text-sm ${showFilters ? 'border-primary-400 text-primary-600 dark:text-primary-400' : ''}`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
            <button type="submit" disabled={loading} className="btn-primary gap-2 text-sm px-5">
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span className="hidden sm:inline">Search</span>
            </button>
          </div>

          {/* Advanced filters */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-700 animate-fade-in">
              {/* Category */}
              <div>
                <label className="label">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input-field"
                >
                  <option value="">All categories</option>
                  {NEWS_CATEGORIES.map((c) => (
                    <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>

              {/* Country */}
              <div>
                <label className="label">Country</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="input-field"
                >
                  {NEWS_COUNTRIES.map(({ code, label }) => (
                    <option key={code} value={code}>{label}</option>
                  ))}
                </select>
              </div>

              {/* From date */}
              <div>
                <label className="label">From date</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="input-field"
                  max={toDate || undefined}
                />
              </div>

              {/* To date */}
              <div>
                <label className="label">To date</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="input-field"
                  min={fromDate || undefined}
                />
              </div>
            </div>
          )}
        </form>

        {/* Quick category pills */}
        {!showFilters && (
          <div className="flex flex-wrap gap-2 pt-1">
            {['', ...NEWS_CATEGORIES].map((c) => (
              <button
                key={c || 'all'}
                onClick={() => { setCategory(c); }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  category === c
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {c ? c.charAt(0).toUpperCase() + c.slice(1) : 'All'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error */}
      {error && <ErrorBanner message={error} onRetry={() => fetchNews(page)} />}

      {/* Results count */}
      {searched && !loading && !error && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {total > 0
              ? `Showing ${articles.length} of ${total.toLocaleString()} articles`
              : 'No articles found'
            }
            {query && <span className="font-medium text-slate-700 dark:text-slate-300"> for "{query}"</span>}
          </p>
          {category && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 capitalize">
              {category}
            </span>
          )}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(PAGE_SIZE)].map((_, i) => <NewsCardSkeleton key={i} />)}
        </div>
      ) : articles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 animate-fade-in">
          {articles.map((article, i) => (
            <NewsCard key={`${article.url}-${i}`} article={article} onAnalyze={handleAnalyze} />
          ))}
        </div>
      ) : searched && !error ? (
        <EmptyState
          icon={<Globe className="w-8 h-8" />}
          title="No articles found"
          description={
            query
              ? `No results for "${query}". Try different keywords or remove filters.`
              : 'Click Search to load top headlines.'
          }
          action={
            <button onClick={() => fetchNews(1)} className="btn-primary text-sm">
              Load Top Headlines
            </button>
          }
        />
      ) : !searched ? (
        <EmptyState
          icon={<Search className="w-8 h-8" />}
          title="Search or browse headlines"
          description="Enter keywords above, or just click Search to see today's top stories."
          action={
            <button onClick={() => fetchNews(1)} className="btn-primary text-sm">
              Load Top Headlines
            </button>
          }
        />
      ) : null}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className="btn-secondary px-3 py-2 text-sm disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex gap-1">
            {[...Array(Math.min(totalPages, 5))].map((_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                    p === page
                      ? 'bg-primary-600 text-white'
                      : 'btn-secondary'
                  }`}
                >
                  {p}
                </button>
              );
            })}
            {totalPages > 5 && <span className="w-9 h-9 flex items-center justify-center text-slate-400">…</span>}
          </div>

          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            className="btn-secondary px-3 py-2 text-sm disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
