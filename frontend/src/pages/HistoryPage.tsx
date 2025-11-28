import { Navigate } from 'react-router-dom';
import { Trash2, Clock, Download } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useQueryStore } from '../store/queryStore';
import { useState } from 'react';
import EmptyState from '../components/EmptyState';

export default function HistoryPage() {
  const { isAuthenticated } = useAuthStore();
  const { history, clearHistory } = useQueryStore();
  const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all');

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const handleClear = () => {
    // eslint-disable-next-line no-alert
    if (globalThis.confirm('Are you sure you want to clear all history?')) {
      clearHistory();
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(history, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query-history-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredHistory = filter === 'all' 
    ? history 
    : history.filter(item => 
        filter === 'success' ? item.result.success : !item.result.success
      );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Query History
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View your recent database queries ({filteredHistory.length} {filter !== 'all' && `${filter}`} queries)
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter Buttons */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                filter === 'all'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('success')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                filter === 'success'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Success
            </button>
            <button
              onClick={() => setFilter('failed')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                filter === 'failed'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Failed
            </button>
          </div>

          {history.length > 0 && (
            <>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={handleClear}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            </>
          )}
        </div>
      </div>

      {filteredHistory.length === 0 ? (
        <EmptyState 
          type={filter === 'all' ? 'history' : 'search'}
          title={filter === 'all' ? 'No History Yet' : `No ${filter} queries`}
          description={
            filter === 'all' 
              ? 'Your query history will appear here once you start making queries'
              : `No ${filter} queries found. Try a different filter.`
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((item) => (
            <div key={item.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Clock className="w-4 h-4" />
                  {formatTimestamp(item.timestamp)}
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    item.result.success
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}
                >
                  {item.result.success ? 'Success' : 'Needs Clarification'}
                </span>
              </div>

              <div className="mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Question:
                </h3>
                <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                  {item.question}
                </p>
              </div>

              {item.context && (
                <div className="mb-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Context:
                  </h3>
                  <pre className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 rounded-lg p-3 overflow-x-auto">
                    {JSON.stringify(item.context, null, 2)}
                  </pre>
                </div>
              )}

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Answer:
                </h3>
                <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 rounded-lg p-3 whitespace-pre-wrap">
                  {item.result.answer}
                </p>
              </div>

              {item.result.data && item.result.data.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Returned {item.result.data.length} row(s)
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
