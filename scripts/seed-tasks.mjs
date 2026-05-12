/**
 * Script para insertar tareas repetitivas predefinidas en Supabase.
 * Ejecutar con: node scripts/seed-tasks.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://szveigktxomzeetutmfa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6dmVpZ2t0eG9temVldHV0bWZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MzcyNDUsImV4cCI6MjA5NDAxMzI0NX0.l6_zErQBiJislDS1ws9rlOm2oj6sdg92oYbtf0BWSrU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── User ID (Sergio Araujo – sergiosdok@gmail.com) ──────────────────────────
async function getUserId() {
  return '103441455011716726264';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function genId() {
  return `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6]; // Dom-Sáb
const MON_TO_SAT = [1, 2, 3, 4, 5, 6];  // Lun-Sáb

/**
 * Crea el objeto de tarea para insertar en Supabase.
 */
function makeTask({ userId, title, priority, taskType, repeatDays, dueTime, parentId = null, weight = 3, hideFromCalendar = false }) {
  const now = new Date().toISOString();
  
  // Construir due_date con la hora si se especifica (hoy como fecha base)
  let due_date = null;
  if (dueTime) {
    const today = new Date();
    const [hours, minutes] = dueTime.split(':').map(Number);
    today.setHours(hours, minutes, 0, 0);
    due_date = today.toISOString();
  }

  return {
    id: genId(),
    user_id: userId,
    parent_id: parentId,
    title,
    description: null,
    status: 'pending',
    priority,
    task_type: taskType,
    due_date,
    weight,
    repeat_days: repeatDays,
    hide_from_calendar: hideFromCalendar,
    tags: [],
    created_at: now,
    updated_at: now,
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Iniciando inserción de tareas repetitivas...\n');

  const userId = await getUserId();
  console.log(`✅ User ID: ${userId}\n`);

  // Pequeño delay entre IDs para evitar colisiones
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const tasksToInsert = [];

  // ──────────────────────────────────────────────────────────────────────────
  // 1. GIMNASIO – Lun-Sáb, sin hora, alta, tarea principal única
  // ──────────────────────────────────────────────────────────────────────────
  const gimnasio = makeTask({
    userId,
    title: 'Gimnasio',
    priority: 'high',
    taskType: 'routine',
    repeatDays: MON_TO_SAT,
    dueTime: null,
    weight: 5,
  });
  tasksToInsert.push(gimnasio);
  console.log(`📋 1. Gimnasio (Lun-Sáb) → ${gimnasio.id}`);

  await delay(10);

  // ──────────────────────────────────────────────────────────────────────────
  // 2. RUTINA DE LA MAÑANA – Todos los días, 09:00, contenedor
  // ──────────────────────────────────────────────────────────────────────────
  const rutinaMañana = makeTask({
    userId,
    title: 'Rutina de la mañana',
    priority: 'high',
    taskType: 'habit_group',
    repeatDays: ALL_DAYS,
    dueTime: '09:00',
    weight: 4,
  });
  tasksToInsert.push(rutinaMañana);
  console.log(`📋 2. Rutina de la mañana (Todos, 09:00) → ${rutinaMañana.id}`);

  await delay(10);

  // Subtarea 2.1: Lavarse los dientes
  const sub2_1 = makeTask({
    userId,
    title: 'Lavarse los dientes',
    priority: 'high',
    taskType: 'routine',
    repeatDays: ALL_DAYS,
    dueTime: '09:00',
    parentId: rutinaMañana.id,
    weight: 1,
  });
  tasksToInsert.push(sub2_1);
  console.log(`   └─ 2.1 Lavarse los dientes → ${sub2_1.id}`);

  await delay(10);

  // Subtarea 2.2: Tomar medicamento
  const sub2_2 = makeTask({
    userId,
    title: 'Tomar medicamento',
    priority: 'high',
    taskType: 'routine',
    repeatDays: ALL_DAYS,
    dueTime: '09:00',
    parentId: rutinaMañana.id,
    weight: 2,
  });
  tasksToInsert.push(sub2_2);
  console.log(`   └─ 2.2 Tomar medicamento → ${sub2_2.id}`);

  await delay(10);

  // ──────────────────────────────────────────────────────────────────────────
  // 3. RUTINA DE LA TARDE – Todos los días, 15:00, contenedor
  // ──────────────────────────────────────────────────────────────────────────
  const rutinaTarde = makeTask({
    userId,
    title: 'Rutina de la tarde',
    priority: 'high',
    taskType: 'habit_group',
    repeatDays: ALL_DAYS,
    dueTime: '15:00',
    weight: 4,
  });
  tasksToInsert.push(rutinaTarde);
  console.log(`📋 3. Rutina de la tarde (Todos, 15:00) → ${rutinaTarde.id}`);

  await delay(10);

  // Subtarea 3.1: Cepillarse los dientes
  const sub3_1 = makeTask({
    userId,
    title: 'Cepillarse los dientes',
    priority: 'high',
    taskType: 'routine',
    repeatDays: ALL_DAYS,
    dueTime: '15:00',
    parentId: rutinaTarde.id,
    weight: 1,
  });
  tasksToInsert.push(sub3_1);
  console.log(`   └─ 3.1 Cepillarse los dientes → ${sub3_1.id}`);

  await delay(10);

  // Subtarea 3.2: Tomar medicamentos
  const sub3_2 = makeTask({
    userId,
    title: 'Tomar medicamentos',
    priority: 'high',
    taskType: 'routine',
    repeatDays: ALL_DAYS,
    dueTime: '15:00',
    parentId: rutinaTarde.id,
    weight: 2,
  });
  tasksToInsert.push(sub3_2);
  console.log(`   └─ 3.2 Tomar medicamentos → ${sub3_2.id}`);

  await delay(10);

  // ──────────────────────────────────────────────────────────────────────────
  // 4. TOMAR MEDICAMENTOS – Todos los días, 19:00, tarea principal única
  // ──────────────────────────────────────────────────────────────────────────
  const tomarMed = makeTask({
    userId,
    title: 'Tomar medicamentos',
    priority: 'high',
    taskType: 'routine',
    repeatDays: ALL_DAYS,
    dueTime: '19:00',
    weight: 3,
  });
  tasksToInsert.push(tomarMed);
  console.log(`📋 4. Tomar medicamentos (Todos, 19:00) → ${tomarMed.id}`);

  await delay(10);

  // ──────────────────────────────────────────────────────────────────────────
  // 5. HACER EJERCICIO – Todos los días, 19:30, prioridad media
  // ──────────────────────────────────────────────────────────────────────────
  const ejercicio = makeTask({
    userId,
    title: 'Hacer ejercicio',
    priority: 'medium',
    taskType: 'routine',
    repeatDays: ALL_DAYS,
    dueTime: '19:30',
    weight: 4,
  });
  tasksToInsert.push(ejercicio);
  console.log(`📋 5. Hacer ejercicio (Todos, 19:30) → ${ejercicio.id}`);

  await delay(10);

  // ──────────────────────────────────────────────────────────────────────────
  // 6. RUTINA DE LA NOCHE – Todos los días, 21:00, contenedor
  // ──────────────────────────────────────────────────────────────────────────
  const rutinaNoche = makeTask({
    userId,
    title: 'Rutina de la noche',
    priority: 'high',
    taskType: 'habit_group',
    repeatDays: ALL_DAYS,
    dueTime: '21:00',
    weight: 4,
  });
  tasksToInsert.push(rutinaNoche);
  console.log(`📋 6. Rutina de la noche (Todos, 21:00) → ${rutinaNoche.id}`);

  await delay(10);

  // Subtarea 6.1: Tomar medicamentos
  const sub6_1 = makeTask({
    userId,
    title: 'Tomar medicamentos',
    priority: 'high',
    taskType: 'routine',
    repeatDays: ALL_DAYS,
    dueTime: '21:00',
    parentId: rutinaNoche.id,
    weight: 2,
  });
  tasksToInsert.push(sub6_1);
  console.log(`   └─ 6.1 Tomar medicamentos → ${sub6_1.id}`);

  await delay(10);

  // Subtarea 6.2: Cepillarse los dientes
  const sub6_2 = makeTask({
    userId,
    title: 'Cepillarse los dientes',
    priority: 'high',
    taskType: 'routine',
    repeatDays: ALL_DAYS,
    dueTime: '21:00',
    parentId: rutinaNoche.id,
    weight: 1,
  });
  tasksToInsert.push(sub6_2);
  console.log(`   └─ 6.2 Cepillarse los dientes → ${sub6_2.id}`);

  // ──────────────────────────────────────────────────────────────────────────
  // INSERTAR EN SUPABASE
  // ──────────────────────────────────────────────────────────────────────────
  console.log(`\n📦 Insertando ${tasksToInsert.length} tareas en Supabase...`);

  const { data, error } = await supabase
    .from('tasks')
    .insert(tasksToInsert)
    .select('id, title, parent_id, task_type, repeat_days');

  if (error) {
    console.error('\n❌ Error al insertar:', error.message);
    console.error('Detalle:', error);
    process.exit(1);
  }

  console.log(`\n✅ ${data.length} tareas insertadas exitosamente!\n`);
  
  // Resumen
  console.log('═══════════════════════════════════════════════════════');
  console.log('RESUMEN DE TAREAS INSERTADAS');
  console.log('═══════════════════════════════════════════════════════');
  
  for (const t of data) {
    const indent = t.parent_id ? '   └─' : '📋';
    const type = t.task_type === 'habit_group' ? '[Contenedor]' : '[Rutina]';
    const days = t.repeat_days?.length === 7 ? 'Todos los días' : 'Lun-Sáb';
    console.log(`${indent} ${t.title} ${type} (${days})`);
  }

  console.log('\n🎉 Seed completado!');
}

main().catch(console.error);
