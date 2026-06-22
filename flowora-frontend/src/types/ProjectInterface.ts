export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: 'MANAGER' | 'MEMBER' | 'VIEWER';
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    name: string;
    email: string;
    profile_picture?: string;
  };
}

export interface ProjectCreator {
  id: string;
  name: string;
  email: string;
  profile_picture?: string;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  visibility: 'PUBLIC' | 'PRIVATE' | 'WORKSPACE';
  status: 'ACTIVE' | 'IN_REVIEW' | 'COMPLETED' | 'PAUSED';
  color?: string;
  icon?: string;
  org_id: string;
  created_by: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  creator?: ProjectCreator;
  members?: ProjectMember[];

  // Additional computed fields
  memberCount?: number;
  taskCount?: number;
  progress?: number;
}

export interface CreateProjectData {
  title: string;
  description?: string;
  visibility: string;
  color?: string;
  icon?: string;
}

export interface UpdateProjectData {
  title?: string;
  description?: string;
  visibility?: string;
  color?: string;
  icon?: string;
}