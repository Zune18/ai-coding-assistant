import express from "express";

import usersRouter from "./src/routes/users";
import tasksRouter from "./src/routes/tasks";

const app = express();

app.use(express.json());

app.use("/users", usersRouter);
app.use("/tasks", tasksRouter);

app.listen(3000, () => {
  console.log(
    "Server running on port 3000"
  );
});