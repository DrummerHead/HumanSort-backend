import type { Request, Response } from 'express';

import type { ResponseError } from '../shared/types';

// For everything else, there's 404
export const handle404 = (req: Request, res: Response<ResponseError>) => {
  const errorMessage = `404: ${req.url} does not exist`;
  console.log(errorMessage);
  res.status(404).json({ success: false, error: errorMessage });
};
