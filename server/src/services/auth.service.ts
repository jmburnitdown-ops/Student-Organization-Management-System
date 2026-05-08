import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppError } from '../middleware/errorHandler';
import { JwtPayload } from '../types';
import { supabase } from '../utils/supabase';
import { PostgrestError } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  studentId?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

type DbUser = {
  id: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: 'ADMIN' | 'STUDENT';
  student_id: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
};

function mapPublicUser(user: DbUser) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    role: user.role,
    studentId: user.student_id,
    avatarUrl: user.avatar_url,
    bio: user.bio,
    createdAt: user.created_at,
  };
}

function generateTokens(payload: JwtPayload) {
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
  const refreshToken = jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });
  return { accessToken, refreshToken };
}

function mapDbError(err: PostgrestError | null, action: 'Registration' | 'Login' | 'Profile' | 'Refresh'): AppError {
  if (!err) return new AppError(`${action} failed: Unknown error`, 500);

  const missingPasswordColumn =
    err.message.includes("Could not find the 'password' column of 'users' in the schema cache") ||
    err.message.includes('column "password" does not exist');

  if (missingPasswordColumn) {
    return new AppError(
      `${action} failed: database schema is missing users.password. Run the SQL fix script (soms-supabase-fix.sql) in Supabase SQL Editor, then retry.`,
      500
    );
  }

  return new AppError(`${action} failed: ${err.message}`, 500);
}

export async function registerUser(dto: RegisterDto) {
  const { data: existingByEmail, error: emailErr } = await supabase
    .from('users')
    .select('id')
    .eq('email', dto.email)
    .maybeSingle();
  if (emailErr) throw mapDbError(emailErr, 'Registration');
  if (existingByEmail) throw new AppError('Email already registered', 409);

  if (dto.studentId) {
    const { data: existingByStudentId, error: sidErr } = await supabase
      .from('users')
      .select('id')
      .eq('student_id', dto.studentId)
      .maybeSingle();
    if (sidErr) throw mapDbError(sidErr, 'Registration');
    if (existingByStudentId) throw new AppError('Student ID already in use', 409);
  }

  const hashed = await bcrypt.hash(dto.password, 12);
  const { data: inserted, error: insertErr } = await supabase
    .from('users')
    .insert({
      email: dto.email,
      password: hashed,
      first_name: dto.firstName,
      last_name: dto.lastName,
      student_id: dto.studentId || null,
    })
    .select('id, email, first_name, last_name, role, student_id, avatar_url, bio, created_at')
    .single();

  if (insertErr || !inserted) {
    // Log raw Supabase/PostgREST error for debugging (not exposing service key)
    logger.error('User insert failed', { error: insertErr });
    throw mapDbError(insertErr, 'Registration');
  }

  const user = inserted as DbUser;
  const tokens = generateTokens({ id: user.id, email: user.email, role: user.role });
  return { user: mapPublicUser(user), ...tokens };
}

export async function loginUser(dto: LoginDto) {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, password, first_name, last_name, role, student_id, avatar_url, bio, created_at')
    .eq('email', dto.email)
    .maybeSingle();
  if (error) throw mapDbError(error, 'Login');
  if (!data) throw new AppError('Invalid credentials', 401);

  const user = data as DbUser;
  const valid = await bcrypt.compare(dto.password, user.password);
  if (!valid) throw new AppError('Invalid credentials', 401);

  const tokens = generateTokens({ id: user.id, email: user.email, role: user.role });
  return { user: mapPublicUser(user), ...tokens };
}

export async function refreshTokens(token: string) {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    const { data, error } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', payload.id)
      .maybeSingle();
    if (error) throw mapDbError(error, 'Refresh');
    if (!data) throw new AppError('User not found', 404);
    const user = data as Pick<DbUser, 'id' | 'email' | 'role'>;
    return generateTokens({ id: user.id, email: user.email, role: user.role });
  } catch {
    throw new AppError('Invalid refresh token', 401);
  }
}

export async function getMe(userId: string) {
  const { data: userData, error: userErr } = await supabase
    .from('users')
    .select('id, email, first_name, last_name, role, avatar_url, bio, student_id, created_at')
    .eq('id', userId)
    .maybeSingle();
  if (userErr) throw mapDbError(userErr, 'Profile');
  if (!userData) throw new AppError('User not found', 404);

  const { count, error: countErr } = await supabase
    .from('memberships')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (countErr) throw mapDbError(countErr, 'Profile');

  const user = userData as DbUser;
  return {
    ...mapPublicUser(user),
    _count: { memberships: count || 0 },
  };
}
