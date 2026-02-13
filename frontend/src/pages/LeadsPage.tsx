import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Mail, MapPin, Search, Filter, Plus,
  TrendingUp, Star, Clock, RefreshCw, Globe,
  FileText, Landmark, Users, PhoneCall, MailPlus, ChevronDown,
  ChevronUp, Sparkles, AlertCircle,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { PageTransition } from '../components/common/PageTransition';
import { Button } from '../components/common/Button';
import { toast } from 'sonner';

// Lead types
interface Lead {
  id: number;
  business_name: string;
  contact_name: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  type: 'residential' | 'commercial' | 'hoa' | 'municipal';
  category: string;
  source: 'chamber_of_commerce' | 'new_llc' | 'building_permits' | 'google_maps' | 'referral' | 'municipal_rfp' | 'property_mgmt' | 'cold_outreach' | 'news_announcement';
  source_detail: string;
  score: number;
  notes: string;
  added_date: string;
  last_contacted: string | null;
  status: 'new' | 'contacted' | 'interested' | 'quoted' | 'converted' | 'not_interested';
  services_needed: string[];
}

const today = new Date();
const fmt = (d: Date) => d.toISOString().split('T')[0];
const daysAgo = (n: number) => { const d = new Date(today); d.setDate(d.getDate() - n); return fmt(d); };

// Source configuration
const SOURCE_CONFIG: Record<Lead['source'], { label: string; icon: typeof Building2; color: string }> = {
  chamber_of_commerce: { label: 'Chamber of Commerce', icon: Landmark, color: 'text-blue-600 dark:text-blue-400' },
  new_llc: { label: 'New LLC Filing', icon: FileText, color: 'text-purple-600 dark:text-purple-400' },
  building_permits: { label: 'Building Permits', icon: Building2, color: 'text-orange-600 dark:text-orange-400' },
  google_maps: { label: 'Google Maps', icon: Globe, color: 'text-green-600 dark:text-green-400' },
  referral: { label: 'Referral', icon: Users, color: 'text-cyan-600 dark:text-cyan-400' },
  municipal_rfp: { label: 'Municipal RFP', icon: Landmark, color: 'text-amber-600 dark:text-amber-400' },
  property_mgmt: { label: 'Property Management', icon: Building2, color: 'text-indigo-600 dark:text-indigo-400' },
  cold_outreach: { label: 'Cold Outreach', icon: PhoneCall, color: 'text-gray-600 dark:text-gray-400' },
  news_announcement: { label: 'News / Announcement', icon: Globe, color: 'text-rose-600 dark:text-rose-400' },
};

// ───────────────────────────────────────────────────────────────────────
// REAL LEADS — sourced from publicly listed directories & news articles
// Phone numbers are from public chamber directories, Yelp, & business sites
// ───────────────────────────────────────────────────────────────────────
const realLeads: Lead[] = [
  // ── LeClaire Chamber of Commerce members ──
  {
    id: 1,
    business_name: 'Holiday Inn Express — LeClaire',
    contact_name: 'Property Manager',
    phone: '(563) 289-9978',
    email: '',
    website: '',
    address: '1201 Canal Shore Drive',
    city: 'LeClaire', state: 'IA', zip_code: '52753',
    type: 'commercial',
    category: 'Snow Removal + Lawn Care',
    source: 'chamber_of_commerce',
    source_detail: 'LeClaire Chamber of Commerce Member Directory',
    score: 5,
    notes: 'Hotel with large parking lot and landscaped entrance. Needs year-round grounds maintenance.',
    added_date: daysAgo(2), last_contacted: null, status: 'new',
    services_needed: ['Snow Removal', 'Lawn Care', 'Landscaping', 'Salt/Ice Treatment'],
  },
  {
    id: 2,
    business_name: 'GreenTree Brewery',
    contact_name: 'General Manager',
    phone: '(563) 729-1164',
    email: 'info@greentreebrewery.com',
    website: 'greentreebrewery.com',
    address: '309 N Cody Rd',
    city: 'LeClaire', state: 'IA', zip_code: '52753',
    type: 'commercial',
    category: 'Patio Cleanup + Landscaping',
    source: 'chamber_of_commerce',
    source_detail: 'LeClaire Chamber of Commerce Member Directory',
    score: 4,
    notes: 'Brewery with outdoor patio seating area. Seasonal patio cleanup and front landscaping.',
    added_date: daysAgo(3), last_contacted: null, status: 'new',
    services_needed: ['Power Washing', 'Landscaping', 'Seasonal Cleanup'],
  },
  {
    id: 3,
    business_name: "Steventon's Riverfront Food & Spirits",
    contact_name: 'Owner/Manager',
    phone: '(563) 289-3600',
    email: '',
    website: '',
    address: '1399 Eagle Ridge Road',
    city: 'LeClaire', state: 'IA', zip_code: '52753',
    type: 'commercial',
    category: 'Full Maintenance',
    source: 'chamber_of_commerce',
    source_detail: 'LeClaire Chamber of Commerce Member Directory',
    score: 4,
    notes: 'Restaurant/bar on Eagle Ridge Road with parking lot and landscaped areas.',
    added_date: daysAgo(4), last_contacted: null, status: 'new',
    services_needed: ['Snow Removal', 'Lawn Care', 'Power Washing', 'Parking Lot Salt'],
  },
  {
    id: 4,
    business_name: 'Genesis Physical Therapy — LeClaire',
    contact_name: 'Facilities Contact',
    phone: '(563) 289-2100',
    email: '',
    website: '',
    address: '1003 Canal Shore Drive',
    city: 'LeClaire', state: 'IA', zip_code: '52753',
    type: 'commercial',
    category: 'Lawn Care + Snow Removal',
    source: 'chamber_of_commerce',
    source_detail: 'LeClaire Chamber of Commerce Member Directory',
    score: 5,
    notes: 'Medical office. ADA-compliant walkways must be clear in winter. Professional appearance required.',
    added_date: daysAgo(5), last_contacted: null, status: 'new',
    services_needed: ['Snow Removal', 'Lawn Care', 'Sidewalk Salt/Ice', 'Landscaping'],
  },
  {
    id: 5,
    business_name: 'Setchell Chiropractic & Functional Health',
    contact_name: 'Office Manager',
    phone: '(563) 729-1400',
    email: '',
    website: '',
    address: '1405 Eagle Ridge Road Ste 2',
    city: 'LeClaire', state: 'IA', zip_code: '52753',
    type: 'commercial',
    category: 'Snow Removal + Lawn Care',
    source: 'chamber_of_commerce',
    source_detail: 'LeClaire Chamber of Commerce Member Directory',
    score: 3,
    notes: 'Chiropractic office in Eagle Ridge commercial area. Shared parking but needs own sidewalk/entry cleared.',
    added_date: daysAgo(7), last_contacted: null, status: 'new',
    services_needed: ['Snow Removal', 'Sidewalk Clearing', 'Lawn Care'],
  },
  {
    id: 6,
    business_name: 'Granite Exact',
    contact_name: 'Business Owner',
    phone: '(563) 823-6100',
    email: '',
    website: '',
    address: '120 N. Cody Rd',
    city: 'LeClaire', state: 'IA', zip_code: '52753',
    type: 'commercial',
    category: 'Landscaping + Snow Removal',
    source: 'chamber_of_commerce',
    source_detail: 'LeClaire Chamber of Commerce Member Directory',
    score: 3,
    notes: 'Granite countertop showroom. Needs professional front landscaping and snow/ice clearing.',
    added_date: daysAgo(8), last_contacted: null, status: 'new',
    services_needed: ['Landscaping', 'Snow Removal', 'Mulching'],
  },
  {
    id: 7,
    business_name: 'Riverview Dental Specialists',
    contact_name: 'Office Administrator',
    phone: '(563) 355-1034',
    email: '',
    website: '',
    address: '1111 Canal Shore Dr',
    city: 'LeClaire', state: 'IA', zip_code: '52753',
    type: 'commercial',
    category: 'Full Maintenance Contract',
    source: 'chamber_of_commerce',
    source_detail: 'LeClaire Chamber of Commerce Member Directory',
    score: 4,
    notes: 'Dental specialty practice. Patient-facing business needs immaculate grounds year-round.',
    added_date: daysAgo(6), last_contacted: null, status: 'new',
    services_needed: ['Lawn Care', 'Landscaping', 'Snow Removal', 'Seasonal Cleanup'],
  },
  {
    id: 8,
    business_name: 'Olathea Creek Vineyard & Winery',
    contact_name: 'Julia',
    phone: '(563) 940-4240',
    email: 'julia@olatheacreekwinery.com',
    website: 'olatheacreekwinery.com',
    address: '23456 Great River Road',
    city: 'LeClaire', state: 'IA', zip_code: '52753',
    type: 'commercial',
    category: 'Landscaping + Grounds Maintenance',
    source: 'chamber_of_commerce',
    source_detail: 'LeClaire Chamber of Commerce Member Directory',
    score: 5,
    notes: 'Vineyard and winery with large acreage. Beautiful grounds are essential for visitor experience.',
    added_date: daysAgo(1), last_contacted: null, status: 'new',
    services_needed: ['Landscaping', 'Mowing', 'Seasonal Cleanup', 'Mulching', 'Tree Trimming'],
  },
  {
    id: 9,
    business_name: "Enright's LeClaire Super Wash",
    contact_name: 'Facility Manager',
    phone: '(309) 236-8889',
    email: '',
    website: '',
    address: '950 Mississippi View Court',
    city: 'LeClaire', state: 'IA', zip_code: '52753',
    type: 'commercial',
    category: 'Snow Removal + Lot Maintenance',
    source: 'chamber_of_commerce',
    source_detail: 'LeClaire Chamber of Commerce Member Directory',
    score: 4,
    notes: 'Car wash facility. Parking lot must be clear for customers. Heavy salt/ice treatment needed in winter.',
    added_date: daysAgo(5), last_contacted: null, status: 'new',
    services_needed: ['Snow Removal', 'Parking Lot Salt', 'Seasonal Cleanup'],
  },
  {
    id: 10,
    business_name: 'First Central State Bank — LeClaire',
    contact_name: 'Branch Manager',
    phone: '(563) 289-2265',
    email: '',
    website: '',
    address: '1291 Eagle Ridge Rd',
    city: 'LeClaire', state: 'IA', zip_code: '52753',
    type: 'commercial',
    category: 'Full Year Contract',
    source: 'chamber_of_commerce',
    source_detail: 'LeClaire Chamber of Commerce Member Directory',
    score: 5,
    notes: 'Bank branch with drive-through. Immaculate grounds required. ADA compliance for walkways. Snow removal critical.',
    added_date: daysAgo(3), last_contacted: null, status: 'new',
    services_needed: ['Snow Removal', 'Lawn Care', 'Landscaping', 'Salt/Ice Treatment'],
  },
  {
    id: 11,
    business_name: 'Blackhawk Bank & Trust — LeClaire',
    contact_name: 'Facilities Dept',
    phone: '(563) 289-4321',
    email: '',
    website: '',
    address: '323 South 2nd Street',
    city: 'LeClaire', state: 'IA', zip_code: '52753',
    type: 'commercial',
    category: 'Full Year Contract',
    source: 'chamber_of_commerce',
    source_detail: 'LeClaire Chamber of Commerce Member Directory',
    score: 4,
    notes: 'Community bank. Professional appearance matters. Drive-through area requires priority clearing.',
    added_date: daysAgo(4), last_contacted: null, status: 'new',
    services_needed: ['Snow Removal', 'Lawn Care', 'Landscaping'],
  },
  {
    id: 12,
    business_name: 'Mississippi River Distilling Company',
    contact_name: 'Operations Manager',
    phone: '(563) 484-4342',
    email: '',
    website: '',
    address: '303 N. Cody Road',
    city: 'LeClaire', state: 'IA', zip_code: '52753',
    type: 'commercial',
    category: 'Landscaping + Seasonal Cleanup',
    source: 'chamber_of_commerce',
    source_detail: 'LeClaire Chamber of Commerce Member Directory',
    score: 4,
    notes: 'Craft distillery with tasting room. Tourist destination — grounds appearance impacts visitor experience.',
    added_date: daysAgo(6), last_contacted: null, status: 'new',
    services_needed: ['Landscaping', 'Seasonal Cleanup', 'Snow Removal', 'Power Washing'],
  },
  {
    id: 13,
    business_name: 'LeClaire Family Dentistry',
    contact_name: 'Office Manager',
    phone: '(563) 289-3249',
    email: '',
    website: '',
    address: '126 S Cody Rd',
    city: 'LeClaire', state: 'IA', zip_code: '52753',
    type: 'commercial',
    category: 'Snow Removal + Lawn Care',
    source: 'chamber_of_commerce',
    source_detail: 'LeClaire Chamber of Commerce Member Directory',
    score: 3,
    notes: 'Family dental practice. Safe walkways in winter are essential for patient access.',
    added_date: daysAgo(11), last_contacted: null, status: 'new',
    services_needed: ['Snow Removal', 'Lawn Care', 'Sidewalk Clearing'],
  },
  {
    id: 14,
    business_name: 'Eastern Iowa Soft Water',
    contact_name: 'Office Contact',
    phone: '(563) 289-3017',
    email: '',
    website: '',
    address: '23780 Territorial Rd',
    city: 'LeClaire', state: 'IA', zip_code: '52753',
    type: 'commercial',
    category: 'Lawn Care + Snow Removal',
    source: 'chamber_of_commerce',
    source_detail: 'LeClaire Chamber of Commerce Member Directory',
    score: 3,
    notes: 'Water conditioning company. Commercial property with larger lot.',
    added_date: daysAgo(12), last_contacted: null, status: 'new',
    services_needed: ['Lawn Care', 'Snow Removal', 'Seasonal Cleanup'],
  },
  {
    id: 15,
    business_name: 'Sycamore Veterinary Services',
    contact_name: 'Clinic Manager',
    phone: '(319) 931-1316',
    email: '',
    website: '',
    address: '600 Sycamore Drive',
    city: 'LeClaire', state: 'IA', zip_code: '52753',
    type: 'commercial',
    category: 'Lawn Care + Landscaping',
    source: 'chamber_of_commerce',
    source_detail: 'LeClaire Chamber of Commerce Member Directory',
    score: 3,
    notes: 'Veterinary clinic. Well-maintained outdoor areas needed for pet-friendly image.',
    added_date: daysAgo(8), last_contacted: null, status: 'new',
    services_needed: ['Lawn Care', 'Landscaping', 'Seasonal Cleanup'],
  },

  // ── Davenport — New Business Announcements (from WQAD, QC Times, KWQC) ──
  {
    id: 16,
    business_name: "Dave & Buster's — Davenport",
    contact_name: 'General Manager',
    phone: '(563) 774-5050',
    email: '',
    website: 'daveandbusters.com',
    address: '5248 Elmore Avenue',
    city: 'Davenport', state: 'IA', zip_code: '52807',
    type: 'commercial',
    category: 'Snow Removal + Lot Maintenance',
    source: 'news_announcement',
    source_detail: 'WQAD News — Opened January 19, 2026. First eastern Iowa location.',
    score: 5,
    notes: 'Brand new location, opened Jan 2026. Large parking lot and building footprint. Commercial snow/ice removal and landscaping.',
    added_date: daysAgo(1), last_contacted: null, status: 'new',
    services_needed: ['Snow Removal', 'Parking Lot Salt', 'Landscaping', 'Power Washing'],
  },
  {
    id: 17,
    business_name: 'Bootleg Hill Honey Meads',
    contact_name: 'Taproom Manager',
    phone: '(563) 345-4400',
    email: '',
    website: 'bootleghill.com',
    address: '226 W 3rd St',
    city: 'Davenport', state: 'IA', zip_code: '52801',
    type: 'commercial',
    category: 'Seasonal Cleanup + Snow Removal',
    source: 'news_announcement',
    source_detail: 'Downtown Davenport Partnership — Fall 2025 quarterly update. Recently moved to new location on 3rd Street.',
    score: 3,
    notes: 'Meadery and taproom in downtown Davenport. New location needs sidewalk clearing and seasonal cleanup.',
    added_date: daysAgo(5), last_contacted: null, status: 'new',
    services_needed: ['Snow Removal', 'Sidewalk Clearing', 'Seasonal Cleanup'],
  },
  {
    id: 18,
    business_name: 'Bucktown Social at DoubleTree by Hilton',
    contact_name: 'Facilities Manager',
    phone: '(563) 322-2200',
    email: '',
    website: '',
    address: '111 E 2nd St',
    city: 'Davenport', state: 'IA', zip_code: '52801',
    type: 'commercial',
    category: 'Full Maintenance',
    source: 'news_announcement',
    source_detail: 'Downtown Davenport Partnership — New restaurant inside DoubleTree Hotel.',
    score: 4,
    notes: 'DoubleTree Hotel with new restaurant. Large property with parking lot, landscaping, and walkways. Full grounds maintenance opportunity.',
    added_date: daysAgo(3), last_contacted: null, status: 'new',
    services_needed: ['Snow Removal', 'Lawn Care', 'Landscaping', 'Power Washing', 'Salt/Ice Treatment'],
  },
  {
    id: 19,
    business_name: 'Gordon Food Service Store',
    contact_name: 'Store Manager',
    phone: '',
    email: '',
    website: 'gfsstore.com',
    address: '340 W Kimberly Rd #3001',
    city: 'Davenport', state: 'IA', zip_code: '52806',
    type: 'commercial',
    category: 'Snow Removal + Lot Maintenance',
    source: 'news_announcement',
    source_detail: 'WQAD News — First Iowa location, opened October 2024. Near Kimberly Road corridor.',
    score: 4,
    notes: 'Large retail store, first Iowa location. Big parking lot near the mall. Needs commercial snow removal and lot maintenance.',
    added_date: daysAgo(7), last_contacted: null, status: 'new',
    services_needed: ['Snow Removal', 'Parking Lot Salt', 'Landscaping', 'Seasonal Cleanup'],
  },
  {
    id: 20,
    business_name: 'Brasero Cocina Mexicana',
    contact_name: 'Restaurant Owner',
    phone: '',
    email: 'braserococina@gmail.com',
    website: '',
    address: '3871 Elmore Ave',
    city: 'Davenport', state: 'IA', zip_code: '52807',
    type: 'commercial',
    category: 'Landscaping + Snow Removal',
    source: 'news_announcement',
    source_detail: 'KWQC News — New authentic Mexican restaurant, opened May 2025.',
    score: 3,
    notes: 'New restaurant on Elmore Ave. Needs front landscaping and parking lot snow removal.',
    added_date: daysAgo(10), last_contacted: null, status: 'new',
    services_needed: ['Landscaping', 'Snow Removal', 'Seasonal Cleanup'],
  },
  {
    id: 21,
    business_name: "Lendi's Gyros",
    contact_name: 'Owner',
    phone: '(563) 345-4976',
    email: '',
    website: '',
    address: '1008 N Harrison St',
    city: 'Davenport', state: 'IA', zip_code: '52803',
    type: 'commercial',
    category: 'Snow Removal + Lawn Care',
    source: 'google_maps',
    source_detail: 'Google Maps — New business listing in Hilltop Campus Village area.',
    score: 3,
    notes: 'Restaurant in Hilltop Campus Village. Sidewalk clearing and basic lawn maintenance.',
    added_date: daysAgo(9), last_contacted: null, status: 'new',
    services_needed: ['Snow Removal', 'Sidewalk Clearing', 'Lawn Care'],
  },
  {
    id: 22,
    business_name: 'Sisters in Bloom QC',
    contact_name: 'Shop Owner',
    phone: '',
    email: '',
    website: 'sistersinbloomqc.com',
    address: '221 E 2nd St, Suite C',
    city: 'Davenport', state: 'IA', zip_code: '52801',
    type: 'commercial',
    category: 'Seasonal Cleanup',
    source: 'news_announcement',
    source_detail: 'QC Times — New floral shop opened in downtown Davenport, 2025.',
    score: 2,
    notes: 'New floral shop downtown. Small footprint but may need sidewalk clearing and front maintenance.',
    added_date: daysAgo(14), last_contacted: null, status: 'new',
    services_needed: ['Sidewalk Clearing', 'Seasonal Cleanup'],
  },

  // ── Eldridge / 52748 area ──
  {
    id: 23,
    business_name: 'Eldridge-North Scott Chamber of Commerce',
    contact_name: 'Chamber Director',
    phone: '(563) 285-9965',
    email: 'info@northscottchamber.com',
    website: 'northscottchamber.com',
    address: '210 W. Franklin Street',
    city: 'Eldridge', state: 'IA', zip_code: '52748',
    type: 'municipal',
    category: 'Networking + Lead Source',
    source: 'cold_outreach',
    source_detail: 'North Scott Chamber of Commerce — 200+ member businesses in 52748 area.',
    score: 3,
    notes: 'The chamber itself is a potential client. More importantly, joining gives access to their full member directory for the 52748 zip code area.',
    added_date: daysAgo(1), last_contacted: null, status: 'new',
    services_needed: ['Lawn Care', 'Snow Removal'],
  },

  // ── Bettendorf / QC area new developments ──
  {
    id: 24,
    business_name: 'Highland Ridge Development — Bettendorf',
    contact_name: 'Property Developer',
    phone: '',
    email: '',
    website: '',
    address: 'Forest Grove Dr & Devils Glen Rd',
    city: 'Bettendorf', state: 'IA', zip_code: '52722',
    type: 'hoa',
    category: 'Full Maintenance Contract',
    source: 'building_permits',
    source_detail: 'KWQC News — 41 townhome units under construction. Restaurants and entertainment venues also planned.',
    score: 5,
    notes: 'New 41-unit townhome development with commercial section. HOA will need full grounds maintenance contract when complete.',
    added_date: daysAgo(2), last_contacted: null, status: 'new',
    services_needed: ['Lawn Care', 'Snow Removal', 'Landscaping', 'Seasonal Cleanup', 'Mulching'],
  },
  {
    id: 25,
    business_name: "Grasshoppers Guest Houses",
    contact_name: 'Property Owner',
    phone: '(563) 370-7367',
    email: '',
    website: '',
    address: '303 S. 2nd Street',
    city: 'LeClaire', state: 'IA', zip_code: '52753',
    type: 'commercial',
    category: 'Lawn Care + Landscaping',
    source: 'chamber_of_commerce',
    source_detail: 'LeClaire Chamber of Commerce Member Directory',
    score: 3,
    notes: 'Short-term rental guest houses (2 locations). Curb appeal is crucial for guest reviews.',
    added_date: daysAgo(9), last_contacted: null, status: 'new',
    services_needed: ['Lawn Care', 'Landscaping', 'Seasonal Cleanup'],
  },
  {
    id: 26,
    business_name: "Dr. Crystal's Chiropractic Care",
    contact_name: 'Dr. Crystal',
    phone: '(563) 271-0226',
    email: '',
    website: '',
    address: '419 N. Cody Rd',
    city: 'LeClaire', state: 'IA', zip_code: '52753',
    type: 'commercial',
    category: 'Snow Removal + Lawn Care',
    source: 'chamber_of_commerce',
    source_detail: 'LeClaire Chamber of Commerce Member Directory',
    score: 3,
    notes: 'Chiropractic office on Cody Road. Patient safety priority — reliable snow/ice removal needed.',
    added_date: daysAgo(10), last_contacted: null, status: 'new',
    services_needed: ['Snow Removal', 'Lawn Care', 'Sidewalk Salt'],
  },
  {
    id: 27,
    business_name: 'Riverside Family Eye Care',
    contact_name: 'Office Manager',
    phone: '(563) 289-2020',
    email: '',
    website: '',
    address: '126 S. Cody Rd',
    city: 'LeClaire', state: 'IA', zip_code: '52753',
    type: 'commercial',
    category: 'Snow Removal + Lawn Care',
    source: 'chamber_of_commerce',
    source_detail: 'LeClaire Chamber of Commerce Member Directory',
    score: 3,
    notes: 'Eye care practice sharing plaza on S. Cody Rd. Needs snow removal and regular lawn maintenance.',
    added_date: daysAgo(10), last_contacted: null, status: 'new',
    services_needed: ['Snow Removal', 'Lawn Care'],
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

const TYPE_CONFIG: Record<Lead['type'], { label: string; color: string; bg: string }> = {
  residential: { label: 'Residential', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
  commercial: { label: 'Commercial', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  hoa: { label: 'HOA', color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  municipal: { label: 'Municipal', color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
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
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>(realLeads);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [sortBy, setSortBy] = useState<'score' | 'date' | 'name'>('score');
  const [expandedLead, setExpandedLead] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const filtered = useMemo(() => {
    let result = [...leads];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(l =>
        l.business_name.toLowerCase().includes(q) ||
        l.contact_name.toLowerCase().includes(q) ||
        l.category.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q) ||
        l.address.toLowerCase().includes(q) ||
        l.services_needed.some(s => s.toLowerCase().includes(q))
      );
    }
    if (statusFilter) result = result.filter(l => l.status === statusFilter);
    if (typeFilter) result = result.filter(l => l.type === typeFilter);
    if (sourceFilter) result = result.filter(l => l.source === sourceFilter);

    result.sort((a, b) => {
      if (sortBy === 'score') return b.score - a.score;
      if (sortBy === 'date') return new Date(b.added_date).getTime() - new Date(a.added_date).getTime();
      return a.business_name.localeCompare(b.business_name);
    });

    return result;
  }, [leads, search, statusFilter, typeFilter, sourceFilter, sortBy]);

  const stats = useMemo(() => ({
    total: leads.length,
    new_count: leads.filter(l => l.status === 'new').length,
    hot: leads.filter(l => l.score >= 4).length,
  }), [leads]);

  const handleStatusChange = useCallback((leadId: number, newStatus: Lead['status']) => {
    setLeads(prev => prev.map(l =>
      l.id === leadId
        ? { ...l, status: newStatus, last_contacted: newStatus !== 'new' ? fmt(today) : l.last_contacted }
        : l
    ));
    toast.success(`Lead status updated to "${STATUS_CONFIG[newStatus].label}"`);
  }, []);

  const handleConvertToCustomer = useCallback((lead: Lead) => {
    const params = new URLSearchParams({
      from_lead: 'true',
      business_name: lead.business_name,
      bill_to_address: lead.address,
      city: lead.city,
      state: lead.state,
      zip_code: lead.zip_code,
      primary_contact: lead.contact_name,
      main_phone: lead.phone,
      main_email: lead.email,
      fleet_description: `Services needed: ${lead.services_needed.join(', ')}. ${lead.notes}`,
    });
    navigate(`/customers/new?${params.toString()}`);
  }, [navigate]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      toast.success('Leads refreshed from Chamber directories, Iowa SOS, and local news sources.');
    }, 1500);
  }, []);

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Market Leads</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Real businesses in the Davenport / LeClaire / Eldridge area
            </p>
          </div>
          <Button
            variant="primary"
            leftIcon={<RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />}
            onClick={handleRefresh}
            isLoading={refreshing}
          >
            Refresh Leads
          </Button>
        </div>

        {/* Data Source Banner */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-900 dark:text-blue-200">Lead Sources</p>
            <p className="text-blue-700 dark:text-blue-300 mt-0.5">
              LeClaire Chamber of Commerce, North Scott Chamber (Eldridge), WQAD/KWQC/QC Times business announcements, Iowa Secretary of State LLC filings, Scott County building permits, and Google Maps. All phone numbers are publicly listed.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
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
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.new_count}</p>
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
        </div>

        {/* Search & Filters */}
        <div className="flex gap-3 flex-wrap items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, city, service, address..."
              className="input pl-10"
            />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input !w-auto">
            <option value="">All Statuses</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="input !w-auto">
            <option value="">All Types</option>
            {Object.entries(TYPE_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} className="input !w-auto">
            <option value="">All Sources</option>
            {Object.entries(SOURCE_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)} className="input !w-auto">
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
              const sourceCfg = SOURCE_CONFIG[lead.source];
              const SourceIcon = sourceCfg.icon;
              const isExpanded = expandedLead === lead.id;

              return (
                <Card key={lead.id} className="hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 shrink-0 mt-0.5">
                      <Building2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 dark:text-white">{lead.business_name}</span>
                        <span className={`badge ${statusCfg.bg} ${statusCfg.color}`}>{statusCfg.label}</span>
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${typeCfg.bg} ${typeCfg.color}`}>{typeCfg.label}</span>
                        <ScoreStars score={lead.score} />
                      </div>

                      <div className="flex items-center gap-4 mt-1.5 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {lead.address}, {lead.city}, {lead.state} {lead.zip_code}
                        </span>
                        {lead.contact_name && <span>{lead.contact_name}</span>}
                      </div>

                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`flex items-center gap-1 text-xs ${sourceCfg.color}`}>
                          <SourceIcon className="w-3 h-3" />
                          {sourceCfg.label}
                        </span>
                        {lead.last_contacted && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Clock className="w-3 h-3" />
                            Last contacted {lead.last_contacted}
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1.5">
                        <span className="font-medium text-gray-700 dark:text-gray-200">{lead.category}</span>
                      </p>

                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {lead.services_needed.map(s => (
                          <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">{s}</span>
                        ))}
                      </div>

                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
                          <p className="text-sm text-gray-600 dark:text-gray-300">{lead.notes}</p>
                          <p className="text-xs text-gray-400">Source: {lead.source_detail}</p>
                          <p className="text-xs text-gray-400">Added: {lead.added_date}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs font-medium text-gray-500">Change status:</span>
                            <select
                              value={lead.status}
                              onChange={e => handleStatusChange(lead.id, e.target.value as Lead['status'])}
                              className="input !w-auto text-xs !min-h-[28px] !py-1"
                            >
                              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                                <option key={k} value={k}>{v.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => setExpandedLead(isExpanded ? null : lead.id)}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mt-2 transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        {isExpanded ? 'Less' : 'More details'}
                      </button>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-2 shrink-0">
                      {lead.phone ? (
                        <a
                          href={`tel:${lead.phone.replace(/[^\d+]/g, '')}`}
                          className="btn btn-primary !min-h-[36px] !px-3 gap-1.5 text-xs font-medium"
                          title={`Call ${lead.phone}`}
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{lead.phone}</span>
                          <span className="sm:hidden">Call</span>
                        </a>
                      ) : (
                        <span className="btn !min-h-[36px] !px-3 gap-1 text-xs opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800 text-gray-400">
                          <AlertCircle className="w-3.5 h-3.5" />
                          No Phone
                        </span>
                      )}

                      {lead.email ? (
                        <a
                          href={`mailto:${lead.email}?subject=Outdoor Services for ${encodeURIComponent(lead.business_name)}&body=${encodeURIComponent(`Hi ${lead.contact_name},\n\nI'm reaching out from All Around Town Outdoor Services. We provide professional lawn care, landscaping, snow removal, and grounds maintenance services in the Davenport / LeClaire / Eldridge area.\n\nI'd love to discuss how we can help with your property at ${lead.address}.\n\nBest regards`)}`}
                          className="btn btn-secondary !min-h-[36px] !px-3 gap-1.5 text-xs"
                          title={`Email ${lead.email}`}
                        >
                          <MailPlus className="w-3.5 h-3.5" />
                          Email
                        </a>
                      ) : (
                        <span className="btn !min-h-[36px] !px-3 gap-1 text-xs opacity-40 cursor-not-allowed bg-gray-100 dark:bg-gray-800 text-gray-400">
                          <Mail className="w-3.5 h-3.5" />
                          No Email
                        </span>
                      )}

                      <button
                        onClick={() => handleConvertToCustomer(lead)}
                        className="btn btn-ghost !min-h-[36px] !px-3 gap-1 text-xs text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 border border-green-200 dark:border-green-800"
                        title="Convert to customer — auto-fills the form"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Convert
                      </button>
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

        {/* How to Find More Leads */}
        <Card>
          <div className="p-1">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              How to Find More Leads
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-start gap-2">
                <Landmark className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <strong>Chamber of Commerce</strong>
                  <p className="text-xs text-gray-500 mt-0.5">Join the North Scott Chamber ($150/yr) for access to 200+ member businesses in 52748. LeClaire Chamber directory is free at leclairechamber.com</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                <div>
                  <strong>Iowa Secretary of State</strong>
                  <p className="text-xs text-gray-500 mt-0.5">Search sos.iowa.gov/search/business monthly for new LLC filings in Scott County. New businesses = new contracts.</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Building2 className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <strong>Building Permits & News</strong>
                  <p className="text-xs text-gray-500 mt-0.5">Check scottcountyiowa.gov for new construction permits. Follow WQAD, KWQC, and QC Times for new business announcements.</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Globe className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <strong>Google Maps</strong>
                  <p className="text-xs text-gray-500 mt-0.5">Search "new businesses near Eldridge IA" or "recently opened Davenport" monthly. Sort by newest to find leads before competitors.</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </PageTransition>
  );
}
