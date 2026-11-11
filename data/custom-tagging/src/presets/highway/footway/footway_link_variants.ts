import type { CustomPreset } from '../../../types';
import { ANY, buildRemoveTags } from '../../../lib/tag_helpers';
import { presetNameEn } from '../../../preset_name_en';
import {
    FOOTWAY_LINK_FIELDS,
    FOOTWAY_LINK_MORE_FIELDS,
    FOOTWAY_LINK_REFERENCE
} from './access_aisle_fields';

interface FootwayLinkBicycleVariant {
    id: string;
    bicycle: 'dismount' | 'yes';
}

const BICYCLE_LINK_VARIANTS: FootwayLinkBicycleVariant[] = [
    { id: 'highway/footway/footway_link_bicycle_dismount', bicycle: 'dismount' },
    { id: 'highway/footway/footway_link_bicycle_yes', bicycle: 'yes' }
];

function footwayLinkBicyclePreset(variant: FootwayLinkBicycleVariant): CustomPreset {
    const addTags = {
        highway: 'footway',
        footway: 'link',
        bicycle: variant.bicycle,
        surface: 'asphalt'
    };
    return {
        icon: 'temaki-pedestrian',
        geometry: ['line'],
        fields: [...FOOTWAY_LINK_FIELDS],
        moreFields: [...FOOTWAY_LINK_MORE_FIELDS],
        tags: { highway: 'footway', footway: 'link', bicycle: variant.bicycle },
        addTags,
        removeTags: buildRemoveTags(addTags, { access: ANY }),
        matchScore: 2,
        reference: FOOTWAY_LINK_REFERENCE,
        name: presetNameEn(variant.id)
    };
}

export const footwayLinkVariantPresets: Record<string, CustomPreset> = {
    ...Object.fromEntries(BICYCLE_LINK_VARIANTS.map((v) => [v.id, footwayLinkBicyclePreset(v)] as const))
};
