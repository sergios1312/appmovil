-- ============================================================================
-- Migración TaskFlow — aplicar en Supabase (SQL Editor) ANTES de usar esta build
-- ============================================================================
-- Generada el 2026-05-30 junto con la corrección de bugs de la web.

-- 1) Columna completed_at en `tasks`  ── REQUERIDA ──
--    El progreso semanal ahora se basa en cuándo se completó cada tarea (no en
--    updated_at, que cambia con cualquier edición). Sin esta columna, crear o
--    actualizar tareas fallará.
alter table public.tasks
  add column if not exists completed_at timestamptz;

--    Backfill para tareas ya completadas (estima el completado con updated_at).
update public.tasks
   set completed_at = coalesce(completed_at, updated_at)
 where status = 'completed'
   and completed_at is null;


-- 2) Borrado en cascada de subtareas a nivel de base de datos  ── RECOMENDADO ──
--    El cliente ya borra descendientes en orden, pero esto evita huérfanos si una
--    operación se interrumpe. Descomenta y ajusta el nombre de la FK si difiere.
-- alter table public.tasks
--   drop constraint if exists tasks_parent_id_fkey,
--   add  constraint tasks_parent_id_fkey
--        foreign key (parent_id) references public.tasks(id) on delete cascade;


-- 3) Row Level Security  ── IMPORTANTE (seguridad de datos) ──
--    La app usa la anon key (pública) y filtra por user_id en el cliente. Si RLS
--    no está activo y atado al usuario, cualquiera con la anon key podría leer o
--    escribir datos de otros. Verifica que RLS esté habilitado en tasks, expenses,
--    body_weight_logs y profiles, con políticas acordes a tu modelo de auth.
--    (Nota: la app autentica con Google directamente, no con Supabase Auth, por lo
--     que auth.uid() no aplica tal cual; valora migrar a Supabase Auth para un RLS
--     robusto basado en auth.uid().)
-- alter table public.tasks            enable row level security;
-- alter table public.expenses         enable row level security;
-- alter table public.body_weight_logs enable row level security;
-- alter table public.profiles         enable row level security;
