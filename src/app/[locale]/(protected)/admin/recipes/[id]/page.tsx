"use client";

import { use, useEffect, useState } from 'react';
import { toast } from 'sonner';
import RecipeForm from '../RecipeForm';
import RecipeService, { type RecipeDetail } from '@/services/recipeService';
import { useDictionary } from '@/i18n/DictionaryProvider';

export default function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { dict } = useDictionary();
    const [recipe, setRecipe] = useState<RecipeDetail | null>(null);

    useEffect(() => {
        RecipeService.getForEdit(Number(id))
            .then(setRecipe)
            .catch(err => toast.error(err instanceof Error ? err.message : dict.admin.recipeLoadFailed));
    }, [id]);

    if (!recipe) return <p className="text-sm text-gray-500">{dict.common.loading}</p>;

    return (
        <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900">{dict.admin.editRecipe}</h2>
            <RecipeForm recipe={recipe} />
        </div>
    );
}
