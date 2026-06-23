import { utilArrayDifference, utilObjectOmit } from '../util';

export function actionChangePreset(entityID, oldPreset, newPreset, skipFieldDefaults) {
    return function action(graph) {
        const entity = graph.entity(entityID);
        const geometry = entity.geometry(graph);
        let tags = entity.tags;
        const loc = entity.extent(graph).center();

        // preserve tags that the new preset might care about, if any
        let preserveKeys = [];
        let oldPresetFieldKeys = [];
        if (newPreset) {
            if (newPreset.addTags) {
                preserveKeys = preserveKeys.concat(Object.keys(newPreset.addTags));
            }
            if (oldPreset) {
                const wasSubPreset = oldPreset.id.startsWith(newPreset.id);
                newPreset.fields(loc).concat(newPreset.moreFields(loc))
                    .filter(f => f.matchGeometry(geometry))
                    .flatMap(f => f.allKeys(tags))
                    .filter(key => {
                        if (wasSubPreset) {
                            // if old preset was a sub-preset of the new one:
                            // don't preserve tags which defined the old sub-preset,
                            // even if the new preset has a field for it
                            // for example:
                            //   amenity=restaurant + cuisine=pizza + name, etc.
                            //   should result in: amenity=restaurant + name, etc.
                            // https://github.com/openstreetmap/iD/issues/9372
                            return oldPreset.tags[key] === undefined;
                        }
                        return true;
                    })
                    .filter(Boolean)
                    .forEach(key => preserveKeys.push(key));

                if (oldPreset.id !== newPreset.id) {
                    // 'field-keys' are keys used by fields (different to the keys used by preset itself)
                    oldPresetFieldKeys = [
                        ...oldPreset.fields(loc),
                        ...oldPreset.moreFields(loc)
                    ].flatMap(f => f.allKeys(tags));

                    // field-keys used by the old preset but not the new preset
                    const fieldKeysToRemove = utilArrayDifference(oldPresetFieldKeys, preserveKeys);
                    let reducedTags = utilObjectOmit(tags, fieldKeysToRemove);
                    reducedTags = oldPreset.unsetTags(reducedTags, geometry, preserveKeys, false, loc);
                    reducedTags = newPreset.setTags(reducedTags, geometry, oldPresetFieldKeys, skipFieldDefaults, loc);

                    if (oldPreset.matchScore(reducedTags) === -1 /* -1 means, the preset does not match */) {
                        // only actually remove tags if the old preset is fully orthogonal
                        // with the new one: if the old preset also matches reduced set of tags of
                        // the new preset, it is likely a case where the new preset is a "collective"
                        // preset that is meant to include both presets
                        // e.g. when changing from building to a school which has a field for the building
                        // tag, building-specific subtags should remain on the feature
                        // https://github.com/openstreetmap/iD/issues/12071
                        tags = reducedTags;
                    }
                }
            }
        }
        if (oldPreset) tags = oldPreset.unsetTags(tags, geometry, preserveKeys, false, loc);
        if (newPreset) tags = newPreset.setTags(tags, geometry, oldPresetFieldKeys, skipFieldDefaults, loc);

        return graph.replace(entity.update({tags: tags}));
    };
}
