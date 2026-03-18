import session from "express-session";
import { AppUser as User, InsertUser, Diploma, InsertDiploma, DiplomaSettings, InsertDiplomaSettings } from "@shared/schema";
import { prisma, pool } from "./db";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: number): Promise<void>;
  getDiplomas(): Promise<(Diploma & { student?: User })[]>;
  getDiploma(id: number): Promise<(Diploma & { student?: User }) | undefined>;
  getDiplomasByStudent(studentId: number): Promise<Diploma[]>;
  getDiplomaByCertificateId(certId: string): Promise<(Diploma & { student?: User }) | undefined>;
  createDiploma(diploma: InsertDiploma): Promise<Diploma>;
  updateDiploma(id: number, diploma: Partial<InsertDiploma>): Promise<Diploma>;
  getDiplomaSettings(): Promise<DiplomaSettings | undefined>;
  updateDiplomaSettings(settings: InsertDiplomaSettings): Promise<DiplomaSettings>;
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  private toAppUser(user: any): User {
    return {
      ...user,
      role: user.role as "admin" | "student",
      createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
    };
  }

  private toDiploma(diploma: any): Diploma {
    return {
      ...diploma,
      issueDate: diploma.issueDate instanceof Date ? diploma.issueDate.toISOString() : diploma.issueDate,
      createdAt: diploma.createdAt instanceof Date ? diploma.createdAt.toISOString() : diploma.createdAt,
    };
  }

  async getUser(id: number): Promise<User | undefined> {
    const user = await prisma.user.findUnique({ where: { id } });
    return user ? this.toAppUser(user) : undefined;
  }

  async getUsers(): Promise<User[]> {
    const users = await prisma.user.findMany();
    return users.map((u) => this.toAppUser(u));
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const user = await prisma.user.findUnique({ where: { username } });
    return user ? this.toAppUser(user) : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const user = await prisma.user.findUnique({ where: { email } });
    return user ? this.toAppUser(user) : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user = await prisma.user.create({ data: insertUser });
    return this.toAppUser(user);
  }

  async updateUser(id: number, update: Partial<InsertUser>): Promise<User> {
    const user = await prisma.user.update({ where: { id }, data: update });
    return this.toAppUser(user);
  }

  async deleteUser(id: number): Promise<void> {
    await prisma.user.delete({ where: { id } });
  }

  async getDiplomas(): Promise<(Diploma & { student?: User })[]> {
    const diplomas = await prisma.diploma.findMany({ include: { student: true } });
    return diplomas.map((d) => ({
      ...this.toDiploma(d),
      student: d.student ? this.toAppUser(d.student) : undefined,
    }));
  }

  async getDiploma(id: number): Promise<(Diploma & { student?: User }) | undefined> {
    const diploma = await prisma.diploma.findUnique({ where: { id }, include: { student: true } });
    if (!diploma) return undefined;
    return {
      ...this.toDiploma(diploma),
      student: diploma.student ? this.toAppUser(diploma.student) : undefined,
    };
  }

  async getDiplomasByStudent(studentId: number): Promise<Diploma[]> {
    const diplomas = await prisma.diploma.findMany({ where: { studentId } });
    return diplomas.map((d) => this.toDiploma(d));
  }

  async getDiplomaByCertificateId(certId: string): Promise<(Diploma & { student?: User }) | undefined> {
    const diploma = await prisma.diploma.findFirst({ where: { certificateId: certId }, include: { student: true } });
    if (!diploma) return undefined;
    return {
      ...this.toDiploma(diploma),
      student: diploma.student ? this.toAppUser(diploma.student) : undefined,
    };
  }

  async createDiploma(diploma: InsertDiploma): Promise<Diploma> {
    const created = await prisma.diploma.create({
      data: {
        ...diploma,
        issueDate: diploma.issueDate ?? new Date(),
      },
    });
    return this.toDiploma(created);
  }

  async updateDiploma(id: number, update: Partial<InsertDiploma>): Promise<Diploma> {
    const updated = await prisma.diploma.update({ where: { id }, data: update });
    return this.toDiploma(updated);
  }

  async getDiplomaSettings(): Promise<DiplomaSettings | undefined> {
    const settings = await prisma.diplomaSettings.findFirst();
    if (!settings) return undefined;
    return {
      ...settings,
      updatedAt: settings.updatedAt instanceof Date ? settings.updatedAt.toISOString() : settings.updatedAt,
    };
  }

  async updateDiplomaSettings(settings: InsertDiplomaSettings): Promise<DiplomaSettings> {
    // upsert with single row assumption
    const existing = await prisma.diplomaSettings.findFirst();
    if (existing) {
      const updated = await prisma.diplomaSettings.update({ where: { id: existing.id }, data: settings });
      return {
        ...updated,
        updatedAt: updated.updatedAt instanceof Date ? updated.updatedAt.toISOString() : updated.updatedAt,
      };
    }
    const created = await prisma.diplomaSettings.create({ data: settings });
    return {
      ...created,
      updatedAt: created.updatedAt instanceof Date ? created.updatedAt.toISOString() : created.updatedAt,
    };
  }
}

export const storage = new DatabaseStorage();
