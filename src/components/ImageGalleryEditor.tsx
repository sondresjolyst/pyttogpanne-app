"use client";

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { ArrowDownIcon, ArrowUpIcon, PhotoIcon, TrashIcon } from '@heroicons/react/24/outline';
import ContentImage from '@/components/ContentImage';
import TextInput from '@/components/TextInput';
import ImageService, { type GalleryImageInput } from '@/services/imageService';
import { move } from '@/lib/arrays';
import { useDictionary } from '@/i18n/DictionaryProvider';

interface Props {
    images: GalleryImageInput[];
    onChange: (images: GalleryImageInput[]) => void;
}

/** Ordered photos with captions. The first one is the cover, wherever it is used. */
export default function ImageGalleryEditor({ images, onChange }: Props) {
    const { dict } = useDictionary();
    const fileInput = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    const upload = async (files: File[]) => {
        setUploading(true);
        try {
            const uploaded = await Promise.all(files.map(file => ImageService.upload(file)));
            // The API keeps the first of any repeat, so dropping repeats here keeps what the
            // editor shows and what gets saved in step.
            const added = uploaded
                .filter(image => !images.some(existing => existing.contentImageId === image.id))
                .map(image => ({ contentImageId: image.id, caption: '' }));
            onChange([...images, ...added]);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : dict.admin.uploadFailed);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div>
            <p className="text-sm text-gray-500 mb-3">{dict.admin.galleryHint}</p>

            {images.length === 0 ? (
                <div className="flex h-24 w-32 items-center justify-center rounded-lg border border-dashed border-gray-300 text-gray-400">
                    <PhotoIcon className="h-6 w-6" />
                </div>
            ) : (
                <ul className="space-y-3">
                    {images.map((image, index) => (
                        <li key={image.contentImageId} className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
                            <div className="relative shrink-0">
                                <ContentImage imageId={image.contentImageId} alt="" sizes="128px" className="h-20 w-28 rounded-lg object-cover" />
                                {index === 0 && (
                                    <span className="absolute left-1 top-1 rounded-full bg-gray-900 px-2 py-0.5 text-xs font-medium text-white">
                                        {dict.admin.coverImage}
                                    </span>
                                )}
                            </div>
                            <div className="flex-1">
                                <TextInput
                                    label={dict.admin.caption}
                                    value={image.caption ?? ''}
                                    onChange={e => onChange(images.map((row, i) => (i === index ? { ...row, caption: e.target.value } : row)))}
                                />
                            </div>
                            <div className="flex gap-1">
                                <button type="button" aria-label={dict.admin.moveUp} onClick={() => onChange(move(images, index, index - 1))} className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:border-gray-400">
                                    <ArrowUpIcon className="h-4 w-4" />
                                </button>
                                <button type="button" aria-label={dict.admin.moveDown} onClick={() => onChange(move(images, index, index + 1))} className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:border-gray-400">
                                    <ArrowDownIcon className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    aria-label={dict.common.remove}
                                    onClick={() => onChange(images.filter((_, i) => i !== index))}
                                    className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:border-red-400 hover:text-red-600"
                                >
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={uploading}
                className="mt-3 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:border-gray-400 disabled:opacity-50"
            >
                {uploading ? dict.admin.uploading : dict.admin.addImage}
            </button>
            <input
                ref={fileInput}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={e => {
                    const files = [...(e.target.files ?? [])];
                    if (files.length > 0) upload(files);
                    e.target.value = '';
                }}
            />
        </div>
    );
}
