import { Router } from "express";
import {
  createUser,
  getUser,
} from "../services/user.service";

const router = Router();

router.post("/", (req, res) => {
  const user = createUser(
    req.body.name
  );

  res.json(user);
});

router.get("/:id", (req, res) => {
  const user = getUser(
    req.params.id
  );

  res.json(user);
});

export default router;