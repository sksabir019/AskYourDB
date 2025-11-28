import { Link, useLocation } from 'react-router-dom';
import { Home, History, X, Bookmark, TrendingUp, FileText, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

const menuItems = [
  { path: '/', label: 'Query', icon: Home, badge: null },
  { path: '/history', label: 'History', icon: History, badge: null },
  { path: '/favorites', label: 'Favorites', icon: Bookmark, badge: 'Soon', disabled: true },
  { path: '/analytics', label: 'Analytics', icon: TrendingUp, badge: 'Soon', disabled: true },
];

const resourceItems = [
  { path: '/docs', label: 'Documentation', icon: FileText, disabled: true },
  { path: '/help', label: 'Help & Support', icon: HelpCircle, disabled: true },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();

  const SidebarContent = () => (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="p-4 flex justify-between items-center md:hidden border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Menu</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {/* Main Navigation */}
        <div className="space-y-1">
          <p className="px-4 py-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Main
          </p>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const isDisabled = item.disabled;

            return (
              <Link
                key={item.path}
                to={isDisabled ? '#' : item.path}
                onClick={(e) => {
                  if (isDisabled) {
                    e.preventDefault();
                    return;
                  }
                  onClose();
                }}
                className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                  isDisabled
                    ? 'opacity-50 cursor-not-allowed'
                    : isActive
                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-500/30'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${
                    isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400'
                  }`} />
                  <span className="font-medium">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Resources */}
        <div className="mt-6 space-y-1">
          <p className="px-4 py-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Resources
          </p>
          {resourceItems.map((item) => {
            const Icon = item.icon;
            const isDisabled = item.disabled;

            return (
              <Link
                key={item.path}
                to={isDisabled ? '#' : item.path}
                onClick={(e) => {
                  if (isDisabled) e.preventDefault();
                  else onClose();
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                  isDisabled
                    ? 'opacity-50 cursor-not-allowed text-gray-500 dark:text-gray-500'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div>
            <p className="font-semibold text-gray-700 dark:text-gray-300">Version 1.0.0</p>
            <p className="mt-1">Powered by OpenAI</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="Connected"></div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-64 z-50 md:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex shrink-0 transition-all duration-300 ${
        isOpen ? 'w-64' : 'w-0 overflow-hidden'
      }`}>
        <div className="w-64 h-full">
          <SidebarContent />
        </div>
      </aside>
    </>
  );
}
