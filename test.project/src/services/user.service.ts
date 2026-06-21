import { User } from "../types";

const users: User[] = [];

export const createUser = (
  name: string
): User => {
  const user = {
    id: crypto.randomUUID(),
    name,
  };

  users.push(user);

  return user;
};

export const getUser = (
  id: string
) => {
  return users.find(
    u => u.id === id
  );
};