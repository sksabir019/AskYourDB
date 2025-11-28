import { Request, Response, NextFunction } from 'express';
import { handleQuery } from '../queryController';
import * as llmClient from '../../../services/llm/llmClient';
import * as dbFactory from '../../../db/factory';

jest.mock('../../../services/llm/llmClient');
jest.mock('../../../db/factory');

describe('QueryController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {
        question: 'How many users are there?',
      },
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleQuery', () => {
    it('should successfully process a valid query', async () => {
      const mockPlan = {
        operation: 'find',
        collection: 'users',
        filter: {},
        limit: 100,
      };

      const mockResult = {
        rows: [
          { id: 1, name: 'User 1' },
          { id: 2, name: 'User 2' },
        ],
      };

      const mockAnswer = 'There are 2 users in the database.';

      (llmClient.generateQueryPlan as jest.Mock).mockResolvedValue(mockPlan);
      (dbFactory.getAdapter as jest.Mock).mockResolvedValue({
        execute: jest.fn().mockResolvedValue(mockResult),
      });
      (llmClient.summarizeResults as jest.Mock).mockResolvedValue(mockAnswer);

      await handleQuery(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          answer: mockAnswer,
          data: mockResult.rows,
          meta: expect.objectContaining({
            rowCount: 2,
          }),
        })
      );
    });

    it('should handle ambiguous queries', async () => {
      const mockPlan = {
        ambiguous: true,
        clarify: 'Did you mean the users table or customers table?',
      };

      (llmClient.generateQueryPlan as jest.Mock).mockResolvedValue(mockPlan);

      await handleQuery(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        clarify: mockPlan.clarify,
        requiresClarification: true,
      });
    });

    it('should handle validation errors', async () => {
      mockRequest.body = { question: '' };

      await handleQuery(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle LLM errors', async () => {
      (llmClient.generateQueryPlan as jest.Mock).mockRejectedValue(
        new Error('LLM API error')
      );

      await handleQuery(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle database errors', async () => {
      const mockPlan = {
        operation: 'find',
        collection: 'users',
      };

      (llmClient.generateQueryPlan as jest.Mock).mockResolvedValue(mockPlan);
      (dbFactory.getAdapter as jest.Mock).mockResolvedValue({
        execute: jest.fn().mockRejectedValue(new Error('Database connection failed')),
      });

      await handleQuery(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
