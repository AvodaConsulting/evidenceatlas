import { Role } from '../types';

export interface PermissionSet {
  canManageWorkspace: boolean;
  canManageMembers: boolean;
  canDeleteWorkspace: boolean;
  canManageProviderSettings: boolean;
  canCreateProject: boolean;
  canEditProjectDetails: boolean;
  canDeleteProject: boolean;
  canAddWorks: boolean;
  canEditWorks: boolean;
  canRemoveWorks: boolean;
  canChangeInclusionStatus: boolean;
  canManageTags: boolean;
  canExecuteSearches: boolean;
  canCreateAnnotations: boolean;
  canDeleteOwnAnnotations: boolean;
  canDeleteAnyAnnotation: boolean;
  canCreateEvidence: boolean;
  canExportData: boolean;
  canSaveMapSnapshots: boolean;
  canManageCitationTrails: boolean;
}

export function getRolePermissions(role: Role | null | undefined): PermissionSet {
  if (!role) {
    return {
      canManageWorkspace: false,
      canManageMembers: false,
      canDeleteWorkspace: false,
      canManageProviderSettings: false,
      canCreateProject: false,
      canEditProjectDetails: false,
      canDeleteProject: false,
      canAddWorks: false,
      canEditWorks: false,
      canRemoveWorks: false,
      canChangeInclusionStatus: false,
      canManageTags: false,
      canExecuteSearches: false,
      canCreateAnnotations: false,
      canDeleteOwnAnnotations: false,
      canDeleteAnyAnnotation: false,
      canCreateEvidence: false,
      canExportData: false,
      canSaveMapSnapshots: false,
      canManageCitationTrails: false,
    };
  }

  switch (role) {
    case 'owner':
      return {
        canManageWorkspace: true,
        canManageMembers: true,
        canDeleteWorkspace: true,
        canManageProviderSettings: true,
        canCreateProject: true,
        canEditProjectDetails: true,
        canDeleteProject: true,
        canAddWorks: true,
        canEditWorks: true,
        canRemoveWorks: true,
        canChangeInclusionStatus: true,
        canManageTags: true,
        canExecuteSearches: true,
        canCreateAnnotations: true,
        canDeleteOwnAnnotations: true,
        canDeleteAnyAnnotation: true,
        canCreateEvidence: true,
        canExportData: true,
        canSaveMapSnapshots: true,
        canManageCitationTrails: true,
      };

    case 'editor':
      return {
        canManageWorkspace: false,
        canManageMembers: false,
        canDeleteWorkspace: false,
        canManageProviderSettings: false,
        canCreateProject: true,
        canEditProjectDetails: true,
        canDeleteProject: false,
        canAddWorks: true,
        canEditWorks: true,
        canRemoveWorks: true,
        canChangeInclusionStatus: true,
        canManageTags: true,
        canExecuteSearches: true,
        canCreateAnnotations: true,
        canDeleteOwnAnnotations: true,
        canDeleteAnyAnnotation: false,
        canCreateEvidence: true,
        canExportData: true,
        canSaveMapSnapshots: true,
        canManageCitationTrails: true,
      };

    case 'commenter':
      return {
        canManageWorkspace: false,
        canManageMembers: false,
        canDeleteWorkspace: false,
        canManageProviderSettings: false,
        canCreateProject: false,
        canEditProjectDetails: false,
        canDeleteProject: false,
        canAddWorks: false,
        canEditWorks: false,
        canRemoveWorks: false,
        canChangeInclusionStatus: false,
        canManageTags: false,
        canExecuteSearches: false,
        canCreateAnnotations: true,
        canDeleteOwnAnnotations: true,
        canDeleteAnyAnnotation: false,
        canCreateEvidence: false,
        canExportData: true,
        canSaveMapSnapshots: false,
        canManageCitationTrails: false,
      };

    case 'viewer':
    default:
      return {
        canManageWorkspace: false,
        canManageMembers: false,
        canDeleteWorkspace: false,
        canManageProviderSettings: false,
        canCreateProject: false,
        canEditProjectDetails: false,
        canDeleteProject: false,
        canAddWorks: false,
        canEditWorks: false,
        canRemoveWorks: false,
        canChangeInclusionStatus: false,
        canManageTags: false,
        canExecuteSearches: false,
        canCreateAnnotations: false,
        canDeleteOwnAnnotations: false,
        canDeleteAnyAnnotation: false,
        canCreateEvidence: false,
        canExportData: true,
        canSaveMapSnapshots: false,
        canManageCitationTrails: false,
      };
  }
}

export function formatRoleLabel(role: Role): string {
  switch (role) {
    case 'owner': return 'Owner (Full Access)';
    case 'editor': return 'Editor (Add/Edit Works)';
    case 'commenter': return 'Commenter (Annotations Only)';
    case 'viewer': return 'Viewer (Read Only)';
  }
}

export function getRoleBadgeClass(role: Role): string {
  switch (role) {
    case 'owner':
      return 'bg-amber-100 text-amber-900 border-amber-200';
    case 'editor':
      return 'bg-emerald-100 text-emerald-900 border-emerald-200';
    case 'commenter':
      return 'bg-sky-100 text-sky-900 border-sky-200';
    case 'viewer':
      return 'bg-stone-100 text-stone-700 border-stone-200';
  }
}
