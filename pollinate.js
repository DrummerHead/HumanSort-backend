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
        'Table pics does not exist, adding pic data from folder ../../',
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
  },
);
