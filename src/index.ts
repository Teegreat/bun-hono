import { Hono } from "hono";
import { initDatabase } from "./database/db";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { loginUser, register } from "./controllers/auth";
import { jwt, sign } from "hono/jwt";
import type { JwtVariables } from "hono/jwt";
import {
  createTask,
  deleteTask,
  getAllTasks,
  getTask,
  updateTask,
} from "./controllers/task";

const app = new Hono();
const db = initDatabase();

// middleware
app.use("*", cors());
app.use("*", logger());

const auth = jwt({
  secret: process.env.JWT_SECRET || "JWT_SECRET",
  alg: "HS256",
});

// Input validation
const registerSchema = z.object({
  username: z
    .string()
    .min(1, "Username is required")
    .max(25, "Username is too long"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["user", "admin"]).optional(),
});

//login schema
const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

const taskSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional(),
  user_id: z.number().int().positive(),
});

// auth routes
app.post("/register-user", zValidator("json", registerSchema), (c) =>
  register(c, db),
);

app.post("/login", zValidator("json", loginSchema), (c) => loginUser(c, db));

// task routes
app.post("/tasks", auth, zValidator("json", taskSchema), (c) =>
  createTask(c, db),
);

app.get("/tasks", auth, (c) => getAllTasks(c, db));

app.get("/tasks/:id", auth, (c) => getTask(c, db));

app.put("/tasks/:id", auth, zValidator("json", taskSchema), (c) =>
  updateTask(c, db),
);

app.delete("/tasks/:id", auth, (c) => deleteTask(c, db));

app.get("/", (c) => {
  return c.text("Hello, User and Task management using Bun & Hono!");
});

app.get("/db-test", (c) => {
  const result = db.query("SELECT sqlite_version()").get();

  return c.json({
    message: "DB connected successfully",
    sqlite_version: result,
  });
});

export default app;
