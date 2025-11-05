import { vi } from "vitest";
import type { SupabaseClient } from "@/db/supabase.client";

type SupabaseResponse<T> = { data: T; error: null } | { data: null; error: { message: string; code?: string } };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type QueryResponse = SupabaseResponse<any> | Promise<SupabaseResponse<any>>;

/**
 * Helper to create a successful Supabase response
 */
export function createSuccessResponse<T>(data: T): { data: T; error: null } {
  return {
    data,
    error: null,
  };
}

/**
 * Helper to create an error Supabase response
 */
export function createErrorResponse(error: { message: string; code?: string }): {
  data: null;
  error: { message: string; code?: string };
} {
  return {
    data: null,
    error,
  };
}

/**
 * Creates a chainable mock for Supabase queries
 * All chain methods return 'this' except the terminal methods (single, order, eq as terminal, etc.)
 */
function createChainableMock(terminalResponse: QueryResponse, eqAsTerminal = false, orderReturnsChain = false) {
  // For update().eq().eq() pattern, first eq() returns this, second eq() returns response
  const eqMock = eqAsTerminal
    ? vi
        .fn()
        .mockReturnValueOnce({ eq: vi.fn().mockReturnValue(Promise.resolve(terminalResponse)) })
        .mockReturnValue(Promise.resolve(terminalResponse))
    : vi.fn().mockReturnThis();

  // Create a simple chain for order().not() pattern - just has not() as terminal
  const createOrderChain = (response: QueryResponse) => {
    return {
      not: vi.fn().mockReturnValue(Promise.resolve(response)),
      // Make the chain itself awaitable
      then: (onResolve?: (value: any) => any, onReject?: (reason: any) => any) => {
        const promise = Promise.resolve(response);
        return promise.then(onResolve, onReject);
      },
    };
  };

  // Create a chainable object that can be awaited
  const createAwaitableChain = (response: QueryResponse) => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: eqMock,
      is: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnValue(Promise.resolve(response)),
      order: orderReturnsChain
        ? vi.fn().mockReturnValue(createOrderChain(response))
        : vi.fn().mockReturnValue(Promise.resolve(response)),
      single: vi.fn().mockReturnValue(Promise.resolve(response)),
      // Make the chain itself awaitable
      then: (onResolve?: (value: any) => any, onReject?: (reason: any) => any) => {
        const promise = Promise.resolve(response);
        return promise.then(onResolve, onReject);
      },
    };
    return chain;
  };

  return createAwaitableChain(terminalResponse);
}

interface QueryConfig {
  response: QueryResponse;
  eqAsTerminal?: boolean; // For update().eq().eq() pattern where last eq() returns response
  orderReturnsChain?: boolean; // For order().not() pattern where order() returns chainable object
}

/**
 * Creates a mock Supabase client for testing
 * Use mockQuery() to configure responses for each query
 */
export function createMockSupabaseClient(): SupabaseClient {
  const configs: QueryConfig[] = [];
  let callIndex = 0;

  const fromMock = vi.fn(() => {
    const config = configs[callIndex] ?? { response: createSuccessResponse(null) };
    callIndex++;
    return createChainableMock(config.response, config.eqAsTerminal, config.orderReturnsChain);
  });

  const mock = {
    from: fromMock,
    /**
     * Configure the next query response
     * Can be called multiple times to set up responses for multiple queries
     * @param response - The response to return
     * @param eqAsTerminal - If true, eq() will return the response (for update().eq().eq() pattern)
     * @param orderReturnsChain - If true, order() returns chainable object (for order().not() pattern)
     */
    mockQuery: (response: QueryResponse, eqAsTerminal = false, orderReturnsChain = false) => {
      configs.push({ response, eqAsTerminal, orderReturnsChain });
      return mock;
    },
    /**
     * Reset all mocked responses and call counter
     */
    reset: () => {
      configs.length = 0;
      callIndex = 0;
      fromMock.mockClear();
    },
  };

  return mock as unknown as SupabaseClient & {
    mockQuery: (response: QueryResponse, eqAsTerminal?: boolean, orderReturnsChain?: boolean) => typeof mock;
    reset: () => void;
  };
}

/**
 * Type for the mock Supabase client with helper methods
 * Use this type when you need to type your mock client variable
 */
export type MockSupabaseClient = ReturnType<typeof createMockSupabaseClient> & {
  mockQuery: (response: QueryResponse, eqAsTerminal?: boolean, orderReturnsChain?: boolean) => MockSupabaseClient;
  reset: () => void;
};
