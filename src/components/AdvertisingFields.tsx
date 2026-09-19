"use client";

import Toggle from '@/components/Toggle';
import TextInput from '@/components/TextInput';
import { useDictionary } from '@/i18n/DictionaryProvider';

interface Props {
    isAdvertising: boolean;
    advertiser: string;
    onChange: (value: { isAdvertising: boolean; advertiser: string }) => void;
}

/**
 * Marks an item as advertising. Norwegian rules require the label on free products and
 * discounts too, not only paid partnerships, so the hint spells that out where it is decided.
 */
export default function AdvertisingFields({ isAdvertising, advertiser, onChange }: Props) {
    const { dict } = useDictionary();

    return (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
            <Toggle
                checked={isAdvertising}
                onChange={value => onChange({ isAdvertising: value, advertiser })}
                label={dict.admin.advertising}
            />
            <p className="text-sm text-amber-900">{dict.admin.advertisingHint}</p>

            {isAdvertising && (
                <div>
                    <TextInput
                        label={dict.admin.advertiser}
                        value={advertiser}
                        onChange={e => onChange({ isAdvertising, advertiser: e.target.value })}
                    />
                    <p className="mt-1 text-xs text-amber-900">{dict.admin.advertiserHint}</p>
                </div>
            )}
        </div>
    );
}
