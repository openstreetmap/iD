import {
    ACCESS_CATEGORIES,
    FOOTWAY_KINDS,
    GRID_SURFACES,
    SERVICE_KINDS,
    SERVICE_SIDEWALKS,
    SIDEWALK_LABELS,
    SURFACE_LABELS,
    type AccessCategory,
    type Gender,
    type GridSurface,
    type Labels,
    type ServiceSidewalk,
    type WayKind
} from './access_categories';
import { SIDEWALK_VARIANT_TAGS } from './sidewalk_variant_tags';

// =============================================================================
// ACCESS GRID — expands the configuration of access_categories.ts into one
// entry per preset (id, matched tags, added tags, names). Used by the preset
// sources, the locale generator and the map tag classes.
// =============================================================================

/** Preset locales written by the locale generator. */
export type GridLocale = 'en' | 'fr';

/** One preset of the access grid. */
export interface GridEntry {
    id: string;
    category: AccessCategory;
    kind: WayKind;
    /** Grid surface matched by the preset; undefined for the default-surface preset. */
    surface?: GridSurface;
    /** Separate sidewalk variant (plain service roads only). */
    sidewalk?: ServiceSidewalk;
    /** Tags matched by the preset. */
    tags: Record<string, string>;
    /** Tags added when the preset is applied. */
    addTags: Record<string, string>;
}

/** Join non-empty id parts with `_` (e.g. `private`, `unpaved`, `driveway`). */
function joinIdParts(...parts: (string | undefined)[]): string {
    return parts.filter(Boolean).join('_');
}

/**
 * One entry per grid surface: the default surface is only added on creation,
 * the other surfaces are matched.
 */
function surfaceEntries(
    category: AccessCategory,
    kind: WayKind,
    id: (surface?: GridSurface) => string,
    categoryTags = category.tags
): GridEntry[] {
    return GRID_SURFACES.map((gridSurface) => {
        const surface = gridSurface === kind.defaultSurface ? undefined : gridSurface;
        const tags = { ...kind.tags, ...categoryTags, ...(surface ? { surface } : {}) };
        return { id: id(surface), category, kind, surface, tags, addTags: { surface: gridSurface, ...tags } };
    });
}

/** Separate sidewalk presets of a plain service road; each carries foot=use_sidepath. */
function sidewalkEntries(category: AccessCategory): GridEntry[] {
    const kind = SERVICE_KINDS[0];
    return SERVICE_SIDEWALKS.map((sidewalk) => {
        const tags = { ...kind.tags, ...category.tags, foot: 'use_sidepath', ...SIDEWALK_VARIANT_TAGS[sidewalk] };
        const suffix = sidewalk === 'opposite' ? 'opposite_use_sidepath' : `sidewalk_${sidewalk}`;
        return {
            id: `highway/service/${category.id}_${suffix}`,
            category,
            kind,
            sidewalk,
            tags,
            addTags: { surface: kind.defaultSurface, ...tags }
        };
    });
}

/** Service road presets: `highway/service/<category>[_<surface>][_<service>]`. */
export function serviceGridEntries(): GridEntry[] {
    return ACCESS_CATEGORIES.flatMap((category) => [
        ...SERVICE_KINDS.flatMap((kind) =>
            surfaceEntries(category, kind, (surface) => `highway/service/${joinIdParts(category.id, surface, kind.id)}`)
        ),
        ...sidewalkEntries(category)
    ]);
}

/**
 * Footway, steps and path presets: `highway/footway/<category>[_<surface>][_<kind>]`,
 * except steps: `highway/steps_<category>[_<surface>]`, next to the other steps presets.
 */
export function footwayGridEntries(): GridEntry[] {
    return ACCESS_CATEGORIES.filter((category) => category.footways).flatMap((category) =>
        FOOTWAY_KINDS.flatMap((kind) =>
            surfaceEntries(
                category,
                kind,
                (surface) =>
                    kind.id === 'steps'
                        ? `highway/steps_${joinIdParts(category.id, surface)}`
                        : `highway/footway/${joinIdParts(category.id, surface, kind.id)}`,
                category.footwayTags
            )
        )
    );
}

/** Label in `locale`, in the gender of the way kind when it agrees. */
function labelText(labels: Labels, locale: GridLocale, gender: Gender): string {
    const label = labels[locale];
    return typeof label === 'string' ? label : label[gender];
}

/**
 * Preset name, e.g. "Driveway customers only, concrete".
 * @param entry - grid preset
 * @param locale - preset locale
 */
export function gridPresetName(entry: GridEntry, locale: GridLocale): string {
    const gender = entry.kind.gender;
    const parts = [`${labelText(entry.kind.label, locale, gender)} ${labelText(entry.category.label, locale, gender)}`];
    if (entry.surface) parts.push(`, ${labelText(SURFACE_LABELS[entry.surface], locale, gender)}`);
    if (entry.sidewalk) parts.push(` (${labelText(SIDEWALK_LABELS[entry.sidewalk].label, locale, gender)})`);
    return parts.join('');
}

/**
 * Comma-separated search terms of the category, way kind, surface and sidewalk.
 * @param entry - grid preset
 * @param locale - preset locale
 */
export function gridPresetTerms(entry: GridEntry, locale: GridLocale): string {
    const terms = [
        ...entry.category.terms[locale],
        ...entry.kind.terms[locale],
        ...(entry.surface ? [labelText(SURFACE_LABELS[entry.surface], locale, entry.kind.gender)] : []),
        ...(entry.sidewalk ? SIDEWALK_LABELS[entry.sidewalk].terms[locale] : [])
    ];
    return [...new Set(terms)].join(', ');
}

/**
 * Tag sets that identify a category on the map: its tags and, when set, its footway tags.
 * @param category - access category
 */
export function accessCategoryTagSets(category: AccessCategory): Record<string, string>[] {
    return category.footwayTags ? [category.tags, category.footwayTags] : [category.tags];
}

/**
 * First access category with a tag set whose tags all appear in `tags` (see ACCESS_CATEGORIES ordering).
 * @param tags - entity tags
 * @returns the matching category, or undefined
 */
export function matchAccessCategory(tags: Record<string, string>): AccessCategory | undefined {
    return ACCESS_CATEGORIES.find((category) =>
        accessCategoryTagSets(category).some((tagSet) =>
            Object.entries(tagSet).every(([key, value]) => tags[key] === value)
        )
    );
}
