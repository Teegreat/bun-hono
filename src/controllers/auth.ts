import type { Context } from "hono";
import { Database } from "bun:sqlite";
import { User } from "../types";
import { password as bunPassword } from "bun";
import { sign } from "hono/jwt";

export async function register(c: Context, db: Database) {
  const { username, password, role = "user" } = await c.req.json();

  if (!username || !password) {
    return c.json({ error: "Username and password are required" }, 400);
  }

  if (role !== "user" && role !== "admin") {
    return c.json({ error: "Invalid role" }, 400);
  }

  try {
    const existingUser = db
      .query("SELECT * FROM users WHERE username  = ?")
      .get(username) as User | undefined;

    if (existingUser) {
      return c.json(
        {
          error:
            "User already exists with same username! Please try with a different username",
        },
        400,
      );
    }

    //hash the passowrd
    const hashedPassword = await bunPassword.hash(password);

    db.run("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", [
      username,
      hashedPassword,
      role,
    ]);

    return c.json(
      {
        message: "User registered successfully!",
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

// login
export async function loginUser(c: Context, db: Database) {
  const { username, password } = await c.req.json();

  if (!username || !password) {
    return c.json({ error: "Username and password are required" }, 400);
  }

  try {
    const user = db
      .query("SELECT * FROM users WHERE username = ?")
      .get(username) as User | undefined;

    if (!user) {
      return c.json(
        {
          error: "Invalid credentials",
        },
        401,
      );
    }

    // verify the password
    const isPasswordValid = await bunPassword.verify(password, user.password);

    if (!isPasswordValid) {
      return c.json(
        {
          error: "Invalid credentials",
        },
        401,
      );
    }

    // create token
    const token = await sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET || "JWT_SECRET",
    );

    return c.json({
      message: "Login successfull",
      token,
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
