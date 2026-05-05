export type User = {
  id: number;
  username: string;
  password: string;
  role: "user" | "admin";
};
