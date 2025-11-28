import { Database, Menu, LogOut, Bell, Search, Settings, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useQueryStore } from '../store/queryStore';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SettingsModal from './SettingsModal';

interface HeaderProps {
  readonly onMenuClick: () => void;
  readonly sidebarOpen: boolean;
}

export default function Header({ onMenuClick, sidebarOpen }: HeaderProps) {
  const { user, logout } = useAuthStore();
  const { history } = useQueryStore();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
      if (e.key === 'Escape') {
        setShowSearch(false);
        setShowNotifications(false);
        setShowSettings(false);
      }
    };
    globalThis.addEventListener('keydown', handleKeyPress);
    return () => globalThis.removeEventListener('keydown', handleKeyPress);
  }, []);

  const filteredHistory = history.filter(item =>
    item.question.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5);

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 backdrop-blur-sm bg-white/95 dark:bg-gray-800/95">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left: Logo and Menu Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={onMenuClick}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 group"
              aria-label="Toggle sidebar"
              title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {sidebarOpen ? (
                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400" />
              )}
            </button>
            <button
              onClick={onMenuClick}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg shadow-lg">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 dark:from-primary-400 dark:to-primary-600 bg-clip-text text-transparent">
                  AskYourDB
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Natural Language Database Queries
                </p>
              </div>
            </div>
          </div>

          {/* Center: Search (hidden on mobile) */}
          <div className="hidden lg:flex flex-1 max-w-md mx-8">
            <button
              onClick={() => setShowSearch(true)}
              className="relative w-full text-left"
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <div className="w-full pl-10 pr-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 border-0 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all cursor-pointer">
                <span className="text-gray-500 dark:text-gray-400">Quick search queries...</span>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded">
                  ⌘K
                </span>
              </div>
            </button>
          </div>

          {/* Right: User Info and Actions */}
          <div className="flex items-center gap-2">
            {user && (
              <>
                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowNotifications(!showNotifications);
                      setShowSettings(false);
                    }}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative"
                    aria-label="Notifications"
                    title="Notifications"
                  >
                    <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    {history.length > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                    )}
                  </button>
                  
                  {/* Notifications Dropdown */}
                  {showNotifications && (
                    <>
                      <button 
                        type="button"
                        className="fixed inset-0 z-40 cursor-default bg-transparent"
                        onClick={() => setShowNotifications(false)}
                        aria-label="Close notifications"
                      />
                      <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                          <h3 className="font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
                        </div>
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                          {history.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                              No recent queries
                            </div>
                          ) : (
                            history.slice(0, 5).map((item) => (
                              <button
                                key={item.id}
                                onClick={() => {
                                  navigate('/');
                                  setShowNotifications(false);
                                }}
                                className="w-full p-4 hover:bg-gray-50 dark:hover:bg-gray-700 text-left transition-colors"
                              >
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {item.question}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {new Date(item.timestamp).toLocaleTimeString()}
                                </p>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Settings */}
                <button
                  onClick={() => {
                    setShowSettings(true);
                    setShowNotifications(false);
                  }}
                  className="hidden sm:flex p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Settings"
                  title="Settings"
                >
                  <Settings className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>

                {/* User Info */}
                <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-semibold text-sm">
                    {user.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight">
                      {user.email.split('@')[0]}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {user.role}
                    </p>
                  </div>
                </div>

                {/* Logout */}
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-all duration-200 font-medium text-sm"
                  aria-label="Logout"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden lg:inline">Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          <button 
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-default" 
            onClick={() => setShowSearch(false)}
            aria-label="Close search"
          />
          <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search your query history..."
                  className="w-full pl-11 pr-10 py-3 bg-gray-50 dark:bg-gray-900 border-0 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
                  autoFocus
                />
                <button
                  onClick={() => setShowSearch(false)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {searchQuery === '' ? (
                <div className="p-8 text-center">
                  <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">Start typing to search your queries</p>
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500 dark:text-gray-400">No results found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredHistory.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        navigate('/history');
                        setShowSearch(false);
                      }}
                      className="w-full p-4 hover:bg-gray-50 dark:hover:bg-gray-700 text-left transition-colors"
                    >
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                        {item.question}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className={item.result.success ? 'text-green-500' : 'text-yellow-500'}>
                          {item.result.success ? 'Success' : 'Needs Clarification'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Press <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">ESC</kbd> to close
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </header>
  );
}
