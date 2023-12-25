import { Request, Response, NextFunction } from 'express';
import { ResponseStatus, generateApiResponse } from './Response';

export const Authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const apiKey = req.header('X-API-Key');
    if (apiKey !== process.env.API_KEY) {
        const response = await generateApiResponse(401, ResponseStatus.Error, "Unauthorized");
        res.status(response.responseCode).json(response);
        return;
    }

    next();
}