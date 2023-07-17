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
  picId   INTEGER PRIMARY KEY,
  path    TEXT    NOT NULL,
  addedOn TEXT    NOT NULL
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
                   path,
                   addedOn
                 )
                 VALUES (
                   ?,
                   date('now')
                 );
`;

        fs.readdir('./pics', (err, files) => {
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
CREATE TABLE IF NOT EXISTS ranking (
  rank     INTEGER PRIMARY KEY,
  picId    INTEGER NOT NULL,
  rankedOn TEXT    NOT NULL,
  FOREIGN KEY (
    picId
  )
  REFERENCES pics (picId) ON UPDATE CASCADE
                          ON DELETE CASCADE
);
`,
    (err) => {
      if (err) {
        return console.log(err);
      } else {
        console.log('all good with ranking table');
      }
    }
  );
  db.run(
    `
CREATE TABLE IF NOT EXISTS rankingBkp (
  rank     INTEGER PRIMARY KEY,
  picId    INTEGER NOT NULL,
  rankedOn TEXT    NOT NULL,
  FOREIGN KEY (
    picId
  )
  REFERENCES pics (picId) ON UPDATE CASCADE
                          ON DELETE CASCADE
);
`,
    (err) => {
      if (err) {
        return console.log(err);
      } else {
        console.log('all good with rankingBkp table');
      }
    }
  );
});
