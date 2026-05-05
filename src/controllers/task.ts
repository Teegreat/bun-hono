import type { Context } from "hono";
import { Database } from "bun:sqlite";
import { Task } from "../types";

export async function createTask(c: Context, db: Database) {
  const payload = c.get("jwtPayload") as {
    userId: number;
    username: string;
    role: "user" | "admin";
  };

  const userId = payload.userId;
  const userRole = payload.role;

  const { title, description, user_id } = await c.req.json();

  if (!userId) {
    return c.json(
      { error: "Unauthenticated! You need to login to create task" },
      401,
    );
  }

  if (userRole !== "admin") {
    return c.json(
      { error: "Unauthorized! Only Admin can created a task" },
      403,
    );
  }

  if (userId !== user_id) {
    return c.json({ error: "Unauthorized! Invalid User Id" }, 403);
  }

  try {
    const result = db
      .query(
        ` 
            INSERT INTO tasks (user_id, title, description) VALUES (?,?,?) RETURNING *
        `,
      )
      .get(userId, title, description) as Task;

    return c.json(
      {
        message: "Task created successfully",
        result,
      },
      201,
    );
  } catch (err) {
    console.error(err);
    return c.json(
      {
        error: "Internal server error",
      },
      500,
    );
  }
}

export async function getAllTasks(c: Context, db: Database) {
  try {
    const extractAllTasks = db.query("SELECT * FROM tasks").all() as Task[];

    return c.json(extractAllTasks, 200);
  } catch (err) {
    console.error(err);
    return c.json(
      {
        error: "Internal server error",
      },
      500,
    );
  }
}

export async function getTask(c: Context, db: Database) {
  const taskId = Number(c.req.param("id"));

  try {
    const extractSingleTask = db
      .query("SELECT * FROM tasks WHERE id =?")
      .get(taskId) as Task | undefined;

    if (!extractSingleTask) {
      return c.json({ error: "Task not found" }, 404);
    }

    return c.json(extractSingleTask, 200);
  } catch (err) {
    console.error(err);
    return c.json(
      {
        error: "Internal server error",
      },
      500,
    );
  }
}

export async function updateTask(c: Context, db: Database) {
  const payload = c.get("jwtPayload") as {
    userId: number;
    username: string;
    role: "user" | "admin";
  };

  const userId = payload.userId;
  const userRole = payload.role;
  const taskId = Number(c.req.param("id"));

  const { title, description, user_id } = await c.req.json();

  if (!userId) {
    return c.json(
      { error: "Unauthenticated! You need to login to create task" },
      401,
    );
  }

  if (userRole !== "admin") {
    return c.json({ error: "Unauthorized! Only Admin can update a task" }, 403);
  }

  if (userId !== user_id) {
    return c.json({ error: "Unauthorized! Invalid User Id" }, 403);
  }

  try {
    const extractExistingTask = db
      .query("SELECT * FROM tasks WHERE id=?")
      .get(taskId) as Task | undefined;

    if (!extractExistingTask) {
      return c.json({ error: "Task not found" }, 404);
    }

    const updatedTask = db
      .query(
        `
        UPDATE tasks
        SET title = ?, description = ?, user_id = ?
        WHERE id = ?
        RETURNING * 
        `,
      )
      .get(
        title || extractExistingTask.title,
        description || extractExistingTask.description,
        user_id || extractExistingTask.user_id,
        taskId,
      ) as Task;

    return c.json(
      {
        message: "Task updated successfully",
        updatedTask,
      },
      200,
    );
  } catch (err) {
    console.error(err);
    return c.json(
      {
        error: "Internal server error",
      },
      500,
    );
  }
}

export async function deleteTask(c: Context, db: Database) {
  const payload = c.get("jwtPayload") as {
    userId: number;
    username: string;
    role: "user" | "admin";
  };

  const userId = payload.userId;
  const userRole = payload.role;
  const taskId = Number(c.req.param("id"));

  const { title, description, user_id } = await c.req.json();

  if (!userId) {
    return c.json(
      { error: "Unauthenticated! You need to login to create task" },
      401,
    );
  }

  if (userRole !== "admin") {
    return c.json({ error: "Unauthorized! Only Admin can update a task" }, 403);
  }

  if (userId !== user_id) {
    return c.json({ error: "Unauthorized! Invalid User Id" }, 403);
  }

  try {
    const deletedTask = db.query("DELETE FROM tasks WHERE id=?").run(taskId);

    if (deletedTask.changes === 0) {
      return c.json({ error: "Task not found" }, 404);
    }

    return c.json({
      message: "Task deleted successfully",
      deletedTask,
    });
  } catch (err) {
    console.error(err);
    return c.json(
      {
        error: "Internal server error",
      },
      500,
    );
  }
}
