import { AppUser as User, InsertUser, Diploma, InsertDiploma, DiplomaSettings, InsertDiplomaSettings } from "@shared/schema";
import { supabase, pool } from "./db";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { createClient } from '@supabase/supabase-js';

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: number): Promise<void>;
  
  // Diplomas
  getDiplomas(): Promise<(Diploma & { student?: User })[]>;
  getDiploma(id: number): Promise<(Diploma & { student?: User }) | undefined>;
  getDiplomasByStudent(studentId: number): Promise<Diploma[]>;
  getDiplomaByCertificateId(certId: string): Promise<(Diploma & { student?: User }) | undefined>;
  createDiploma(diploma: InsertDiploma): Promise<Diploma>;
  updateDiploma(id: number, diploma: Partial<InsertDiploma>): Promise<Diploma>;
  // Diploma Settings
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

  // quick utility: convert camelCase object keys to snake_case recursively
  private toSnake(obj: any): any {
    if (Array.isArray(obj)) return obj.map((v) => this.toSnake(v));
    if (obj instanceof Date) return obj.toISOString();
    if (obj && typeof obj === 'object') {
      return Object.fromEntries(
        Object.entries(obj).map(([k, v]) => {
          const snake = k.replace(/([A-Z])/g, '_$1').toLowerCase();
          return [snake, this.toSnake(v)];
        }),
      );
    }
    return obj;
  }

  // convert snake_case keys returned from DB to camelCase recursively
  private toCamel(obj: any): any {
    if (Array.isArray(obj)) return obj.map((v) => this.toCamel(v));
    if (obj instanceof Date) return obj;
    if (obj && typeof obj === 'object') {
      return Object.fromEntries(
        Object.entries(obj).map(([k, v]) => {
          const camel = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
          return [camel, this.toCamel(v)];
        }),
      );
    }
    return obj;
  }

  async getUser(id: number): Promise<User | undefined> {
    const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
    if (error || !data) return undefined;
    return this.toCamel(data);
  }

  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw error;
    return this.toCamel(data || []);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await supabase.from('users').select('*').eq('username', username).single();
    if (error || !data) return undefined;
    return this.toCamel(data);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { data, error } = await supabase.from('users').select('*').eq('email', email).single();
    if (error || !data) return undefined;
    return this.toCamel(data);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const snake = this.toSnake(insertUser);
    console.debug("[storage] inserting user", snake);
    const { data, error } = await supabase.from('users').insert(snake).select().single();
    if (error) throw error;
    return this.toCamel(data);
  }

  async updateUser(id: number, update: Partial<InsertUser>): Promise<User> {
    const { data, error } = await supabase.from('users').update(this.toSnake(update)).eq('id', id).select().single();
    if (error) throw error;
    return this.toCamel(data);
  }

  async deleteUser(id: number): Promise<void> {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw error;
  }

  async getDiplomas(): Promise<(Diploma & { student?: User })[]> {
    const { data, error } = await supabase
      .from('diplomas')
      .select(`
        *,
        student:users(*)
      `);
    if (error) throw error;
    return this.toCamel(data || []);
  
  }

  async getDiploma(id: number): Promise<(Diploma & { student?: User }) | undefined> {
    const { data, error } = await supabase
      .from('diplomas')
      .select(`
        *,
        student:users(*)
      `)
      .eq('id', id)
      .single();
    if (error || !data) return undefined;
    return this.toCamel(data);
  
  }

  async getDiplomasByStudent(studentId: number): Promise<Diploma[]> {
    const { data, error } = await supabase.from('diplomas').select('*').eq('student_id', studentId);
    if (error) throw error;
    return this.toCamel(data || []);
  
  }

  async getDiplomaByCertificateId(certId: string): Promise<(Diploma & { student?: User }) | undefined> {
    const { data, error } = await supabase
      .from('diplomas')
      .select(`
        *,
        student:users(*)
      `)
      .eq('certificate_id', certId)
      .single();
    if (error || !data) return undefined;
    return this.toCamel(data);
  
  }

  async createDiploma(diploma: InsertDiploma): Promise<Diploma> {
    console.log('Creating diploma with data:', diploma);
    const snakeData = this.toSnake(diploma);
    console.log('Snake case data:', snakeData);
    const { data, error } = await supabase.from('diplomas').insert(snakeData).select().single();
    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    console.log('Inserted data:', data);
    return this.toCamel(data);
  }

  async updateDiploma(id: number, update: Partial<InsertDiploma>): Promise<Diploma> {
    const { data, error } = await supabase.from('diplomas').update(this.toSnake(update)).eq('id', id).select().single();
    if (error) throw error;
    return this.toCamel(data);
  }

  // Diploma Settings
  async getDiplomaSettings(): Promise<DiplomaSettings | undefined> {
    const { data, error } = await supabase.from('diploma_settings').select('*').single();
    if (error) return undefined;
    return data;
  }

  async updateDiplomaSettings(settings: InsertDiplomaSettings): Promise<DiplomaSettings> {
    const { data, error } = await supabase.from('diploma_settings').upsert(this.toSnake(settings)).select().single();
    if (error) throw error;
    return this.toCamel(data);
  }
}

export const storage = new DatabaseStorage();
