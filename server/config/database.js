import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs';
import path from 'path';
import { env } from './env.js';

let dbInstance = null;

export async function getDbConnection() {
  if (dbInstance) return dbInstance;
  
  // Ensure the parent directory of the database file exists
  const dir = path.dirname(env.DATABASE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  dbInstance = await open({
    filename: env.DATABASE_PATH,
    driver: sqlite3.Database
  });

  // Enforce SQLite Foreign Key constraints
  await dbInstance.exec('PRAGMA foreign_keys = ON;');
  return dbInstance;
}
