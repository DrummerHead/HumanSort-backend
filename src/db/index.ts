import sqlite3 from 'sqlite3';
import type { Database } from 'sqlite3';

import { getAbsolutePath } from '../util/';

export const db: Database = new (sqlite3.verbose().Database)(
  getAbsolutePath('/db/comparo.db'),
  (err) => {
    if (err) {
      console.error(err.message);
      throw err;
    } else {
      db.run('PRAGMA foreign_keys = ON;');
      console.log('Connected to database comparo.db');
    }
  }
);
