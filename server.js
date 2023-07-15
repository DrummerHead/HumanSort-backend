const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

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
        return res.status(400).json({ error: err.message });
      }
      res.json({
        message: 'success',
        data: rows,
      });
    }
  );
});

// GET all comparisons
app.get('/api/v1/comparisons', (req, res) => {
  db.all(
    `
SELECT compId,
       a,
       b,
       createdOn
  FROM comparisons;
`,
    [],
    function (err, rows) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      res.json({
        message: 'success',
        data: rows,
      });
    }
  );
});

// POST a comparison
app.post('/api/v1/comparison', (req, res, next) => {
  let errors = [];
  if (!req.body.a) {
    errors.push('No better image');
  }
  if (!req.body.b) {
    errors.push('No worse image');
  }
  if (req.body.a === req.body.b) {
    errors.push('A and B can not be the same');
  }
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(', ') });
  }

  const data = {
    a: req.body.a,
    b: req.body.b,
  };

  db.run(
    `
INSERT INTO comparisons (
                          a,
                          b,
                          createdOn
                        )
                        VALUES (
                          ?,
                          ?,
                          date('now')
                        );
`,
    [data.a, data.b],
    function (err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      const response = {
        message: 'success',
        data,
        id: this.lastID,
      };
      res.json(response);
      console.log(response);
    }
  );
});

app.use((req, res) => {
  console.log('something happened and I am supposed to 404');
  res.status(404).send('404 brokeiusha');
});
