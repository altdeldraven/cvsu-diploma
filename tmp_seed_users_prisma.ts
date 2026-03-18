import { PrismaClient } from "@prisma/client";
import { scrypt as _scrypt, randomBytes } from "crypto";
import dotenv from "dotenv";

dotenv.config();

const hashPassword = (password: string) =>
  new Promise<string>((resolve, reject) => {
    const salt = randomBytes(16).toString("hex");
    _scrypt(password, salt, 64, (err, derived) => {
      if (err) return reject(err);
      resolve(`${derived.toString("hex")}.${salt}`);
    });
  });

async function main() {
  const prisma = new PrismaClient({ accelerateUrl: process.env.DATABASE_URL });

  try {
    const adminHash = await hashPassword("admin123");
    await prisma.user.upsert({
      where: { username: "admin" },
      create: {
        username: "admin",
        password: adminHash,
        role: "admin",
        firstName: "Registrar",
        lastName: "Admin",
        email: "registrar@school.edu",
        isApproved: true,
      },
      update: {
        password: adminHash,
        firstName: "Registrar",
        lastName: "Admin",
        email: "registrar@school.edu",
        isApproved: true,
      },
    });

    const studentHash = await hashPassword("student123");
    await prisma.user.upsert({
      where: { username: "student" },
      create: {
        username: "student",
        password: studentHash,
        role: "student",
        firstName: "Alice",
        lastName: "Wonderland",
        email: "alice@student.edu",
        studentId: "2024-001",
        isApproved: true,
      },
      update: {
        password: studentHash,
        firstName: "Alice",
        lastName: "Wonderland",
        email: "alice@student.edu",
        studentId: "2024-001",
        isApproved: true,
      },
    });

    const users = await prisma.user.findMany({
      where: {
        username: { in: ["admin", "student"] },
      },
      select: { id: true, username: true, role: true, email: true, isApproved: true },
    });

    console.log(users);
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
