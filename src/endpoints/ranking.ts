import type { Request, Response } from 'express';

import { db } from '../db/';
import type { RankingResponse, Rank } from '../shared/types';

import { addPicPath } from '../util/';

/*
 * GET /api/v1/ranking
 *
 * Gets information of all the pics that have been ranked so far
 *
 */
export const rankingGet = (req: Request, res: Response<RankingResponse>) => {
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
};
