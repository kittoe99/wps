import type { Request, Response, NextFunction } from "express"

export function requireApiToken(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.API_TOKEN
  if (!expected) {
    next()
    return
  }

  const header = req.headers.authorization
  const token = header?.startsWith("Bearer ") ? header.slice(7) : req.headers["x-api-token"]

  if (token !== expected) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }
  next()
}
