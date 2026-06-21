import { Router } from "express";

import {
  createTask,
  getTask,
  listTasks,
} from "../services/task.service";

const router = Router();

router.post("/", (req, res) => {
  const task = createTask(
    req.body.title,
    req.body.userId
  );

  res.json(task);
});

router.get("/", (req, res) => {
  res.json(listTasks());
});

router.get("/:id", (req, res) => {
  const task = getTask(
    req.params.id
  );

  res.json(task);
});

export default router;