export type Role = "STUDENT" | "PROFESSOR" | "ADMIN";
export type CommunityType = "PUBLIC" | "PRIVATE";

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Community {
  id: number;
  name: string;
  description?: string | null;
  type: CommunityType;
  owner: User;
  maxMembers?: number | null;
  createdAt: string;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  communityId: number;
  author: User;
  createdAt: string;
  updatedAt?: string | null;
  likeCount: number;
  likedByMe: boolean;
}

export interface Comment {
  id: number;
  content: string;
  postId: number;
  parentId?: number | null;
  author: User;
  createdAt: string;
  updatedAt?: string | null;
  likeCount: number;
  likedByMe: boolean;
}

export interface StudyResource {
  id: number;
  title: string;
  description?: string | null;
  moduleName: string;
  attachmentReference?: string | null;
  communityId?: number | null;
  author: User;
  createdAt: string;
}

export interface InvitationCode {
  id: number;
  code: string;
  active: boolean;
  createdAt: string;
  communityId: number;
}

export interface ApiErrorBody {
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
  path?: string;
  validationErrors?: Record<string, string>;
}
