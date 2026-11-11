// =============================================================================
// ACCESS CATEGORIES — configuration of the restricted-access way presets.
//
// Every access category below is combined with every way kind and every grid
// surface to build one preset each (see access_grid.ts):
//   - service roads: SERVICE_KINDS × GRID_SURFACES, plus the separate sidewalk
//     variants of plain service roads (SIDEWALK_LABELS);
//   - footways, steps and paths: FOOTWAY_KINDS × GRID_SURFACES, only for the
//     categories with `footways: true`.
//
// The same categories color the map: a highway gets the CSS class
// `tag-access-category-<id>` of the first category whose tags (or footway tags)
// it all carries (config/tag_classes_custom.js); the colors are in css/30_highways.css.
//
// To update:
//   1. edit the categories, kinds, surfaces or labels below;
//   2. add or change the `tag-access-category-<id>` color in css/30_highways.css;
//   3. run `npm run generate:locales:access-grid` to write the preset names and
//      search terms to data/locales/custom_presets/{en,fr}.json (aliases are
//      kept; entries of removed presets must be deleted by hand);
//   4. run `npm run build:presets:custom`.
//
// Tagging references:
//   https://wiki.openstreetmap.org/wiki/Key:access
//   https://wiki.openstreetmap.org/wiki/Key:ownership
//   https://wiki.openstreetmap.org/wiki/Key:operator:type
//   https://wiki.openstreetmap.org/wiki/Key:surface
// =============================================================================

/** French grammatical gender of a way kind, for the agreement of category and surface labels. */
export type Gender = 'm' | 'f';

/** Label in each preset locale; French labels that agree with the way kind have both genders. */
export interface Labels {
    en: string;
    fr: string | Record<Gender, string>;
}

/** Search terms in each preset locale. */
export interface Terms {
    en: string[];
    fr: string[];
}

/** One access category: a set of tags that restricts who may use a way. */
export interface AccessCategory {
    /** Preset id part and CSS class suffix (`tag-access-category-<id>`). */
    id: string;
    /** Tags added by the presets; a highway carrying all of them is drawn in this category's color. */
    tags: Record<string, string>;
    /**
     * Tags of the footway, steps and path presets when they differ from `tags`;
     * a highway carrying all of them is also drawn in this category's color.
     */
    footwayTags?: Record<string, string>;
    /** Wider casing on motor roads (`tag-custom-access-emphasis`). */
    wide: boolean;
    /** Also offered for footways, steps and paths (pedestrian access, not motor_vehicle only). */
    footways: boolean;
    /** Appended to the way kind name, e.g. "Driveway" + "customers only". */
    label: Labels;
    terms: Terms;
    /** OSM wiki pages documenting the tags. */
    wiki: string[];
}

/**
 * Access categories, from the most specific to the most general: the map uses
 * the first one whose tags a way carries, so a category must come before any
 * category whose tags are a subset of its own.
 */
export const ACCESS_CATEGORIES: AccessCategory[] = [
    {
        id: 'private',
        tags: { access: 'private' },
        wide: true,
        footways: true,
        label: { en: 'strictly private', fr: { m: 'strictement privé', f: 'strictement privée' } },
        terms: { en: ['private', 'no access'], fr: ['privé', 'accès interdit'] },
        wiki: ['https://wiki.openstreetmap.org/wiki/Tag:access%3Dprivate']
    },
    {
        id: 'customers',
        tags: { access: 'customers' },
        wide: true,
        footways: true,
        label: { en: 'customers only', fr: 'clients seulement' },
        terms: { en: ['customers', 'business'], fr: ['clients', 'commerce'] },
        wiki: ['https://wiki.openstreetmap.org/wiki/Tag:access%3Dcustomers']
    },
    {
        id: 'delivery',
        tags: { access: 'delivery' },
        wide: false,
        footways: false,
        label: { en: 'delivery only', fr: 'livraisons seulement' },
        terms: { en: ['delivery', 'loading'], fr: ['livraison', 'débarcadère'] },
        wiki: ['https://wiki.openstreetmap.org/wiki/Tag:access%3Ddelivery']
    },
    {
        id: 'permissive',
        tags: { access: 'permissive' },
        wide: false,
        footways: true,
        label: { en: 'permissive', fr: { m: 'permissif', f: 'permissive' } },
        terms: { en: ['permissive', 'tolerated'], fr: ['permissif', 'toléré'] },
        wiki: ['https://wiki.openstreetmap.org/wiki/Tag:access%3Dpermissive']
    },
    {
        // In Canada, the implied licence doctrine (R. v. Evans, 1996 CanLII 248 (SCC))
        // lets any member of the public on legitimate business approach the door of a
        // dwelling, unless the occupier revokes it with a sign or a locked gate (then
        // use `private`): access=destination, not access=private, on private property.
        id: 'private_property',
        tags: { access: 'destination', ownership: 'private' },
        wide: true,
        footways: true,
        label: { en: 'private ownership no transit', fr: 'propriété privée sans transit' },
        terms: {
            en: ['private', 'ownership', 'destination', 'residential'],
            fr: ['privé', 'propriété', 'destination', 'résidentiel']
        },
        wiki: [
            'https://wiki.openstreetmap.org/wiki/Tag:access%3Ddestination',
            'https://wiki.openstreetmap.org/wiki/Key:ownership'
        ]
    },
    {
        // motor_vehicle only, so pedestrians and cyclists keep their default access
        id: 'business',
        tags: { motor_vehicle: 'destination', ownership: 'private', 'operator:type': 'business' },
        wide: false,
        footways: false,
        label: { en: 'business no transit', fr: { m: 'commercial sans transit', f: 'commerciale sans transit' } },
        terms: { en: ['business', 'commercial', 'destination'], fr: ['commerce', 'commercial', 'destination'] },
        wiki: [
            'https://wiki.openstreetmap.org/wiki/Key:motor_vehicle',
            'https://wiki.openstreetmap.org/wiki/Key:ownership',
            'https://wiki.openstreetmap.org/wiki/Key:operator:type'
        ]
    },
    {
        // motor_vehicle only on motor roads, so pedestrians and cyclists keep their
        // default access; access=destination on footways, steps and paths
        id: 'destination',
        tags: { motor_vehicle: 'destination' },
        footwayTags: { access: 'destination' },
        wide: false,
        footways: true,
        label: { en: 'public no transit', fr: { m: 'public sans transit', f: 'publique sans transit' } },
        terms: { en: ['public', 'destination', 'no through traffic'], fr: ['public', 'destination', 'sans transit'] },
        wiki: [
            'https://wiki.openstreetmap.org/wiki/Key:motor_vehicle',
            'https://wiki.openstreetmap.org/wiki/Tag:access%3Ddestination'
        ]
    },
    {
        id: 'private_ownership',
        tags: { ownership: 'private' },
        wide: false,
        footways: true,
        label: { en: 'private ownership', fr: 'propriété privée' },
        terms: { en: ['private', 'ownership'], fr: ['privé', 'propriété'] },
        wiki: ['https://wiki.openstreetmap.org/wiki/Key:ownership']
    }
];

/** Surfaces offered as separate presets for every way kind. */
export const GRID_SURFACES = ['asphalt', 'concrete', 'unpaved'] as const;
export type GridSurface = (typeof GRID_SURFACES)[number];

/** Surface labels, appended to the preset name of the non-default surfaces. */
export const SURFACE_LABELS: Record<GridSurface, Labels> = {
    asphalt: { en: 'asphalt', fr: 'asphalte' },
    concrete: { en: 'concrete', fr: 'béton' },
    unpaved: { en: 'unpaved', fr: { m: 'non revêtu', f: 'non revêtue' } }
};

/** One way kind of the grid: the tags it matches and how its presets are named. */
export interface WayKind {
    /** Preset id part; empty for the plain way (no subtype tag). */
    id: string;
    tags: Record<string, string>;
    /**
     * Surface added on creation only, so a way keeps the plain preset when its
     * surface changes to any value outside the grid (paving_stones, gravel…).
     */
    defaultSurface: GridSurface;
    label: Labels;
    gender: Gender;
    terms: Terms;
    wiki: string;
}

/** Service roads: https://wiki.openstreetmap.org/wiki/Key:service */
export const SERVICE_KINDS: WayKind[] = [
    {
        id: '',
        tags: { highway: 'service' },
        defaultSurface: 'asphalt',
        label: { en: 'Service road', fr: 'Voie de service' },
        gender: 'f',
        terms: { en: ['service road'], fr: ['voie de service'] },
        wiki: 'https://wiki.openstreetmap.org/wiki/Tag:highway%3Dservice'
    },
    {
        id: 'parking_aisle',
        tags: { highway: 'service', service: 'parking_aisle' },
        defaultSurface: 'asphalt',
        label: { en: 'Parking aisle', fr: 'Allée de stationnement' },
        gender: 'f',
        terms: { en: ['parking aisle', 'parking lot'], fr: ['allée de stationnement', 'stationnement'] },
        wiki: 'https://wiki.openstreetmap.org/wiki/Tag:service%3Dparking_aisle'
    },
    {
        id: 'driveway',
        tags: { highway: 'service', service: 'driveway' },
        defaultSurface: 'asphalt',
        label: { en: 'Driveway', fr: 'Entrée charretière' },
        gender: 'f',
        terms: { en: ['driveway', 'entrance'], fr: ['entrée charretière', 'entrée', 'allée'] },
        wiki: 'https://wiki.openstreetmap.org/wiki/Tag:service%3Ddriveway'
    },
    {
        id: 'drive_through',
        tags: { highway: 'service', service: 'drive-through' },
        defaultSurface: 'asphalt',
        label: { en: 'Drive-through', fr: 'Service au volant' },
        gender: 'm',
        terms: { en: ['drive-through', 'drive-thru'], fr: ['service au volant', 'drive-thru'] },
        wiki: 'https://wiki.openstreetmap.org/wiki/Tag:service%3Ddrive-through'
    }
];

/** Footways, steps and paths: https://wiki.openstreetmap.org/wiki/Key:footway */
export const FOOTWAY_KINDS: WayKind[] = [
    {
        id: '',
        tags: { highway: 'footway' },
        defaultSurface: 'asphalt',
        label: { en: 'Footway', fr: 'Chemin piéton' },
        gender: 'm',
        terms: { en: ['footway', 'foot path'], fr: ['chemin piéton', 'sentier'] },
        wiki: 'https://wiki.openstreetmap.org/wiki/Tag:highway%3Dfootway'
    },
    {
        id: 'sidewalk',
        tags: { highway: 'footway', footway: 'sidewalk' },
        defaultSurface: 'concrete',
        label: { en: 'Sidewalk', fr: 'Trottoir' },
        gender: 'm',
        terms: { en: ['sidewalk'], fr: ['trottoir'] },
        wiki: 'https://wiki.openstreetmap.org/wiki/Tag:footway%3Dsidewalk'
    },
    {
        id: 'access_aisle',
        tags: { highway: 'footway', footway: 'access_aisle' },
        defaultSurface: 'asphalt',
        label: { en: 'Access aisle', fr: 'Voie de circulation' },
        gender: 'f',
        terms: { en: ['access aisle', 'striped zone'], fr: ['voie de circulation', 'zone hachurée'] },
        wiki: 'https://wiki.openstreetmap.org/wiki/Tag:footway%3Daccess_aisle'
    },
    {
        id: 'footway_link',
        tags: { highway: 'footway', footway: 'link' },
        defaultSurface: 'asphalt',
        label: { en: 'Footway link', fr: 'Lien piétonnier' },
        gender: 'm',
        terms: { en: ['footway link', 'connector'], fr: ['lien piétonnier', 'connecteur'] },
        wiki: 'https://wiki.openstreetmap.org/wiki/Tag:footway%3Dlink'
    },
    {
        id: 'steps',
        tags: { highway: 'steps' },
        defaultSurface: 'concrete',
        label: { en: 'Steps', fr: 'Escalier' },
        gender: 'm',
        terms: { en: ['steps', 'stairs'], fr: ['escalier', 'marches'] },
        wiki: 'https://wiki.openstreetmap.org/wiki/Tag:highway%3Dsteps'
    },
    {
        id: 'path',
        tags: { highway: 'path' },
        defaultSurface: 'unpaved',
        label: { en: 'Path', fr: 'Sentier' },
        gender: 'm',
        terms: { en: ['path', 'trail'], fr: ['sentier'] },
        wiki: 'https://wiki.openstreetmap.org/wiki/Tag:highway%3Dpath'
    },
    {
        id: 'informal',
        tags: { highway: 'path', informal: 'yes' },
        defaultSurface: 'unpaved',
        label: { en: 'Informal path', fr: 'Sentier informel' },
        gender: 'm',
        terms: { en: ['informal path', 'desire path'], fr: ['sentier informel', 'chemin de traverse'] },
        wiki: 'https://wiki.openstreetmap.org/wiki/Key:informal'
    }
];

/** Separate sidewalk variants of plain service roads (tags in sidewalk_variant_tags.ts). */
export const SERVICE_SIDEWALKS = ['both', 'left', 'right', 'opposite'] as const;
export type ServiceSidewalk = (typeof SERVICE_SIDEWALKS)[number];

/** Labels of the separate sidewalk variants, appended in parentheses to the preset name. */
export const SIDEWALK_LABELS: Record<ServiceSidewalk, { label: Labels; terms: Terms }> = {
    both: {
        label: { en: 'separate sidewalk, both sides', fr: 'trottoir séparé, deux côtés' },
        terms: { en: ['sidewalk', 'sidepath', 'both'], fr: ['trottoir', 'deux côtés'] }
    },
    left: {
        label: { en: 'separate sidewalk, left', fr: 'trottoir séparé, gauche' },
        terms: { en: ['sidewalk', 'sidepath', 'left'], fr: ['trottoir', 'gauche'] }
    },
    right: {
        label: { en: 'separate sidewalk, right', fr: 'trottoir séparé, droite' },
        terms: { en: ['sidewalk', 'sidepath', 'right'], fr: ['trottoir', 'droite'] }
    },
    opposite: {
        label: { en: 'divided, sidewalk opposite side', fr: 'chaussées séparées, trottoir côté opposé' },
        terms: {
            en: ['sidewalk', 'sidepath', 'divided', 'opposite'],
            fr: ['trottoir', 'chaussées séparées', 'côté opposé']
        }
    }
};
