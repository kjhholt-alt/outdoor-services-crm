import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileSearch, Search, Filter, Play, Loader2,
  CheckCircle2, XCircle, Clock, Globe, FileText,
  Hash, MapPin, Calendar, ExternalLink, ChevronDown,
  ChevronUp, AlertCircle, BarChart3,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { PageTransition } from '../components/common/PageTransition';
import { Button } from '../components/common/Button';
import { toast } from 'sonner';
import { scannerApi, type ScanResult, type ScanStats } from '../api/scanner';

// ── Iowa/Illinois cities served ──
const CITIES = [
  { city: 'Davenport', state: 'IA' },
  { city: 'Bettendorf', state: 'IA' },
  { city: 'LeClaire', state: 'IA' },
  { city: 'Eldridge', state: 'IA' },
  { city: 'Princeton', state: 'IA' },
  { city: 'DeWitt', state: 'IA' },
  { city: 'Rock Island', state: 'IL' },
  { city: 'Moline', state: 'IL' },
  { city: 'East Moline', state: 'IL' },
  { city: 'Silvis', state: 'IL' },
  { city: 'Milan', state: 'IL' },
  { city: 'Colona', state: 'IL' },
];

// ── Demo results when backend is not available ──
const DEMO_RESULTS: ScanResult[] = [
  {
    id: 1, city: 'Davenport', state: 'IA', keyword: 'refuse collection',
    snippet: '...motion to approve the purchase of two new refuse collection vehicles for the sanitation department. Alderman Smith seconded. The total cost is estimated at $385,000 from the FY2026 capital budget...',
    source_url: 'https://www.davenportiowa.com/meetings/minutes/2026-01-council',
    page_title: 'Davenport City Council Meeting Minutes — January 14, 2026',
    meeting_date: '2026-01-14', document_type: 'html', found_at: '2026-02-13T10:30:00Z',
  },
  {
    id: 2, city: 'Bettendorf', state: 'IA', keyword: 'street sweeper',
    snippet: '...Public Works Director reported that the current street sweeper fleet is aging and recommended replacing Unit #47 with a new Elgin Pelican model. Council directed staff to prepare an RFP for the March meeting...',
    source_url: 'https://www.bettendorf.org/council/minutes/2026-02',
    page_title: 'Bettendorf City Council Regular Meeting — February 4, 2026',
    meeting_date: '2026-02-04', document_type: 'html', found_at: '2026-02-13T10:32:00Z',
  },
  {
    id: 3, city: 'Rock Island', state: 'IL', keyword: 'vacuum truck',
    snippet: '...approved the lease-purchase of one (1) vacuum truck for the sewer maintenance division. The Vactor 2100 Plus model was selected through the state purchasing contract at $312,500...',
    source_url: 'https://www.rigov.org/DocumentCenter/View/12345/Council-Minutes-2026-01',
    page_title: 'Rock Island City Council Minutes — January 27, 2026',
    meeting_date: '2026-01-27', document_type: 'pdf', found_at: '2026-02-13T10:35:00Z',
  },
  {
    id: 4, city: 'Moline', state: 'IL', keyword: 'solid waste',
    snippet: '...solid waste collection contract with Republic Services expires June 30, 2026. City Manager recommended issuing a new RFP for solid waste and recycling services. Council approved unanimously...',
    source_url: 'https://www.moline.il.us/AgendaCenter/ViewFile/Minutes/2026-02-11',
    page_title: 'Moline City Council Proceedings — February 11, 2026',
    meeting_date: '2026-02-11', document_type: 'html', found_at: '2026-02-13T10:38:00Z',
  },
  {
    id: 5, city: 'Eldridge', state: 'IA', keyword: 'recycling',
    snippet: '...discussed expanding the curbside recycling program to include glass and additional plastics. The recycling coordinator presented cost estimates ranging from $15,000 to $22,000 annually...',
    source_url: 'https://www.eldridgeiowa.org/minutes/2026/january',
    page_title: 'Eldridge City Council Minutes — January 21, 2026',
    meeting_date: '2026-01-21', document_type: 'html', found_at: '2026-02-13T10:40:00Z',
  },
  {
    id: 6, city: 'DeWitt', state: 'IA', keyword: 'garbage truck',
    snippet: '...the 2018 garbage truck (Unit #12) requires a new hydraulic arm estimated at $18,000. Council discussed whether repair or replacement is more cost-effective given the truck has 95,000 miles...',
    source_url: 'https://www.dewitt-ia.gov/council/2026-01-minutes.pdf',
    page_title: '2026-01-minutes.pdf',
    meeting_date: '2026-01-08', document_type: 'pdf', found_at: '2026-02-13T10:42:00Z',
  },
  {
    id: 7, city: 'East Moline', state: 'IL', keyword: 'roll-off',
    snippet: '...approved the purchase of two roll-off containers for the public works yard. The 30-yard containers will be used for debris collection during spring cleanup events and storm response...',
    source_url: 'https://www.eastmoline.com/minutes/2026-february',
    page_title: 'East Moline City Council Minutes — February 3, 2026',
    meeting_date: '2026-02-03', document_type: 'html', found_at: '2026-02-13T10:44:00Z',
  },
  {
    id: 8, city: 'Davenport', state: 'IA', keyword: 'sweeper',
    snippet: '...spring sweeping schedule to begin March 15. The fleet of four sweeper units will operate on a rotating ward schedule. Alderman Johnson asked about adding a fifth sweeper to reduce the cycle time...',
    source_url: 'https://www.davenportiowa.com/meetings/minutes/2026-02-council',
    page_title: 'Davenport City Council Meeting Minutes — February 10, 2026',
    meeting_date: '2026-02-10', document_type: 'html', found_at: '2026-02-13T10:46:00Z',
  },
];

const DEMO_STATS: ScanStats = {
  total_mentions: 8,
  cities_with_hits: 6,
  last_scan: {
    id: 1, started_at: '2026-02-13T10:30:00Z', completed_at: '2026-02-13T10:47:00Z',
    status: 'completed', cities_scanned: 12, total_results: 8, error_message: '',
  },
  active_keywords: 6,
};

function highlightKeyword(text: string, keyword: string): React.ReactElement {
  const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part)
          ? <mark key={i} className="bg-amber-200 dark:bg-amber-700/50 text-amber-900 dark:text-amber-100 px-0.5 rounded">{part}</mark>
          : <span key={i}>{part}</span>
      )}
    </>
  );
}

export function MeetingMinutesPage() {
  const queryClient = useQueryClient();

  // State
  const [selectedCities, setSelectedCities] = useState<Set<string>>(new Set());
  const [activeJobId, setActiveJobId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [keywordFilter, setKeywordFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // ── Data fetching ──

  const { data: stats } = useQuery({
    queryKey: ['scanner-stats'],
    queryFn: async () => {
      try {
        return await scannerApi.getStats();
      } catch {
        setIsDemoMode(true);
        return DEMO_STATS;
      }
    },
    staleTime: 30_000,
  });

  const { data: results } = useQuery({
    queryKey: ['scanner-results'],
    queryFn: async () => {
      try {
        return await scannerApi.getResults();
      } catch {
        setIsDemoMode(true);
        return DEMO_RESULTS;
      }
    },
    staleTime: 30_000,
  });

  const { data: activeJob } = useQuery({
    queryKey: ['scanner-job', activeJobId],
    queryFn: () => scannerApi.getScanStatus(activeJobId!),
    enabled: activeJobId !== null,
    refetchInterval: (query) => {
      const job = query.state.data;
      if (job && (job.status === 'completed' || job.status === 'failed')) {
        return false;
      }
      return 3000;
    },
  });

  // Stop polling once complete and refresh results
  if (activeJob && activeJob.status !== 'running' && activeJobId !== null) {
    if (activeJob.status === 'completed') {
      toast.success(`Scan complete — ${activeJob.total_results} mentions found across ${activeJob.cities_scanned} cities`);
    } else if (activeJob.status === 'failed') {
      toast.error(`Scan failed: ${activeJob.error_message || 'Unknown error'}`);
    }
    setActiveJobId(null);
    queryClient.invalidateQueries({ queryKey: ['scanner-results'] });
    queryClient.invalidateQueries({ queryKey: ['scanner-stats'] });
  }

  const { data: history } = useQuery({
    queryKey: ['scanner-history'],
    queryFn: async () => {
      try {
        return await scannerApi.getHistory();
      } catch {
        return [];
      }
    },
    enabled: showHistory,
  });

  // ── Scan mutation ──

  const scanMutation = useMutation({
    mutationFn: (cities: { city: string; state: string }[]) => scannerApi.triggerScan(cities),
    onSuccess: (job) => {
      setActiveJobId(job.id);
      toast.success(`Scan started — scanning ${selectedCities.size || CITIES.length} cities...`);
    },
    onError: () => {
      toast.error('Failed to start scan. Is the backend running?');
    },
  });

  // ── Handlers ──

  const handleToggleCity = useCallback((key: string) => {
    setSelectedCities(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }, []);

  const handleScanAll = useCallback(() => {
    scanMutation.mutate(CITIES);
  }, [scanMutation]);

  const handleScanSelected = useCallback(() => {
    const cities = CITIES.filter(c => selectedCities.has(`${c.city}-${c.state}`));
    if (cities.length === 0) {
      toast.error('Select at least one city to scan');
      return;
    }
    scanMutation.mutate(cities);
  }, [scanMutation, selectedCities]);

  // ── Filtered results ──

  const filteredResults = useMemo(() => {
    if (!results) return [];
    let filtered = [...results];

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(r =>
        r.snippet.toLowerCase().includes(q) ||
        r.page_title.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q) ||
        r.keyword.toLowerCase().includes(q)
      );
    }
    if (cityFilter) filtered = filtered.filter(r => r.city === cityFilter);
    if (keywordFilter) filtered = filtered.filter(r => r.keyword === keywordFilter);
    if (stateFilter) filtered = filtered.filter(r => r.state === stateFilter);

    return filtered;
  }, [results, search, cityFilter, keywordFilter, stateFilter]);

  // Unique values for filter dropdowns
  const uniqueCities = useMemo(() => [...new Set((results || []).map(r => r.city))].sort(), [results]);
  const uniqueKeywords = useMemo(() => [...new Set((results || []).map(r => r.keyword))].sort(), [results]);

  const isScanning = activeJobId !== null || scanMutation.isPending;

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileSearch className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              Meeting Minutes Scanner
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Scan city council meeting minutes for equipment purchase discussions
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              leftIcon={<Play className="w-4 h-4" />}
              onClick={handleScanSelected}
              disabled={isScanning || selectedCities.size === 0}
            >
              Scan Selected ({selectedCities.size})
            </Button>
            <Button
              variant="primary"
              leftIcon={isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              onClick={handleScanAll}
              disabled={isScanning}
              isLoading={isScanning}
            >
              {isScanning ? 'Scanning...' : 'Scan All Cities'}
            </Button>
          </div>
        </div>

        {/* Demo mode banner */}
        {isDemoMode && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-900 dark:text-amber-200">Demo Mode</p>
              <p className="text-amber-700 dark:text-amber-300 mt-0.5">
                Showing sample data. Start the Django backend to run real scans against city council meeting minutes.
              </p>
            </div>
          </div>
        )}

        {/* Progress bar during scan */}
        {activeJob && activeJob.status === 'running' && (
          <Card>
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400" />
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-900 dark:text-white">
                    Scanning city council minutes...
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {activeJob.cities_scanned} / {CITIES.length} cities — {activeJob.total_results} mentions found
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(5, (activeJob.cities_scanned / CITIES.length) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Hash className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.total_mentions ?? 0}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Mentions</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-green-100 dark:bg-green-900/30">
                <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.cities_with_hits ?? 0}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Cities with Hits</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {stats?.last_scan
                    ? new Date(stats.last_scan.started_at).toLocaleDateString()
                    : 'Never'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Last Scan</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.active_keywords ?? 0}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Active Keywords</p>
              </div>
            </div>
          </Card>
        </div>

        {/* City Selection */}
        <Card>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-green-600 dark:text-green-400" />
            Cities to Scan
          </h3>
          <div className="flex flex-wrap gap-2">
            {CITIES.map(c => {
              const key = `${c.city}-${c.state}`;
              const isSelected = selectedCities.has(key);
              return (
                <button
                  key={key}
                  onClick={() => handleToggleCity(key)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    isSelected
                      ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {c.city}, {c.state}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Search & Filters */}
        <div className="flex gap-3 flex-wrap items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search results..."
              className="input pl-10"
            />
          </div>
          <select value={cityFilter} onChange={e => setCityFilter(e.target.value)} className="input !w-auto">
            <option value="">All Cities</option>
            {uniqueCities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={keywordFilter} onChange={e => setKeywordFilter(e.target.value)} className="input !w-auto">
            <option value="">All Keywords</option>
            {uniqueKeywords.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          <select value={stateFilter} onChange={e => setStateFilter(e.target.value)} className="input !w-auto">
            <option value="">All States</option>
            <option value="IA">Iowa</option>
            <option value="IL">Illinois</option>
          </select>
        </div>

        {/* Results */}
        <div className="space-y-3">
          {filteredResults.length > 0 ? (
            filteredResults.map(result => (
              <Card key={result.id} className="hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-lg shrink-0 mt-0.5 ${
                    result.document_type === 'pdf'
                      ? 'bg-red-100 dark:bg-red-900/30'
                      : 'bg-blue-100 dark:bg-blue-900/30'
                  }`}>
                    {result.document_type === 'pdf'
                      ? <FileText className="w-5 h-5 text-red-600 dark:text-red-400" />
                      : <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1">
                        {result.page_title || 'Untitled Document'}
                      </span>
                      <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                        {result.keyword}
                      </span>
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                        result.document_type === 'pdf'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      }`}>
                        {result.document_type.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {result.city}, {result.state}
                      </span>
                      {result.meeting_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(result.meeting_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">
                      {highlightKeyword(result.snippet, result.keyword)}
                    </p>

                    <a
                      href={result.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline mt-2"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View Source
                    </a>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card>
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Filter className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No results yet</p>
                <p className="text-sm mt-1">
                  {results && results.length > 0
                    ? 'Try adjusting your filters'
                    : 'Click "Scan All Cities" to search meeting minutes for equipment keywords'
                  }
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* Scan History */}
        <div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Scan History
          </button>
          {showHistory && history && history.length > 0 && (
            <div className="mt-3 space-y-2">
              {history.map(job => (
                <Card key={job.id}>
                  <div className="flex items-center gap-3 text-sm">
                    {job.status === 'completed'
                      ? <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                      : job.status === 'failed'
                      ? <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                      : <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
                    }
                    <span className="text-gray-900 dark:text-white font-medium">
                      {new Date(job.started_at).toLocaleString()}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {job.cities_scanned} cities scanned
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {job.total_results} results
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                      job.status === 'completed'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : job.status === 'failed'
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    }`}>
                      {job.status}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
