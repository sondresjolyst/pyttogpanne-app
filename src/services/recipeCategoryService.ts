import axiosInstance from './axiosInstance';
import { request } from '@/lib/apiRequest';
import type { RecipeCategory } from './recipeService';

export interface RecipeCategoryInput {
    key: string;
    name: string;
    sortOrder: number;
}

const RecipeCategoryService = {
    list: () =>
        request(() => axiosInstance.get<RecipeCategory[]>('/recipe-categories'), 'Failed to load categories'),

    create: (body: RecipeCategoryInput) =>
        request(() => axiosInstance.post<RecipeCategory>('/recipe-categories', body), 'Failed to save category'),

    update: (id: number, body: RecipeCategoryInput) =>
        request(() => axiosInstance.put<RecipeCategory>(`/recipe-categories/${id}`, body), 'Failed to save category'),

    remove: (id: number) =>
        request(() => axiosInstance.delete(`/recipe-categories/${id}`), 'Failed to delete category'),
};

export default RecipeCategoryService;
