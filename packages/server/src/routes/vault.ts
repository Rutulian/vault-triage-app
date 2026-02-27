import { Router, type Request, type Response } from "express";
import { connectVault, getVaultStatus } from "../services/vault.js";

export const vaultRouter = Router();

/** POST /api/vault/connect */
vaultRouter.post("/connect", (req: Request, res: Response) => {
  const { path } = req.body as { path: unknown };

  if (typeof path !== "string" || path.length === 0) {
    res.status(400).json({ error: "path is required" });
    return;
  }

  try {
    const info = connectVault(path);
    res.json(info);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(400).json({ error: message });
  }
});

/** GET /api/vault/status */
vaultRouter.get("/status", (_req: Request, res: Response) => {
  const vault = getVaultStatus();
  res.json({ vault });
});
