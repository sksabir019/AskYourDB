import mongoose, { Schema, Document } from 'mongoose';

export interface IQueryHistory extends Document {
  userId: string;
  question: string;
  success: boolean;
  executionTime: number;
  rowCount: number;
  createdAt: Date;
}

const QueryHistorySchema = new Schema<IQueryHistory>(
  {
    userId: { type: String, required: true, index: true },
    question: { type: String, required: true, maxlength: 2000 },
    success: { type: Boolean, required: true, index: true },
    executionTime: { type: Number, required: true },
    rowCount: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'query_history',
  }
);

// Compound indexes for analytics queries
QueryHistorySchema.index({ userId: 1, createdAt: -1 });
QueryHistorySchema.index({ userId: 1, success: 1 });

// TTL index - automatically delete records older than 90 days
QueryHistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

export const QueryHistory = mongoose.model<IQueryHistory>('QueryHistory', QueryHistorySchema);
