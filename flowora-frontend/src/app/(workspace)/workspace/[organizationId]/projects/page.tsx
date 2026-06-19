'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import ProjectCard from '@/components/UI/project/ProjectCard';
import { CreateProjectModal } from '@/components/modal/CreateProjectModal';

export default function ProjectsPage() {
  const params = useParams();
  const organizationId = params.organizationId as string;

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'IN_REVIEW' | 'COMPLETED' | 'PAUSED'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects', organizationId],
    // queryFn: () => projectApi.getProjects(organizationId),
    queryFn: () => undefined,
    enabled: !!organizationId,
  });

  const filteredProjects = projects
    .filter((project: any) =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((project: any) => {
      if (statusFilter === 'ALL') return true;
      return project.status === statusFilter;
    });

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
      {/* Page Header */}
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Projects</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage all projects in this organization
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-brand text-white px-4 py-2.5 rounded-xl hover:bg-brand-dark transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Filters & Search */}
      <div className="px-6 py-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand text-sm"
          />
        </div>

        <div className="flex gap-2">
          {(['ALL', 'ACTIVE', 'IN_REVIEW', 'COMPLETED', 'PAUSED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                statusFilter === status
                  ? 'bg-brand text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      <div className="flex-1 p-6 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-400 text-lg">No projects found</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 text-brand hover:text-brand-dark font-medium"
            >
              Create your first project →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {filteredProjects.map((project: any) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>

      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        organizationId={organizationId}
      />
    </div>
  );
}