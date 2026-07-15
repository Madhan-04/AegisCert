import { getDbConnection } from './config/database.js';

export async function run(sql, params = []) {
  const db = await getDbConnection();
  return db.run(sql, params);
}

export async function all(sql, params = []) {
  const db = await getDbConnection();
  return db.all(sql, params);
}

export async function get(sql, params = []) {
  const db = await getDbConnection();
  return db.get(sql, params);
}

export async function exec(sql) {
  const db = await getDbConnection();
  return db.exec(sql);
}
