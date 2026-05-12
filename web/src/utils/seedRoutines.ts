import { CreateTaskDTO } from '@/core/entities/Task';

export async function seedDailyRoutines(addTask: (dto: CreateTaskDTO) => Promise<any>, userId: string) {
  const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
  const dailyRepeat = [0, 1, 2, 3, 4, 5, 6];
  const monToSatRepeat = [1, 2, 3, 4, 5, 6];

  // 1. Gimnasio
  await addTask({
    title: 'Gimnasio',
    priority: 'high',
    task_type: 'routine',
    due_date: `${today}T12:00:00`, // Sin hora específica, pero la BD requiere una. Usamos medio día.
    weight: 5,
    repeat_days: monToSatRepeat,
    hide_from_calendar: false,
    parent_id: null,
    is_synced: false,
    user_id: userId,
  } as any);

  // 2. Rutina de la mañana
  const morningRoutine = await addTask({
    title: 'Rutina de la mañana',
    priority: 'high',
    task_type: 'habit_group',
    due_date: `${today}T09:00:00`,
    weight: 3,
    repeat_days: dailyRepeat,
    hide_from_calendar: false,
    parent_id: null,
    is_synced: false,
    user_id: userId,
  } as any);

  await addTask({
    title: 'Lavarse los dientes',
    priority: 'high',
    task_type: 'routine',
    due_date: `${today}T09:00:00`,
    weight: 1,
    repeat_days: dailyRepeat,
    hide_from_calendar: true,
    parent_id: morningRoutine.id,
    is_synced: false,
    user_id: userId,
  } as any);

  await addTask({
    title: 'Tomar medicamento',
    priority: 'high',
    task_type: 'routine',
    due_date: `${today}T09:00:00`,
    weight: 2,
    repeat_days: dailyRepeat,
    hide_from_calendar: true,
    parent_id: morningRoutine.id,
    is_synced: false,
    user_id: userId,
  } as any);

  // 3. Rutina de la tarde
  const afternoonRoutine = await addTask({
    title: 'Rutina de la tarde',
    priority: 'high',
    task_type: 'habit_group',
    due_date: `${today}T15:00:00`, // 03:00 p.m.
    weight: 3,
    repeat_days: dailyRepeat,
    hide_from_calendar: false,
    parent_id: null,
    is_synced: false,
    user_id: userId,
  } as any);

  await addTask({
    title: 'Cepillarse los dientes',
    priority: 'high',
    task_type: 'routine',
    due_date: `${today}T15:00:00`,
    weight: 1,
    repeat_days: dailyRepeat,
    hide_from_calendar: true,
    parent_id: afternoonRoutine.id,
    is_synced: false,
    user_id: userId,
  } as any);

  await addTask({
    title: 'Tomar medicamentos',
    priority: 'high',
    task_type: 'routine',
    due_date: `${today}T15:00:00`,
    weight: 2,
    repeat_days: dailyRepeat,
    hide_from_calendar: true,
    parent_id: afternoonRoutine.id,
    is_synced: false,
    user_id: userId,
  } as any);

  // 4. Tomar medicamentos
  await addTask({
    title: 'Tomar medicamentos',
    priority: 'high',
    task_type: 'routine',
    due_date: `${today}T19:00:00`, // 07:00 p.m.
    weight: 2,
    repeat_days: dailyRepeat,
    hide_from_calendar: false,
    parent_id: null,
    is_synced: false,
    user_id: userId,
  } as any);

  // 5. Hacer ejercicio
  await addTask({
    title: 'Hacer ejercicio',
    priority: 'medium',
    task_type: 'routine',
    due_date: `${today}T19:30:00`, // 07:30 p.m.
    weight: 4,
    repeat_days: dailyRepeat,
    hide_from_calendar: false,
    parent_id: null,
    is_synced: false,
    user_id: userId,
  } as any);

  // 6. Rutina de la noche
  const nightRoutine = await addTask({
    title: 'Rutina de la noche',
    priority: 'high',
    task_type: 'habit_group',
    due_date: `${today}T21:00:00`, // 09:00 p.m.
    weight: 3,
    repeat_days: dailyRepeat,
    hide_from_calendar: false,
    parent_id: null,
    is_synced: false,
    user_id: userId,
  } as any);

  await addTask({
    title: 'Tomar medicamentos',
    priority: 'high',
    task_type: 'routine',
    due_date: `${today}T21:00:00`,
    weight: 2,
    repeat_days: dailyRepeat,
    hide_from_calendar: true,
    parent_id: nightRoutine.id,
    is_synced: false,
    user_id: userId,
  } as any);

  await addTask({
    title: 'Cepillarse los dientes',
    priority: 'high',
    task_type: 'routine',
    due_date: `${today}T21:00:00`,
    weight: 1,
    repeat_days: dailyRepeat,
    hide_from_calendar: true,
    parent_id: nightRoutine.id,
    is_synced: false,
    user_id: userId,
  } as any);
}
