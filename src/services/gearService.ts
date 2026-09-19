import axiosInstance from './axiosInstance';
import { request } from '@/lib/apiRequest';
import type { GalleryImage, GalleryImageInput } from './imageService';

export const GEAR_KINDS = ['Utstyr', 'Tips'] as const;

export type GearKind = (typeof GEAR_KINDS)[number];

export interface GearItem {
    id: number;
    slug: string;
    title: string;
    kind: GearKind;
    summary: string | null;
    body: string;
    coverImageId: string | null;
    images: GalleryImage[];
    sortOrder: number;
    isPublished: boolean;
    isAdvertising: boolean;
    advertiser: string | null;
    updatedAt: string;
}

export interface GearItemInput {
    title: string;
    kind: GearKind;
    summary?: string | null;
    body: string;
    images: GalleryImageInput[];
    sortOrder: number;
    isPublished: boolean;
    isAdvertising: boolean;
    advertiser?: string | null;
}

const GearService = {
    list: (all = true) =>
        request(() => axiosInstance.get<GearItem[]>('/gear', { params: { all } }), 'Failed to load gear'),

    create: (body: GearItemInput) =>
        request(() => axiosInstance.post<GearItem>('/gear', body), 'Failed to save gear item'),

    update: (id: number, body: GearItemInput) =>
        request(() => axiosInstance.put<GearItem>(`/gear/${id}`, body), 'Failed to save gear item'),

    remove: (id: number) =>
        request(() => axiosInstance.delete(`/gear/${id}`), 'Failed to delete gear item'),
};

export default GearService;
