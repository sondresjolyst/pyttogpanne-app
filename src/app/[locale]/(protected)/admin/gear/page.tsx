"use client";

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { PencilSquareIcon, PhotoIcon, TrashIcon } from '@heroicons/react/24/outline';
import TextInput from '@/components/TextInput';
import TextArea from '@/components/TextArea';
import Toggle from '@/components/Toggle';
import ContentImage from '@/components/ContentImage';
import GearService, { GEAR_KINDS, type GearItem, type GearItemInput, type GearKind } from '@/services/gearService';
import ImageService from '@/services/imageService';
import { useDictionary } from '@/i18n/DictionaryProvider';

const emptyDraft = (sortOrder: number): GearItemInput => ({
    title: '',
    kind: 'Utstyr',
    summary: '',
    body: '',
    contentImageId: null,
    sortOrder,
    isPublished: false,
});

export default function AdminGearPage() {
    const { dict } = useDictionary();
    const fileInput = useRef<HTMLInputElement>(null);
    const [items, setItems] = useState<GearItem[] | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [draft, setDraft] = useState<GearItemInput>(emptyDraft(10));
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    const load = () =>
        GearService.list()
            .then(setItems)
            .catch(err => toast.error(err instanceof Error ? err.message : dict.admin.gearLoadFailed));

    useEffect(() => { load(); }, []);

    const startNew = () => {
        setEditingId(null);
        setDraft(emptyDraft((items?.length ?? 0) * 10 + 20));
    };

    const startEdit = (item: GearItem) => {
        setEditingId(item.id);
        setDraft({
            title: item.title,
            kind: item.kind,
            summary: item.summary ?? '',
            body: item.body,
            contentImageId: item.contentImageId,
            sortOrder: item.sortOrder,
            isPublished: item.isPublished,
        });
    };

    const upload = async (file: File) => {
        setUploading(true);
        try {
            const image = await ImageService.upload(file);
            setDraft(d => ({ ...d, contentImageId: image.id }));
        } catch (err) {
            toast.error(err instanceof Error ? err.message : dict.admin.uploadFailed);
        } finally {
            setUploading(false);
        }
    };

    const save = async () => {
        if (draft.title.trim() === '') return toast.error(dict.admin.titleRequired);
        if (draft.body.trim() === '') return toast.error(dict.validation.required);

        setSaving(true);
        try {
            if (editingId != null) await GearService.update(editingId, draft);
            else await GearService.create(draft);
            toast.success(dict.admin.gearSaved);
            startNew();
            load();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : dict.admin.gearSaveFailed);
        } finally {
            setSaving(false);
        }
    };

    const remove = async (item: GearItem) => {
        if (!confirm(dict.admin.confirmDeleteGear.replace('{title}', item.title))) return;
        try {
            await GearService.remove(item.id);
            toast.success(dict.admin.gearDeleted);
            if (editingId === item.id) startNew();
            load();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : dict.admin.gearDeleteFailed);
        }
    };

    const kindLabel = (kind: GearKind) => (kind === 'Utstyr' ? dict.gear.kindUtstyr : dict.gear.kindTips);

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 p-5 space-y-4">
                <h2 className="font-bold text-gray-900">{editingId != null ? dict.admin.editGearItem : dict.admin.newGearItem}</h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                        <TextInput label={dict.admin.recipeTitle} required value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} />
                    </div>
                    <div>
                        <label htmlFor="kind" className="block text-sm font-medium text-gray-700 mb-1">{dict.gear.kind}</label>
                        <select
                            id="kind"
                            value={draft.kind}
                            onChange={e => setDraft({ ...draft, kind: e.target.value as GearKind })}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            {GEAR_KINDS.map(kind => <option key={kind} value={kind}>{kindLabel(kind)}</option>)}
                        </select>
                    </div>
                </div>

                <TextInput label={dict.gear.summary} value={draft.summary ?? ''} onChange={e => setDraft({ ...draft, summary: e.target.value })} />
                <TextArea label={dict.gear.body} required value={draft.body} onChange={e => setDraft({ ...draft, body: e.target.value })} />
                <p className="text-xs text-gray-500">{dict.admin.markdownHint}</p>

                <div className="flex items-center gap-4">
                    {draft.contentImageId ? (
                        <ContentImage imageId={draft.contentImageId} alt="" sizes="128px" className="h-20 w-28 rounded-lg object-cover" />
                    ) : (
                        <div className="flex h-20 w-28 items-center justify-center rounded-lg border border-dashed border-gray-300 text-gray-400">
                            <PhotoIcon className="h-6 w-6" />
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={() => fileInput.current?.click()}
                        disabled={uploading}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:border-gray-400 disabled:opacity-50"
                    >
                        {uploading ? dict.admin.uploading : dict.admin.addImage}
                    </button>
                    {draft.contentImageId && (
                        <button
                            type="button"
                            onClick={() => setDraft({ ...draft, contentImageId: null })}
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:border-gray-400"
                        >
                            {dict.common.remove}
                        </button>
                    )}
                    <input
                        ref={fileInput}
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) upload(file);
                            e.target.value = '';
                        }}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                    <TextInput label={dict.admin.sortOrder} type="number" value={draft.sortOrder} onChange={e => setDraft({ ...draft, sortOrder: Number(e.target.value) })} />
                    <Toggle checked={draft.isPublished} onChange={value => setDraft({ ...draft, isPublished: value })} label={dict.admin.published} />
                </div>

                <div className="flex gap-3">
                    <button type="button" onClick={save} disabled={saving} className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50">
                        {saving ? dict.common.saving : dict.common.save}
                    </button>
                    {editingId != null && (
                        <button type="button" onClick={startNew} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-gray-400">
                            {dict.common.cancel}
                        </button>
                    )}
                </div>
            </div>

            {items == null ? (
                <p className="text-sm text-gray-500">{dict.common.loading}</p>
            ) : items.length === 0 ? (
                <p className="text-sm text-gray-500">{dict.admin.noGear}</p>
            ) : (
                <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-200">
                    {items.map(item => (
                        <li key={item.id} className="flex items-center gap-3 p-4">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="truncate font-semibold text-gray-900">{item.title}</span>
                                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{kindLabel(item.kind)}</span>
                                    {!item.isPublished && (
                                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">{dict.admin.draftTag}</span>
                                    )}
                                </div>
                                {item.summary && <p className="truncate text-sm text-gray-500">{item.summary}</p>}
                            </div>
                            <button type="button" aria-label={dict.common.edit} onClick={() => startEdit(item)} className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:border-gray-400">
                                <PencilSquareIcon className="h-4 w-4" />
                            </button>
                            <button type="button" aria-label={dict.common.delete} onClick={() => remove(item)} className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:border-red-400 hover:text-red-600">
                                <TrashIcon className="h-4 w-4" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
