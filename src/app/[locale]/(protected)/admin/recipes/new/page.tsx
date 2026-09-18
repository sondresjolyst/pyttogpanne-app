"use client";

import RecipeForm from '../RecipeForm';
import { useDictionary } from '@/i18n/DictionaryProvider';

export default function NewRecipePage() {
    const { dict } = useDictionary();

    return (
        <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900">{dict.admin.newRecipe}</h2>
            <RecipeForm />
        </div>
    );
}
