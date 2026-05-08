export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'STUDENT';
  avatarUrl?: string;
  bio?: string;
  studentId?: string;
  createdAt: string;
  _count?: { memberships: number };
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  category: string;
  isActive: boolean;
  createdAt: string;
  _count?: { memberships: number; events: number };
}

export interface Membership {
  id: string;
  userId: string;
  organizationId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  role: string;
  joinedAt?: string;
  createdAt: string;
  user?: Partial<User>;
  organization?: Partial<Organization>;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate: string;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  imageUrl?: string;
  maxAttendees?: number;
  organizationId: string;
  organization?: Partial<Organization>;
  createdAt: string;
}

export interface Document {
  id: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedById: string;
  organizationId?: string;
  isPublic: boolean;
  createdAt: string;
  uploadedBy?: Partial<User>;
  organization?: Partial<Organization>;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export interface DashboardStats {
  users: number;
  organizations: number;
  events: number;
  pendingMemberships: number;
}
