import { AppError } from '../middleware/errorHandler';
import { getPaginationParams, buildPaginatedResponse } from '../utils/pagination';
import { PaginationQuery } from '../types';
import { supabase } from '../utils/supabase';

export interface CreateOrgDto {
  name: string;
  description?: string;
  category: string;
  logoUrl?: string;
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
}

export async function listOrganizations(query: PaginationQuery & { category?: string }) {
  const { page, limit, skip } = getPaginationParams(query);
  let q = supabase
    .from('organizations')
    .select('id,name,slug,description,logo_url,category,is_active,created_at', { count: 'exact' })
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(skip, skip + limit - 1);

  if (query.search) q = q.or(`name.ilike.%${query.search}%,description.ilike.%${query.search}%`);
  if (query.category) q = q.eq('category', query.category);

  const { data, error, count } = await q;
  if (error) throw new AppError(`Failed to list organizations: ${error.message}`, 500);

  const rows = data ?? [];
  const enriched = await Promise.all(
    rows.map(async (org) => {
      const [{ count: members }, { count: events }] = await Promise.all([
        supabase.from('memberships').select('id', { count: 'exact', head: true }).eq('organization_id', org.id),
        supabase.from('events').select('id', { count: 'exact', head: true }).eq('organization_id', org.id),
      ]);

      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        description: org.description,
        logoUrl: org.logo_url,
        category: org.category,
        isActive: org.is_active,
        createdAt: org.created_at,
        _count: { memberships: members ?? 0, events: events ?? 0 },
      };
    })
  );

  return buildPaginatedResponse(enriched, count ?? 0, page, limit);
}

export async function getOrganizationById(id: string) {
  const { data: org, error } = await supabase
    .from('organizations')
    .select('id,name,slug,description,logo_url,category,is_active,created_by_id,created_at')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new AppError(`Failed to fetch organization: ${error.message}`, 500);
  if (!org) throw new AppError('Organization not found', 404);

  const [creatorRes, memberCountRes, eventCountRes, docCountRes, upcomingEventsRes] = await Promise.all([
    org.created_by_id
      ? supabase.from('users').select('first_name,last_name,email').eq('id', org.created_by_id).maybeSingle()
      : Promise.resolve({ data: null, error: null } as any),
    supabase.from('memberships').select('id', { count: 'exact', head: true }).eq('organization_id', id),
    supabase.from('events').select('id', { count: 'exact', head: true }).eq('organization_id', id),
    supabase.from('documents').select('id', { count: 'exact', head: true }).eq('organization_id', id),
    supabase
      .from('events')
      .select('id,title,description,location,start_date,end_date,status,organization_id,created_at')
      .eq('organization_id', id)
      .eq('status', 'UPCOMING')
      .order('start_date', { ascending: true })
      .limit(3),
  ]);

  if (creatorRes.error || memberCountRes.error || eventCountRes.error || docCountRes.error || upcomingEventsRes.error) {
    const parts = [
      creatorRes.error?.message,
      memberCountRes.error?.message,
      eventCountRes.error?.message,
      docCountRes.error?.message,
      upcomingEventsRes.error?.message,
    ].filter(Boolean);
    throw new AppError(`Failed to fetch organization details: ${parts.join(' | ')}`, 500);
  }

  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    description: org.description,
    logoUrl: org.logo_url,
    category: org.category,
    isActive: org.is_active,
    createdAt: org.created_at,
    createdBy: creatorRes.data
      ? {
          firstName: creatorRes.data.first_name,
          lastName: creatorRes.data.last_name,
          email: creatorRes.data.email,
        }
      : null,
    _count: {
      memberships: memberCountRes.count ?? 0,
      events: eventCountRes.count ?? 0,
      documents: docCountRes.count ?? 0,
    },
    events: (upcomingEventsRes.data ?? []).map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      location: e.location,
      startDate: e.start_date,
      endDate: e.end_date,
      status: e.status,
      organizationId: e.organization_id,
      createdAt: e.created_at,
    })),
  };
}

export async function createOrganization(dto: CreateOrgDto, createdById: string) {
  const slug = slugify(dto.name);
  const { data: existing, error: existingErr } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  if (existingErr) throw new AppError(`Failed to validate organization: ${existingErr.message}`, 500);
  if (existing) throw new AppError('Organization name already taken', 409);

  const { data: created, error: createErr } = await supabase
    .from('organizations')
    .insert({
      name: dto.name,
      slug,
      description: dto.description ?? null,
      category: dto.category,
      logo_url: dto.logoUrl ?? null,
      created_by_id: createdById,
    })
    .select('id,name,slug,description,logo_url,category,is_active,created_at')
    .single();
  if (createErr || !created) throw new AppError(`Failed to create organization: ${createErr?.message || 'Unknown error'}`, 500);

  return {
    id: created.id,
    name: created.name,
    slug: created.slug,
    description: created.description,
    logoUrl: created.logo_url,
    category: created.category,
    isActive: created.is_active,
    createdAt: created.created_at,
  };
}

export async function updateOrganization(id: string, dto: Partial<CreateOrgDto>) {
  const { data: org, error: findErr } = await supabase.from('organizations').select('id').eq('id', id).maybeSingle();
  if (findErr) throw new AppError(`Failed to update organization: ${findErr.message}`, 500);
  if (!org) throw new AppError('Organization not found', 404);

  const payload: any = {};
  if (dto.name !== undefined) payload.name = dto.name;
  if (dto.description !== undefined) payload.description = dto.description;
  if (dto.category !== undefined) payload.category = dto.category;
  if (dto.logoUrl !== undefined) payload.logo_url = dto.logoUrl;
  if (dto.name) payload.slug = slugify(dto.name);

  const { data, error } = await supabase
    .from('organizations')
    .update(payload)
    .eq('id', id)
    .select('id,name,slug,description,logo_url,category,is_active,created_at')
    .single();
  if (error || !data) throw new AppError(`Failed to update organization: ${error?.message || 'Unknown error'}`, 500);

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    logoUrl: data.logo_url,
    category: data.category,
    isActive: data.is_active,
    createdAt: data.created_at,
  };
}

export async function deleteOrganization(id: string) {
  const { data, error } = await supabase
    .from('organizations')
    .update({ is_active: false })
    .eq('id', id)
    .select('id')
    .maybeSingle();
  if (error) throw new AppError(`Failed to deactivate organization: ${error.message}`, 500);
  if (!data) throw new AppError('Organization not found', 404);
  return data;
}

export async function getOrgMembers(orgId: string, query: PaginationQuery & { status?: string }) {
  const { page, limit, skip } = getPaginationParams(query);
  let q = supabase
    .from('memberships')
    .select('id,user_id,organization_id,status,role,joined_at,created_at,user:users(id,first_name,last_name,email,avatar_url,student_id)', { count: 'exact' })
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .range(skip, skip + limit - 1);

  if (query.status) q = q.eq('status', query.status);
  const { data, error, count } = await q;
  if (error) throw new AppError(`Failed to fetch members: ${error.message}`, 500);

  const mapped = (data ?? []).map((m: any) => ({
    id: m.id,
    userId: m.user_id,
    organizationId: m.organization_id,
    status: m.status,
    role: m.role,
    joinedAt: m.joined_at,
    createdAt: m.created_at,
    user: m.user
      ? {
          id: m.user.id,
          firstName: m.user.first_name,
          lastName: m.user.last_name,
          email: m.user.email,
          avatarUrl: m.user.avatar_url,
          studentId: m.user.student_id,
        }
      : null,
  }));

  return buildPaginatedResponse(mapped, count ?? 0, page, limit);
}
