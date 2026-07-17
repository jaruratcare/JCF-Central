import { Router, type IRouter } from "express";
import { sbSelect, sbInsert, sbDelete, toCamel, toSnake } from "./supabase";
import { getProjectAccess, hasAtLeast } from "./lib/permissions";
import {
  ListCommentsParams,
  CreateCommentParams,
  CreateCommentBody,
  DeleteCommentParams,
} from "./api-zod";

const router: IRouter = Router();

async function itemProjectAccess(req: import("express").Request, itemId: number) {
  const items = await sbSelect("work_items", { id: `eq.${itemId}` });
  const item = items[0];
  if (!item) return { item: null, access: null } as const;
  const access = await getProjectAccess(req.user!, item.project_id as number);
  return { item, access } as const;
}

router.get("/items/:itemId/comments", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.itemId) ? req.params.itemId[0] : req.params.itemId;
  const params = ListCommentsParams.safeParse({ itemId: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const { item, access } = await itemProjectAccess(req, params.data.itemId);
  if (!item || !access) { res.status(404).json({ error: "Item not found" }); return; }
  const rows = await sbSelect("comments", {
    work_item_id: `eq.${params.data.itemId}`,
    order: "created_at.asc",
  });
  res.json(rows.map(toCamel));
});

router.post("/items/:itemId/comments", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.itemId) ? req.params.itemId[0] : req.params.itemId;
  const params = CreateCommentParams.safeParse({ itemId: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = CreateCommentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { item, access } = await itemProjectAccess(req, params.data.itemId);
  if (!item) { res.status(404).json({ error: "Item not found" }); return; }
  if (!hasAtLeast(access, "editor")) { res.status(403).json({ error: "Edit access required" }); return; }
  const row = await sbInsert("comments", toSnake({ ...parsed.data, workItemId: params.data.itemId } as Record<string, unknown>));
  res.status(201).json(toCamel(row));
});

router.delete("/comments/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteCommentParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const comments = await sbSelect("comments", { id: `eq.${params.data.id}` });
  if (!comments[0]) { res.status(404).json({ error: "Comment not found" }); return; }
  const { access } = await itemProjectAccess(req, comments[0].work_item_id as number);
  if (!hasAtLeast(access, "editor")) { res.status(403).json({ error: "Edit access required" }); return; }
  await sbDelete("comments", { id: `eq.${params.data.id}` });
  res.sendStatus(204);
});

export default router;
