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
  path    TEXT    NOT NULL UNIQUE,
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
  picId    INTEGER NOT NULL UNIQUE,
  rankedOn TEXT    NOT NULL,
  FOREIGN KEY (
    picId
  )
  REFERENCES pics (picId) ON UPDATE CASCADE
                          ON DELETE CASCADE
);
`,
    // It's not as easy as on update cascade on delete cascade
    // because if a pic is deleted then in worst case scenario
    // (the pic being number one in ranking) then all the rank
    // of each row should change to reflect the fact the pic
    // doesn't exist anymore. There can't be any "holes" in the
    // ranking. Wondering if I should do the change at the database
    // level of the backend code level... or just assume a pic will
    // never be deleted. Probably should do it at the database level
    // for practice. We'll put it in the backlog (to never be seen again).
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
  picId    INTEGER NOT NULL UNIQUE,
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
