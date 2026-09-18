"use client";

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CheckIcon, PencilSquareIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import TextInput from '@/components/TextInput';
import RecipeCategoryService from '@/services/recipeCategoryService';
import type { RecipeCategory } from '@/services/recipeService';
import { useDictionary } from '@/i18n/DictionaryProvider';

interface Draft {
    key: string;
    name: string;
    sortOrder: number;
}

const emptyDraft = (sortOrder: number): Draft => ({ key: '', name: '', sortOrder });

export default function AdminCategoriesPage() {
    const { dict } = useDictionary();
    const [categories, setCategories] = useState<RecipeCategory[] | null>(null);
    const [draft, setDraft] = useState<Draft>(emptyDraft(10));
    const [editingId, setEditingId] = useState<number | null>(null);
    const [edit, setEdit] = useState<Draft>(emptyDraft(10));

    const load = () =>
        RecipeCategoryService.list()
            .then(setCategories)
            .catch(err => toast.error(err instanceof Error ? err.message : dict.admin.categoriesLoadFailed));

    useEffect(() => { load(); }, []);

    const add = async () => {
        if (draft.key.trim() === '') return toast.error(dict.admin.categoryKeyRequired);
        if (draft.name.trim() === '') return toast.error(dict.validation.required);
        try {
            await RecipeCategoryService.create(draft);
            toast.success(dict.admin.categoryAdded);
            setDraft(emptyDraft((categories?.length ?? 0) * 10 + 20));
            load();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : dict.common.actionFailed);
        }
    };

    const save = async (id: number) => {
        try {
            await RecipeCategoryService.update(id, edit);
            toast.success(dict.admin.categoryUpdated);
            setEditingId(null);
            load();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : dict.common.actionFailed);
        }
    };

    const remove = async (category: RecipeCategory) => {
        if (!confirm(dict.admin.confirmDelete)) return;
        try {
            await RecipeCategoryService.remove(category.id);
            toast.success(dict.admin.categoryDeleted);
            load();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : dict.common.actionFailed);
        }
    };

    return (
        <div className="space-y-6">
            <p className="text-sm text-gray-600">{dict.admin.categoriesHint}</p>

            <div className="rounded-2xl border border-gray-200 p-5">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    <div className="sm:col-span-4">
                        <TextInput label={dict.admin.name} value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} />
                    </div>
                    <div className="sm:col-span-4">
                        <TextInput label={dict.admin.categoryKey} value={draft.key} onChange={e => setDraft({ ...draft, key: e.target.value })} />
                    </div>
                    <div className="sm:col-span-2">
                        <TextInput label={dict.admin.sortOrder} type="number" value={draft.sortOrder} onChange={e => setDraft({ ...draft, sortOrder: Number(e.target.value) })} />
                    </div>
                    <div className="sm:col-span-2">
                        <button type="button" onClick={add} className="w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800">
                            {dict.common.add}
                        </button>
                    </div>
                </div>
                <p className="mt-2 text-xs text-gray-500">{dict.admin.categoryKeyHint}</p>
            </div>

            {categories == null ? (
                <p className="text-sm text-gray-500">{dict.common.loading}</p>
            ) : categories.length === 0 ? (
                <p className="text-sm text-gray-500">{dict.admin.noCategories}</p>
            ) : (
                <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-200">
                    {categories.map(category => (
                        <li key={category.id} className="flex items-center gap-3 p-4">
                            {editingId === category.id ? (
                                <>
                                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <TextInput label={dict.admin.name} value={edit.name} onChange={e => setEdit({ ...edit, name: e.target.value })} />
                                        <TextInput label={dict.admin.categoryKey} value={edit.key} onChange={e => setEdit({ ...edit, key: e.target.value })} />
                                        <TextInput label={dict.admin.sortOrder} type="number" value={edit.sortOrder} onChange={e => setEdit({ ...edit, sortOrder: Number(e.target.value) })} />
                                    </div>
                                    <button type="button" aria-label={dict.common.save} onClick={() => save(category.id)} className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:border-gray-400">
                                        <CheckIcon className="h-4 w-4" />
                                    </button>
                                    <button type="button" aria-label={dict.common.cancel} onClick={() => setEditingId(null)} className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:border-gray-400">
                                        <XMarkIcon className="h-4 w-4" />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="min-w-0 flex-1">
                                        <span className="font-semibold text-gray-900">{category.name}</span>
                                        <span className="ml-2 text-sm text-gray-500">{category.key}</span>
                                    </div>
                                    <button
                                        type="button"
                                        aria-label={dict.common.edit}
                                        onClick={() => { setEditingId(category.id); setEdit({ key: category.key, name: category.name, sortOrder: category.sortOrder }); }}
                                        className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:border-gray-400"
                                    >
                                        <PencilSquareIcon className="h-4 w-4" />
                                    </button>
                                    <button type="button" aria-label={dict.common.delete} onClick={() => remove(category)} className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:border-red-400 hover:text-red-600">
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
