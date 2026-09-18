"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import ContentImage from '@/components/ContentImage';
import RecipeService, { type RecipeSummary } from '@/services/recipeService';
import { useDictionary } from '@/i18n/DictionaryProvider';
import { localeHref } from '@/i18n/config';

export default function AdminRecipesPage() {
    const { locale, dict } = useDictionary();
    const [recipes, setRecipes] = useState<RecipeSummary[] | null>(null);

    useEffect(() => {
        RecipeService.list()
            .then(setRecipes)
            .catch(err => toast.error(err instanceof Error ? err.message : dict.admin.recipesLoadFailed));
    }, []);

    const remove = async (recipe: RecipeSummary) => {
        if (!confirm(dict.admin.confirmDeleteRecipe.replace('{title}', recipe.title))) return;
        try {
            await RecipeService.remove(recipe.id);
            setRecipes(list => (list ?? []).filter(r => r.id !== recipe.id));
            toast.success(dict.admin.recipeDeleted);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : dict.admin.recipeDeleteFailed);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <Link
                    href={localeHref(locale, '/admin/recipes/new')}
                    className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                >
                    {dict.admin.newRecipe}
                </Link>
            </div>

            {recipes == null ? (
                <p className="text-sm text-gray-500">{dict.common.loading}</p>
            ) : recipes.length === 0 ? (
                <p className="text-sm text-gray-500">{dict.admin.noRecipes}</p>
            ) : (
                <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-200">
                    {recipes.map(recipe => (
                        <li key={recipe.id} className="flex items-center gap-4 p-4">
                            <ContentImage
                                imageId={recipe.coverImageId}
                                alt=""
                                sizes="64px"
                                fallbackSrc="/icon.png"
                                className="h-14 w-14 shrink-0 rounded-lg object-cover"
                            />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="truncate font-semibold text-gray-900">{recipe.title}</span>
                                    {!recipe.isPublished && (
                                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">{dict.admin.draftTag}</span>
                                    )}
                                </div>
                                <p className="truncate text-sm text-gray-500">
                                    {[
                                        recipe.categories.map(c => c.name).join(', '),
                                        recipe.totalMinutes != null ? `${recipe.totalMinutes} min` : null,
                                        `${recipe.servings} ${dict.recipes.servings.toLowerCase()}`,
                                    ].filter(Boolean).join(' · ')}
                                </p>
                            </div>
                            <div className="flex gap-1">
                                <Link
                                    href={localeHref(locale, `/admin/recipes/${recipe.id}`)}
                                    aria-label={dict.common.edit}
                                    className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:border-gray-400"
                                >
                                    <PencilSquareIcon className="h-4 w-4" />
                                </Link>
                                <button
                                    type="button"
                                    aria-label={dict.common.delete}
                                    onClick={() => remove(recipe)}
                                    className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:border-red-400 hover:text-red-600"
                                >
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
