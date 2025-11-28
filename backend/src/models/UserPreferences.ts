import mongoose, { Schema, Document } from 'mongoose';

export interface IUserPreferences extends Document {
  userId: string;
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'es' | 'fr' | 'de';
  queriesPerPage: number;
  autoSave: boolean;
  notifications: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserPreferencesSchema = new Schema<IUserPreferences>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    language: { type: String, enum: ['en', 'es', 'fr', 'de'], default: 'en' },
    queriesPerPage: { type: Number, default: 10, min: 5, max: 100 },
    autoSave: { type: Boolean, default: true },
    notifications: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    collection: 'user_preferences',
  }
);

export const UserPreferences = mongoose.model<IUserPreferences>('UserPreferences', UserPreferencesSchema);
