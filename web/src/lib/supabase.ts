/**
 * @file supabase.ts
 * @description Cliente Supabase singleton para la app web (Vite/React).
 *
 * Usa las variables de entorno VITE_SUPABASE_URL y
 * VITE_SUPABASE_ANON_KEY definidas en .env.local.
 */

import { createClient } from '@supabase/supabase-js';

// Valores públicos del proyecto Supabase, usados como respaldo. La anon key es una
// clave de CLIENTE: se incrusta en el bundle del navegador y cualquiera puede leerla
// en el JS publicado, así que tenerla aquí no añade exposición. El control de acceso
// real debe hacerse con Row Level Security (RLS) en Supabase.
//
// Prioridad: si defines VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (en web/.env.local
// o en Vercel → Environment Variables), esos valores ganan. El respaldo evita que la
// web quede en PANTALLA EN BLANCO cuando el build se hace sin esas variables
// (createClient lanza "supabaseUrl is required." si recibe valores vacíos).
const FALLBACK_SUPABASE_URL = 'https://szveigktxomzeetutmfa.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6dmVpZ2t0eG9temVldHV0bWZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MzcyNDUsImV4cCI6MjA5NDAxMzI0NX0.l6_zErQBiJislDS1ws9rlOm2oj6sdg92oYbtf0BWSrU';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || FALLBACK_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY;

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn(
    '[Supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY no definidas; usando los valores de respaldo del proyecto.'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
