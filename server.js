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

// POST single ranking and edit ranking table
app.post('/api/v1/one-ranking', (req, res, next) => {
  console.log('POST /api/v1/one-ranking with:');
  console.dir(req.body);

  db.serialize(() => {
    db.run(`
BEGIN TRANSACTION;
`);

    // Make all the ranks the negative version of themselves
    // minus one. This is to shift down all the rankings.
    // I can't do a +1 because it seems that it is done one
    // by one and by adding one to one it becomes the same
    // as the one after it, breaking the UNIQUE CONSTRAIN
    db.run(
      `
UPDATE ranking
   SET rank = -rank - 1
 WHERE rank >= ?;
`,
      req.body.rank
    );

    // Insert the new fella
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

    statement.run(req.body.rank, req.body.picId, req.body.rankedOn, (err) => {
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
    statement.finalize();

    // put the rankings back to their positive selves
    db.run(
      `
UPDATE ranking
   SET rank = -rank
 WHERE rank < 0;
`
    );

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

// POST single ranking and edit ranking table
app.post('/api/v1/new-rank-order', (req, res, next) => {
  console.log('POST /api/v1/new-rank-order with:');
  console.dir(req.body);

  // lower ranking mens better; I'M NUMBAH ONE BABY WOOOOO!!!
  const upgradeRank = req.body.newRank < req.body.originalRank;

  db.serialize(() => {
    db.run(`
BEGIN TRANSACTION;
`);

    // Different update queries for the intermediate pictures
    // depending on whether new pic ranking
    // is moving up or down
    // ids go negative temporarily to avoid unique constraints
    db.run(
      upgradeRank
        ? `
UPDATE ranking
   SET rank = -rank - 1
 WHERE rank < ? AND
       rank >= ?;
`
        : `
UPDATE ranking
   SET rank = -rank + 1
 WHERE rank > ? AND
       rank <= ?;
`,
      req.body.originalRank,
      req.body.newRank
    );

    // Change rank and rankedOn of picture that is moving in rank
    db.run(
      `
UPDATE ranking
   SET rank = ?,
       rankedOn = ?
 WHERE rank = ?;
`,
      req.body.newRank,
      req.body.rankedOn,
      req.body.originalRank
    );

    // Put the rankings back to their positive selves
    db.run(
      `
UPDATE ranking
   SET rank = -rank
 WHERE rank < 0;
`
    );

    db.run(`
COMMIT TRANSACTION;
`);
    return res.json({
      message: 'success',
    });
  });
});

app.use((req, res) => {
  const errorMessage = `404: ${req.url} does not exist`;
  console.log(errorMessage);
  res.status(404).json({ error: errorMessage });
});
