import express from 'express';
import bodyParser from 'body-parser';
import type { Express } from 'express';

import { rootGet } from './endpoints/root';
import { rankingGet } from './endpoints/ranking';
import { oneRankingPost } from './endpoints/one-ranking';
import { oneNonRankedGet } from './endpoints/one-non-ranked';
import { newRankOrderPost } from './endpoints/new-rank-order';
import { handle404 } from './endpoints/404';
import { getAbsolutePath } from './util/';

const app: Express = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Serve static assets from pics folder
export const picsFolder = '/pics/';
app.use(picsFolder, express.static(getAbsolutePath(picsFolder)));

const port = 7777;
app.listen(port, () => {
  console.log(`Runnin' like crazy on ${port}`);
});

// Sanity check root message
app.get('/', rootGet);

/*
 * GET /api/v1/ranking
 *
 * Gets information of all the pics that have been ranked so far
 *
 */
app.get('/api/v1/ranking', rankingGet);

/*
 * POST /api/v1/one-ranking
 *
 * Post a single ranking and add it to the rankings,
 * shift other rankings as necessary
 *
 */
app.post('/api/v1/one-ranking', oneRankingPost);

/*
 * GET /api/v1/one-non-ranked
 *
 * Get a single not yet ranked pic
 *
 */
app.get('/api/v1/one-non-ranked', oneNonRankedGet);

/*
 * POST /api/v1/new-rank-order
 *
 * Change the existing order of ranking without adding a new pic
 * by getting the picId and the previous ranking and new ranking,
 * shifting rank of other pics as necessary
 *
 */
app.post('/api/v1/new-rank-order', newRankOrderPost);

// For everything else, there's 404
app.use(handle404);
