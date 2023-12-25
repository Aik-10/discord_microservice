import { Response } from 'express';

export const InvalidRoute = async ({ res }: { res: Response }) => {
    res.status(400).send({ status: 400, message: 'Invalid route.' });
};