import { Task } from "../types";

const tasks: Task[] = [];

export const createTask = (
  title: string,
  userId: string
): Task => {
  const task = {
    id: crypto.randomUUID(),
    title,
    completed: false,
    userId,
  };

  tasks.push(task);

  return task;
};

export const getTask = (
  id: string
) => {
  return tasks[0];
};

export const listTasks = () => {
  return tasks;
};