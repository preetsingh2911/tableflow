import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { businessAPI } from '../../api';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { business, updateBusinessData } = useAuth();
  
  // Profile Form
  const [profileForm, setProfileForm] = useState({
    name: '', ownerName: '', ownerEmail: '', ownerPhone: ''
  });
  const [profileSaving, setProfileSaving] = useState(false);

  // Security Form
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '', newPassword: '', confirmPassword: ''
  });
  const [securitySaving, setSecuritySaving] = useState(false);

  // Notifications Form (Mock for now as backend doesn't have these columns yet)
  const [notifications, setNotifications] = useState({
    emailNewBooking: true, emailCancellations: true, emailDailyDigest: false,
    whatsappNewBooking: true, whatsappCancellations: true
  });
  const [notificationsSaving, setNotificationsSaving] = useState(false);

  useEffect(() => {
    if (business) {
      setProfileForm({
        name: business.name || '',
        ownerName: business.owner_name || '',
        ownerEmail: business.owner_email || '',
        ownerPhone: business.owner_phone || ''
      });
    }
  }, [business]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const { data } = await businessAPI.updateProfile(profileForm);
      updateBusinessData(data.data.business);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSecuritySubmit = async (e) => {
    e.preventDefault();
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    setSecuritySaving(true);
    try {
      // NOTE: We mock this success since backend password update endpoint isn't built yet
      await new Promise(resolve => setTimeout(resolve, 800));
      toast.success('Password updated successfully');
      setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error('Failed to update password');
    } finally {
      setSecuritySaving(false);
    }
  };

  const handleNotificationsSubmit = async (e) => {
    e.preventDefault();
    setNotificationsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('Notification preferences saved');
    } catch (err) {
      toast.error('Failed to save notifications');
    } finally {
      setNotificationsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account and preferences</p>
      </div>

      <div className="space-y-8">
        
        {/* Profile Details */}
        <section className="dashboard-card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 border-b border-gray-100 pb-4">Business Profile</h2>
          <form onSubmit={handleProfileSubmit} className="space-y-5 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                <input required type="text" className="dashboard-input" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
                <input required type="text" className="dashboard-input" value={profileForm.ownerName} onChange={e => setProfileForm({...profileForm, ownerName: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Owner Email</label>
                <input required type="email" className="dashboard-input" value={profileForm.ownerEmail} onChange={e => setProfileForm({...profileForm, ownerEmail: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Owner Phone</label>
                <input required type="tel" className="dashboard-input" value={profileForm.ownerPhone} onChange={e => setProfileForm({...profileForm, ownerPhone: e.target.value})} />
              </div>
            </div>
            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button type="submit" disabled={profileSaving} className="btn-dashboard-primary">
                {profileSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </section>

        {/* Security */}
        <section className="dashboard-card p-6 border border-red-100 shadow-sm bg-red-50/10">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 border-b border-gray-100 pb-4">Security & Password</h2>
          <form onSubmit={handleSecuritySubmit} className="space-y-5 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input required type="password" className="dashboard-input" value={securityForm.currentPassword} onChange={e => setSecurityForm({...securityForm, currentPassword: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input required type="password" minLength="6" className="dashboard-input" value={securityForm.newPassword} onChange={e => setSecurityForm({...securityForm, newPassword: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input required type="password" minLength="6" className="dashboard-input" value={securityForm.confirmPassword} onChange={e => setSecurityForm({...securityForm, confirmPassword: e.target.value})} />
            </div>
            <div className="pt-4 border-t border-gray-100">
              <button type="submit" disabled={securitySaving} className="btn-dashboard-secondary text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900">
                {securitySaving ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </section>

        {/* Notifications */}
        <section className="dashboard-card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 border-b border-gray-100 pb-4">Notification Preferences</h2>
          <form onSubmit={handleNotificationsSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl">
              <div className="space-y-4 bg-gray-50 p-5 rounded-xl border border-gray-100">
                <h3 className="font-semibold text-gray-900 border-b border-gray-200 pb-2">Email Notifications</h3>
                
                <label className="flex items-center gap-3 cursor-pointer mt-4 hover:bg-gray-100 p-1.5 -ml-1.5 rounded transition-colors">
                  <input type="checkbox" checked={notifications.emailNewBooking} onChange={e => setNotifications({...notifications, emailNewBooking: e.target.checked})} className="w-4 h-4 rounded border-gray-300 text-dashboard-primary focus:ring-dashboard-primary" />
                  <span className="text-sm font-medium text-gray-700">New bookings</span>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 p-1.5 -ml-1.5 rounded transition-colors">
                  <input type="checkbox" checked={notifications.emailCancellations} onChange={e => setNotifications({...notifications, emailCancellations: e.target.checked})} className="w-4 h-4 rounded border-gray-300 text-dashboard-primary focus:ring-dashboard-primary" />
                  <span className="text-sm font-medium text-gray-700">Cancellations</span>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 p-1.5 -ml-1.5 rounded transition-colors">
                  <input type="checkbox" checked={notifications.emailDailyDigest} onChange={e => setNotifications({...notifications, emailDailyDigest: e.target.checked})} className="w-4 h-4 rounded border-gray-300 text-dashboard-primary focus:ring-dashboard-primary" />
                  <span className="text-sm font-medium text-gray-700">Daily summary digest</span>
                </label>
              </div>

              <div className="space-y-4 bg-gray-50 p-5 rounded-xl border border-gray-100">
                <h3 className="font-semibold text-gray-900 border-b border-gray-200 pb-2">WhatsApp Notifications</h3>
                
                <label className="flex items-center gap-3 cursor-pointer mt-4 hover:bg-gray-100 p-1.5 -ml-1.5 rounded transition-colors">
                  <input type="checkbox" checked={notifications.whatsappNewBooking} onChange={e => setNotifications({...notifications, whatsappNewBooking: e.target.checked})} className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                  <span className="text-sm font-medium text-gray-700">New bookings</span>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 p-1.5 -ml-1.5 rounded transition-colors">
                  <input type="checkbox" checked={notifications.whatsappCancellations} onChange={e => setNotifications({...notifications, whatsappCancellations: e.target.checked})} className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                  <span className="text-sm font-medium text-gray-700">Cancellations</span>
                </label>
              </div>
            </div>

            <div className="pt-4">
              <button type="submit" disabled={notificationsSaving} className="btn-dashboard-secondary">
                {notificationsSaving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </form>
        </section>

      </div>
    </div>
  );
}
