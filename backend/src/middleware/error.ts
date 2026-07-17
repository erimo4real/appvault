import type { NextFunction, Request, Response } from "express";
import { env } from "../lib/env.js";

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: "Route not found" });
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (env.NODE_ENV === "production") {
    console.error(error instanceof Error ? error.message : "Unknown error");
  } else {
    console.error(error);
  }
  res.status(500).json({ error: "Something went wrong" });
}
