import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3, CheckCircle2, AlertTriangle, TrendingUp,
  Search, History, Newspaper, RefreshCw,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { dashboardApi, historyApi } from '@/services/api';
import type { DashboardStats, PredictionHistoryItem } from '@/types';
import ConfidenceMeter from '@/components/ConfidenceMeter';
import { PageLoader, EmptyState, ErrorBanner, CardSkeleton } from '@/components/Loading';
import { useAuth } from '@/context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

const PIE_COLORS = ['#22c55e', '#f97316'];

function StatCard({
  icon: Icon, label, value, sub, color,
}: {
  icon: React.ElementType; label: string; value: string | number;
  sub?: string; color: string;
}) {
  return (
    <div className="card p-6 flex items-start gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<PredictionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [s, r] = await Promise.all([
        dashboardApi.getStats(),
        historyApi.getHistory({ page: 1, page_size: 5 }),
      ]);
      setStats(s);
      setRecent(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="page-container space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="section-title">Dashboard</h1>
          <p className="section-subtitle">
            Welcome back, <span className="text-primary-600 dark:text-primary-400 font-medium">{user?.name}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-secondary gap-1.5 text-sm">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <Link to="/analyze" className="btn-primary text-sm">
            <Search className="w-4 h-4" /> Analyze News
          </Link>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={load} />}

      {/* Stat cards */}
      {stats ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={BarChart3} label="Total Analyzed"
              value={stats.total_analyzed}
              sub="all time"
              color="bg-primary-500"
            />
            <StatCard
              icon={CheckCircle2} label="Real News"
              value={stats.real_count}
              sub={`${stats.real_percentage}% of total`}
              color="bg-green-500"
            />
            <StatCard
              icon={AlertTriangle} label="Fake News"
              value={stats.fake_count}
              sub={`${stats.fake_percentage}% of total`}
              color="bg-orange-500"
            />
            <StatCard
              icon={TrendingUp} label="Avg Confidence"
              value={`${Math.round(stats.avg_confidence * 100)}%`}
              sub="across all predictions"
              color="bg-violet-500"
            />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Area chart – 14-day trend */}
            <div className="card p-6 lg:col-span-2">
              <h2 className="font-semibold text-slate-800 dark:text-slate-200 mb-4 text-sm">
                14-Day Analysis Trend
              </h2>
              {stats.daily_stats.some((d) => d.real_count + d.fake_count > 0) ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={stats.daily_stats} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradReal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradFake" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#f97316" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval={2} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, fontSize: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                    />
                    <Area type="monotone" dataKey="real_count" name="Real" stroke="#22c55e" strokeWidth={2} fill="url(#gradReal)" />
                    <Area type="monotone" dataKey="fake_count" name="Fake" stroke="#f97316" strokeWidth={2} fill="url(#gradFake)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState
                  title="No data yet"
                  description="Analyze some articles to see your trend chart."
                />
              )}
            </div>

            {/* Pie chart */}
            <div className="card p-6 flex flex-col">
              <h2 className="font-semibold text-slate-800 dark:text-slate-200 mb-4 text-sm">
                Real vs Fake Split
              </h2>
              {stats.total_analyzed > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Real', value: stats.real_count },
                          { name: 'Fake', value: stats.fake_count },
                        ]}
                        cx="50%" cy="50%"
                        innerRadius={50} outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {PIE_COLORS.map((color, i) => (
                          <Cell key={i} fill={color} />
                        ))}
                      </Pie>
                      <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                      <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-auto">
                    <ConfidenceMeter
                      confidence={stats.avg_confidence}
                      prediction={stats.real_count >= stats.fake_count ? 'REAL' : 'FAKE'}
                      size="sm"
                    />
                    <p className="text-xs text-slate-400 mt-1 text-center">Average confidence</p>
                  </div>
                </>
              ) : (
                <EmptyState title="No predictions yet" description="Start analyzing articles." />
              )}
            </div>
          </div>

          {/* Recent analyses */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Recent Analyses</h2>
              <Link to="/history" className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
                <History className="w-3.5 h-3.5" /> View all
              </Link>
            </div>

            {recent.length === 0 ? (
              <EmptyState
                icon={<Newspaper className="w-8 h-8" />}
                title="No analyses yet"
                description="Head over to News Search or Analyze to get started."
                action={<Link to="/analyze" className="btn-primary text-sm">Analyze Now</Link>}
              />
            ) : (
              <div className="space-y-3">
                {recent.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                      item.prediction === 'REAL'
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : 'bg-orange-100 dark:bg-orange-900/30'
                    }`}>
                      {item.prediction === 'REAL'
                        ? <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                        : <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                        {item.headline}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                        {item.source && ` · ${item.source}`}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={item.prediction === 'REAL' ? 'badge-real' : 'badge-fake'}>
                        {item.prediction}
                      </span>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {Math.round(item.confidence * 100)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      )}
    </div>
  );
}
