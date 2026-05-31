/**
 * Temporary English labels for access field types until id-tagging-schema ships them.
 * @see data/access_field_types.en.json
 */
import accessFieldTypesEn from '../../data/access_field_types.en.json' with { type: 'json' };

/** @param {Record<string, unknown>} localeStrings */
export function applyAccessFieldTypes(localeStrings) {
    const access = localeStrings?.presets?.fields?.access;
    if (!access) return;
    access.types = { ...access.types, ...accessFieldTypesEn };
}
