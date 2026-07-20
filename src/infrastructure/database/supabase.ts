/**
 * @file supabase.ts
 * @layer infrastructure/database
 * @description Cliente Supabase singleton para la app móvil (React Native).
 *
 * Usa las variables de entorno EXPO_PUBLIC_SUPABASE_URL y
 * EXPO_PUBLIC_SUPABASE_ANON_KEY definidas en .env.local.
 *
 * Este cliente se usa para:
 * - CRUD de tareas, eventos y gastos
 * - Suscripciones Realtime (WebSocket)
 * - Autenticación futura (si se migra de Google OAuth directo a Supabase Auth)
 */

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('[Supabase] ⚠️ Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // Usar AsyncStorage para persistir la sesión en React Native
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // No aplica en React Native
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
