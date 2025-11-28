import { Star, Trash2, Play } from 'lucide-react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { templatesAPI, type QueryTemplate } from '../services/api';
import { useAuthStore } from '../store/authStore';

interface QueryTemplatesProps {
  readonly onSelectTemplate: (query: string) => void;
}

const defaultTemplates: Omit<QueryTemplate, 'id' | 'createdAt'>[] = [
  {
    name: 'Recent Users',
    query: 'Show me all users who signed up in the last 30 days',
    category: 'Users',
    isFavorite: true,
  },
  {
    name: 'Revenue by Category',
    query: 'What is the total revenue by product category?',
    category: 'Analytics',
    isFavorite: true,
  },
  {
    name: 'Pending Orders',
    query: 'List all pending orders from the last 7 days',
    category: 'Orders',
    isFavorite: true,
  },
  {
    name: 'Active Customers',
    query: 'How many active customers do we have?',
    category: 'Customers',
    isFavorite: false,
  },
  {
    name: 'Top Products',
    query: 'Show me the top 5 products by sales',
    category: 'Products',
    isFavorite: false,
  },
  {
    name: 'Completed Orders',
    query: 'What are the orders with status completed?',
    category: 'Orders',
    isFavorite: false,
  },
];

export default function QueryTemplates({ onSelectTemplate }: QueryTemplatesProps) {
  const [templates, setTemplates] = useState<QueryTemplate[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, isInitialized } = useAuthStore();

  // Load templates from backend on mount - only when authenticated
  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      loadTemplates();
    } else if (isInitialized && !isAuthenticated) {
      setIsLoading(false);
    }
  }, [isAuthenticated, isInitialized]);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const serverTemplates = await templatesAPI.getAll();
      
      // If no templates exist, create defaults
      if (serverTemplates.length === 0) {
        for (const template of defaultTemplates) {
          await templatesAPI.create(template);
        }
        const newTemplates = await templatesAPI.getAll();
        setTemplates(newTemplates);
      } else {
        setTemplates(serverTemplates);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast.error('Failed to load query templates');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavorite = async (id: string) => {
    const template = templates.find(t => t.id === id);
    if (!template) return;
    
    try {
      await templatesAPI.update(id, { isFavorite: !template.isFavorite });
      setTemplates(templates.map(t => 
        t.id === id ? { ...t, isFavorite: !t.isFavorite } : t
      ));
      toast.success('Template updated');
    } catch (error) {
      toast.error('Failed to update template');
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      await templatesAPI.delete(id);
      setTemplates(templates.filter(t => t.id !== id));
      toast.success('Template deleted');
    } catch (error) {
      toast.error('Failed to delete template');
    }
  };

  const favorites = templates.filter(t => t.isFavorite);
  const displayTemplates = showAll ? templates : favorites;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          Quick Templates
        </h3>
        {templates.length > favorites.length && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            {showAll ? 'Show Favorites' : 'Show All'}
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Loading templates...</p>
        </div>
      ) : displayTemplates.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-4">
          No templates yet. Star some queries to add them here!
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <AnimatePresence>
            {displayTemplates.map((template) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group relative p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-primary-500 dark:hover:border-primary-400 transition-all"
              >
                {template.category && (
                  <span className="text-xs font-medium text-primary-600 dark:text-primary-400 mb-1 block">
                    {template.category}
                  </span>
                )}
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  {template.name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                  {template.query}
                </p>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectTemplate(template.query)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors text-sm font-medium"
                  >
                    <Play className="w-3 h-3" />
                    Use Template
                  </button>
                  <button
                    onClick={() => toggleFavorite(template.id)}
                    className={`p-1.5 rounded-md transition-colors ${
                      template.isFavorite
                        ? 'text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                        : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    title={template.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Star className={`w-4 h-4 ${template.isFavorite ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={() => deleteTemplate(template.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                    title="Delete template"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
