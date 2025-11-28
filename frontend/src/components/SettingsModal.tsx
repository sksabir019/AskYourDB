import { X, User, Palette, Key, Globe, Moon, Sun, Monitor } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuthStore } from '../store/authStore';
import { preferencesAPI, apiKeysAPI, type ApiKey } from '../services/api';
import toast from 'react-hot-toast';

interface SettingsModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

type Theme = 'light' | 'dark' | 'system';
type Language = 'en' | 'es' | 'fr' | 'de';

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'api' | 'theme'>('profile');
  const [isLoading, setIsLoading] = useState(false);
  
  // Profile settings
  const [displayName, setDisplayName] = useState(user?.email.split('@')[0] || '');
  const [email, setEmail] = useState(user?.email || '');
  const [notifications, setNotifications] = useState(true);
  
  // Theme settings
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme') as Theme;
    return saved || 'system';
  });
  
  // Preferences
  const [language, setLanguage] = useState<Language>('en');
  const [queriesPerPage, setQueriesPerPage] = useState(10);
  const [autoSave, setAutoSave] = useState(true);
  
  // API Keys
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');

  useEffect(() => {
    if (theme === 'dark' || (theme === 'system' && globalThis.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Load preferences and API keys when modal opens
  useEffect(() => {
    if (isOpen) {
      loadPreferences();
      loadApiKeys();
    }
  }, [isOpen]);

  const loadPreferences = async () => {
    try {
      const prefs = await preferencesAPI.get();
      setTheme(prefs.theme);
      setLanguage(prefs.language);
      setQueriesPerPage(prefs.queriesPerPage);
      setAutoSave(prefs.autoSave);
      setNotifications(prefs.notifications);
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  };

  const loadApiKeys = async () => {
    try {
      const keys = await apiKeysAPI.getAll();
      setApiKeys(keys);
    } catch (error) {
      console.error('Failed to load API keys:', error);
    }
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      await preferencesAPI.update({ notifications });
      toast.success('Profile settings saved successfully!');
      onClose();
    } catch (error) {
      toast.error('Failed to save profile settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    setIsLoading(true);
    try {
      await preferencesAPI.update({ language, queriesPerPage, autoSave });
      toast.success('Preferences saved successfully!');
    } catch (error) {
      toast.error('Failed to save preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateApiKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a name for the API key');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await apiKeysAPI.generate(newKeyName);
      setApiKeys([...apiKeys, response.data]);
      setNewKeyName('');
      toast.success('API key generated successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to generate API key');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    setIsLoading(true);
    try {
      await apiKeysAPI.delete(id);
      setApiKeys(apiKeys.filter(k => k.id !== id));
      toast.success('API key deleted');
    } catch (error) {
      toast.error('Failed to delete API key');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success('API key copied to clipboard');
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 overflow-y-auto">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onClose()}
        aria-label="Close settings"
      />
      
      <div className="relative w-full max-w-4xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[90vh] flex flex-col my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 min-w-[16rem] border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto bg-gray-50 dark:bg-gray-900/50">
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'profile'
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <User className="w-5 h-5" />
                <span className="font-medium">Profile</span>
              </button>
              
              <button
                onClick={() => setActiveTab('preferences')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'preferences'
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Globe className="w-5 h-5" />
                <span className="font-medium">Preferences</span>
              </button>
              
              <button
                onClick={() => setActiveTab('api')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'api'
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Key className="w-5 h-5" />
                <span className="font-medium">API Keys</span>
              </button>
              
              <button
                onClick={() => setActiveTab('theme')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'theme'
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Palette className="w-5 h-5" />
                <span className="font-medium">Theme</span>
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto min-w-0">
            {/* Profile Settings */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profile Settings</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Manage your account information</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="input-field"
                    placeholder="Your display name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Role
                  </label>
                  <input
                    type="text"
                    value={user?.role || 'user'}
                    disabled
                    className="input-field opacity-60 cursor-not-allowed"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Email Notifications</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Receive notifications about query results</p>
                  </div>
                  <button
                    onClick={() => setNotifications(!notifications)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      notifications ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        notifications ? 'translate-x-6' : ''
                      }`}
                    />
                  </button>
                </div>

                <div className="pt-4">
                  <button onClick={handleSaveProfile} className="btn-primary" disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {/* Preferences */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Preferences</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Customize your experience</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as Language)}
                    className="input-field"
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Queries per page
                  </label>
                  <select
                    value={queriesPerPage}
                    onChange={(e) => setQueriesPerPage(Number(e.target.value))}
                    className="input-field"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Auto-save queries</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Automatically save query history</p>
                  </div>
                  <button
                    onClick={() => setAutoSave(!autoSave)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      autoSave ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        autoSave ? 'translate-x-6' : ''
                      }`}
                    />
                  </button>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleSavePreferences}
                    className="btn-primary"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Saving...' : 'Save Preferences'}
                  </button>
                </div>
              </div>
            )}

            {/* API Keys */}
            {activeTab === 'api' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">API Keys</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Manage your API keys for integrations</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="input-field flex-1"
                    placeholder="API key name (e.g., Production)"
                  />
                  <button onClick={handleGenerateApiKey} className="btn-primary whitespace-nowrap px-6">
                    Generate Key
                  </button>
                </div>

                {apiKeys.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <Key className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400 font-medium">No API keys yet</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Generate your first API key to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {apiKeys.map((apiKey) => (
                      <div
                        key={apiKey.id}
                        className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white truncate">{apiKey.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              Created {new Date(apiKey.createdAt).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteApiKey(apiKey.id)}
                            className="ml-3 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 px-3 py-2.5 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 text-xs font-mono text-gray-700 dark:text-gray-300 overflow-x-auto whitespace-nowrap">
                            {apiKey.key}
                          </code>
                          <button
                            onClick={() => handleCopyKey(apiKey.key)}
                            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded transition-colors text-sm font-medium whitespace-nowrap"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Theme Settings */}
            {activeTab === 'theme' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Appearance</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Customize how AskYourDB looks</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Theme Mode
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setTheme('light')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        theme === 'light'
                          ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <Sun className={`w-8 h-8 mx-auto mb-2 ${theme === 'light' ? 'text-primary-600' : 'text-gray-400'}`} />
                      <p className={`text-sm font-medium ${theme === 'light' ? 'text-primary-700 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}`}>
                        Light
                      </p>
                    </button>

                    <button
                      onClick={() => setTheme('dark')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        theme === 'dark'
                          ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <Moon className={`w-8 h-8 mx-auto mb-2 ${theme === 'dark' ? 'text-primary-600' : 'text-gray-400'}`} />
                      <p className={`text-sm font-medium ${theme === 'dark' ? 'text-primary-700 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}`}>
                        Dark
                      </p>
                    </button>

                    <button
                      onClick={() => setTheme('system')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        theme === 'system'
                          ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <Monitor className={`w-8 h-8 mx-auto mb-2 ${theme === 'system' ? 'text-primary-600' : 'text-gray-400'}`} />
                      <p className={`text-sm font-medium ${theme === 'system' ? 'text-primary-700 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}`}>
                        System
                      </p>
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Current theme:</strong> {theme === 'system' ? 'System preference' : theme.charAt(0).toUpperCase() + theme.slice(1)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
