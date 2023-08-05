import path from 'path';

import { picsFolder } from '../index';
import type { Rank } from '../shared/types';

export const getAbsolutePath = (relativePath: string) =>
  path.join(process.cwd(), relativePath);

export const addPicPath = (pic: Rank) => ({
  ...pic,
  path: `${picsFolder}${pic.path}`,
});

export const randInt = (lessthan: number) =>
  Math.floor(Math.random() * lessthan);

export const getRandItem = <T>(array: T[]): T => array[randInt(array.length)];
