import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. The application will work in Demo mode only until configured.');
}

// Ensure the URL is valid before calling createClient to prevent a white screen crash
const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

export const supabase = isValidUrl(supabaseUrl) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : ({
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: async ({ email }: any) => {
          // Simulate success for any login in demo mode
          return { 
            data: { 
              user: { 
                id: 'demo-user-id', 
                email, 
                user_metadata: { full_name: 'Usuário Demo' } 
              }, 
              session: { access_token: 'demo-token' } 
            }, 
            error: null 
          };
        },
        signUp: async ({ email, options }: any) => {
          // Simulate success for signup
          return { 
            data: { 
              user: { 
                id: 'demo-user-id', 
                email, 
                user_metadata: options?.data || {} 
              }, 
              session: { access_token: 'demo-token' } 
            }, 
            error: null 
          };
        },
        signOut: async () => ({ error: null }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: { code: 'PGRST116', message: 'Demo mode' } }),
            order: () => ({
              gte: () => ({
                lte: () => ({
                  order: async () => ({ data: [], error: null })
                })
              })
            })
          }),
          order: () => ({
            limit: async () => ({ data: [], error: null })
          })
        }),
        insert: (data: any) => ({
          select: () => ({
            single: async () => ({ data: Array.isArray(data) ? data[0] : data, error: null })
          })
        }),
        upsert: (data: any) => ({
          select: () => ({
            single: async () => ({ data: Array.isArray(data) ? data[0] : data, error: null })
          })
        })
      })
    } as any);
