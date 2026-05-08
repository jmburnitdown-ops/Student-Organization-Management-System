import { AppError } from '../middleware/errorHandler';
import { supabase } from '../utils/supabase';

export async function joinOrganization(userId: string, orgId: string) {
  const { data: org, error: orgErr } = await supabase
    .from('organizations')
    .select('id,is_active')
    .eq('id', orgId)
    .maybeSingle();
  if (orgErr) throw new AppError(`Join failed: ${orgErr.message}`, 500);
  if (!org || !org.is_active) throw new AppError('Organization not found', 404);

  const { data: existing, error: existingErr } = await supabase
    .from('memberships')
    .select('id,status')
    .eq('user_id', userId)
    .eq('organization_id', orgId)
    .maybeSingle();
  if (existingErr) throw new AppError(`Join failed: ${existingErr.message}`, 500);

  if (existing) {
    if (existing.status === 'APPROVED') throw new AppError('Already a member', 409);
    if (existing.status === 'PENDING') throw new AppError('Application already pending', 409);
    const { data: updated, error: updateErr } = await supabase
      .from('memberships')
      .update({ status: 'PENDING' })
      .eq('id', existing.id)
      .select('id,user_id,organization_id,status,role,joined_at,created_at')
      .single();
    if (updateErr || !updated) throw new AppError(`Join failed: ${updateErr?.message || 'Unknown error'}`, 500);
    return updated;
  }

  const { data: created, error: createErr } = await supabase
    .from('memberships')
    .insert({ user_id: userId, organization_id: orgId })
    .select('id,user_id,organization_id,status,role,joined_at,created_at')
    .single();
  if (createErr || !created) throw new AppError(`Join failed: ${createErr?.message || 'Unknown error'}`, 500);
  return created;
}

export async function leaveOrganization(userId: string, orgId: string) {
  const { data: membership, error: findErr } = await supabase
    .from('memberships')
    .select('id')
    .eq('user_id', userId)
    .eq('organization_id', orgId)
    .maybeSingle();
  if (findErr) throw new AppError(`Leave failed: ${findErr.message}`, 500);
  if (!membership) throw new AppError('Membership not found', 404);
  const { error: deleteErr } = await supabase.from('memberships').delete().eq('id', membership.id);
  if (deleteErr) throw new AppError(`Leave failed: ${deleteErr.message}`, 500);
  return { success: true };
}

export async function updateMembershipStatus(
  membershipId: string,
  status: 'APPROVED' | 'REJECTED'
) {
  const { data: membership, error: findErr } = await supabase
    .from('memberships')
    .select('id')
    .eq('id', membershipId)
    .maybeSingle();
  if (findErr) throw new AppError(`Update failed: ${findErr.message}`, 500);
  if (!membership) throw new AppError('Membership not found', 404);

  const { data: updated, error: updateErr } = await supabase
    .from('memberships')
    .update({
      status,
      ...(status === 'APPROVED' ? { joined_at: new Date().toISOString() } : {}),
    })
    .eq('id', membershipId)
    .select('id,user_id,organization_id,status,role,joined_at,created_at,user:users(first_name,last_name,email),organization:organizations(name)')
    .single();
  if (updateErr || !updated) throw new AppError(`Update failed: ${updateErr?.message || 'Unknown error'}`, 500);

  const m: any = updated;
  return {
    id: m.id,
    userId: m.user_id,
    organizationId: m.organization_id,
    status: m.status,
    role: m.role,
    joinedAt: m.joined_at,
    createdAt: m.created_at,
    user: m.user
      ? { firstName: m.user.first_name, lastName: m.user.last_name, email: m.user.email }
      : null,
    organization: m.organization ? { name: m.organization.name } : null,
  };
}

export async function getMyMemberships(userId: string) {
  const { data, error } = await supabase
    .from('memberships')
    .select('id,user_id,organization_id,status,role,joined_at,created_at,organization:organizations(id,name,slug,logo_url,category)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new AppError(`Membership fetch failed: ${error.message}`, 500);

  const rows: any[] = data ?? [];
  const result = await Promise.all(
    rows.map(async (m) => {
      const { count } = await supabase
        .from('memberships')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', m.organization_id)
        .eq('status', 'APPROVED');

      return {
        id: m.id,
        userId: m.user_id,
        organizationId: m.organization_id,
        status: m.status,
        role: m.role,
        joinedAt: m.joined_at,
        createdAt: m.created_at,
        organization: m.organization
          ? {
              id: m.organization.id,
              name: m.organization.name,
              slug: m.organization.slug,
              logoUrl: m.organization.logo_url,
              category: m.organization.category,
              _count: { memberships: count ?? 0 },
            }
          : null,
      };
    })
  );

  return result;
}
