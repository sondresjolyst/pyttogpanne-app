import axiosInstance from './axiosInstance';
import { createAdminUsersService, createEmailStatsService, request } from '@sjolystinnovation/app-kit/api';

export interface AdminStats {
    totalUsers: number;
    publishedRecipes: number;
    draftRecipes: number;
    recipeCategories: number;
    gearItemCount: number;
    contentImages: number;
    storageUsedBytes: number;
    diskTotalBytes: number;
    diskFreeBytes: number;
}

export interface DailyStat {
    date: string;
    totalUsers: number;
    publishedRecipes: number;
    draftRecipes: number;
    gearItemCount: number;
    contentImages: number;
}

export type { AdminUser } from '@sjolystinnovation/app-kit/api';

const AdminService = {
    getStats: () =>
        request(() => axiosInstance.get<AdminStats>('/admin/stats'), 'Failed to load stats'),

    getStatsHistory: () =>
        request(() => axiosInstance.get<DailyStat[]>('/admin/stats/history'), 'Failed to load stats history'),

    ...createAdminUsersService(axiosInstance),
};

export const EmailStatsService = createEmailStatsService(axiosInstance);

export default AdminService;
