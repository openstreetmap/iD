import type { CustomPreset, PresetReference } from '../../../types';
import { ANY, buildRemoveTags } from '../../../lib/tag_helpers';
import { presetNameEn } from '../../../preset_name_en';
import { footwayGridEntries } from '../access_grid';
import {
    ACCESS_AISLE_FIELDS,
    ACCESS_AISLE_MORE_FIELDS,
    ACCESS_AISLE_REFERENCE,
    FOOTWAY_LINK_FIELDS,
    FOOTWAY_LINK_MORE_FIELDS,
    FOOTWAY_LINK_REFERENCE,
    RESTRICTED_AISLE_FIELDS
} from './access_aisle_fields';

// =============================================================================
// RESTRICTED FOOTWAYS — footways, steps and paths built from the access grid
// (access_categories.ts): one preset per access category × way kind × surface.
// =============================================================================

const RESTRICTED_FOOTWAY_FIELDS = [...FOOTWAY_LINK_FIELDS, 'access_restricted'] as const;

/** Preset shell of one way kind (FOOTWAY_KINDS id in access_categories.ts). */
interface FootwayShell {
    icon: string;
    fields: readonly string[];
    moreFields: readonly string[];
    reference: PresetReference;
    /** Wildcards added to removeTags; undefined keeps iD's default (removeTags = addTags). */
    removeWildcards?: Record<string, typeof ANY>;
    /** Above the generic bicycle/footway variants that match the same tags. */
    matchScore?: number;
}

const FOOTWAY_SHELLS: Record<string, FootwayShell> = {
    '': {
        icon: 'temaki-pedestrian',
        fields: RESTRICTED_FOOTWAY_FIELDS,
        moreFields: FOOTWAY_LINK_MORE_FIELDS,
        reference: { key: 'highway', value: 'footway' },
        removeWildcards: { bicycle: ANY, footway: ANY },
        matchScore: 2
    },
    sidewalk: {
        icon: 'temaki-pedestrian',
        fields: RESTRICTED_FOOTWAY_FIELDS,
        moreFields: FOOTWAY_LINK_MORE_FIELDS,
        reference: { key: 'footway', value: 'sidewalk' },
        removeWildcards: { bicycle: ANY },
        matchScore: 2
    },
    access_aisle: {
        icon: 'temaki-striped_way',
        fields: ACCESS_AISLE_FIELDS,
        moreFields: ACCESS_AISLE_MORE_FIELDS,
        reference: ACCESS_AISLE_REFERENCE,
        removeWildcards: { bicycle: ANY },
        matchScore: 2
    },
    footway_link: {
        icon: 'temaki-striped_way',
        fields: RESTRICTED_AISLE_FIELDS,
        moreFields: ACCESS_AISLE_MORE_FIELDS,
        reference: FOOTWAY_LINK_REFERENCE,
        removeWildcards: { bicycle: ANY },
        matchScore: 2
    },
    steps: {
        icon: 'iD-highway-steps',
        fields: ['{highway/steps}'],
        moreFields: ['{highway/steps}'],
        reference: { key: 'highway', value: 'steps' }
    },
    path: {
        icon: 'iD-other-line',
        fields: RESTRICTED_FOOTWAY_FIELDS,
        moreFields: FOOTWAY_LINK_MORE_FIELDS,
        reference: { key: 'highway', value: 'path' },
        removeWildcards: { bicycle: ANY },
        matchScore: 2
    },
    informal: {
        icon: 'iD-other-line',
        fields: RESTRICTED_FOOTWAY_FIELDS,
        moreFields: FOOTWAY_LINK_MORE_FIELDS,
        reference: { key: 'informal', value: 'yes' },
        removeWildcards: { bicycle: ANY, footway: ANY, highway: ANY },
        matchScore: 2
    }
};

export const restrictedFootwayVariantPresets: Record<string, CustomPreset> = Object.fromEntries(
    footwayGridEntries().map((entry): [string, CustomPreset] => {
        const shell = FOOTWAY_SHELLS[entry.kind.id];
        return [
            entry.id,
            {
                icon: shell.icon,
                geometry: ['line'],
                fields: [...shell.fields],
                moreFields: [...shell.moreFields],
                tags: entry.tags,
                addTags: entry.addTags,
                ...(shell.removeWildcards ? { removeTags: buildRemoveTags(entry.addTags, shell.removeWildcards) } : {}),
                ...(shell.matchScore ? { matchScore: shell.matchScore } : {}),
                reference: shell.reference,
                name: presetNameEn(entry.id)
            }
        ];
    })
);
