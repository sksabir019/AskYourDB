import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { QueryResponse } from '../services/api';

export interface QueryHistoryItem {
  id: string;
  question: string;
  context?: Record<string, unknown>;
  result: QueryResponse;
  timestamp: number;
}

interface QueryState {
  history: QueryHistoryItem[];
  isLoading: boolean;
  currentResult: QueryResponse | null;
  addToHistory: (item: QueryHistoryItem) => void;
  clearHistory: () => void;
  setLoading: (loading: boolean) => void;
  setCurrentResult: (result: QueryResponse | null) => void;
}

export const useQueryStore = create<QueryState>()(
  persist(
    (set) => ({
      history: [],
      isLoading: false,
      currentResult: null,
      addToHistory: (item) =>
        set((state) => ({
          history: [item, ...state.history.slice(0, 49)],
        })),
      clearHistory: () => set({ history: [] }),
      setLoading: (loading) => set({ isLoading: loading }),
      setCurrentResult: (result) => set({ currentResult: result }),
    }),
    {
      name: 'query-storage',
    }
  )
);
