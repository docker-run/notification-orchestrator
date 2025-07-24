import * as express from "express";

export const wrapAsyncHandler = (
  cb: (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<void>
): express.Handler => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    return cb(req, res, next).catch((err) => next(err));
  };
};
