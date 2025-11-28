import mongoose, { Schema, Document } from 'mongoose';

export interface IApiKey extends Document {
  userId: string;
  name: string;
  key: string;
  lastUsed?: Date;
  createdAt: Date;
}

const ApiKeySchema = new Schema<IApiKey>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    key: { type: String, required: true, unique: true, index: true },
    lastUsed: { type: Date },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'api_keys',
  }
);

// Secure the key field - mask it in JSON responses
ApiKeySchema.set('toJSON', {
  transform: (_doc, ret) => {
    // Don't return the full key in JSON responses
    if (ret.key) {
      ret.maskedKey = `${ret.key.substring(0, 12)}...${ret.key.substring(ret.key.length - 4)}`;
      ret.key = ret.maskedKey;
    }
    return ret;
  },
});

export const ApiKey = mongoose.model<IApiKey>('ApiKey', ApiKeySchema);
