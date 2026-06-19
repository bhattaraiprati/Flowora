'use client';

import React, { useState, ChangeEvent } from 'react';
import Link from 'next/link';
import Logo from '@/components/UI/logo';
import { organizationApi } from '@/lib/api';
import {
  Building2,
  Globe,
  Users,
  Briefcase,
  Check,
  ChevronLeft,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Retail',
  'Manufacturing',
  'Media & Entertainment',
  'Non-Profit',
  'Government',
  'Other',
];

const ORG_SIZES = [
  { value: '1-10', label: '1 – 10  (Startup)' },
  { value: '11-50', label: '11 – 50  (Small)' },
  { value: '51-200', label: '51 – 200  (Mid-size)' },
  { value: '201-500', label: '201 – 500  (Growing)' },
  { value: '500+', label: '500+  (Enterprise)' },
];

function slugify(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function Field({
  label,
  error,
  children,
  hint,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      {children}
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function Input({
  icon: Icon,
  right,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  icon?: React.ElementType;
  right?: React.ReactNode;
  error?: boolean;
}) {
  return (
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      )}
      <input
        {...props}
        className={`w-full ${Icon ? 'pl-10' : 'pl-3'} ${right ? 'pr-10' : 'pr-3'} py-2.5 text-sm border rounded-xl outline-none transition
          ${error
            ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100'
            : 'border-slate-200 bg-white focus:border-brand focus:ring-2 focus:ring-brand/10'
          } placeholder:text-slate-400 text-slate-800`}
      />
      {right && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">{right}</div>
      )}
    </div>
  );
}

export default function CreateOrganizationPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const [org, setOrg] = useState({
    orgName: '',
    orgSlug: '',
    industry: '',
    size: '',
    website: '',
    description: '',
  });

  function onOrgChange(
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    if (name === 'orgName') {
      setOrg((prev) => ({ ...prev, orgName: value, orgSlug: slugify(value) }));
    } else {
      setOrg((prev) => ({ ...prev, [name]: value }));
    }
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setApiError(null);
  }

  function validateForm(): boolean {
    const errs: Record<string, string> = {};
    if (!org.orgName.trim()) errs.orgName = 'Organization name is required.';
    if (!org.orgSlug.trim()) errs.orgSlug = 'Slug is required.';
    if (!org.industry) errs.industry = 'Please select an industry.';
    if (!org.size) errs.size = 'Please select a team size.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  const createOrgMutation = useMutation({
    mutationFn: (data: typeof org) =>
      organizationApi.createOrganization({
        name: data.orgName,
        slug: data.orgSlug,
        industry: data.industry,
        size: data.size,
        website: data.website,
        description: data.description,
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['myOrganizations'] });
      // Redirect to the newly created organization's dashboard
      router.push(`/workspace/${res.organization.id}/dashboard`);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Something went wrong.';
      setApiError(msg);
      if (typeof msg === 'string' && (msg.toLowerCase().includes('slug') || msg.toLowerCase().includes('organization'))) {
        setErrors((prev) => ({ ...prev, orgSlug: msg }));
      }
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;
    createOrgMutation.mutate(org);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-brand-light/30 flex flex-col font-sans">
      <header className="h-14 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center px-6 sticky top-0 z-50">
        <Link href="/dashboard" className="flex items-center">
          <div className="bg-brand rounded-xl p-0.5">
            <Logo />
          </div>
        </Link>
        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 py-12">
        <div className="w-full max-w-2xl space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 bg-brand-light text-brand text-xs font-semibold px-4 py-1.5 rounded-full mb-1">
              <Building2 className="w-3.5 h-3.5" />
              New Organization
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Set up your workspace
            </h1>
            <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
              Create a new organization for your team to collaborate in.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {apiError && (
              <div className="bg-red-50 border-b border-red-100 p-4 text-xs font-semibold text-red-700 flex items-start gap-2.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-600 mt-1.5" />
                <span>{apiError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="px-8 pt-8 pb-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Field label="Organization Name *" error={errors.orgName}>
                      <Input
                        icon={Building2}
                        name="orgName"
                        placeholder="Acme Corporation"
                        value={org.orgName}
                        onChange={onOrgChange}
                        error={!!errors.orgName}
                        autoFocus
                      />
                    </Field>
                  </div>

                  <div className="sm:col-span-2">
                    <Field
                      label="Organization Slug *"
                      error={errors.orgSlug}
                      hint="Used in your workspace URL. Auto-generated from name."
                    >
                      <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/10 transition">
                        <span className="px-3 py-2.5 text-sm text-slate-400 bg-slate-50 border-r border-slate-200 select-none whitespace-nowrap">
                          flowora.io/
                        </span>
                        <input
                          name="orgSlug"
                          value={org.orgSlug}
                          onChange={onOrgChange}
                          placeholder="acme-corporation"
                          className="flex-1 px-3 py-2.5 text-sm outline-none bg-white text-slate-800 placeholder:text-slate-400"
                        />
                      </div>
                    </Field>
                  </div>

                  <Field label="Industry *" error={errors.industry}>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <select
                        name="industry"
                        value={org.industry}
                        onChange={onOrgChange}
                        className={`w-full pl-10 pr-3 py-2.5 text-sm border rounded-xl outline-none transition appearance-none bg-white
                          ${errors.industry
                            ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                            : 'border-slate-200 focus:border-brand focus:ring-2 focus:ring-brand/10'
                          } text-slate-800`}
                      >
                        <option value="" disabled>Select industry</option>
                        {INDUSTRIES.map((ind) => (
                          <option key={ind} value={ind}>{ind}</option>
                        ))}
                      </select>
                    </div>
                  </Field>

                  <Field label="Team Size *" error={errors.size}>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <select
                        name="size"
                        value={org.size}
                        onChange={onOrgChange}
                        className={`w-full pl-10 pr-3 py-2.5 text-sm border rounded-xl outline-none transition appearance-none bg-white
                          ${errors.size
                            ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                            : 'border-slate-200 focus:border-brand focus:ring-2 focus:ring-brand/10'
                          } text-slate-800`}
                      >
                        <option value="" disabled>Select team size</option>
                        {ORG_SIZES.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                  </Field>

                  <div className="sm:col-span-2">
                    <Field label="Website (optional)">
                      <Input
                        icon={Globe}
                        name="website"
                        type="url"
                        placeholder="https://yourcompany.com"
                        value={org.website}
                        onChange={onOrgChange}
                      />
                    </Field>
                  </div>

                  <div className="sm:col-span-2">
                    <Field label="Organization Description (optional)">
                      <textarea
                        name="description"
                        value={org.description}
                        onChange={onOrgChange}
                        rows={3}
                        placeholder="Briefly describe what your organization does…"
                        className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition placeholder:text-slate-400 text-slate-800 resize-none"
                      />
                    </Field>
                  </div>
                </div>
              </div>

              <div className="px-8 py-6 bg-slate-50/60 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={createOrgMutation.isPending}
                  className="flex items-center gap-2 px-6 py-2.5 bg-brand text-white text-sm font-semibold rounded-xl hover:bg-brand-dark transition-all shadow-sm active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {createOrgMutation.isPending ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating…
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Create Organization
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
