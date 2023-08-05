import type { Request, Response } from 'express';

import { db } from '../db/';

import type {
  NewRankOrderRequestBody,
  NewRankOrderResponse,
} from '../shared/types';

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
export const newRankOrderPost = (
  req: NewRankOrderRequest,
  res: Response<NewRankOrderResponse>
) => {
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
};
