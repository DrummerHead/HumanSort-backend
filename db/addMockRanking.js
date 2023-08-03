const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const db = new sqlite3.Database('comparo.db', (err) => {
  if (err) {
    console.log(err.message);
    throw err;
  } else {
    console.log('Connected to database comparo.db');
  }
});

db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON;');
  // 7 4 9 5 3 1 8 6 2
  db.run(
    `
INSERT INTO ranking (
                          rank,
                          picId,
                          rankedOn
                        )
                        VALUES (
                          1,
                          7,
                          date('now')
                        ),
                        (
                          2,
                          4,
                          date('now')
                        ),
                        (
                          3,
                          9,
                          date('now')
                        ),
                        (
                          4,
                          5,
                          date('now')
                        ),
                        (
                          5,
                          3,
                          date('now')
                        ),
                        (
                          6,
                          1,
                          date('now')
                        ),
                        (
                          7,
                          8,
                          date('now')
                        ),
                        (
                          8,
                          6,
                          date('now')
                        ),
                        (
                          9,
                          2,
                          date('now')
                        );
`,
    (err) => {
      if (err) {
        console.log(err.message);
      } else {
        console.log('all good adding mock ranking');
      }
    }
  );
});
