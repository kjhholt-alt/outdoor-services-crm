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
} from 'lucide-react';
import { customersApi, activitiesApi } from '../api/client';
import { Button } from '../components/common/Button';
import { Card, CardHeader, CardContent } from '../components/common/Card';
import { Modal } from '../components/common/Modal';
import { TextArea, Select } from '../components/common/Input';
import { FAB } from '../components/common/FAB';
import type { Customer, Activity, Reminder, ActivityType } from '../types';

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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

  const addNoteMutation = useMutation({
    mutationFn: (content: string) => customersApi.addNote(customerId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
      setNoteModalOpen(false);
      setNewNote('');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Customer not found</p>
        <Button variant="secondary" onClick={() => navigate('/customers')} className="mt-4">
          Back to Customers
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/customers')}
          className="p-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {customer.business_name}
          </h1>
          {customer.region_name && (
            <span className="badge badge-info mt-1">{customer.region_name}</span>
          )}
        </div>
        <Button
          variant="secondary"
          leftIcon={<Edit className="w-4 h-4" />}
          onClick={() => navigate(`/customers/${customerId}/edit`)}
        >
          Edit
        </Button>
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
                      <p className="text-sm text-gray-500 dark:text-gray-400">Contact</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {customer.primary_contact}
                      </p>
                    </div>
                  </div>
                )}
                {customer.main_phone && (
                  <a
                    href={`tel:${customer.main_phone}`}
                    className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 -m-2 rounded-lg"
                  >
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <Phone className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {customer.main_phone}
                      </p>
                    </div>
                  </a>
                )}
                {customer.main_email && (
                  <a
                    href={`mailto:${customer.main_email}`}
                    className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 -m-2 rounded-lg"
                  >
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                      <p className="font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
                        {customer.main_email}
                      </p>
                    </div>
                  </a>
                )}
                {customer.bill_to_address && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <MapPin className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Address</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {customer.city}
                        {customer.city && customer.state && ', '}
                        {customer.state} {customer.zip_code}
                      </p>
                    </div>
                  </div>
                )}
              </div>
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
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                    {customer.current_note.content}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Updated {new Date(customer.current_note.created_at).toLocaleDateString()}
                  </p>

                  {customer.notes && customer.notes.length > 1 && (
                    <div className="mt-4">
                      <button
                        onClick={() => setShowNoteHistory(!showNoteHistory)}
                        className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
                      >
                        {showNoteHistory ? (
                          <>
                            <ChevronUp className="w-4 h-4" />
                            Hide history
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4" />
                            Show {customer.notes.length - 1} previous notes
                          </>
                        )}
                      </button>

                      {showNoteHistory && (
                        <div className="mt-4 space-y-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                          {customer.notes
                            .filter((note) => !note.is_current)
                            .map((note) => (
                              <div key={note.id} className="text-sm">
                                <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                                  {note.content}
                                </p>
                                <p className="text-gray-400 mt-1">
                                  {new Date(note.created_at).toLocaleDateString()} by{' '}
                                  {note.created_by_name}
                                </p>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No notes yet
                </p>
              )}
            </CardContent>
          </Card>

          {/* Fleet Description */}
          {customer.fleet_description && (
            <Card>
              <CardHeader title="Fleet Description" />
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
                <div className="space-y-4">
                  {activities.slice(0, 10).map((activity) => (
                    <div
                      key={activity.id}
                      className="flex gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${activity.activity_type_color}20` }}
                      >
                        <Calendar
                          className="w-5 h-5"
                          style={{ color: activity.activity_type_color }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {activity.activity_type_name}
                        </p>
                        {activity.notes && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            {activity.notes}
                          </p>
                        )}
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {new Date(activity.activity_datetime).toLocaleString()}
                        </p>
                      </div>
                      {activity.outcome && (
                        <span className="badge badge-info">{activity.outcome}</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No activities logged yet
                </p>
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
                  <p className="text-sm text-gray-500 dark:text-gray-400">Last Call</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {customer.last_call_date || 'Never'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                  <Calendar className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Next Call</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {customer.next_call_date || 'Not scheduled'}
                  </p>
                </div>
              </div>
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
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {reminder.title}
                      </p>
                      <p
                        className={`text-sm ${
                          reminder.is_overdue
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {reminder.reminder_date}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4 text-sm">
                  No pending reminders
                </p>
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
            <Button variant="secondary" onClick={() => setNoteModalOpen(false)}>
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
          placeholder="Enter your note..."
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
  const [activityType, setActivityType] = useState('');
  const [notes, setNotes] = useState('');
  const [outcome, setOutcome] = useState('completed');
  const [createReminder, setCreateReminder] = useState(true);
  const [reminderDays, setReminderDays] = useState('30');

  const createActivityMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => activitiesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-activities', customerId] });
      queryClient.invalidateQueries({ queryKey: ['customer-reminders', customerId] });
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
      onClose();
      // Reset form
      setActivityType('');
      setNotes('');
      setOutcome('completed');
      setCreateReminder(true);
      setReminderDays('30');
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
              className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
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
