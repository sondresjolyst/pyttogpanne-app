import axiosInstance from './axiosInstance';
import { request } from '@/lib/apiRequest';
import type { GalleryImage, GalleryImageInput } from './imageService';

export const DIFFICULTIES = ['Enkel', 'Middels', 'Avansert'] as const;

export type Difficulty = (typeof DIFFICULTIES)[number];

export interface RecipeCategory {
    id: number;
    key: string;
    name: string;
    sortOrder: number;
}

export interface RecipeIngredient {
    id: number;
    sortOrder: number;
    groupName: string | null;
    amount: string | null;
    unit: string | null;
    name: string;
    note: string | null;
}

export interface RecipeStep {
    id: number;
    sortOrder: number;
    text: string;
    contentImageId: string | null;
}

export interface RecipeSummary {
    id: number;
    slug: string;
    title: string;
    intro: string | null;
    servings: number;
    totalMinutes: number | null;
    difficulty: Difficulty;
    coverImageId: string | null;
    isPublished: boolean;
    isAdvertising: boolean;
    advertiser: string | null;
    updatedAt: string;
    categories: RecipeCategory[];
}

export interface RecipeDetail extends RecipeSummary {
    prepMinutes: number | null;
    cookMinutes: number | null;
    tips: string | null;
    publishedAt: string | null;
    ingredients: RecipeIngredient[];
    steps: RecipeStep[];
    images: GalleryImage[];
}

export interface RecipeIngredientInput {
    groupName?: string | null;
    amount?: string | null;
    unit?: string | null;
    name: string;
    note?: string | null;
}

export interface RecipeStepInput {
    text: string;
    contentImageId?: string | null;
}

export interface RecipeInput {
    title: string;
    intro?: string | null;
    servings: number;
    prepMinutes?: number | null;
    cookMinutes?: number | null;
    difficulty: Difficulty;
    tips?: string | null;
    isPublished: boolean;
    isAdvertising: boolean;
    advertiser?: string | null;
    categoryIds: number[];
    ingredients: RecipeIngredientInput[];
    steps: RecipeStepInput[];
    images: GalleryImageInput[];
}

const RecipeService = {
    list: (all = true) =>
        request(() => axiosInstance.get<RecipeSummary[]>('/recipes', { params: { all } }), 'Failed to load recipes'),

    getForEdit: (id: number) =>
        request(() => axiosInstance.get<RecipeDetail>(`/recipes/${id}/edit`), 'Failed to load recipe'),

    create: (body: RecipeInput) =>
        request(() => axiosInstance.post<RecipeDetail>('/recipes', body), 'Failed to save recipe'),

    update: (id: number, body: RecipeInput) =>
        request(() => axiosInstance.put<RecipeDetail>(`/recipes/${id}`, body), 'Failed to save recipe'),

    remove: (id: number) =>
        request(() => axiosInstance.delete(`/recipes/${id}`), 'Failed to delete recipe'),
};

export default RecipeService;
