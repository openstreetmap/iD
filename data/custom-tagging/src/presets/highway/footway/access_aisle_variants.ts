import type { CustomPreset } from '../../../types';
import { ANY, buildRemoveTags } from '../../../lib/tag_helpers';
import { presetNameEn } from '../../../preset_name_en';
import { ACCESS_AISLE_FIELDS, ACCESS_AISLE_MORE_FIELDS, ACCESS_AISLE_REFERENCE } from './access_aisle_fields';

interface AccessAisleVariant {
    id: string;
    bicycle?: 'dismount' | 'yes';
}

const ACCESS_AISLE_VARIANTS: AccessAisleVariant[] = [
    { id: 'highway/footway/access_aisle' },
    { id: 'highway/footway/access_aisle_bicycle_dismount', bicycle: 'dismount' },
    { id: 'highway/footway/access_aisle_bicycle_yes', bicycle: 'yes' }
];

function accessAislePreset(variant: AccessAisleVariant): CustomPreset {
    const tags: Record<string, string> = { highway: 'footway', footway: 'access_aisle' };
    if (variant.bicycle) tags.bicycle = variant.bicycle;

    const addTags: Record<string, string> = {
        highway: 'footway',
        footway: 'access_aisle',
        surface: 'asphalt'
    };
    addTags.bicycle = variant.bicycle ?? 'dismount';

    const removeTags = buildRemoveTags(addTags, { access: ANY });

    return {
        icon: 'temaki-striped_way',
        geometry: ['line'],
        fields: [...ACCESS_AISLE_FIELDS],
        moreFields: [...ACCESS_AISLE_MORE_FIELDS],
        tags,
        addTags,
        removeTags,
        matchScore: 2,
        reference: ACCESS_AISLE_REFERENCE,
        name: presetNameEn(variant.id)
    };
}

export const accessAisleVariantPresets: Record<string, CustomPreset> = Object.fromEntries(
    ACCESS_AISLE_VARIANTS.map((v) => [v.id, accessAislePreset(v)] as const)
);
