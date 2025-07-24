import * as express from 'express';

export function errorHandlerMiddleware(): express.ErrorRequestHandler {
  return (err: Error, req: express.Request, res: express.Response, next: express.NextFunction): void => {
    const { status, message, stack } = err as any;
    res.set('X-Formatted-Error-Object', '1').status(status || 500).json({ message, stack });
  }
}

