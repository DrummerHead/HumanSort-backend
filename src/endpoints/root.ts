import type { Request, Response } from 'express';

// homepage with cool message
export const rootGet = (req: Request, res: Response) => {
  console.log('get /');
  res.json({ message: 'all good mah dude' });
};
