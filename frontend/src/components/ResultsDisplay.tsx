import { CheckCircle, AlertCircle, Database, Code, Clock, Copy, Check, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import toast from 'react-hot-toast';
import type { QueryResponse } from '../services/api';
import DataTable from './DataTable';

interface ResultsDisplayProps {
  readonly result: QueryResponse | null;
  readonly executionTime?: number;
  readonly streamingAnswer?: string;
  readonly isStreaming?: boolean;
}

// Simple markdown-like formatter for the answer
function formatAnswer(text: string): JSX.Element {
  const lines = text.split('\n');
  const elements: JSX.Element[] = [];
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    // Bullet points
    if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      elements.push(
        <li key={index} className="ml-4 text-gray-700 dark:text-gray-300">
          {trimmed.substring(2)}
        </li>
      );
    }
    // Numbered lists
    else if (/^\d+\.\s/.test(trimmed)) {
      const content = trimmed.replace(/^\d+\.\s/, '');
      elements.push(
        <li key={index} className="ml-4 text-gray-700 dark:text-gray-300 list-decimal">
          {content}
        </li>
      );
    }
    // Headers (bold text with colon)
    else if (trimmed.endsWith(':') && trimmed.length < 50) {
      elements.push(
        <p key={index} className="font-semibold text-gray-900 dark:text-white mt-3 mb-1">
          {trimmed}
        </p>
      );
    }
    // Regular paragraphs
    else if (trimmed) {
      elements.push(
        <p key={index} className="text-gray-700 dark:text-gray-300 mb-2">
          {trimmed}
        </p>
      );
    }
  });
  
  return <div className="space-y-1">{elements}</div>;
}

export default function ResultsDisplay({ result, executionTime, streamingAnswer, isStreaming }: ResultsDisplayProps) {
  const [copiedSql, setCopiedSql] = useState(false);

  // Show streaming content if available
  if (isStreaming && streamingAnswer) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="card border-l-4 border-blue-500"
      >
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-blue-500 animate-pulse" />
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
            Analyzing your data...
          </h3>
        </div>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {formatAnswer(streamingAnswer)}
          <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-1" />
        </div>
      </motion.div>
    );
  }

  if (!result) return null;

  const { success, answer, data, meta, clarify, requiresClarification } = result;
  const sqlQuery = meta?.sql || meta?.query;

  const copySql = () => {
    if (sqlQuery) {
      navigator.clipboard.writeText(sqlQuery);
      setCopiedSql(true);
      toast.success('SQL query copied to clipboard');
      setTimeout(() => setCopiedSql(false), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Status Banner */}
      <div
        className={`card flex items-start gap-3 ${
          success
            ? 'border-l-4 border-green-500'
            : 'border-l-4 border-yellow-500'
        }`}
      >
        {success ? (
          <CheckCircle className="w-6 h-6 text-green-500 mt-1 shrink-0" />
        ) : (
          <AlertCircle className="w-6 h-6 text-yellow-500 mt-1 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
              {success ? 'Query Executed Successfully' : 'Clarification Needed'}
            </h3>
            <div className="flex items-center gap-2">
              {executionTime !== undefined && (
                <span className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                  <Clock className="w-3 h-3" />
                  {executionTime < 1000 ? `${executionTime}ms` : `${(executionTime / 1000).toFixed(2)}s`}
                </span>
              )}
              {sqlQuery && (
                <button
                  onClick={copySql}
                  className="flex items-center gap-1 text-xs px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
                  title="Copy SQL query"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-3 h-3" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy SQL
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {formatAnswer(answer)}
          </p>
        </div>
      </div>

      {/* Clarification Message */}
      {requiresClarification && clarify && (
        <div className="card bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                Please Clarify
              </h4>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                {clarify}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Data Results */}
      {data && data.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
              Query Results
            </h3>
            <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">
              {data.length} {data.length === 1 ? 'row' : 'rows'}
            </span>
          </div>
          <DataTable data={data} />
        </div>
      )}

      {/* Metadata */}
      {meta && Object.keys(meta).length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Code className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {sqlQuery ? 'Generated SQL Query' : 'Query Metadata'}
            </h3>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-gray-700 dark:text-gray-300 font-mono">
              {sqlQuery || JSON.stringify(meta, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </motion.div>
  );
}
