import type { CustomPreset } from '../../types';
import { presetNameEn } from '../../preset_name_en';
import { serviceGridEntries } from './access_grid';

// =============================================================================
// SERVICE ROADS — restricted-access service roads, built from the access grid
// (access_categories.ts): one preset per access category × `service` subtype ×
// surface, plus the separate sidewalk variants for each access category.
// =============================================================================

const ICON = 'iD-highway-service';
const FIELDS = ['{highway/service}'];

export const serviceVariantPresets: Record<string, CustomPreset> = Object.fromEntries(
    serviceGridEntries().map((entry): [string, CustomPreset] => [
        entry.id,
        {
            icon: ICON,
            geometry: ['line'],
            fields: [...FIELDS],
            moreFields: [...FIELDS],
            tags: entry.tags,
            addTags: entry.addTags,
            // Only force-remove foot=use_sidepath on preset change; sidewalk tags are
            // managed by the shared sidewalk field, which iD preserves (preserveKeys).
            ...(entry.sidewalk ? { removeTags: { foot: 'use_sidepath' } } : {}),
            reference: entry.kind.id ? { key: 'service', value: entry.kind.tags.service } : { key: 'highway', value: 'service' },
            name: presetNameEn(entry.id)
        }
    ])
);
