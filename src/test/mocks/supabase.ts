
import { vi } from 'vitest';

export const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        data: [],
        error: null,
      })),
      in: vi.fn(() => ({
        data: [],
        error: null,
      })),
      order: vi.fn(() => ({
        data: [],
        error: null,
      })),
    })),
    insert: vi.fn(() => ({
      data: null,
      error: null,
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        data: null,
        error: null,
      })),
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => ({
        data: null,
        error: null,
      })),
    })),
  })),
  auth: {
    getUser: vi.fn(() => ({
      data: { user: null },
      error: null,
    })),
    signInWithPassword: vi.fn(() => ({
      data: { user: null },
      error: null,
    })),
    signOut: vi.fn(() => ({
      error: null,
    })),
  },
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(() => ({
        data: { path: 'test-path' },
        error: null,
      })),
      getPublicUrl: vi.fn(() => ({
        data: { publicUrl: 'test-url' },
      })),
    })),
  },
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));
