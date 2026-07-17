import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";
import { z } from "zod";

const uuid = z.string().uuid();

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: result.error.flatten()
      });
    }

    req.body = result.data;
    next();
  };
}

export function validateParam(key: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = uuid.safeParse(req.params[key]);
    if (!result.success) {
      return res.status(400).json({ error: `Invalid ${key}` });
    }
    next();
  };
}
