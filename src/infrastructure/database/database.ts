/**
 * @file database.ts
 * @layer infrastructure/database
 * @description Inicialización de la base de datos SQLite local con expo-sqlite.
 *
 * ESTADO ACTUAL: Estructura lista, pendiente de integrar con TaskRepository.
 * El TaskRepository actual usa un Map en memoria (mock).
 *
 * PRÓXIMA ITERACIÓN: Reemplazar el Map en TaskRepository por estas queries SQLite.
 */

import * as SQLite from 'expo-sqlite';

const DB_NAME = 'taskflow.db';
const DB_VERSION = 2;

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Obtiene (o crea) la instancia singleton de la base de datos.
 * La base de datos persiste entre reinicios de la app.
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync(DB_NAME);
  await runMigrations(db);
  return db;
}

/**
 * Ejecuta las migraciones de schema en orden.
 * Cada migración solo se ejecuta una vez (versionado manual por pragma).
 */
async function runMigrations(database: SQLite.SQLiteDatabase): Promise<void> {
  // Habilitar WAL para mejor rendimiento concurrente
  await database.execAsync('PRAGMA journal_mode = WAL;');
  await database.execAsync('PRAGMA foreign_keys = ON;');

  // Obtener versión actual del schema
  const result = await database.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  const currentVersion = result?.user_version ?? 0;

  if (currentVersion < 1) {
    await migrate_v1(database);
    await database.execAsync(`PRAGMA user_version = 1`);
    console.log('[Database] Migración v1 aplicada');
  }

  if (currentVersion < 2) {
    await migrate_v2(database);
    await database.execAsync(`PRAGMA user_version = 2`);
    console.log('[Database] Migración v2 aplicada');
  }

  console.log(`[Database] Schema en versión ${DB_VERSION}`);
}

/**
 * Migración v1: Esquema inicial
 * - Tabla tasks (con parent_id para jerarquía plana)
 */
async function migrate_v1(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS tasks (
      id              TEXT PRIMARY KEY,
      parent_id       TEXT REFERENCES tasks(id) ON DELETE CASCADE,
      title           TEXT NOT NULL,
      description     TEXT,
      status          TEXT NOT NULL DEFAULT 'pending'
                          CHECK(status IN ('pending','in_progress','completed','cancelled')),
      priority        TEXT NOT NULL DEFAULT 'medium'
                          CHECK(priority IN ('low','medium','high','urgent')),
      due_date        TEXT,
      google_event_id TEXT,
      google_task_id  TEXT,
      google_tasklist_id TEXT,
      tags            TEXT DEFAULT '[]',
      is_synced       INTEGER NOT NULL DEFAULT 0,
      last_synced_at  TEXT,
      created_at      TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Índices para queries frecuentes
    CREATE INDEX IF NOT EXISTS idx_tasks_parent_id  ON tasks(parent_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_status     ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_due_date   ON tasks(due_date);
    CREATE INDEX IF NOT EXISTS idx_tasks_is_synced  ON tasks(is_synced);
  `);
}

/**
 * Migración v2: Campos para tipos de tarea, gamificación y rutinas
 */
async function migrate_v2(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    ALTER TABLE tasks ADD COLUMN task_type TEXT NOT NULL DEFAULT 'single'
      CHECK(task_type IN ('routine','single','project','habit_group'));
    ALTER TABLE tasks ADD COLUMN weight INTEGER NOT NULL DEFAULT 3;
    ALTER TABLE tasks ADD COLUMN repeat_days TEXT;
    ALTER TABLE tasks ADD COLUMN hide_from_calendar INTEGER NOT NULL DEFAULT 0;
  `);
}

/**
 * Cierra la conexión a la base de datos (útil para testing)
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}

/**
 * Resetea la base de datos (solo para desarrollo/testing)
 */
export async function resetDatabase(): Promise<void> {
  if (__DEV__) {
    await closeDatabase();
    await SQLite.deleteDatabaseAsync(DB_NAME);
    console.log('[Database] Base de datos reseteada');
  }
}
