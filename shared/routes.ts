import { z } from 'zod';
import { insertUserSchema, insertDiplomaSchema, AppUser as User, Diploma, CreateUserRequest, UpdateUserRequest, CreateDiplomaRequest, UpdateDiplomaRequest, DiplomaResponse } from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/login' as const,
      input: z.object({
        username: z.string(),
        password: z.string(),
      }),
      responses: {
        200: z.custom<User>(),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/logout' as const,
      responses: {
        200: z.void(),
      },
    },
    register: {
      method: 'POST' as const,
      path: '/api/register' as const,
      input: insertUserSchema,
      responses: {
        201: z.custom<User>(),
        400: errorSchemas.validation,
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/user' as const,
      responses: {
        200: z.custom<User>(),
        401: errorSchemas.unauthorized,
      },
    },
  },
  users: {
    list: {
      method: 'GET' as const,
      path: '/api/users' as const,
      responses: {
        200: z.array(z.custom<User>()),
        403: errorSchemas.unauthorized,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/users/:id' as const,
      input: insertUserSchema.partial(),
      responses: {
        200: z.custom<User>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/users/:id' as const,
      responses: {
        200: z.void(),
        404: errorSchemas.notFound,
      },
    },
    resetPassword: {
      method: 'POST' as const,
      path: '/api/users/:id/reset-password' as const,
      input: z.object({ password: z.string() }),
      responses: {
        200: z.void(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/users' as const,
      input: insertUserSchema,
      responses: {
        201: z.custom<User>(),
        400: errorSchemas.validation,
      },
    },
  },
  settings: {
    get: {
      method: 'GET' as const,
      path: '/api/settings' as const,
      responses: {
        200: z.custom<any>(),
      },
    },
    update: {
      method: 'POST' as const,
      path: '/api/settings' as const,
      input: z.any(),
      responses: {
        200: z.custom<any>(),
      },
    },
  },
  diplomas: {
    list: {
      method: 'GET' as const,
      path: '/api/diplomas' as const,
      responses: {
        200: z.array(z.custom<Diploma & { student?: User }>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/diplomas/:id' as const,
      responses: {
        200: z.custom<Diploma & { student?: User }>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/diplomas' as const,
      input: insertDiplomaSchema,
      responses: {
        201: z.custom<Diploma>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/diplomas/:id' as const,
      input: insertDiplomaSchema.partial(),
      responses: {
        200: z.custom<Diploma>(),
        404: errorSchemas.notFound,
      },
    },
    verify: {
      method: 'GET' as const,
      path: '/api/diplomas/verify/:certificateId' as const,
      responses: {
        200: z.object({
          valid: z.boolean(),
          blockchainVerified: z.boolean().nullable().optional(),
          blockchainTimestamp: z.number().nullable().optional(),
          blockchainConfigured: z.boolean().optional(),
          diploma: z.custom<DiplomaResponse>().optional(),
          message: z.string().optional(),
        }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

// Type exports
export type { User, Diploma, DiplomaResponse, CreateUserRequest, UpdateUserRequest, CreateDiplomaRequest, UpdateDiplomaRequest };
