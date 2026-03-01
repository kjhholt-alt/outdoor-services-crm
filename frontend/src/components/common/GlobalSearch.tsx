import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Briefcase, Receipt, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { customersApi, jobsApi, invoicesApi } from '../../api/client';
import type { CustomerListItem, Job, Invoice } from '../../types';

interface SearchResult {
  type: 'customer' | 'job' | 'invoice';
  id: number;
  title: string;
  subtitle: string;
  href: string;
}

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Keyboard shortcut: Ctrl+K to open search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const debouncedQuery = useDebounce(query, 300);

  const { data: customersData } = useQuery({
    queryKey: ['search-customers', debouncedQuery],
    queryFn: () => customersApi.list({ search: debouncedQuery }),
    enabled: debouncedQuery.length >= 2,
  });

  const { data: jobsData } = useQuery({
    queryKey: ['search-jobs', debouncedQuery],
    queryFn: () => jobsApi.list({ search: debouncedQuery }),
    enabled: debouncedQuery.length >= 2,
  });

  const { data: invoicesData } = useQuery({
    queryKey: ['search-invoices', debouncedQuery],
    queryFn: () => invoicesApi.list({ search: debouncedQuery }),
    enabled: debouncedQuery.length >= 2,
  });

  const customers: CustomerListItem[] = customersData?.results ?? customersData ?? [];
  const jobs: Job[] = jobsData?.results ?? jobsData ?? [];
  const invoices: Invoice[] = invoicesData?.results ?? invoicesData ?? [];

  const results: SearchResult[] = [
    ...customers.slice(0, 5).map((c): SearchResult => ({
      type: 'customer',
      id: c.id,
      title: c.business_name,
      subtitle: [c.primary_contact, c.main_phone].filter(Boolean).join(' - '),
      href: `/customers/${c.id}`,
    })),
    ...jobs.slice(0, 5).map((j): SearchResult => ({
      type: 'job',
      id: j.id,
      title: `${j.service_name} - ${j.customer_name}`,
      subtitle: `${j.scheduled_date} - ${j.status}`,
      href: '/jobs',
    })),
    ...invoices.slice(0, 5).map((i): SearchResult => ({
      type: 'invoice',
      id: i.id,
      title: `${i.invoice_number} - ${i.customer_name}`,
      subtitle: `$${Number(i.total).toFixed(2)} - ${i.status}`,
      href: '/invoices',
    })),
  ];

  const iconMap = {
    customer: Users,
    job: Briefcase,
    invoice: Receipt,
  };

  const handleSelect = (result: SearchResult) => {
    navigate(result.href);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Search trigger */}
      <button
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm w-full lg:w-64"
      >
        <Search className="w-4 h-4" />
        <span>Search...</span>
        <kbd className="hidden sm:inline-block ml-auto text-xs bg-gray-200 dark:bg-gray-600 rounded px-1.5 py-0.5">
          Ctrl+K
        </kbd>
      </button>

      {/* Search dropdown */}
      {isOpen && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden min-w-[320px] lg:min-w-[400px]">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search customers, jobs, invoices..."
                className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 outline-none text-sm"
              />
              {query && (
                <button onClick={() => setQuery('')} className="p-1 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {debouncedQuery.length >= 2 && (
              <div className="max-h-80 overflow-y-auto">
                {results.length > 0 ? (
                  <div className="py-1">
                    {results.map((result) => {
                      const Icon = iconMap[result.type];
                      return (
                        <button
                          key={`${result.type}-${result.id}`}
                          onClick={() => handleSelect(result)}
                          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-left"
                        >
                          <Icon className="w-4 h-4 text-gray-400 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {result.title}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {result.subtitle}
                            </p>
                          </div>
                          <span className="text-[10px] uppercase tracking-wider text-gray-400 shrink-0">
                            {result.type}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                    No results found
                  </div>
                )}
              </div>
            )}

            {debouncedQuery.length < 2 && debouncedQuery.length > 0 && (
              <div className="py-4 text-center text-sm text-gray-400">
                Type at least 2 characters to search
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function useDebounce(value: string, delay: number): string {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}
