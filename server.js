const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const picsFolder = '/pics/';
app.use(picsFolder, express.static(path.join(__dirname, 'pics')));

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

const addPicPath = (pic) => ({
  ...pic,
  path: `${picsFolder}${pic.path}`,
});

// homepage with cool message
app.get('/', (req, res) => {
  console.log('get /');
  res.json({ message: 'all good mah dude' });
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
        ranks: rows.map(addPicPath),
        rankedAmount: rows.length,
      });
    }
  );
});

// POST a ranking
app.post('/api/v1/ranking', (req, res, next) => {
  console.log('hit /api/v1/ranking with POST');
  let errors = [];
  // TODO: If I don't find more possible errors, remove array

  const ids = req.body.map((r) => r.picId);
  const idSet = new Set(ids);

  if (ids.length !== idSet.size) {
    errors.push(
      'Ids of ranks have to be unique; no repeated Pics! No soup for you!'
    );
  }

  if (errors.length > 0) {
    const errorMessage = errors.join(', ');
    console.log(errorMessage);
    return res.status(400).json({ error: errorMessage });
  }

  db.serialize(() => {
    // Originally the idea of this transaction was to copy everything
    // from ranking to rankingBkp and then delete ranking and recreate
    // with whatever came down the wire. Gotta do this if I want to add
    // an undo feature and I guess it should be nice in general... like
    // a good database christian or something.
    db.run(`
BEGIN TRANSACTION;
`);
    db.run(`
DELETE FROM ranking;
`);
    const statement = db.prepare(`
INSERT INTO ranking (
                      rank,
                      picId,
                      rankedOn
                    )
                    VALUES (
                      ?,
                      ?,
                      ?
                    );
`);

    req.body.forEach((row) => {
      statement.run(row.rank, row.picId, row.rankedOn, (err) => {
        if (err) {
          console.error('When trying to insert');
          console.error(row);
          console.error(err.message);
          console.error('Rolling back transaction');
          // this is not gonna work
          // https://github.com/TryGhost/node-sqlite3/issues/304
          // it seems I should be using better-sqlite
          // https://github.com/WiseLibs/better-sqlite3
          db.run(`
ROLLBACK TRANSACTION;
`);
          return res.status(400).json({ error: err.message });
        }
      });
    });
    statement.finalize();

    db.run(`
COMMIT TRANSACTION;
`);
    db.get(
      `
SELECT count(*) AS rankedAmount
  FROM ranking;
`,
      (err, row) => {
        if (err) {
          console.log(err.message);
          return res.status(400).json({ error: err.message });
        }
        console.log('count rankings:');
        console.log(row.rankedAmount);
        return res.json({
          message: 'success',
          rankedAmount: row.rankedAmount,
        });
      }
    );
  });
});

const randInt = (lessthan) => Math.floor(Math.random() * lessthan);
const getRandItem = (array) => array[randInt(array.length)];

// GET one non ranked pic
app.get('/api/v1/one-non-ranked', (req, res) => {
  db.all(
    `
SELECT picId,
       path
  FROM pics
EXCEPT
SELECT picId,
       path
  FROM ranking
       JOIN pics USING (
         picId
       );
`,
    [],
    function (err, rows) {
      if (err) {
        console.log(err.message);
        return res.status(400).json({ error: err.message });
      }
      console.log('GET /api/v1/one-non-ranked');
      if (rows.length === 0) {
        console.log('no more pictures to rank!');
        return res.json({
          message: 'success',
          newPic: { path: '', id: -7 },

          unrankedAmount: rows.length,
        });
      }
      const oneNonRanked = getRandItem(rows);
      console.log(oneNonRanked);
      res.json({
        message: 'success',
        newPic: {
          ...oneNonRanked,
          path: `${picsFolder}${oneNonRanked.path}`,
        },
        unrankedAmount: rows.length,
      });
    }
  );
});

app.use((req, res) => {
  const errorMessage = `404: ${req.url} does not exist`;
  console.log(errorMessage);
  res.status(404).json({ error: errorMessage });
});
