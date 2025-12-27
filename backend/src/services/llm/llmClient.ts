import { OpenAI } from 'openai';
import Groq from 'groq-sdk';
import { safeJsonParse } from '../../utils/safeJsonParse';
import { config } from '../../configs';
import { LLMError } from '../../utils/errors';
import { logger } from '../../utils/logger';

// Type for the unified client interface
type LLMClient = OpenAI | Groq;

// Initialize clients based on provider
let openaiClient: OpenAI | null = null;
let groqClient: Groq | null = null;

// Lazy initialization to provide better error messages
const getOpenAIClient = (): OpenAI => {
  if (!openaiClient) {
    if (!config.llm.openai.apiKey) {
      throw new LLMError('OpenAI API key is not configured. Please set OPENAI_API_KEY in your .env file.');
    }
    openaiClient = new OpenAI({ 
      apiKey: config.llm.openai.apiKey,
      timeout: 30000,
      maxRetries: 2,
    });
  }
  return openaiClient;
};

const getGroqClient = (): Groq => {
  if (!groqClient) {
    if (!config.llm.groq.apiKey) {
      throw new LLMError('Groq API key is not configured. Please set GROQ_API_KEY in your .env file.');
    }
    groqClient = new Groq({
      apiKey: config.llm.groq.apiKey,
    });
  }
  return groqClient;
};

// Determine which client to use - cast to any to handle union type
const getClient = (): LLMClient => {
  return config.llm.provider === 'groq' ? getGroqClient() : getOpenAIClient();
};

const getModel = () => {
  return config.llm.provider === 'groq' ? config.llm.groq.model : config.llm.openai.model;
};

const MONGO_SYSTEM_PROMPT = `You are a query generator for MongoDB that MUST output a valid JSON object following this QueryPlan schema:
{
  "operation": "find" | "aggregate" | "count",
  "collection": "collection_name", // REQUIRED - MongoDB collection name
  "filter": {},  // MongoDB query filter (for find/count)
  "projection": {},  // Fields to return (optional)
  "pipeline": [],  // Aggregation pipeline (for aggregate)
  "limit": number,  // Max results (optional)
  "sort": {}  // Sort order (optional)
}

SCHEMA INFORMATION:
Collections: users, products, orders, customers

users: { name, email, role, status, signupDate (Date), lastLogin (Date), country, plan }
products: { name, category, price (Number), stock (Number), sales (Number), rating (Number), sku }
orders: { orderNumber, customerEmail, customerName, items (Array), total (Number), status, orderDate (Date), shippedAt (Date), deliveredAt (Date) }
customers: { name, email, phone, status, totalOrders (Number), totalSpent (Number), joinDate (Date), lastOrderAt (Date) }

CRITICAL RULES:
1. ALWAYS include "collection" field - this is REQUIRED
2. For date comparisons, use ISO date strings: {"signupDate": {"$gte": "2025-10-29T00:00:00.000Z"}}
3. Calculate dates properly - for "last 30 days", subtract 30 days from current date
4. Use "find" for simple queries, "aggregate" for complex queries with grouping/calculations, "count" for counting
5. For revenue/total calculations, use aggregate with $sum
6. For "top N" queries, use sort with -1 for descending and limit
7. Output ONLY valid JSON, no markdown, no explanations, no extra text`;

const POSTGRES_SYSTEM_PROMPT = `You are a query generator for PostgreSQL that MUST output a valid JSON object following this QueryPlan schema:
{
  "operation": "find" | "aggregate" | "count",
  "table": "table_name", // REQUIRED - PostgreSQL table name
  "filter": {},  // Filter conditions using MongoDB-style operators
  "projection": {},  // Fields to return (optional, use {field: 1} to include)
  "pipeline": [],  // Aggregation pipeline for aggregate operations
  "limit": number,  // Max results (optional)
  "sort": {}  // Sort order (use 1 for ASC, -1 for DESC)
}

SCHEMA INFORMATION:
Tables: users, products, orders, customers

users: { id, name, email, role, status, signup_date (timestamp), last_login (timestamp), country, plan }
products: { id, name, category, price (numeric), stock (integer), sales (integer), rating (numeric), sku }
orders: { id, order_number, customer_email, customer_name, items (jsonb), total (numeric), status, order_date (timestamp), shipped_at (timestamp), delivered_at (timestamp) }
customers: { id, name, email, phone, status, total_orders (integer), total_spent (numeric), join_date (timestamp), last_order_at (timestamp) }

FILTER OPERATORS (use MongoDB-style operators that will be translated to SQL):
- Simple equality: {"status": "active"}
- Greater than: {"price": {"$gt": 100}}
- Greater or equal: {"signup_date": {"$gte": "2025-10-29"}}
- Less than: {"stock": {"$lt": 10}}
- In list: {"status": {"$in": ["pending", "shipped"]}}
- Not equal: {"role": {"$ne": "admin"}}
- Like/Contains: {"name": {"$like": "john"}}

AGGREGATE PIPELINE (for complex queries):
- $match: filter rows
- $group: group by field with aggregations ($sum, $avg, $count, $min, $max)
- $sort: order results
- $limit: limit results

EXAMPLES:
1. Find active users: {"operation": "find", "table": "users", "filter": {"status": "active"}, "limit": 100}
2. Count orders: {"operation": "count", "table": "orders", "filter": {"status": "completed"}}
3. Total revenue: {"operation": "aggregate", "table": "orders", "pipeline": [{"$group": {"_id": null, "total": {"$sum": "$total"}}}]}

CRITICAL RULES:
1. ALWAYS include "table" field - this is REQUIRED
2. For date comparisons, use ISO date strings: "2025-10-29" or "2025-10-29T00:00:00Z"
3. Use "find" for simple queries, "aggregate" for grouping/calculations, "count" for counting
4. Output ONLY valid JSON, no markdown, no explanations, no extra text`;

// Dynamic system prompt based on database engine
const getSystemPrompt = () => {
  return config.database.engine === 'postgres' ? POSTGRES_SYSTEM_PROMPT : MONGO_SYSTEM_PROMPT;
};

const MAX_QUESTION_LENGTH = 500;
const MAX_SAMPLE_ROWS = 3;
const MAX_SAMPLE_LENGTH = 1000;

function buildUserPrompt(nl: string, schemaHint: any) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  return `Question: ${nl}

Available Collections/Tables: ${JSON.stringify(schemaHint || {})}

IMPORTANT: Calculate dates relative to current time. Today is ${new Date().toISOString()}.
For "last 30 days", use: ${thirtyDaysAgo}
For "last 7 days", use: ${sevenDaysAgo}

Example queries:

1. For "users who signed up in last 30 days":
{
  "operation": "find",
  "collection": "users",
  "filter": {"signupDate": {"$gte": "${thirtyDaysAgo}"}},
  "limit": 100
}

2. For "total revenue by product category":
{
  "operation": "aggregate",
  "collection": "orders",
  "pipeline": [
    {"$unwind": "$items"},
    {"$lookup": {"from": "products", "localField": "items.product", "foreignField": "name", "as": "productInfo"}},
    {"$unwind": "$productInfo"},
    {"$group": {"_id": "$productInfo.category", "totalRevenue": {"$sum": {"$multiply": ["$items.price", "$items.quantity"]}}}},
    {"$sort": {"totalRevenue": -1}}
  ]
}

3. For "pending orders from last 7 days":
{
  "operation": "find",
  "collection": "orders",
  "filter": {"status": "pending", "orderDate": {"$gte": "${sevenDaysAgo}"}},
  "limit": 100
}

4. For "how many active customers":
{
  "operation": "count",
  "collection": "customers",
  "filter": {"status": "active"}
}

5. For "top 5 products by sales":
{
  "operation": "find",
  "collection": "products",
  "sort": {"sales": -1},
  "limit": 5
}

6. For "completed orders":
{
  "operation": "find",
  "collection": "orders",
  "filter": {"status": "completed"},
  "limit": 100
}

Now generate the query plan for the question above. Output ONLY the JSON, nothing else.`;
}

function handleLlmError(error: unknown, providerRaw: string): never {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  const errorName = error instanceof Error ? error.name : 'Error';
  const provider = providerRaw.toUpperCase();
  
  // Log the full error for debugging
  logger.error(`LLM error (${provider}):`, {
    name: errorName,
    message: errorMessage,
    stack: error instanceof Error ? error.stack : undefined
  });

  // Check for specific error types
  if (errorMessage.includes('API key') || errorMessage.includes('Unauthorized') || errorMessage.includes('401')) {
    throw new LLMError(`Invalid or missing ${provider} API key. Please check your ${provider}_API_KEY in .env file`);
  }
  if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
    throw new LLMError(`${provider} API rate limit exceeded. Please try again in a few moments`);
  }
  if (errorMessage.includes('quota') || errorMessage.includes('insufficient_quota')) {
    throw new LLMError(`${provider} API quota exceeded. Please check your account billing at ${provider === 'OPENAI' ? 'https://platform.openai.com/usage' : 'https://console.groq.com'}`);
  }
  if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
    throw new LLMError(`${provider} API request timed out. Please try again`);
  }
  if (errorMessage.includes('network') || errorMessage.includes('ECONNREFUSED')) {
    throw new LLMError(`Unable to connect to ${provider} API. Please check your internet connection`);
  }

  throw new LLMError(`Failed to generate query plan: ${errorMessage}`);
}

export async function generateQueryPlan(nl: string, schemaHint: any): Promise<any> {
  try {
    if (!nl || nl.length === 0) {
      throw new LLMError('Question cannot be empty');
    }

    if (nl.length > MAX_QUESTION_LENGTH) {
      throw new LLMError(`Question exceeds maximum length of ${MAX_QUESTION_LENGTH} characters`);
    }

    const provider = config.llm.provider;
    logger.info(`Using LLM provider: ${provider}`);

    const client = getClient();
    const model = getModel();
    const systemPrompt = getSystemPrompt();
    const userPrompt = buildUserPrompt(nl, schemaHint);

    const response = await (client as any).chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0,
      max_tokens: 500,
    });

    const text = response.choices?.[0]?.message?.content || '';
    const parsed = safeJsonParse(text);

    if (!parsed) {
      logger.error('LLM returned invalid JSON:', text);
      throw new LLMError('Failed to parse LLM response');
    }

    return parsed;
  } catch (error) {
    if (error instanceof LLMError) throw error;
    return handleLlmError(error, config.llm.provider);
  }
}

export async function summarizeResults(question: string, rows: any[]): Promise<string> {
  try {
    if (!rows || rows.length === 0) {
      return `I couldn't find any data matching your query. Try rephrasing your question or checking if the data exists.`;
    }
    
    // Include more data for better summaries
    const sampleSize = Math.min(rows.length, 10);
    const sample = rows
      .slice(0, sampleSize)
      .map(r => JSON.stringify(r))
      .join('\n')
      .slice(0, 2000);
    
    const prompt = `You are a friendly data assistant. Answer the user's question directly based on the query results.

Question: "${question}"

Data (${rows.length} total results):
${sample}

RULES:
1. Answer the question DIRECTLY - don't say "based on the data" or "the query shows"
2. If it's a count question, just give the number: "You have 96 active customers."
3. If it's a list, show the items clearly with bullet points
4. Format currency as $X,XXX.XX
5. Format large numbers with commas (1,234)
6. Keep it concise - 2-3 sentences max for simple questions
7. For aggregations, show each category clearly
8. Be conversational and helpful

Example good responses:
- "You have 96 active customers."
- "Here are your top 5 products by sales:\n• Keyboard Wireless: 1,525 units\n• 4K Monitor: 1,524 units"
- "Total revenue by category:\n• Electronics: $373,185\n• Furniture: $110,446\n• Stationery: $8,974"

Now answer the question:`;
    
    const client = getClient();
    const model = getModel();
    
    const resp = await (client as any).chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 400,
    });
    
    return resp.choices?.[0]?.message?.content || `Found ${rows.length} results.`;
  } catch (error) {
    logger.warn('LLM summarization failed, using fallback:', error);
    return generateFallbackSummary(question, rows);
  }
}

// Fallback summary when LLM fails
function generateFallbackSummary(question: string, rows: any[]): string {
  const count = rows.length;
  const questionLower = question.toLowerCase();
  
  // Count questions
  if (questionLower.includes('how many') || questionLower.includes('count')) {
    return `There are ${count.toLocaleString()} results.`;
  }
  
  // Revenue/total questions
  if (questionLower.includes('revenue') || questionLower.includes('total')) {
    if (rows[0]?._id && rows[0]?.totalRevenue) {
      const formatted = rows.map(r => 
        `• ${r._id}: $${r.totalRevenue.toLocaleString()}`
      ).join('\n');
      return `Revenue breakdown:\n${formatted}`;
    }
  }
  
  // Top N questions
  if (questionLower.includes('top')) {
    const items = rows.slice(0, 5).map((r, i) => 
      `${i + 1}. ${r.name || r._id || JSON.stringify(r)}`
    ).join('\n');
    return `Top results:\n${items}`;
  }
  
  return `Found ${count.toLocaleString()} results.`;
}

export async function* streamSummarizeResults(question: string, rows: any[]): AsyncGenerator<string> {
  try {
    if (!rows || rows.length === 0) {
      yield `No results found for your query: "${question}"`;
      return;
    }
    
    const sample = rows
      .slice(0, MAX_SAMPLE_ROWS)
      .map(r => JSON.stringify(r))
      .join('\n')
      .slice(0, MAX_SAMPLE_LENGTH);
    
    const prompt = `You are a helpful data analyst assistant. Based on the database query results below, provide a clear, well-formatted answer to the user's question.

User Question: "${question}"

Query returned ${rows.length} result(s). Here is a sample of the data:
${sample}

Instructions:
- Provide a direct, conversational answer
- Use bullet points or numbered lists when showing multiple items
- Format numbers nicely (currency with $, large numbers with commas)
- If showing a list, limit to top 10 items
- Be concise but informative
- Don't mention "rows" or "database" - speak naturally as if explaining to a business user`;
    
    const client = getClient();
    const model = getModel();
    
    const stream = await (client as any).chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 500,
      stream: true,
    });
    
    for await (const chunk of stream) {
      const content = chunk.choices?.[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  } catch (error) {
    logger.warn('LLM streaming summarization failed, using fallback:', error);
    // Use the same fallback logic as non-streaming
    const fallback = generateFallbackSummary(question, rows);
    yield fallback;
  }
}
