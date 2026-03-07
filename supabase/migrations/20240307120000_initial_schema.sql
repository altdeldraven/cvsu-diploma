-- Create enum types
CREATE TYPE user_role AS ENUM ('admin', 'student');
CREATE TYPE diploma_status AS ENUM ('pending_clearance', 'cleared', 'issued');

-- Create users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role user_role DEFAULT 'student' NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  student_id TEXT,
  address TEXT,
  program TEXT,
  sex TEXT,
  latin_honor TEXT,
  graduation_year INTEGER,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create diplomas table
CREATE TABLE diplomas (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES users(id) NOT NULL,
  course TEXT NOT NULL,
  issue_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  grade TEXT,
  status diploma_status DEFAULT 'pending_clearance' NOT NULL,
  tx_hash TEXT,
  ipfs_hash TEXT,
  certificate_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create diploma_settings table
CREATE TABLE diploma_settings (
  id SERIAL PRIMARY KEY,
  campus_registrar TEXT NOT NULL,
  campus_administrator TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_diplomas_student_id ON diplomas(student_id);
CREATE INDEX idx_diplomas_certificate_id ON diplomas(certificate_id);
CREATE INDEX idx_diplomas_status ON diplomas(status);

-- Enable Row Level Security (RLS) if needed
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE diplomas ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE diploma_settings ENABLE ROW LEVEL SECURITY;