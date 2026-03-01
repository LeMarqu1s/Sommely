import { createClient } from '@supabase/supabase-js';

const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL ?? '').trim();
const supabaseAnonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();

// Supabase optionnel : si non configuré, l'app fonctionne en mode local (localStorage)

export const supabase = createClient(
  supabaseUrl || 'https://temp.supabase.co',
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ0ZW1wIn0.x'
);

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          email: string | null;
          first_name: string | null;
          preferences: Record<string, any> | null;
          onboarding_completed: boolean;
          subscription_status: 'free' | 'monthly' | 'annual' | 'lifetime';
          subscription_start: string | null;
          subscription_end: string | null;
          scan_count_total: number;
          scan_count_today: number;
          last_scan_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['user_profiles']['Insert']>;
      };
      scans: {
        Row: {
          id: string;
          user_id: string;
          wine_name: string;
          wine_region: string | null;
          wine_year: number | null;
          wine_type: string | null;
          score: number;
          is_favorite: boolean;
          created_at: string;
        };
      };
    };
  };
};

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
}

export async function upsertUserProfile(userId: string, profile: Record<string, any>) {
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert({ id: userId, ...profile, updated_at: new Date().toISOString() })
    .select()
    .single();
  return { data, error };
}

export async function saveScan(userId: string, wineData: Record<string, any>, score: number) {
  const { data, error } = await supabase
    .from('scans')
    .insert({
      user_id: userId,
      wine_name: wineData.name,
      wine_region: wineData.region,
      wine_year: wineData.year,
      wine_type: wineData.type,
      score,
      is_favorite: false,
    })
    .select()
    .single();
  return { data, error };
}

export async function getUserScans(userId: string, limit = 20) {
  const { data, error } = await supabase
    .from('scans')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return { data, error };
}

