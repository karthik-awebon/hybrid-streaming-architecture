import { describe, it, expect, vi } from 'vitest';
import { createSuccessResponse, createErrorResponse } from './api-response';
import { ValidationError } from './errors';
import { NextResponse } from 'next/server';

// Mock NextResponse
vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((body, init) => ({
      body,
      status: init?.status || 200,
      json: async () => body,
    })),
  },
}));

describe('api-response', () => {
  describe('createSuccessResponse', () => {
    it('should create a success response with default status 200', () => {
      const data = { foo: 'bar' };
      createSuccessResponse(data);

      expect(NextResponse.json).toHaveBeenCalledWith({ success: true, data }, { status: 200 });
    });

    it('should create a success response with custom status', () => {
      const data = { foo: 'bar' };
      createSuccessResponse(data, 201);

      expect(NextResponse.json).toHaveBeenCalledWith({ success: true, data }, { status: 201 });
    });
  });

  describe('createErrorResponse', () => {
    it('should handle AppError correctly', () => {
      const error = new ValidationError('Invalid data', { field: 'name' });
      createErrorResponse(error);

      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          success: false,
          error: {
            message: 'Invalid data',
            details: { field: 'name' },
          },
        },
        { status: 400 }
      );
    });

    it('should handle generic Error correctly', () => {
      const error = new Error('Generic error');
      createErrorResponse(error);

      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          success: false,
          error: {
            message: 'Generic error',
          },
        },
        { status: 500 }
      );
    });

    it('should handle unknown error correctly', () => {
      createErrorResponse('Something went wrong');

      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          success: false,
          error: {
            message: 'Internal Server Error',
          },
        },
        { status: 500 }
      );
    });
  });
});
