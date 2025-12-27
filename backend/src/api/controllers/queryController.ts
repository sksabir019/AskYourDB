import { Request, Response, NextFunction } from 'express';
import { generateQueryPlan, summarizeResults, streamSummarizeResults } from '../../services/llm/llmClient';
import { getAdapter } from '../../db/factory';
import { validatePlan } from '../../services/planner/validator';
import { queryRequestSchema, validateRequest } from '../validators/requestValidator';
import { ValidationError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { ERROR_MESSAGES, DEFAULT_TABLES, DEFAULT_COLLECTIONS } from '../../utils/constants';
import { queryCache } from '../../utils/queryCache';

export async function handleQuery(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  
  try {
    // Validate request body
    const validatedData = validateRequest(queryRequestSchema)(req.body);
    const { question } = validatedData;
    
    logger.info(`Processing query: ${question.substring(0, 100)}...`);
    
    // Schema hint - in production, this should come from database introspection or config
    const schemaHint = {
      tables: DEFAULT_TABLES as any,
      collections: DEFAULT_COLLECTIONS as any,
    };

    // Check cache first
    const cached = queryCache.get(question, schemaHint);
    if (cached) {
      logger.info(`Cache hit for query: ${question.substring(0, 100)}`);
      return res.status(200).json({
        ...cached,
        meta: {
          ...cached.meta,
          cached: true,
          cacheAge: Date.now() - cached.cachedAt,
        },
      });
    }
    
    // Generate query plan using LLM
    const plan = await generateQueryPlan(question, schemaHint);
    
    if (!plan) {
      throw new ValidationError(ERROR_MESSAGES.LLM_NO_PLAN);
    }
    
    // Handle ambiguous queries
    if ('ambiguous' in plan && plan.ambiguous) {
      logger.info('Query requires clarification');
      return res.status(200).json({
        success: true,
        clarify: plan.clarify,
        requiresClarification: true,
      });
    }
    
    // Validate and sanitize the plan
    const validatedPlan = validatePlan(plan, schemaHint);
    
    // Execute query
    const db = await getAdapter();
    const result = await db.execute(validatedPlan);
    
    // Generate natural language summary
    const answer = await summarizeResults(question, result.rows || []);
    
    const duration = Date.now() - startTime;
    logger.info(`Query completed in ${duration}ms, returned ${result.rows?.length || 0} rows`);
    
    // Extract SQL query if available from the plan
    const generatedSql = validatedPlan.sql || 
      (validatedPlan.operation === 'rawSql' ? validatedPlan.sql : null);
    
    const response = {
      success: true,
      answer,
      data: result.rows || [],
      meta: {
        plan: validatedPlan,
        rowCount: result.rows?.length || 0,
        executionTime: `${duration}ms`,
        sql: generatedSql,
        query: generatedSql,
        cached: false,
      },
      cachedAt: Date.now(),
    };

    // Cache the response (5 minutes TTL for queries with results)
    if (result.rows && result.rows.length > 0) {
      queryCache.set(question, response, schemaHint, 5 * 60 * 1000);
    }
    
    res.status(200).json(response);
  } catch (error) {
    logger.error('Query handler error:', error);
    return next(error);
  }
}

export async function handleStreamQuery(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  
  try {
    // Validate request body
    const validatedData = validateRequest(queryRequestSchema)(req.body);
    const { question } = validatedData;
    
    logger.info(`Processing streaming query: ${question.substring(0, 100)}...`);
    
    // Schema hint
    const schemaHint = {
      tables: DEFAULT_TABLES as any,
      collections: DEFAULT_COLLECTIONS as any,
    };
    
    // Generate query plan using LLM
    const plan = await generateQueryPlan(question, schemaHint);
    
    if (!plan) {
      throw new ValidationError(ERROR_MESSAGES.LLM_NO_PLAN);
    }
    
    // Handle ambiguous queries
    if ('ambiguous' in plan && plan.ambiguous) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.write(`data: ${JSON.stringify({ type: 'clarify', content: plan.clarify })}\n\n`);
      res.write(`data: [DONE]\n\n`);
      return res.end();
    }
    
    // Validate and sanitize the plan
    const validatedPlan = validatePlan(plan, schemaHint);
    
    // Execute query
    const db = await getAdapter();
    const result = await db.execute(validatedPlan);
    
    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Send metadata first
    const duration = Date.now() - startTime;
    res.write(`data: ${JSON.stringify({ 
      type: 'meta', 
      rowCount: result.rows?.length || 0,
      executionTime: `${duration}ms`
    })}\n\n`);
    
    // Stream the summary
    for await (const chunk of streamSummarizeResults(question, result.rows || [])) {
      res.write(`data: ${JSON.stringify({ type: 'content', content: chunk })}\n\n`);
    }
    
    // Send completion signal with data
    res.write(`data: ${JSON.stringify({ 
      type: 'complete', 
      data: result.rows || [],
      plan: validatedPlan 
    })}\n\n`);
    res.write(`data: [DONE]\n\n`);
    
    logger.info(`Streaming query completed in ${Date.now() - startTime}ms`);
    res.end();
  } catch (error) {
    logger.error('Streaming query handler error:', error);
    
    // Extract error message
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    
    // If headers already sent, send error via SSE
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ 
        type: 'error', 
        message: errorMessage,
        timestamp: new Date().toISOString()
      })}\n\n`);
      res.write(`data: [DONE]\n\n`);
      return res.end();
    }
    
    // If headers not sent, pass to error handler
    return next(error);
  }
}
