"use client";

import { AdminUsersPanel } from '@sjolystinnovation/app-kit/admin';
import { nbAdminUsersPanelStrings } from '@sjolystinnovation/app-kit/locales/nb';
import AdminService from '@/services/adminService';

export default function AdminUsersPage() {
    return <AdminUsersPanel service={AdminService} strings={nbAdminUsersPanelStrings} />;
}
