/*
 * ============= Database =============
 */

/*

CREATE TABLE pics (
  picId   INTEGER PRIMARY KEY,
  path    TEXT    NOT NULL UNIQUE,
  addedOn TEXT    NOT NULL
);

*/

type DateString = string;

export interface PicRow {
  picId: number;
  path: string;
  addedOn: DateString;
}

/*

CREATE TABLE ranking (
  rank     INTEGER PRIMARY KEY,
  picId    INTEGER NOT NULL UNIQUE,
  rankedOn TEXT    NOT NULL,
  FOREIGN KEY (
    picId
  )
  REFERENCES pics (picId) ON UPDATE CASCADE
                          ON DELETE CASCADE
);

*/

export interface RankRow {
  rank: number;
  picId: number;
  rankedOn: DateString;
}

/*
 * ============= Entities =============
 */

export type Rank = RankRow & Pick<PicRow, 'path'>;

export type RankShift = {
  newRank: number;
  originalRank: number;
} & Pick<RankRow, 'rankedOn'>;

export type Pic = Pick<PicRow, 'picId' | 'path'>;

/*
 * ============= API =============
 */

interface ResponseSuccess<P, E> {
  success: true;
  payload: P;
  meta: E;
}
export interface ResponseError {
  success: false;
  error: string;
}

/*
 * GET /api/v1/ranking
 *
 * Gets information of all the pics that have been ranked so far
 *
 */

// Response
export type RankingResponseSuccess = ResponseSuccess<Rank[], number>;
export type RankingResponse = RankingResponseSuccess | ResponseError;

/*
 * POST /api/v1/one-ranking
 *
 * Post a single ranking and add it to the rankings,
 * shift other rankings as necessary
 *
 */

// Request
export type OneRankingRequestBody = RankRow;

// Response
export type OneRankingResponseSuccess = ResponseSuccess<number, number>;
export type OneRankingResponse = OneRankingResponseSuccess | ResponseError;

/*
 * GET /api/v1/one-non-ranked
 *
 * Get a single not yet ranked pic
 *
 */

// Response
export type OneNonRankedResponseSuccess = ResponseSuccess<Pic, number>;
export type OneNonRankedResponse = OneNonRankedResponseSuccess | ResponseError;

/*
 * POST /api/v1/new-rank-order
 *
 * Change the existing order of ranking without adding a new pic
 * by getting the picId and the previous ranking and new ranking,
 * shifting rank of other pics as necessary
 *
 */

// Request
export type NewRankOrderRequestBody = RankShift;

// Response
// Apparently this one can't fail...
export type NewRankOrderResponseSuccess = ResponseSuccess<undefined, undefined>;
export type NewRankOrderResponse = NewRankOrderResponseSuccess;
