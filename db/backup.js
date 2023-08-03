const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const today = new Date().toISOString().split('T')[0];

const DBName = 'comparo';
const newDBName = `${today}-${DBName}.db`;

const db = new sqlite3.Database(`${DBName}.db`, (err) => {
  if (err) {
    console.log(err.message);
    throw err;
  } else {
    console.log(`Connected to database ${DBName}.db`);
  }
});

db.serialize(() => {
  db.run(
    `
VACUUM INTO '${newDBName}';
`,
    (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log(`Backup successful into ${newDBName}`);
      }
    }
  );
});
