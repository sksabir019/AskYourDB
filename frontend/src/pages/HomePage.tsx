import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useQueryStore } from '../store/queryStore';
import { queryAPI, QueryResponse } from '../services/api';
import QueryInput from '../components/QueryInput';
import ResultsDisplay from '../components/ResultsDisplay';
import QueryTemplates from '../components/QueryTemplates';
import EmptyState from '../components/EmptyState';

export default function HomePage() {
  const { isAuthenticated } = useAuthStore();
  const { currentResult, isLoading, setLoading, setCurrentResult, addToHistory, history } = useQueryStore();
  const [localError, setLocalError] = useState<string | null>(null);
  const [executionTime, setExecutionTime] = useState<number | undefined>();
  const [streamingAnswer, setStreamingAnswer] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Calculate statistics
  const totalQueries = history.length;
  const successfulQueries = history.filter(h => h.result.success).length;
  const successRate = totalQueries > 0 ? Math.round((successfulQueries / totalQueries) * 100) : 0;
  const todayQueries = history.filter(h => {
    const today = new Date().setHours(0, 0, 0, 0);
    return new Date(h.timestamp).setHours(0, 0, 0, 0) === today;
  }).length;

  const handleQuery = async (question: string, context?: Record<string, unknown>) => {
    setLocalError(null);
    setLoading(true);
    setStreamingAnswer('');
    setIsStreaming(true);
    const startTime = Date.now();
    let collectedAnswer = '';

    try {
      let finalData: any[] = [];
      let finalPlan: any = null;
      let rowCount = 0;

      await queryAPI.executeStream(
        { question, context },
        // onChunk - called for each streamed text chunk
        (chunk) => {
          collectedAnswer += chunk;
          setStreamingAnswer(collectedAnswer);
        },
        // onMeta - called when we get metadata
        (meta) => {
          rowCount = meta.rowCount;
          setExecutionTime(Number.parseInt(meta.executionTime, 10));
        },
        // onComplete - called when streaming is done
        (data, plan) => {
          finalData = data;
          finalPlan = plan;
        },
        // onError - called on error
        (error) => {
          setLocalError(error);
          toast.error(error);
        }
      );

      const endTime = Date.now();
      setExecutionTime(endTime - startTime);
      setIsStreaming(false);
      
      // Build the final result using collected answer
      const result: QueryResponse = {
        success: true,
        answer: collectedAnswer,
        data: finalData,
        meta: {
          plan: finalPlan,
          rowCount,
          executionTime: `${endTime - startTime}ms`,
        },
      };
      
      setCurrentResult(result);
      addToHistory({ 
        id: Date.now().toString(),
        question, 
        context, 
        result, 
        timestamp: Date.now() 
      });

      toast.success('Query executed successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to execute query';
      setLocalError(message);
      toast.error(message);
    } finally {
      setLoading(false);
      setIsStreaming(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Ask Your Database
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Query your database using natural language
        </p>
      </div>

      {/* Statistics Cards */}
      {totalQueries > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Queries</p>
                <p className="text-3xl font-bold mt-1">{totalQueries}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-blue-200" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Success Rate</p>
                <p className="text-3xl font-bold mt-1">{successRate}%</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-200" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Today's Queries</p>
                <p className="text-3xl font-bold mt-1">{todayQueries}</p>
              </div>
              <Clock className="w-10 h-10 text-purple-200" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Failed Queries</p>
                <p className="text-3xl font-bold mt-1">{totalQueries - successfulQueries}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-orange-200" />
            </div>
          </div>
        </div>
      )}

      {localError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{localError}</p>
        </div>
      )}

      {/* Query Templates */}
      {!currentResult && history.length === 0 && (
        <QueryTemplates onSelectTemplate={(query) => handleQuery(query)} />
      )}

      <QueryInput onSubmit={handleQuery} isLoading={isLoading} />
      
      {isStreaming && streamingAnswer ? (
        <ResultsDisplay 
          result={null} 
          executionTime={executionTime}
          streamingAnswer={streamingAnswer}
          isStreaming={isStreaming}
        />
      ) : currentResult ? (
        <ResultsDisplay result={currentResult} executionTime={executionTime} />
      ) : history.length === 0 && !isLoading ? (
        <EmptyState 
          type="queries" 
          description="Get started by typing a natural language question about your database above."
        />
      ) : null}
    </div>
  );
}
