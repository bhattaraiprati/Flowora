// types/DashboardInterface.ts
export interface DashboardStats {
  activeProjects: number;
  tasksDueToday: number;
  teamMembers: number;
  completedThisWeek: number;
}

export interface DashboardTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  project: { id: string; title: string; color: string };
}

export interface DashboardBoard {
  id: string;
  title: string;
  color: string;
  progress: number;
  taskCount: number;
  members: { id: string; name: string }[];
  updatedAt: string;
}

export interface DashboardActivity {
  taskId: string;
  taskTitle: string;
  status: string;
  projectId: string;
  projectTitle: string;
  actorName: string;
  updatedAt: string;
}

export interface DashboardData {
  stats: DashboardStats;
  myTasks: DashboardTask[];
  recentBoards: DashboardBoard[];
  recentActivity: DashboardActivity[];
}