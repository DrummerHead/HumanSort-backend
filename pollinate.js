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
  db.run(
    `
CREATE TABLE pics (
    picId INTEGER PRIMARY KEY,
    path  TEXT
);
`,
    (err) => {
      if (err) {
        console.log('Table pics already exists');
      } else {
        console.log(
          'Table pics does not exist, adding pic data from folder ../../'
        );
        const stmt = `
INSERT INTO pics (
                   path
                 )
                 VALUES (
                   ?
                 );
`;

        fs.readdir('../../', (err, files) => {
          if (err) {
            return err.message;
          }
          onlyPng = files.filter((filename) => filename.match(/\.png$/));
          onlyPng.forEach((file) => {
            db.run(stmt, file);
          });
        });
      }
    }
  );

  db.run(
    `
CREATE TABLE IF NOT EXISTS comparisons (
  compId    INTEGER PRIMARY KEY,
  a         INTEGER NOT NULL,
  b         INTEGER NOT NULL,
  createdOn TEXT    NOT NULL,
  CHECK (a != b),
  FOREIGN KEY (
    a
  )
  REFERENCES pics (picId) ON UPDATE CASCADE
                          ON DELETE CASCADE,
  FOREIGN KEY (
    b
  )
  REFERENCES pics (picId) ON UPDATE CASCADE
                          ON DELETE CASCADE
);
`,
    (err) => {
      if (err) {
        return console.log(err);
      } else {
        console.log('all good with comparisons table');
      }
    }
  );
});
