import express from 'express';
import sqlite3 from 'sqlite3';
import process from 'process';
import path from 'path';
import bodyParser from 'body-parser';

import type { Express, Request, Response } from 'express';
import type {
  Rank,
  Pic,
  RankingResponse,
  OneRankingRequestBody,
  OneRankingResponse,
  OneNonRankedResponse,
  NewRankOrderRequestBody,
  NewRankOrderResponse,
  ResponseError,
} from './shared/types';
import type { Database } from 'sqlite3';

const app: Express = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const picsFolder = '/pics/';

const getAbsolutePath = (relativePath: string) =>
  path.join(process.cwd(), relativePath);

app.use(picsFolder, express.static(getAbsolutePath(picsFolder)));

const port = 7777;
app.listen(port, () => {
  console.log(`Runnin' like crazy on ${port}`);
});

const db: Database = new (sqlite3.verbose().Database)(
  getAbsolutePath('/db/comparo.db'),
  (err) => {
    if (err) {
      console.error(err.message);
      throw err;
    } else {
      db.run('PRAGMA foreign_keys = ON;');
      console.log('Connected to database comparo.db');
    }
  }
);

const addPicPath = (pic: Rank) => ({
  ...pic,
  path: `${picsFolder}${pic.path}`,
});

// homepage with cool message
app.get('/', (req: Request, res: Response) => {
  console.log('get /');
  res.json({ message: 'all good mah dude' });
});

/*
 * GET /api/v1/ranking
 *
 * Gets information of all the pics that have been ranked so far
 *
 */
app.get('/api/v1/ranking', (req: Request, res: Response<RankingResponse>) => {
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
    function (err, rows: Rank[]) {
      if (err) {
        console.log(err.message);
        return res.status(400).json({ success: false, error: err.message });
      }
      res.json({
        success: true,
        payload: rows.map(addPicPath),
        meta: rows.length,
      });
    }
  );
});

/*
 * POST /api/v1/one-ranking
 *
 * Post a single ranking and add it to the rankings,
 * shift other rankings as necessary
 *
 */
interface OneRankingRequest extends Request {
  body: OneRankingRequestBody;
}
app.post(
  '/api/v1/one-ranking',
  (req: OneRankingRequest, res: Response<OneRankingResponse>) => {
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

      statement.run(
        req.body.rank,
        req.body.picId,
        req.body.rankedOn,
        (err: Error | null) => {
          if (err) {
            console.error('When trying to insert');
            console.error(req.body);
            console.error(err.message);
            console.error('Rolling back transaction');
            // this is not gonna work
            // https://github.com/TryGhost/node-sqlite3/issues/304
            // it seems I should be using better-sqlite
            // https://github.com/WiseLibs/better-sqlite3
            db.run(`
ROLLBACK TRANSACTION;
`);
            return res.status(400).json({ success: false, error: err.message });
          }
        }
      );
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
        (err, row: { rankedAmount: number }) => {
          if (err) {
            console.log(err.message);
            return res.status(400).json({ success: false, error: err.message });
          }
          console.log('count rankings:');
          console.log(row.rankedAmount);
          return res.json({
            success: true,
            payload: row.rankedAmount,
            meta: row.rankedAmount,
          });
        }
      );
    });
  }
);

const randInt = (lessthan: number) => Math.floor(Math.random() * lessthan);
const getRandItem = <T>(array: T[]): T => array[randInt(array.length)];

/*
 * GET /api/v1/one-non-ranked
 *
 * Get a single not yet ranked pic
 *
 */
app.get(
  '/api/v1/one-non-ranked',
  (req: Request, res: Response<OneNonRankedResponse>) => {
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
      function (err, rows: Pic[]) {
        if (err) {
          console.log(err.message);
          return res.status(400).json({ success: false, error: err.message });
        }
        console.log('GET /api/v1/one-non-ranked');
        if (rows.length === 0) {
          console.log('no more pictures to rank!');
          return res.json({
            success: true,
            payload: { path: '', picId: -7 },
            meta: rows.length,
          });
        }
        const oneNonRanked = getRandItem(rows);
        console.log(oneNonRanked);
        res.json({
          success: true,
          payload: {
            ...oneNonRanked,
            path: `${picsFolder}${oneNonRanked.path}`,
          },
          meta: rows.length,
        });
      }
    );
  }
);

/*
 * POST /api/v1/new-rank-order
 *
 * Change the existing order of ranking without adding a new pic
 * by getting the picId and the previous ranking and new ranking,
 * shifting rank of other pics as necessary
 *
 */
interface NewRankOrderRequest extends Request {
  body: NewRankOrderRequestBody;
}
app.post(
  '/api/v1/new-rank-order',
  (req: NewRankOrderRequest, res: Response<NewRankOrderResponse>) => {
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
      // TODO: refactor this, consider checking out what's inside `this` of a db callback and sending some of that
      return res.json({
        success: true,
        payload: undefined,
        meta: undefined,
      });
    });
  }
);

// For everything else, there's 404
app.use((req: Request, res: Response<ResponseError>) => {
  const errorMessage = `404: ${req.url} does not exist`;
  console.log(errorMessage);
  res.status(404).json({ success: false, error: errorMessage });
});
