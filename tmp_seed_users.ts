import { scrypt as _scrypt, randomBytes } from "crypto";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const scrypt = (password: string) =>
  new Promise<string>((resolve, reject) => {
    const salt = randomBytes(16).toString("hex");
    _scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${derivedKey.toString("hex")}.${salt}`);
    });
  });

async function main() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL missing");

  const conn = raw.startsWith("prisma+postgres://")
    ? "postgres://" + raw.slice("prisma+postgres://".length)
    : raw;

  const pool = new pg.Pool({ connectionString: conn });
  const client = await pool.connect();
  try {
    const adminPass = await scrypt("admin123");
    await client.query(
      `INSERT INTO "User" (username,password,role,firstName,lastName,email,isApproved) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password`,
      ["admin", adminPass, "admin", "Registrar", "Admin", "registrar@school.edu", true],
    );

    const studentPass = await scrypt("student123");
    await client.query(
      `INSERT INTO "User" (username,password,role,firstName,lastName,email,studentId,isApproved) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password`,
      ["student", studentPass, "student", "Alice", "Wonderland", "alice@student.edu", "2024-001", true],
    );

    const users = await client.query(
      `SELECT id, username, role, email, "isApproved" FROM "User" WHERE username IN ($1,$2)`,
      ["admin", "student"],
    );
    console.log(users.rows);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
