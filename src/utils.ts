import { Request, Response, NextFunction } from 'express';
import { promisify } from 'util';
import { randomBytes } from 'crypto';

export const randomBytesAsync = promisify(randomBytes);

const crypto = require('crypto');
const util = require('util');

const hashPassword = util.promisify(crypto.pbkdf2)

export function isInteger(input:string){
    return input?.match(/^\d+$/) ?? false;
}

export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch((err: any) => {
      console.error('Async error:', err);
      res.status(500).json({ error: err.message });
    });
  };
};

export async function calculatePasswordHash(
     plainTextPassword: string,
    passwordSalt: string,
){
  const passwordHash = await hashPassword(
      plainTextPassword,
      passwordSalt,
      10000,
      64,
      'sha512')

      return passwordHash.toString("hex");
}
