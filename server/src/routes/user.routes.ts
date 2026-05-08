import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { getPaginationParams, buildPaginatedResponse } from '../utils/pagination';
import { AuthenticatedRequest } from '../types';
import { Response, NextFunction } from 'express';
import { supabase } from '../utils/supabase';

const router = Router();

// Admin: list all users
router.get('/', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as any);
    const search = (req.query.search as string) || '';
    let q = supabase
      .from('users')
      .select('id,email,first_name,last_name,role,student_id,created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(skip, skip + limit - 1);

    if (search) q = q.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);

    const { data, error, count } = await q;
    if (error) throw error;

    const mapped = await Promise.all(
      (data ?? []).map(async (u: any) => {
        const { count: mcount } = await supabase
          .from('memberships')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', u.id);

        return {
          id: u.id,
          email: u.email,
          firstName: u.first_name,
          lastName: u.last_name,
          role: u.role,
          studentId: u.student_id,
          createdAt: u.created_at,
          _count: { memberships: mcount ?? 0 },
        };
      })
    );

    res.json({ success: true, data: buildPaginatedResponse(mapped, count ?? 0, page, limit) });
  } catch (err) { next(err); }
});

// Admin: get dashboard stats
router.get('/stats', authenticate, requireAdmin, async (_req, res: Response, next: NextFunction) => {
  try {
    const [users, orgs, events, pending] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('organizations').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('events').select('id', { count: 'exact', head: true }),
      supabase.from('memberships').select('id', { count: 'exact', head: true }).eq('status', 'PENDING'),
    ]);
    res.json({
      success: true,
      data: {
        users: users.count ?? 0,
        organizations: orgs.count ?? 0,
        events: events.count ?? 0,
        pendingMemberships: pending.count ?? 0,
      },
    });
  } catch (err) { next(err); }
});

export default router;
