import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/authContext';
import { useTheme } from '@/theme/themeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Check, Lock, ArrowLeft, Eye, EyeOff, Moon, Sun, Briefcase, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Settings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setError('Please fill in all password fields');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (formData.newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('jcf_auth_token');
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to change password');
      }

      setSuccess('Password changed successfully!');
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      setTimeout(() => {
        setSuccess('');
      }, 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen p-6 transition-colors duration-200 bg-background text-foreground">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 hover:underline mb-4 text-primary"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="mt-2 text-muted-foreground">Manage your account settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Settings Sections */}
          <div className="lg:col-span-1">
            <div className="rounded-lg shadow-sm p-4 sticky top-6 space-y-2 bg-card border border-border">
              <button
                onClick={() => setActiveTab('profile')}
                className={cn(
                  "w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  activeTab === 'profile' ? 'bg-muted text-primary' : 'text-foreground'
                )}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={cn(
                  "w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  activeTab === 'security' ? 'bg-muted text-primary' : 'text-foreground'
                )}
              >
                Security
              </button>
              <button
                onClick={() => setActiveTab('appearance')}
                className={cn(
                  "w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  activeTab === 'appearance' ? 'bg-muted text-primary' : 'text-foreground'
                )}
              >
                Appearance
              </button>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Section */}
            <div
              id="profile"
              className={cn(
                "rounded-lg shadow-sm p-8 bg-card border border-border",
                activeTab === 'profile' ? 'block' : 'hidden'
              )}
            >
              <h2 className="text-xl font-bold mb-6">Profile Information</h2>
              
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-muted-foreground">
                    First Name
                  </label>
                  <div className="px-4 py-3 rounded-lg bg-input text-foreground border border-border">
                    {user.firstName}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-muted-foreground">
                    Last Name
                  </label>
                  <div className="px-4 py-3 rounded-lg bg-input text-foreground border border-border">
                    {user.lastName}
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2 text-muted-foreground">
                  Email Address
                </label>
                <div className="px-4 py-3 rounded-lg bg-input text-foreground border border-border">
                  {user.email}
                </div>
              </div>

              <div className="border-t border-border my-6" />

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2 text-muted-foreground">
                    <Briefcase className="w-4 h-4" />
                    Department
                  </label>
                  <div className="px-4 py-3 rounded-lg font-medium capitalize bg-accent/10 text-primary border border-primary">
                    {user.department.replace(/-/g, ' ')}
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2 text-muted-foreground">
                    <Shield className="w-4 h-4" />
                    Role
                  </label>
                  <div className="px-4 py-3 rounded-lg font-medium capitalize bg-accent/10 text-primary border border-primary">
                    {user.role.replace(/-/g, ' ')}
                  </div>
                </div>
              </div>
            </div>

            {/* Security Section */}
            <div
              id="security"
              className={cn(
                "rounded-lg shadow-sm p-8 bg-card border border-border",
                activeTab === 'security' ? 'block' : 'hidden'
              )}
            >
              <div className="flex items-center gap-3 mb-6">
                <Lock className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold text-foreground">Change Password</h2>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-lg flex items-start gap-3 bg-destructive/10 border border-destructive">
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-destructive" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {success && (
                <div className="mb-6 p-4 rounded-lg flex items-start gap-3 bg-green-500/10 border border-green-500">
                  <Check className="w-5 h-5 mt-0.5 flex-shrink-0 text-green-500" />
                  <p className="text-sm text-green-500">{success}</p>
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-5">
                <div>
                  <label htmlFor="current-password" className="block text-sm font-medium mb-2 text-foreground">
                    Current Password
                  </label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showPasswords.current ? 'text' : 'password'}
                      placeholder="Enter your current password"
                      value={formData.currentPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      disabled={isLoading}
                      className="w-full pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('current')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors text-muted-foreground hover:text-foreground"
                    >
                      {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium mb-2 text-foreground">
                    New Password
                  </label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPasswords.new ? 'text' : 'password'}
                      placeholder="Enter your new password (min. 8 characters)"
                      value={formData.newPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                      disabled={isLoading}
                      className="w-full pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('new')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors text-muted-foreground hover:text-foreground"
                    >
                      {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium mb-2 text-foreground">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showPasswords.confirm ? 'text' : 'password'}
                      placeholder="Confirm your new password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      disabled={isLoading}
                      className="w-full pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirm')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors text-muted-foreground hover:text-foreground"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full font-medium py-2.5 rounded-lg transition-all hover:opacity-90 bg-primary text-primary-foreground"
                >
                  {isLoading ? 'Updating...' : 'Update Password'}
                </Button>
              </form>

              <div className="mt-6 rounded-lg p-4 bg-blue-500/10 border border-blue-500 text-blue-500">
                <p className="text-sm">
                  For security reasons, you'll need to re-login after changing your password.
                </p>
              </div>
            </div>

            {/* Appearance Section */}
            <div
              id="appearance"
              className={cn(
                "rounded-lg shadow-sm p-8 bg-card border border-border",
                activeTab === 'appearance' ? 'block' : 'hidden'
              )}
            >
              <h2 className="text-xl font-bold mb-6 text-foreground">Appearance</h2>

              <div>
                <label className="block text-sm font-medium mb-4 text-muted-foreground">
                  Theme
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setTheme('light')}
                    className={cn(
                      "flex items-center gap-3 px-4 py-4 rounded-lg border-2 transition-all",
                      theme === 'light'
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-muted'
                    )}
                  >
                    <Sun className={cn("w-5 h-5", theme === 'light' ? 'text-primary' : 'text-muted-foreground')} />
                    <div className="text-left">
                      <p className={cn("text-sm font-medium", theme === 'light' ? 'text-primary' : 'text-foreground')}>
                        Light
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Bright and clean
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => setTheme('dark')}
                    className={cn(
                      "flex items-center gap-3 px-4 py-4 rounded-lg border-2 transition-all",
                      theme === 'dark'
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-muted'
                    )}
                  >
                    <Moon className={cn("w-5 h-5", theme === 'dark' ? 'text-primary' : 'text-muted-foreground')} />
                    <div className="text-left">
                      <p className={cn("text-sm font-medium", theme === 'dark' ? 'text-primary' : 'text-foreground')}>
                        Dark
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Easy on eyes
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="mt-6 rounded-lg p-4 bg-green-500/10 border border-green-500 text-green-500">
                <p className="text-sm">
                  Your theme preference has been saved automatically.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
