"use client";

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { PhotoIcon, TrashIcon } from '@heroicons/react/24/outline';
import ContentImage from '@/components/ContentImage';
import ImageService from '@/services/imageService';
import { useDictionary } from '@/i18n/DictionaryProvider';

interface Props {
    contentImageId: string | null;
    onChange: (contentImageId: string | null) => void;
}

/** One photo for a single step, shown next to the text it belongs to. */
export default function StepImagePicker({ contentImageId, onChange }: Props) {
    const { dict } = useDictionary();
    const fileInput = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    const upload = async (file: File) => {
        setUploading(true);
        try {
            const image = await ImageService.upload(file);
            onChange(image.id);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : dict.admin.uploadFailed);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-1">
            {contentImageId ? (
                <>
                    <ContentImage imageId={contentImageId} alt="" sizes="112px" className="h-16 w-24 rounded-lg object-cover" />
                    <button
                        type="button"
                        aria-label={dict.common.remove}
                        onClick={() => onChange(null)}
                        className="rounded-lg border border-gray-300 p-1.5 text-gray-600 hover:border-red-400 hover:text-red-600"
                    >
                        <TrashIcon className="h-4 w-4" />
                    </button>
                </>
            ) : (
                <button
                    type="button"
                    onClick={() => fileInput.current?.click()}
                    disabled={uploading}
                    aria-label={dict.admin.stepImage}
                    title={dict.admin.stepImage}
                    className="flex h-16 w-24 items-center justify-center rounded-lg border border-dashed border-gray-300 text-gray-400 hover:border-gray-400 disabled:opacity-50"
                >
                    <PhotoIcon className="h-5 w-5" />
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
    );
}
