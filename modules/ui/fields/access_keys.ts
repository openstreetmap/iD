/**
 * Access keys in OSM wiki order (land-based transportation).
 * default: true = always show in UI; otherwise show only when present in tags.
 *
 * Only covers land keys because the schema's "access" field is only used on
 * highway/barrier/leisure presets. Waterway presets use "access_simple".
 * @see https://wiki.openstreetmap.org/wiki/Key:access#Land-based_transportation
 */

export interface AccessKeyEntry {
    key: string;
    default?: boolean;
}
export const ACCESS_KEYS: ReadonlyArray<AccessKeyEntry> = [
    { key: 'access', default: true },
    { key: 'foot', default: true },
    { key: 'dog' },
    { key: 'ski' },
    { key: 'ski:nordic' },
    { key: 'ski:alpine' },
    { key: 'ski:telemark' },
    { key: 'inline_skates' },
    { key: 'horse', default: true },
    { key: 'portage' },
    { key: 'vehicle' },
    { key: 'bicycle', default: true },
    { key: 'electric_bicycle' },
    { key: 'mtb' },
    { key: 'cargo_bike' },
    { key: 'kick_scooter' },
    { key: 'carriage' },
    { key: 'cycle_rickshaw' },
    { key: 'hand_cart' },
    { key: 'trailer' },
    { key: 'caravan' },
    { key: 'motor_vehicle', default: true },
    { key: 'electric_vehicle' },
    { key: 'motorcycle' },
    { key: 'moped' },
    { key: 'speed_pedelec' },
    { key: 'mofa' },
    { key: 'small_electric_vehicle' },
    { key: 'motorcar' },
    { key: 'motorhome' },
    { key: 'tourist_bus' },
    { key: 'coach' },
    { key: 'goods' },
    { key: 'hgv' },
    { key: 'hgv_articulated' },
    { key: 'bdouble' },
    { key: 'agricultural' },
    { key: 'auto_rickshaw' },
    { key: 'nev' },
    { key: 'golf_cart' },
    { key: 'microcar' },
    { key: 'atv' },
    { key: 'ohv' },
    { key: 'snowmobile' },
    { key: 'psv' },
    { key: 'bus' },
    { key: 'taxi' },
    { key: 'minibus' },
    { key: 'share_taxi' },
    { key: 'hov' },
    { key: 'carpool' },
    { key: 'car_sharing' },
    { key: 'emergency' },
    { key: 'hazmat' },
    { key: 'hazmat:water' },
    { key: 'school_bus' },
    { key: 'disabled' }
];

const KEY_SET = new Set(ACCESS_KEYS.map(function(e) { return e.key; }));

/** Returns keys to show in the UI: defaults + any tagKeys that are known access keys. */
export function getEffectiveAccessKeys(tagKeys: string[], addedKeys: string[] = []): string[] {
    const present = new Set([
        ...tagKeys.filter(function(k) { return KEY_SET.has(k); }),
        ...addedKeys.filter(function(k) { return KEY_SET.has(k); })
    ]);
    return ACCESS_KEYS
        .filter(function(entry) { return entry.default === true || present.has(entry.key); })
        .map(function(entry) { return entry.key; });
}

/** Returns known access keys not already shown in the UI. */
export function getAddableAccessKeys(currentKeys: string[]): string[] {
    const current = new Set(currentKeys);
    return ACCESS_KEYS
        .filter(function(entry) { return !current.has(entry.key); })
        .map(function(entry) { return entry.key; });
}
