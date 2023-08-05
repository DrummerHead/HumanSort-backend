import type { Request, Response } from 'express';

import { db } from '../db/';

import { picsFolder } from '../index';
import { getRandItem } from '../util/';
import type { Pic, OneNonRankedResponse } from '../shared/types';

/*
 * GET /api/v1/one-non-ranked
 *
 * Get a single not yet ranked pic
 *
 */
export const oneNonRankedGet = (
  req: Request,
  res: Response<OneNonRankedResponse>
) => {
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
};
