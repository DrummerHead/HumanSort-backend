import type { Request, Response } from 'express';

import { db } from '../db/';
import type {
  OneRankingRequestBody,
  OneRankingResponse,
} from '../shared/types';

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
export const oneRankingPost = (
  req: OneRankingRequest,
  res: Response<OneRankingResponse>
) => {
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
};
