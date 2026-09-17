import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({
    error: { message: "Route not found", code: "not_found" },
  });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        message: "Validation failed",
        code: "validation_error",
        details: err.flatten().fieldErrors,
      },
    });
  }

  if (err && typeof err === "object" && "statusCode" in err) {
    const statusCode = Number((err as { statusCode: number }).statusCode) || 500;
    const message =
      err instanceof Error ? err.message : "Request failed";

    return res.status(statusCode).json({
      error: { message, code: err instanceof Error ? err.name : "error" },
    });
  }

  console.error("Unhandled error:", err);

  return res.status(500).json({
    error: { message: "Internal server error", code: "internal_error" },
  });
}
