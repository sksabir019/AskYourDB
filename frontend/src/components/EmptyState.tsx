import { Database, FileQuestion, Inbox, SearchX } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  readonly type: 'queries' | 'results' | 'history' | 'search';
  readonly title?: string;
  readonly description?: string;
  readonly action?: {
    label: string;
    onClick: () => void;
  };
}

const emptyStateConfig = {
  queries: {
    icon: Database,
    defaultTitle: 'No queries yet',
    defaultDescription: 'Start by asking a question about your database in natural language.',
    iconClass: 'text-blue-500',
    bgClass: 'bg-blue-50 dark:bg-blue-900/20',
  },
  results: {
    icon: FileQuestion,
    defaultTitle: 'No results to display',
    defaultDescription: 'Execute a query to see results here.',
    iconClass: 'text-purple-500',
    bgClass: 'bg-purple-50 dark:bg-purple-900/20',
  },
  history: {
    icon: Inbox,
    defaultTitle: 'No query history',
    defaultDescription: 'Your past queries will appear here once you start asking questions.',
    iconClass: 'text-gray-500',
    bgClass: 'bg-gray-50 dark:bg-gray-900/20',
  },
  search: {
    icon: SearchX,
    defaultTitle: 'No results found',
    defaultDescription: 'Try adjusting your search terms or filters.',
    iconClass: 'text-orange-500',
    bgClass: 'bg-orange-50 dark:bg-orange-900/20',
  },
};

export default function EmptyState({ type, title, description, action }: EmptyStateProps) {
  const config = emptyStateConfig[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`card text-center py-12 ${config.bgClass}`}
    >
      <div className={`inline-flex p-4 rounded-full ${config.bgClass} mb-4`}>
        <Icon className={`w-12 h-12 ${config.iconClass}`} />
      </div>
      
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {title || config.defaultTitle}
      </h3>
      
      <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
        {description || config.defaultDescription}
      </p>
      
      {action && (
        <button
          onClick={action.onClick}
          className="btn-primary inline-flex items-center gap-2"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
}
