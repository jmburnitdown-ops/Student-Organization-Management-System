import { AppError } from '../middleware/errorHandler';
import { getPaginationParams, buildPaginatedResponse } from '../utils/pagination';
import { PaginationQuery } from '../types';
import { supabase } from '../utils/supabase';

export interface CreateEventDto {
  title: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate: string;
  maxAttendees?: number;
  organizationId: string;
  imageUrl?: string;
}

export async function listEvents(query: PaginationQuery & { status?: string; orgId?: string }) {
  const { page, limit, skip } = getPaginationParams(query);
  let q = supabase
    .from('events')
    .select('id,title,description,location,start_date,end_date,status,image_url,max_attendees,organization_id,created_at,organization:organizations(id,name,logo_url)', { count: 'exact' })
    .order('start_date', { ascending: true })
    .range(skip, skip + limit - 1);

  if (query.search) q = q.or(`title.ilike.%${query.search}%,description.ilike.%${query.search}%`);
  if (query.status) q = q.eq('status', query.status);
  if (query.orgId) q = q.eq('organization_id', query.orgId);

  const { data, error, count } = await q;
  if (error) throw new AppError(`Failed to list events: ${error.message}`, 500);

  const mapped = (data ?? []).map((e: any) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    location: e.location,
    startDate: e.start_date,
    endDate: e.end_date,
    status: e.status,
    imageUrl: e.image_url,
    maxAttendees: e.max_attendees,
    organizationId: e.organization_id,
    createdAt: e.created_at,
    organization: e.organization
      ? { id: e.organization.id, name: e.organization.name, logoUrl: e.organization.logo_url }
      : null,
  }));

  return buildPaginatedResponse(mapped, count ?? 0, page, limit);
}

export async function getEventById(id: string) {
  const { data, error } = await supabase
    .from('events')
    .select('id,title,description,location,start_date,end_date,status,image_url,max_attendees,organization_id,created_at,organization:organizations(id,name,logo_url)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new AppError(`Failed to fetch event: ${error.message}`, 500);
  const event: any = data;
  if (!event) throw new AppError('Event not found', 404);
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    location: event.location,
    startDate: event.start_date,
    endDate: event.end_date,
    status: event.status,
    imageUrl: event.image_url,
    maxAttendees: event.max_attendees,
    organizationId: event.organization_id,
    createdAt: event.created_at,
    organization: event.organization
      ? { id: event.organization.id, name: event.organization.name, logoUrl: event.organization.logo_url }
      : null,
  };
}

export async function createEvent(dto: CreateEventDto) {
  const { data: org, error: orgErr } = await supabase.from('organizations').select('id').eq('id', dto.organizationId).maybeSingle();
  if (orgErr) throw new AppError(`Failed to validate organization: ${orgErr.message}`, 500);
  if (!org) throw new AppError('Organization not found', 404);

  const { data, error } = await supabase
    .from('events')
    .insert({
      title: dto.title,
      description: dto.description ?? null,
      location: dto.location ?? null,
      start_date: dto.startDate,
      end_date: dto.endDate,
      max_attendees: dto.maxAttendees ?? null,
      organization_id: dto.organizationId,
      image_url: dto.imageUrl ?? null,
    })
    .select('id,title,description,location,start_date,end_date,status,image_url,max_attendees,organization_id,created_at')
    .single();
  if (error || !data) throw new AppError(`Failed to create event: ${error?.message || 'Unknown error'}`, 500);
  return {
    id: data.id,
    title: data.title,
    description: data.description,
    location: data.location,
    startDate: data.start_date,
    endDate: data.end_date,
    status: data.status,
    imageUrl: data.image_url,
    maxAttendees: data.max_attendees,
    organizationId: data.organization_id,
    createdAt: data.created_at,
  };
}

export async function updateEvent(id: string, dto: Partial<CreateEventDto>) {
  const { data: event, error: findErr } = await supabase.from('events').select('id').eq('id', id).maybeSingle();
  if (findErr) throw new AppError(`Failed to update event: ${findErr.message}`, 500);
  if (!event) throw new AppError('Event not found', 404);

  const payload: any = {};
  if (dto.title !== undefined) payload.title = dto.title;
  if (dto.description !== undefined) payload.description = dto.description;
  if (dto.location !== undefined) payload.location = dto.location;
  if (dto.startDate !== undefined) payload.start_date = dto.startDate;
  if (dto.endDate !== undefined) payload.end_date = dto.endDate;
  if (dto.maxAttendees !== undefined) payload.max_attendees = dto.maxAttendees;
  if (dto.organizationId !== undefined) payload.organization_id = dto.organizationId;
  if (dto.imageUrl !== undefined) payload.image_url = dto.imageUrl;

  const { data, error } = await supabase
    .from('events')
    .update(payload)
    .eq('id', id)
    .select('id,title,description,location,start_date,end_date,status,image_url,max_attendees,organization_id,created_at')
    .single();
  if (error || !data) throw new AppError(`Failed to update event: ${error?.message || 'Unknown error'}`, 500);
  return {
    id: data.id,
    title: data.title,
    description: data.description,
    location: data.location,
    startDate: data.start_date,
    endDate: data.end_date,
    status: data.status,
    imageUrl: data.image_url,
    maxAttendees: data.max_attendees,
    organizationId: data.organization_id,
    createdAt: data.created_at,
  };
}

export async function deleteEvent(id: string) {
  const { data: event, error: findErr } = await supabase.from('events').select('id').eq('id', id).maybeSingle();
  if (findErr) throw new AppError(`Failed to delete event: ${findErr.message}`, 500);
  if (!event) throw new AppError('Event not found', 404);
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw new AppError(`Failed to delete event: ${error.message}`, 500);
  return { success: true };
}
