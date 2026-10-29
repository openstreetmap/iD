/**
 * Format the raw OSM tag for use in tooltips, e.g. "Tag: tunnel=culvert".
 *
 * @param key - The tag key (e.g. 'tunnel', 'foot', 'addr:country').
 * @param value - The tag value (e.g. 'culvert', 'yes', 'DE').
 * @param isMulti - If true, format as multiCombo: key+value=yes (e.g. language:de=yes).
 */
export function formatTag(key: string, value: string, isMulti = false) {
    if (isMulti) return `Tag: ${key}${value}=yes`;
    return `Tag: ${key}=${value}`;
}
