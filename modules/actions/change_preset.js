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
                    const oldPresetFieldKeys = [
                        ...oldPreset.fields(loc),
                        ...oldPreset.moreFields(loc)
                    ].flatMap(f => f.allKeys(tags));

                    // field-keys used by the old preset but not the new preset
                    const fieldKeysToRemove = utilArrayDifference(oldPresetFieldKeys, preserveKeys);
                    tags = utilObjectOmit(tags, fieldKeysToRemove);
                }
            }
        }
        if (oldPreset) tags = oldPreset.unsetTags(tags, geometry, preserveKeys, false, loc);
        if (newPreset) tags = newPreset.setTags(tags, geometry, skipFieldDefaults, loc);

        return graph.replace(entity.update({tags: tags}));
    };
}
