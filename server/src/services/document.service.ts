import { AppError } from '../middleware/errorHandler';
import { uploadFile, deleteFile } from '../utils/supabase';
import { supabase } from '../utils/supabase';
import { generateFilePath } from '../middleware/upload';
import { getPaginationParams, buildPaginatedResponse } from '../utils/pagination';
import { PaginationQuery } from '../types';
const BUCKET = process.env.SUPABASE_BUCKET || 'soms-documents';

export async function uploadDocument(
  file: Express.Multer.File,
  uploadedById: string,
  title: string,
  description?: string,
  organizationId?: string,
  isPublic?: boolean
) {
  const filePath = generateFilePath(file.originalname, uploadedById);
  const fileUrl = await uploadFile(BUCKET, filePath, file.buffer, file.mimetype);

  const { data, error } = await supabase
    .from('documents')
    .insert({
      title,
      description: description ?? null,
      file_url: fileUrl,
      file_type: file.mimetype,
      file_size: file.size,
      uploaded_by_id: uploadedById,
      organization_id: organizationId ?? null,
      is_public: isPublic || false,
    })
    .select('id,title,description,file_url,file_type,file_size,uploaded_by_id,organization_id,is_public,created_at,uploadedBy:users(first_name,last_name)')
    .single();

  if (error || !data) throw new AppError(`Upload failed: ${error?.message || 'Unknown error'}`, 500);
  const d: any = data;
  return {
    id: d.id,
    title: d.title,
    description: d.description,
    fileUrl: d.file_url,
    fileType: d.file_type,
    fileSize: d.file_size,
    uploadedById: d.uploaded_by_id,
    organizationId: d.organization_id,
    isPublic: d.is_public,
    createdAt: d.created_at,
    uploadedBy: d.uploadedBy ? { firstName: d.uploadedBy.first_name, lastName: d.uploadedBy.last_name } : null,
  };
}

export async function listDocuments(
  userId: string,
  role: string,
  query: PaginationQuery & { orgId?: string }
) {
  const { page, limit, skip } = getPaginationParams(query);
  let q = supabase
    .from('documents')
    .select('id,title,description,file_url,file_type,file_size,uploaded_by_id,organization_id,is_public,created_at,uploadedBy:users(first_name,last_name),organization:organizations(name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(skip, skip + limit - 1);

  if (role !== 'ADMIN') q = q.or(`uploaded_by_id.eq.${userId},is_public.eq.true`);
  if (query.orgId) q = q.eq('organization_id', query.orgId);
  if (query.search) q = q.ilike('title', `%${query.search}%`);

  const { data, error, count } = await q;
  if (error) throw new AppError(`Document list failed: ${error.message}`, 500);

  const mapped = (data ?? []).map((d: any) => ({
    id: d.id,
    title: d.title,
    description: d.description,
    fileUrl: d.file_url,
    fileType: d.file_type,
    fileSize: d.file_size,
    uploadedById: d.uploaded_by_id,
    organizationId: d.organization_id,
    isPublic: d.is_public,
    createdAt: d.created_at,
    uploadedBy: d.uploadedBy ? { firstName: d.uploadedBy.first_name, lastName: d.uploadedBy.last_name } : null,
    organization: d.organization ? { name: d.organization.name } : null,
  }));

  return buildPaginatedResponse(mapped, count ?? 0, page, limit);
}

export async function deleteDocument(id: string, userId: string, role: string) {
  const { data: doc, error: findErr } = await supabase
    .from('documents')
    .select('id,file_url,uploaded_by_id')
    .eq('id', id)
    .maybeSingle();
  if (findErr) throw new AppError(`Delete failed: ${findErr.message}`, 500);
  const d: any = doc;
  if (!d) throw new AppError('Document not found', 404);
  if (role !== 'ADMIN' && d.uploaded_by_id !== userId) {
    throw new AppError('Not authorized to delete this document', 403);
  }

  const path = d.file_url.split('/').slice(-2).join('/');
  await deleteFile(BUCKET, path).catch(() => null); // best effort

  const { error } = await supabase.from('documents').delete().eq('id', id);
  if (error) throw new AppError(`Delete failed: ${error.message}`, 500);
  return { success: true };
}
