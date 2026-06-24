export type MemberRole = 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER';

export type InviteScope = 'ORGANIZATION' | 'PROJECT';

export type InviteStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';

export interface Member {
  id: string;
  user_id: string;
  role: MemberRole;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    name: string;
    email: string;
    profile_picture?: string;
  };
}

export interface OrganizationMember extends Member {
  organization_id: string;
}

export interface ProjectMember extends Member {
  project_id: string;
}

export interface Invitation {
  id: string;
  email: string;
  role: MemberRole;
  scope: InviteScope;
  status: InviteStatus;
  token: string;
  invite_link: string;
  organization_id?: string;
  project_id?: string;
  invited_by: string;
  expires_at: string;
  created_at: string;
  inviter?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateInvitationData {
  email: string;
  role: MemberRole;
  scope: InviteScope;
  organization_id?: string;
  project_id?: string;
}

export interface AcceptInvitationData {
  token: string;
}
