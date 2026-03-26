import { utilArrayDifference, utilObjectOmit } from '../util';

export function actionChangePreset(entityID, oldPreset, newPreset, skipFieldDefaults) {
    return function action(graph) {
        var entity = graph.entity(entityID);
        var geometry = entity.geometry(graph);
        var tags = entity.tags;
        const loc = entity.extent(graph).center();

        // preserve tags that the new preset might care about, if any
        var preserveKeys;
        if (newPreset) {
            preserveKeys = [];
            if (newPreset.addTags) {
                preserveKeys = preserveKeys.concat(Object.keys(newPreset.addTags));
            }
            if (oldPreset && !oldPreset.id.startsWith(newPreset.id)) {
                // only if old preset is not a sub-preset of the new one:
                // preserve tags for which the new preset has a field
                // https://github.com/openstreetmap/iD/issues/9372
                newPreset.fields(loc).concat(newPreset.moreFields(loc))
                    .filter(f => f.matchGeometry(geometry))
                    .flatMap(f => f.allKeys())
                    .filter(Boolean)
                    .forEach(key => preserveKeys.push(key));
            }

            if (oldPreset && (oldPreset.id !== newPreset.id)) {
                const oldFields = [
                    ...oldPreset.fields(loc),
                    ...oldPreset.moreFields(loc)
                ].filter(f => f.matchGeometry(geometry));

                const oldPresetFieldKeys = oldFields.flatMap(f => f.allKeys());

                const fieldKeysToRemove = utilArrayDifference(oldPresetFieldKeys, preserveKeys);
                const fieldKeysToRemoveSet = new Set(fieldKeysToRemove);

                const expandedKeysToRemove = new Set();
                const tagKeys = Object.keys(tags);  // Cache all existing tag keys once to avoid repeated Object iteration

                // Only consider fields that are actually being removed
                const fieldsToRemove = oldFields.filter(field => {
                    const keys = field.allKeys();
                    return keys.some(k => fieldKeysToRemoveSet.has(k));
                });

                // Expand removed fields into their full tag namespaces (localized and prefix-based)
                for (const field of fieldsToRemove) {
                    const keys = field.allKeys();

                    const isLocalized = field.type === 'localized';
                    const hasKeyPrefix = field.key && field.key.endsWith(':');

                    for (const baseKey of keys) {
                        // Always remove the base key itself (e.g. 'name', 'recycling')
                        expandedKeysToRemove.add(baseKey);

                        //For localized fields, remove all language variants (name:*)
                        if (isLocalized) {
                            for (const k of tagKeys) {
                                if (k.startsWith(baseKey + ':')) {
                                    expandedKeysToRemove.add(k);
                                }
                            }
                        }
                    }
                    // For prefix-based fields, remove all tags that share the prefix (recycling:*)
                    if (hasKeyPrefix) {
                        for (const k of tagKeys) {
                            if (k.startsWith(field.key)) {
                                expandedKeysToRemove.add(k);
                            }
                        }
                    }
                }

                tags = utilObjectOmit(tags, Array.from(expandedKeysToRemove));
            }
        }
        if (oldPreset) tags = oldPreset.unsetTags(tags, geometry, preserveKeys, false, loc);
        if (newPreset) tags = newPreset.setTags(tags, geometry, skipFieldDefaults, loc);

        return graph.replace(entity.update({tags: tags}));
    };
}
