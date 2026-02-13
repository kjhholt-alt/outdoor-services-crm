import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Phone,
  Mail,
  MapPin,
  Clock,
  Plus,
  MessageSquare,
  Calendar,
  ChevronDown,
  ChevronUp,
  Briefcase,
  DollarSign,
  Bell,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { customersApi, activitiesApi, jobsApi, invoicesApi } from '../api/client';
import { Button } from '../components/common/Button';
import { Card, CardHeader, CardContent } from '../components/common/Card';
import { Modal } from '../components/common/Modal';
import { TextArea, Select } from '../components/common/Input';
import { FAB } from '../components/common/FAB';
import { PageTransition } from '../components/common/PageTransition';
import { SkeletonCard } from '../components/common/Skeleton';
import { useToast } from '../hooks/useToast';
import type { Customer, Activity, Reminder, ActivityType, Job, Invoice } from '../types';

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const avatarColors = [
  'bg-green-600', 'bg-blue-600', 'bg-purple-600', 'bg-amber-600',
  'bg-rose-600', 'bg-teal-600', 'bg-indigo-600', 'bg-orange-600',
];

function getAvatarColor(id: number): string {
  return avatarColors[id % avatarColors.length];
}

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  const customerId = parseInt(id!, 10);

  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [showNoteHistory, setShowNoteHistory] = useState(false);
  const [newNote, setNewNote] = useState('');

  const { data: customer, isLoading } = useQuery<Customer>({
    queryKey: ['customer', customerId],
    queryFn: () => customersApi.get(customerId),
  });

  const { data: activities } = useQuery<Activity[]>({
    queryKey: ['customer-activities', customerId],
    queryFn: () => customersApi.getActivities(customerId),
  });

  const { data: reminders } = useQuery<Reminder[]>({
    queryKey: ['customer-reminders', customerId],
    queryFn: () => customersApi.getReminders(customerId),
  });

  const { data: activityTypes } = useQuery<ActivityType[]>({
    queryKey: ['activity-types'],
    queryFn: activitiesApi.getTypes,
  });

  // Fetch customer's jobs and invoices for quick stats
  const { data: allJobs } = useQuery<Job[]>({
    queryKey: ['jobs'],
    queryFn: () => jobsApi.list(),
  });

  const { data: allInvoices } = useQuery<Invoice[]>({
    queryKey: ['invoices'],
    queryFn: () => invoicesApi.list(),
  });

  const customerJobs = (Array.isArray(allJobs) ? allJobs : []).filter(
    (j) => j.customer === customerId
  );
  const customerInvoices = (Array.isArray(allInvoices) ? allInvoices : []).filter(
    (i) => i.customer === customerId
  );
  const totalRevenue = customerInvoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + i.total, 0);
  const completedJobs = customerJobs.filter((j) => j.status === 'completed').length;
  const outstandingBalance = customerInvoices
    .filter((i) => ['sent', 'partial', 'overdue'].includes(i.status))
    .reduce((sum, i) => sum + i.balance_due, 0);

  const addNoteMutation = useMutation({
    mutationFn: (content: string) => customersApi.addNote(customerId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
      setNoteModalOpen(false);
      setNewNote('');
      showSuccess('Note added successfully');
    },
    onError: () => {
      showError('Failed to add note');
    },
  });

  if (isLoading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            <div className="flex-1">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mt-2 animate-pulse" />
            </div>
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <SkeletonCard />
              <SkeletonCard />
            </div>
            <div className="space-y-6">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (!customer) {
    return (
      <PageTransition>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
            Customer not found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            This customer may have been removed or the link is invalid.
          </p>
          <Button
            variant="secondary"
            onClick={() => navigate('/customers')}
          >
            Back to Customers
          </Button>
        </div>
      </PageTransition>
    );
  }

  const isCallOverdue =
    customer.next_call_date && new Date(customer.next_call_date) < new Date();

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/customers')}
            className="p-2 mt-1"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0 ${getAvatarColor(customerId)}`}
          >
            {getInitials(customer.business_name)}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">
              {customer.business_name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {customer.region_name && (
                <span className="badge badge-info">{customer.region_name}</span>
              )}
              {customer.is_active ? (
                <span className="badge badge-success">Active</span>
              ) : (
                <span className="badge badge-danger">Inactive</span>
              )}
              {isCallOverdue && (
                <span className="badge badge-danger">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Call overdue
                </span>
              )}
            </div>
          </div>
          <Button
            variant="secondary"
            leftIcon={<Edit className="w-4 h-4" />}
            onClick={() => navigate(`/customers/${customerId}/edit`)}
            className="hidden sm:flex"
          >
            Edit
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="card p-3 text-center">
            <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
              <Briefcase className="w-4 h-4" />
              <span className="text-xs font-medium uppercase">Jobs</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {completedJobs}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">completed</p>
          </div>
          <div className="card p-3 text-center">
            <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-xs font-medium uppercase">Revenue</span>
            </div>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">total paid</p>
          </div>
          <div className="card p-3 text-center">
            <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium uppercase">Activities</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {activities?.length || 0}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">logged</p>
          </div>
          <div className="card p-3 text-center">
            <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-xs font-medium uppercase">Balance</span>
            </div>
            <p
              className={`text-2xl font-bold ${
                outstandingBalance > 0
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-gray-900 dark:text-white'
              }`}
            >
              ${outstandingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">outstanding</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Info */}
            <Card>
              <CardHeader title="Contact Information" />
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  {customer.primary_contact && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <MessageSquare className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Primary Contact
                        </p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {customer.primary_contact}
                        </p>
                      </div>
                    </div>
                  )}
                  {customer.main_phone && (
                    <a
                      href={`tel:${customer.main_phone}`}
                      className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 -m-2 rounded-lg transition-colors"
                    >
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <Phone className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Phone
                        </p>
                        <p className="font-medium text-green-700 dark:text-green-300">
                          {customer.main_phone}
                        </p>
                      </div>
                    </a>
                  )}
                  {customer.main_email && (
                    <a
                      href={`mailto:${customer.main_email}`}
                      className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 -m-2 rounded-lg transition-colors"
                    >
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Email
                        </p>
                        <p className="font-medium text-blue-700 dark:text-blue-300 truncate max-w-[220px]">
                          {customer.main_email}
                        </p>
                      </div>
                    </a>
                  )}
                  {customer.bill_to_address && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${customer.bill_to_address}, ${customer.city}, ${customer.state} ${customer.zip_code}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 -m-2 rounded-lg transition-colors"
                    >
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <MapPin className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Address
                          <ExternalLink className="w-3 h-3 inline ml-1" />
                        </p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {customer.bill_to_address}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {customer.city}
                          {customer.city && customer.state && ', '}
                          {customer.state} {customer.zip_code}
                        </p>
                      </div>
                    </a>
                  )}
                </div>
                {customer.secondary_phone && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <a
                      href={`tel:${customer.secondary_phone}`}
                      className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 -m-2 rounded-lg transition-colors"
                    >
                      <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <Phone className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Secondary Phone
                        </p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {customer.secondary_phone}
                        </p>
                      </div>
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader
                title="Notes"
                action={
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Plus className="w-4 h-4" />}
                    onClick={() => setNoteModalOpen(true)}
                  >
                    Add Note
                  </Button>
                }
              />
              <CardContent>
                {customer.current_note ? (
                  <div>
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                      <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                        {customer.current_note.content}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        Updated{' '}
                        {new Date(
                          customer.current_note.created_at
                        ).toLocaleDateString()}
                      </p>
                    </div>

                    {customer.notes && customer.notes.length > 1 && (
                      <div className="mt-4">
                        <button
                          onClick={() => setShowNoteHistory(!showNoteHistory)}
                          className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 font-medium"
                        >
                          {showNoteHistory ? (
                            <>
                              <ChevronUp className="w-4 h-4" />
                              Hide history
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4" />
                              Show {customer.notes.length - 1} previous note
                              {customer.notes.length - 1 !== 1 ? 's' : ''}
                            </>
                          )}
                        </button>

                        {showNoteHistory && (
                          <div className="mt-4 space-y-3 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                            {customer.notes
                              .filter((note) => !note.is_current)
                              .map((note) => (
                                <div key={note.id} className="text-sm">
                                  <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                                    {note.content}
                                  </p>
                                  <p className="text-gray-400 mt-1">
                                    {new Date(
                                      note.created_at
                                    ).toLocaleDateString()}{' '}
                                    by {note.created_by_name}
                                  </p>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <MessageSquare className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      No notes yet
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setNoteModalOpen(true)}
                      className="mt-2"
                    >
                      Add first note
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Fleet Description */}
            {customer.fleet_description && (
              <Card>
                <CardHeader title="Fleet / Property Description" />
                <CardContent>
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                    {customer.fleet_description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Activity Timeline */}
            <Card>
              <CardHeader
                title="Activity History"
                subtitle={`${activities?.length || 0} activities`}
                action={
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Plus className="w-4 h-4" />}
                    onClick={() => setActivityModalOpen(true)}
                  >
                    Log Activity
                  </Button>
                }
              />
              <CardContent>
                {activities && activities.length > 0 ? (
                  <div className="space-y-1">
                    {activities.slice(0, 10).map((activity, idx) => (
                      <div
                        key={activity.id}
                        className="flex gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <div className="relative">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{
                              backgroundColor: `${activity.activity_type_color}20`,
                            }}
                          >
                            <Calendar
                              className="w-5 h-5"
                              style={{ color: activity.activity_type_color }}
                            />
                          </div>
                          {idx < Math.min(activities.length, 10) - 1 && (
                            <div className="absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-full bg-gray-200 dark:bg-gray-700" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pb-4">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {activity.activity_type_name}
                            </p>
                            {activity.outcome && (
                              <span className="badge badge-info flex-shrink-0">
                                {activity.outcome}
                              </span>
                            )}
                          </div>
                          {activity.notes && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                              {activity.notes}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {new Date(
                              activity.activity_datetime
                            ).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Calendar className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      No activities logged yet
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActivityModalOpen(true)}
                      className="mt-2"
                    >
                      Log first activity
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Call Info */}
            <Card>
              <CardHeader title="Call Schedule" />
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Last Call
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {customer.last_call_date
                        ? new Date(
                            customer.last_call_date
                          ).toLocaleDateString()
                        : 'Never'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      isCallOverdue
                        ? 'bg-red-100 dark:bg-red-900/30'
                        : 'bg-green-100 dark:bg-green-900/30'
                    }`}
                  >
                    <Calendar
                      className={`w-5 h-5 ${
                        isCallOverdue
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-green-600 dark:text-green-400'
                      }`}
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Next Call
                    </p>
                    <p
                      className={`font-medium ${
                        isCallOverdue
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {customer.next_call_date
                        ? new Date(
                            customer.next_call_date
                          ).toLocaleDateString()
                        : 'Not scheduled'}
                    </p>
                    {isCallOverdue && (
                      <p className="text-xs text-red-500 mt-0.5">Overdue</p>
                    )}
                  </div>
                </div>
                {customer.main_phone && (
                  <a
                    href={`tel:${customer.main_phone}`}
                    className="btn-primary w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium"
                  >
                    <Phone className="w-4 h-4" />
                    Call Now
                  </a>
                )}
              </CardContent>
            </Card>

            {/* Reminders */}
            <Card>
              <CardHeader
                title="Reminders"
                subtitle={`${reminders?.length || 0} pending`}
              />
              <CardContent>
                {reminders && reminders.length > 0 ? (
                  <div className="space-y-3">
                    {reminders.slice(0, 5).map((reminder) => (
                      <div
                        key={reminder.id}
                        className={`p-3 rounded-lg border ${
                          reminder.is_overdue
                            ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                            : reminder.is_today
                            ? 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20'
                            : 'border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <Bell
                            className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                              reminder.is_overdue
                                ? 'text-red-500'
                                : reminder.is_today
                                ? 'text-amber-500'
                                : 'text-gray-400'
                            }`}
                          />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                              {reminder.title}
                            </p>
                            {reminder.description && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                                {reminder.description}
                              </p>
                            )}
                            <p
                              className={`text-xs mt-1 ${
                                reminder.is_overdue
                                  ? 'text-red-600 dark:text-red-400 font-medium'
                                  : reminder.is_today
                                  ? 'text-amber-600 dark:text-amber-400 font-medium'
                                  : 'text-gray-500 dark:text-gray-400'
                              }`}
                            >
                              {reminder.is_overdue
                                ? 'Overdue'
                                : reminder.is_today
                                ? 'Due today'
                                : reminder.reminder_date}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Bell className="w-6 h-6 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      No pending reminders
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Customer Since */}
            <Card>
              <CardHeader title="Customer Info" />
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">
                    Added
                  </span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {new Date(customer.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">
                    Added by
                  </span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {customer.created_by_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">
                    Last updated
                  </span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {new Date(customer.updated_at).toLocaleDateString()}
                  </span>
                </div>
                {customer.fax && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      Fax
                    </span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {customer.fax}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Add Note Modal */}
        <Modal
          isOpen={noteModalOpen}
          onClose={() => setNoteModalOpen(false)}
          title="Add Note"
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setNoteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => addNoteMutation.mutate(newNote)}
                isLoading={addNoteMutation.isPending}
                disabled={!newNote.trim()}
              >
                Save Note
              </Button>
            </>
          }
        >
          <TextArea
            label="Note"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Enter your note about this customer..."
            rows={6}
          />
        </Modal>

        {/* Activity Modal */}
        <ActivityModal
          isOpen={activityModalOpen}
          onClose={() => setActivityModalOpen(false)}
          customerId={customerId}
          activityTypes={activityTypes || []}
        />

        {/* FAB */}
        <FAB
          actions={[
            {
              icon: <Phone className="w-5 h-5" />,
              label: 'Log Call',
              onClick: () => setActivityModalOpen(true),
              color: '#3b82f6',
            },
            {
              icon: <Plus className="w-5 h-5" />,
              label: 'Add Note',
              onClick: () => setNoteModalOpen(true),
              color: '#10b981',
            },
          ]}
        />
      </div>
    </PageTransition>
  );
}

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: number;
  activityTypes: ActivityType[];
}

function ActivityModal({
  isOpen,
  onClose,
  customerId,
  activityTypes,
}: ActivityModalProps) {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  const [activityType, setActivityType] = useState('');
  const [notes, setNotes] = useState('');
  const [outcome, setOutcome] = useState('completed');
  const [createReminder, setCreateReminder] = useState(true);
  const [reminderDays, setReminderDays] = useState('30');

  const createActivityMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => activitiesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['customer-activities', customerId],
      });
      queryClient.invalidateQueries({
        queryKey: ['customer-reminders', customerId],
      });
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
      onClose();
      setActivityType('');
      setNotes('');
      setOutcome('completed');
      setCreateReminder(true);
      setReminderDays('30');
      showSuccess('Activity logged successfully');
    },
    onError: () => {
      showError('Failed to log activity');
    },
  });

  const handleSubmit = () => {
    createActivityMutation.mutate({
      customer: customerId,
      activity_type: parseInt(activityType, 10),
      notes,
      outcome,
      activity_datetime: new Date().toISOString(),
      create_reminder: createReminder,
      reminder_days: parseInt(reminderDays, 10),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Log Activity"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={createActivityMutation.isPending}
            disabled={!activityType}
          >
            Log Activity
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Select
          label="Activity Type"
          value={activityType}
          onChange={(e) => setActivityType(e.target.value)}
          options={[
            { value: '', label: 'Select type...' },
            ...activityTypes.map((type) => ({
              value: type.id.toString(),
              label: type.display_name,
            })),
          ]}
        />

        <TextArea
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Enter activity notes..."
          rows={4}
        />

        <Select
          label="Outcome"
          value={outcome}
          onChange={(e) => setOutcome(e.target.value)}
          options={[
            { value: 'completed', label: 'Completed' },
            { value: 'no_answer', label: 'No Answer' },
            { value: 'left_message', label: 'Left Message' },
            { value: 'callback_requested', label: 'Callback Requested' },
            { value: 'not_interested', label: 'Not Interested' },
            { value: 'interested', label: 'Interested' },
            { value: 'follow_up_needed', label: 'Follow Up Needed' },
            { value: 'other', label: 'Other' },
          ]}
        />

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={createReminder}
              onChange={(e) => setCreateReminder(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Create follow-up reminder
            </span>
          </label>

          {createReminder && (
            <Select
              value={reminderDays}
              onChange={(e) => setReminderDays(e.target.value)}
              options={[
                { value: '7', label: '7 business days' },
                { value: '14', label: '14 business days' },
                { value: '30', label: '30 business days' },
                { value: '60', label: '60 business days' },
                { value: '90', label: '90 business days' },
              ]}
              className="w-48"
            />
          )}
        </div>
      </div>
    </Modal>
  );
}
