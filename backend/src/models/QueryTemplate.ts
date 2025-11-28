import mongoose, { Schema, Document } from 'mongoose';

export interface IQueryTemplate extends Document {
  userId: string;
  name: string;
  query: string;
  category?: string;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const QueryTemplateSchema = new Schema<IQueryTemplate>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    query: { type: String, required: true, maxlength: 2000 },
    category: { type: String, trim: true, maxlength: 100 },
    isFavorite: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
    collection: 'query_templates',
  }
);

// Compound index for efficient queries
QueryTemplateSchema.index({ userId: 1, isFavorite: 1 });
QueryTemplateSchema.index({ userId: 1, category: 1 });

export const QueryTemplate = mongoose.model<IQueryTemplate>('QueryTemplate', QueryTemplateSchema);
