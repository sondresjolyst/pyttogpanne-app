"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowDownIcon, ArrowUpIcon, PhotoIcon, TrashIcon } from '@heroicons/react/24/outline';
import TextInput from '@/components/TextInput';
import TextArea from '@/components/TextArea';
import Toggle from '@/components/Toggle';
import ContentImage from '@/components/ContentImage';
import RecipeService, {
    DIFFICULTIES,
    type Difficulty,
    type RecipeCategory,
    type RecipeDetail,
    type RecipeInput,
} from '@/services/recipeService';
import RecipeCategoryService from '@/services/recipeCategoryService';
import ImageService from '@/services/imageService';
import { useDictionary } from '@/i18n/DictionaryProvider';
import { localeHref } from '@/i18n/config';

interface IngredientRow {
    groupName: string;
    amount: string;
    unit: string;
    name: string;
    note: string;
}

interface StepRow {
    text: string;
    contentImageId: string | null;
}

const emptyIngredient = (): IngredientRow => ({ groupName: '', amount: '', unit: '', name: '', note: '' });
const emptyStep = (): StepRow => ({ text: '', contentImageId: null });

const blank = (value: string): string | null => (value.trim() === '' ? null : value.trim());

function move<T>(rows: T[], from: number, to: number): T[] {
    if (to < 0 || to >= rows.length) return rows;
    const next = [...rows];
    const [row] = next.splice(from, 1);
    next.splice(to, 0, row);
    return next;
}

export default function RecipeForm({ recipe }: { recipe?: RecipeDetail }) {
    const { locale, dict } = useDictionary();
    const router = useRouter();
    const coverInput = useRef<HTMLInputElement>(null);

    const [categories, setCategories] = useState<RecipeCategory[]>([]);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [title, setTitle] = useState(recipe?.title ?? '');
    const [intro, setIntro] = useState(recipe?.intro ?? '');
    const [servings, setServings] = useState(recipe?.servings ?? 2);
    const [prepMinutes, setPrepMinutes] = useState(recipe?.prepMinutes?.toString() ?? '');
    const [cookMinutes, setCookMinutes] = useState(recipe?.cookMinutes?.toString() ?? '');
    const [difficulty, setDifficulty] = useState<Difficulty>(recipe?.difficulty ?? 'Enkel');
    const [tips, setTips] = useState(recipe?.tips ?? '');
    const [coverImageId, setCoverImageId] = useState<string | null>(recipe?.coverImageId ?? null);
    const [isPublished, setIsPublished] = useState(recipe?.isPublished ?? false);
    const [categoryIds, setCategoryIds] = useState<number[]>(recipe?.categories.map(c => c.id) ?? []);
    const [ingredients, setIngredients] = useState<IngredientRow[]>(
        recipe?.ingredients.map(i => ({
            groupName: i.groupName ?? '',
            amount: i.amount ?? '',
            unit: i.unit ?? '',
            name: i.name,
            note: i.note ?? '',
        })) ?? [emptyIngredient()],
    );
    const [steps, setSteps] = useState<StepRow[]>(
        recipe?.steps.map(s => ({ text: s.text, contentImageId: s.contentImageId })) ?? [emptyStep()],
    );

    useEffect(() => {
        RecipeCategoryService.list()
            .then(setCategories)
            .catch(err => toast.error(err instanceof Error ? err.message : dict.admin.categoriesLoadFailed));
    }, []);

    const patchIngredient = (index: number, patch: Partial<IngredientRow>) =>
        setIngredients(rows => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

    const patchStep = (index: number, patch: Partial<StepRow>) =>
        setSteps(rows => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

    const uploadCover = async (file: File) => {
        setUploading(true);
        try {
            const image = await ImageService.upload(file);
            setCoverImageId(image.id);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : dict.admin.uploadFailed);
        } finally {
            setUploading(false);
        }
    };

    const save = async () => {
        const named = ingredients.filter(i => i.name.trim() !== '');
        const written = steps.filter(s => s.text.trim() !== '');

        if (title.trim() === '') return toast.error(dict.admin.titleRequired);
        if (named.length === 0) return toast.error(dict.admin.ingredientsRequired);
        if (written.length === 0) return toast.error(dict.admin.stepsRequired);

        const body: RecipeInput = {
            title: title.trim(),
            intro: blank(intro),
            servings,
            prepMinutes: prepMinutes.trim() === '' ? null : Number(prepMinutes),
            cookMinutes: cookMinutes.trim() === '' ? null : Number(cookMinutes),
            difficulty,
            tips: blank(tips),
            coverImageId,
            isPublished,
            categoryIds,
            ingredients: named.map(i => ({
                groupName: blank(i.groupName),
                amount: blank(i.amount),
                unit: blank(i.unit),
                name: i.name.trim(),
                note: blank(i.note),
            })),
            steps: written.map(s => ({ text: s.text.trim(), contentImageId: s.contentImageId })),
        };

        setSaving(true);
        try {
            if (recipe) {
                await RecipeService.update(recipe.id, body);
                toast.success(dict.admin.recipeSaved);
            } else {
                await RecipeService.create(body);
                toast.success(dict.admin.recipeCreated);
            }
            router.push(localeHref(locale, '/admin/recipes'));
            router.refresh();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : dict.admin.recipeSaveFailed);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-8">
            <section className="space-y-4">
                <TextInput label={dict.admin.recipeTitle} required value={title} onChange={e => setTitle(e.target.value)} />
                <TextArea label={dict.recipes.intro} value={intro} onChange={e => setIntro(e.target.value)} />

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <TextInput
                        label={dict.recipes.servings}
                        type="number"
                        min={1}
                        value={servings}
                        onChange={e => setServings(Math.max(1, Number(e.target.value)))}
                    />
                    <TextInput label={dict.recipes.prepMinutes} type="number" min={0} value={prepMinutes} onChange={e => setPrepMinutes(e.target.value)} />
                    <TextInput label={dict.recipes.cookMinutes} type="number" min={0} value={cookMinutes} onChange={e => setCookMinutes(e.target.value)} />
                    <div>
                        <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1">{dict.recipes.difficulty}</label>
                        <select
                            id="difficulty"
                            value={difficulty}
                            onChange={e => setDifficulty(e.target.value as Difficulty)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            {DIFFICULTIES.map(value => (
                                <option key={value} value={value}>
                                    {value === 'Enkel' ? dict.recipes.difficultyEnkel : value === 'Middels' ? dict.recipes.difficultyMiddels : dict.recipes.difficultyAvansert}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <span className="block text-sm font-medium text-gray-700 mb-2">{dict.recipes.categories}</span>
                    <div className="flex flex-wrap gap-2">
                        {categories.map(category => {
                            const on = categoryIds.includes(category.id);
                            return (
                                <button
                                    key={category.id}
                                    type="button"
                                    aria-pressed={on}
                                    onClick={() => setCategoryIds(ids => (on ? ids.filter(id => id !== category.id) : [...ids, category.id]))}
                                    className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                                        on ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300 text-gray-700 hover:border-gray-400'
                                    }`}
                                >
                                    {category.name}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section>
                <h2 className="font-bold text-gray-900 mb-3">{dict.admin.coverImage}</h2>
                <div className="flex items-center gap-4">
                    {coverImageId ? (
                        <ContentImage imageId={coverImageId} alt="" sizes="160px" className="h-24 w-32 rounded-lg object-cover" />
                    ) : (
                        <div className="flex h-24 w-32 items-center justify-center rounded-lg border border-dashed border-gray-300 text-gray-400">
                            <PhotoIcon className="h-6 w-6" />
                        </div>
                    )}
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => coverInput.current?.click()}
                            disabled={uploading}
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:border-gray-400 disabled:opacity-50"
                        >
                            {uploading ? dict.admin.uploading : dict.admin.addImage}
                        </button>
                        {coverImageId && (
                            <button
                                type="button"
                                onClick={() => setCoverImageId(null)}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:border-gray-400"
                            >
                                {dict.common.remove}
                            </button>
                        )}
                    </div>
                    <input
                        ref={coverInput}
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) uploadCover(file);
                            e.target.value = '';
                        }}
                    />
                </div>
            </section>

            <section>
                <h2 className="font-bold text-gray-900 mb-3">{dict.recipes.ingredients}</h2>
                <p className="text-sm text-gray-500 mb-3">{dict.admin.ingredientGroupHint}</p>
                <div className="space-y-3">
                    {ingredients.map((row, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 items-end">
                            <div className="col-span-6 sm:col-span-2">
                                <TextInput label={dict.admin.ingredientAmount} value={row.amount} onChange={e => patchIngredient(index, { amount: e.target.value })} />
                            </div>
                            <div className="col-span-6 sm:col-span-2">
                                <TextInput label={dict.admin.ingredientUnit} value={row.unit} onChange={e => patchIngredient(index, { unit: e.target.value })} />
                            </div>
                            <div className="col-span-12 sm:col-span-4">
                                <TextInput label={dict.admin.ingredientName} value={row.name} onChange={e => patchIngredient(index, { name: e.target.value })} />
                            </div>
                            <div className="col-span-9 sm:col-span-3">
                                <TextInput label={dict.admin.ingredientGroup} value={row.groupName} onChange={e => patchIngredient(index, { groupName: e.target.value })} />
                            </div>
                            <div className="col-span-3 sm:col-span-1 flex gap-1 pb-1">
                                <button type="button" aria-label={dict.admin.moveUp} onClick={() => setIngredients(rows => move(rows, index, index - 1))} className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:border-gray-400">
                                    <ArrowUpIcon className="h-4 w-4" />
                                </button>
                                <button type="button" aria-label={dict.admin.moveDown} onClick={() => setIngredients(rows => move(rows, index, index + 1))} className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:border-gray-400">
                                    <ArrowDownIcon className="h-4 w-4" />
                                </button>
                                <button type="button" aria-label={dict.common.remove} onClick={() => setIngredients(rows => rows.filter((_, i) => i !== index))} className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:border-red-400 hover:text-red-600">
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                <button
                    type="button"
                    onClick={() => setIngredients(rows => [...rows, emptyIngredient()])}
                    className="mt-3 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:border-gray-400"
                >
                    {dict.admin.addIngredient}
                </button>
            </section>

            <section>
                <h2 className="font-bold text-gray-900 mb-3">{dict.recipes.steps}</h2>
                <div className="space-y-3">
                    {steps.map((row, index) => (
                        <div key={index} className="flex gap-2 items-end">
                            <span className="pb-3 text-sm font-semibold text-gray-400 tabular-nums w-6">{index + 1}.</span>
                            <div className="flex-1">
                                <TextArea label={dict.admin.stepText} value={row.text} onChange={e => patchStep(index, { text: e.target.value })} />
                            </div>
                            <div className="flex gap-1 pb-1">
                                <button type="button" aria-label={dict.admin.moveUp} onClick={() => setSteps(rows => move(rows, index, index - 1))} className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:border-gray-400">
                                    <ArrowUpIcon className="h-4 w-4" />
                                </button>
                                <button type="button" aria-label={dict.admin.moveDown} onClick={() => setSteps(rows => move(rows, index, index + 1))} className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:border-gray-400">
                                    <ArrowDownIcon className="h-4 w-4" />
                                </button>
                                <button type="button" aria-label={dict.common.remove} onClick={() => setSteps(rows => rows.filter((_, i) => i !== index))} className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:border-red-400 hover:text-red-600">
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                <button
                    type="button"
                    onClick={() => setSteps(rows => [...rows, emptyStep()])}
                    className="mt-3 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:border-gray-400"
                >
                    {dict.admin.addStep}
                </button>
            </section>

            <section className="space-y-4">
                <TextArea label={dict.recipes.tips} value={tips} onChange={e => setTips(e.target.value)} />
                <Toggle checked={isPublished} onChange={setIsPublished} label={dict.admin.published} />
            </section>

            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={save}
                    disabled={saving}
                    className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                >
                    {saving ? dict.common.saving : dict.common.save}
                </button>
                <button
                    type="button"
                    onClick={() => router.push(localeHref(locale, '/admin/recipes'))}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-gray-400"
                >
                    {dict.common.cancel}
                </button>
            </div>
        </div>
    );
}
