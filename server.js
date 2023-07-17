const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/pics', express.static(path.join(__dirname, 'pics')));

const port = 7777;
app.listen(port, () => {
  console.log(`Runnin' like crazy on ${port}`);
});

const db = new sqlite3.Database('comparo.db', (err) => {
  if (err) {
    console.error(err.message);
    throw err;
  } else {
    db.run('PRAGMA foreign_keys = ON;');
    console.log('Connected to database comparo.db');
  }
});

// homepage with cool message
app.get('/', (req, res) => {
  console.log('get /');
  res.json({ message: 'all good mah dude' });
});

// GET all pics
app.get('/api/v1/pics', (req, res) => {
  db.all(
    `
SELECT picId,
       path
  FROM pics;
`,
    [],
    function (err, rows) {
      if (err) {
        console.log(err.message);
        return res.status(400).json({ error: err.message });
      }
      res.json({
        message: 'success',
        data: rows,
      });
    }
  );
});

// GET all rankings
app.get('/api/v1/ranking', (req, res) => {
  db.all(
    `
SELECT rank,
       picId,
       path,
       rankedOn
  FROM ranking
       JOIN pics USING (
         picId
       )
 ORDER BY rank;
`,
    [],
    function (err, rows) {
      if (err) {
        console.log(err.message);
        return res.status(400).json({ error: err.message });
      }
      res.json({
        message: 'success',
        data: rows,
      });
    }
  );
});

app.use((req, res) => {
  const errorMessage = `404: ${req.url} does not exist`;
  console.log(errorMessage);
  res.status(404).json({ error: errorMessage });
});
