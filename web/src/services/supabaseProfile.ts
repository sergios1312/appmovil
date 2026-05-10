/**
 * @file supabaseProfile.ts
 * @description Servicio para gestionar el perfil del usuario en Supabase.
 * Se llama después del login con Google para crear/actualizar el perfil
 * en la tabla `profiles`.
 */

import { supabase } from '@/lib/supabase';

export interface ProfileData {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
}

/**
 * Crea o actualiza el perfil del usuario en Supabase.
 * Usa upsert para manejar tanto la primera vez como logins subsecuentes.
 */
export async function upsertProfile(profile: ProfileData): Promise<ProfileData> {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: profile.id,
      email: profile.email,
      name: profile.name,
      avatar_url: profile.avatar_url ?? null,
    }, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw new Error(`[SupabaseProfile] upsert: ${error.message}`);
  return data as ProfileData;
}

/**
 * Obtiene el perfil del usuario por ID.
 */
export async function getProfile(id: string): Promise<ProfileData | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(`[SupabaseProfile] get: ${error.message}`);
  return data as ProfileData | null;
}
