import { useState, useEffect } from 'react';
import { Send, Loader2, Sparkles, Zap } from 'lucide-react';

interface QueryInputProps {
  readonly onSubmit: (question: string, context?: Record<string, unknown>) => Promise<void>;
  readonly isLoading: boolean;
}

const exampleQueries = [
  'Show me all users who signed up in the last 30 days',
  'What is the total revenue by product category?',
  'List all pending orders from the last 7 days',
  'How many active customers do we have?',
  'Show me the top 5 products by sales',
  'What are the orders with status completed?',
];

export default function QueryInput({ onSubmit, isLoading }: QueryInputProps) {
  const [question, setQuestion] = useState('');
  const [context, setContext] = useState('');
  const [showExamples, setShowExamples] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('question')?.focus();
      }
    };
    globalThis.addEventListener('keydown', handleKeyPress);
    return () => globalThis.removeEventListener('keydown', handleKeyPress);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;

    let parsedContext: Record<string, unknown> | undefined;
    if (context.trim()) {
      try {
        parsedContext = JSON.parse(context);
      } catch (err) {
        // JSON parse error - show user feedback
        // eslint-disable-next-line no-alert, no-console
        console.error('JSON parse error:', err);
        // eslint-disable-next-line no-alert
        alert('Invalid JSON in context field');
        return;
      }
    }

    await onSubmit(question, parsedContext);
    setQuestion('');
    setContext('');
  };

  return (
    <form onSubmit={handleSubmit} className="card relative">
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="question" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Sparkles className="w-4 h-4 text-primary-500" />
              Ask Your Question
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowExamples(!showExamples)}
                className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
              >
                <Zap className="w-3 h-3" />
                {showExamples ? 'Hide' : 'Show'} Examples
              </button>
              <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                ⌘K
              </span>
            </div>
          </div>
          <textarea
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g., Show me all users who signed up last month"
            className="input-field min-h-24 resize-y focus:ring-2 focus:ring-primary-500"
            disabled={isLoading}
            required
          />
          {showExamples && (
            <div className="mt-3 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
              <p className="text-xs font-medium text-primary-900 dark:text-primary-100 mb-2">Example Queries:</p>
              <div className="space-y-1.5">
                {exampleQueries.map((example, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setQuestion(example)}
                    className="w-full text-left text-sm text-primary-700 dark:text-primary-300 hover:text-primary-900 dark:hover:text-primary-100 hover:bg-primary-100 dark:hover:bg-primary-900/30 px-3 py-2 rounded transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="context" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Additional Context (Optional JSON)
          </label>
          <textarea
            id="context"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder='{"database": "users", "limit": 10}'
            className="input-field min-h-20 resize-y font-mono text-sm"
            disabled={isLoading}
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {question.length} characters
          </p>
        </div>

        <button
          type="submit"
          disabled={!question.trim() || isLoading}
          className="btn-primary w-full flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Submit Query
              <span className="text-xs opacity-75 ml-2">↵</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
