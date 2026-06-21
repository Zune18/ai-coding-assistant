export interface User {
  id: string;
  name: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  userId: string;
}