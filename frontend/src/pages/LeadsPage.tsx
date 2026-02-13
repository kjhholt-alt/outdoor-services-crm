import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2, Phone, Mail, MapPin, Search, Filter, Plus,
  TrendingUp, Star, Clock, RefreshCw,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { PageTransition } from '../components/common/PageTransition';

// Lead types
interface Lead {
  id: number;
  business_name: string;
  contact_name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  type: 'residential' | 'commercial' | 'hoa' | 'municipal';
  category: string;
  source: string;
  score: number; // 1-5 hot score
  notes: string;
  added_date: string;
  last_contacted: string | null;
  status: 'new' | 'contacted' | 'interested' | 'quoted' | 'converted' | 'not_interested';
}

const today = new Date();
const fmt = (d: Date) => d.toISOString().split('T')[0];
const daysAgo = (n: number) => { const d = new Date(today); d.setDate(d.getDate() - n); return fmt(d); };

// Demo leads — new businesses and properties in Davenport/Bettendorf/QC area
const demoLeads: Lead[] = [
  {
    id: 1, business_name: 'Quad Cities CrossFit', contact_name: 'Ryan Mitchell',
    phone: '(563) 555-1201', email: 'ryan@qccrossfit.com',
    address: '4500 N Brady St', city: 'Davenport',
    type: 'commercial', category: 'Snow Removal + Lawn Care',
    source: 'Google Maps - New Business', score: 5,
    notes: 'New gym opened Jan 2026. Large parking lot needs plowing. Summer mowing for front lawn.',
    added_date: daysAgo(3), last_contacted: null, status: 'new',
  },
  {
    id: 2, business_name: 'Prairie Creek Subdivision (Phase 3)', contact_name: 'HOA Board',
    phone: '(563) 555-1302', email: 'hoa@prairiecreekhomes.com',
    address: 'Prairie Creek Blvd & 53rd St', city: 'Davenport',
    type: 'hoa', category: 'Full Maintenance Contract',
    source: 'Referral - Existing Client', score: 5,
    notes: '42 new homes in Phase 3, completed Dec 2025. HOA seeking lawn + snow contract. High value.',
    added_date: daysAgo(5), last_contacted: daysAgo(2), status: 'interested',
  },
  {
    id: 3, business_name: 'Hawkeye Tap House', contact_name: 'Lisa Frederickson',
    phone: '(563) 555-1403', email: 'lisa@hawkeyetap.com',
    address: '127 W 2nd St', city: 'Davenport',
    type: 'commercial', category: 'Power Washing + Cleanup',
    source: 'Yelp - New Listing', score: 4,
    notes: 'New restaurant downtown, needs patio power washing and seasonal cleanup. Opening in March.',
    added_date: daysAgo(7), last_contacted: null, status: 'new',
  },
  {
    id: 4, business_name: 'Martinez Residence (New Build)', contact_name: 'Carlos Martinez',
    phone: '(563) 555-1504', email: 'carlos.m@email.com',
    address: '8912 Forest Grove Dr', city: 'Bettendorf',
    type: 'residential', category: 'Landscaping + Lawn Care',
    source: 'Building Permits - Scott County', score: 4,
    notes: 'New construction completed. Needs full landscape install: sod, shrubs, mulch. Then weekly mowing.',
    added_date: daysAgo(10), last_contacted: daysAgo(8), status: 'quoted',
  },
  {
    id: 5, business_name: 'Valley Physical Therapy', contact_name: 'Dr. Patel',
    phone: '(563) 555-1605', email: 'office@valleypt.com',
    address: '2200 W Kimberly Rd, Suite B', city: 'Davenport',
    type: 'commercial', category: 'Lawn Care + Snow Removal',
    source: 'Google Maps - New Business', score: 3,
    notes: 'New medical office in strip mall. Shared lot but they want their own sidewalk/entry cleared.',
    added_date: daysAgo(12), last_contacted: null, status: 'new',
  },
  {
    id: 6, business_name: 'Riverside Townhomes', contact_name: 'Mark Swanson (Property Mgr)',
    phone: '(563) 555-1706', email: 'mswanson@riversidequadcities.com',
    address: '700 W River Dr', city: 'Davenport',
    type: 'hoa', category: 'Full Year Contract',
    source: 'Cold Outreach - Property Management', score: 4,
    notes: '24-unit townhome complex. Current provider retiring. Need new lawn + snow contractor ASAP.',
    added_date: daysAgo(2), last_contacted: daysAgo(1), status: 'contacted',
  },
  {
    id: 7, business_name: 'QC Solar Solutions', contact_name: 'Amy Chen',
    phone: '(563) 555-1807', email: 'amy@qcsolar.com',
    address: '3100 N Harrison St', city: 'Davenport',
    type: 'commercial', category: 'Landscaping',
    source: 'Chamber of Commerce', score: 3,
    notes: 'New solar company office. Wants professional landscaping for curb appeal. Budget TBD.',
    added_date: daysAgo(14), last_contacted: daysAgo(7), status: 'contacted',
  },
  {
    id: 8, business_name: 'Thompson Acreage', contact_name: 'Bill Thompson',
    phone: '(563) 555-1908', email: 'bthompson@farmmail.com',
    address: '12500 N Pine Rd', city: 'Eldridge',
    type: 'residential', category: 'Mowing + Cleanup',
    source: 'Nextdoor - Service Request', score: 3,
    notes: '3-acre property. Current provider no-showed twice. Looking for reliable weekly mowing.',
    added_date: daysAgo(4), last_contacted: null, status: 'new',
  },
  {
    id: 9, business_name: 'Genesis Health System - New Clinic', contact_name: 'Facilities Dept',
    phone: '(563) 555-2009', email: 'facilities@genesishealth.com',
    address: '5500 Utica Ridge Rd', city: 'Davenport',
    type: 'commercial', category: 'Full Maintenance',
    source: 'Building Permits - Scott County', score: 5,
    notes: 'Major new clinic under construction. Opening May 2026. Huge contract opportunity — full grounds.',
    added_date: daysAgo(1), last_contacted: null, status: 'new',
  },
  {
    id: 10, business_name: 'Bettendorf Parks & Recreation', contact_name: 'Janet Olson',
    phone: '(563) 555-2110', email: 'jolson@bettendorf.org',
    address: '2204 Grant St', city: 'Bettendorf',
    type: 'municipal', category: 'Seasonal Cleanup + Mowing',
    source: 'Municipal RFP', score: 4,
    notes: 'RFP for 2026 season — 3 city parks need spring cleanup and weekly mowing May-Oct. Due March 1.',
    added_date: daysAgo(6), last_contacted: daysAgo(3), status: 'interested',
  },
  {
    id: 11, business_name: 'Cedar River Dental Group', contact_name: 'Dr. Mike Walsh',
    phone: '(563) 555-2211', email: 'office@cedarriverdental.com',
    address: '4200 E 53rd St', city: 'Davenport',
    type: 'commercial', category: 'Lawn Care + Snow',
    source: 'Referral - QC Brewing', score: 4,
    notes: 'Referred by Jake Torres at QC Brewing. New dental office expanding to 2nd location. Wants consistent provider.',
    added_date: daysAgo(8), last_contacted: daysAgo(5), status: 'interested',
  },
  {
    id: 12, business_name: 'Nguyen Family - New Home', contact_name: 'Tran Nguyen',
    phone: '(563) 555-2312', email: 'tran.nguyen@email.com',
    address: '1840 E 46th St', city: 'Davenport',
    type: 'residential', category: 'Landscaping + Weekly Mowing',
    source: 'Facebook Ad', score: 3,
    notes: 'Just moved in from Chicago. Needs full landscape bed cleanup and weekly mowing service.',
    added_date: daysAgo(9), last_contacted: null, status: 'new',
  },
];

const STATUS_CONFIG: Record<Lead['status'], { label: string; color: string; bg: string }> = {
  new: { label: 'New', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  contacted: { label: 'Contacted', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  interested: { label: 'Interested', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
  quoted: { label: 'Quoted', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  converted: { label: 'Converted', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  not_interested: { label: 'Not Interested', color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-900/30' },
};

const TYPE_CONFIG: Record<Lead['type'], { label: string; color: string }> = {
  residential: { label: 'Residential', color: 'text-green-600' },
  commercial: { label: 'Commercial', color: 'text-blue-600' },
  hoa: { label: 'HOA', color: 'text-purple-600' },
  municipal: { label: 'Municipal', color: 'text-amber-600' },
};

function ScoreStars({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i <= score ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-gray-600'}`}
        />
      ))}
    </div>
  );
}

export function LeadsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState<'score' | 'date' | 'name'>('score');

  const filtered = useMemo(() => {
    let leads = [...demoLeads];

    if (search) {
      const q = search.toLowerCase();
      leads = leads.filter(l =>
        l.business_name.toLowerCase().includes(q) ||
        l.contact_name.toLowerCase().includes(q) ||
        l.category.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q)
      );
    }
    if (statusFilter) leads = leads.filter(l => l.status === statusFilter);
    if (typeFilter) leads = leads.filter(l => l.type === typeFilter);

    leads.sort((a, b) => {
      if (sortBy === 'score') return b.score - a.score;
      if (sortBy === 'date') return new Date(b.added_date).getTime() - new Date(a.added_date).getTime();
      return a.business_name.localeCompare(b.business_name);
    });

    return leads;
  }, [search, statusFilter, typeFilter, sortBy]);

  const stats = {
    total: demoLeads.length,
    new: demoLeads.filter(l => l.status === 'new').length,
    hot: demoLeads.filter(l => l.score >= 4).length,
    estimated_value: demoLeads.length * 2500, // rough avg contract value
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Market Leads</h1>
            <p className="text-gray-500 dark:text-gray-400">New businesses & properties in the QC area</p>
          </div>
          <button className="btn btn-primary gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh Leads
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Leads</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-green-100 dark:bg-green-900/30">
                <Plus className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.new}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">New / Uncontacted</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.hot}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Hot Leads (4-5 stars)</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                  ${stats.estimated_value.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Est. Pipeline Value</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search & Filters */}
        <div className="flex gap-3 flex-wrap items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search leads..."
              className="input pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="input !w-auto"
          >
            <option value="">All Statuses</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="input !w-auto"
          >
            <option value="">All Types</option>
            {Object.entries(TYPE_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as 'score' | 'date' | 'name')}
            className="input !w-auto"
          >
            <option value="score">Sort: Hot Score</option>
            <option value="date">Sort: Newest</option>
            <option value="name">Sort: Name</option>
          </select>
        </div>

        {/* Lead Cards */}
        <div className="space-y-3">
          {filtered.length > 0 ? (
            filtered.map(lead => {
              const statusCfg = STATUS_CONFIG[lead.status];
              const typeCfg = TYPE_CONFIG[lead.type];
              return (
                <Card key={lead.id} className="hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 shrink-0 mt-0.5">
                      <Building2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {lead.business_name}
                        </span>
                        <span className={`badge ${statusCfg.bg} ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                        <span className={`text-xs font-medium ${typeCfg.color}`}>
                          {typeCfg.label}
                        </span>
                        <ScoreStars score={lead.score} />
                      </div>

                      <div className="flex items-center gap-4 mt-1.5 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {lead.address}, {lead.city}
                        </span>
                        {lead.contact_name && (
                          <span>{lead.contact_name}</span>
                        )}
                        {lead.last_contacted && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Contacted {lead.last_contacted}
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1.5">
                        <span className="font-medium text-gray-700 dark:text-gray-200">
                          {lead.category}
                        </span>
                        {' '}&mdash;{' '}{lead.notes}
                      </p>

                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs text-gray-400">Source: {lead.source}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                      {lead.phone && (
                        <a
                          href={`tel:${lead.phone}`}
                          className="btn btn-secondary !min-h-[36px] !px-3 gap-1 text-xs"
                          title="Call"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          Call
                        </a>
                      )}
                      {lead.email && (
                        <a
                          href={`mailto:${lead.email}`}
                          className="btn btn-ghost !min-h-[36px] !px-3 gap-1 text-xs"
                          title="Email"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          Email
                        </a>
                      )}
                      <Link
                        to="/customers/new"
                        className="btn btn-primary !min-h-[36px] !px-3 gap-1 text-xs"
                        title="Convert to customer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Convert
                      </Link>
                    </div>
                  </div>
                </Card>
              );
            })
          ) : (
            <Card>
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Filter className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No leads match your filters</p>
                <p className="text-sm mt-1">Try adjusting your search or filters</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
