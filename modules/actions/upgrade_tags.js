export function actionUpgradeTags(entityId, oldTags, replaceTags) {

    return function(graph) {
        var entity = graph.entity(entityId);
        var tags = Object.assign({}, entity.tags);  // shallow copy
        var transferValue;
        var semiIndex;

        for (var oldTagKey in oldTags) {
            if (!(oldTagKey in tags)) continue;
            // wildcard match
            if (oldTags[oldTagKey] === '*') {
                // note the value since we might need to transfer it
                transferValue = tags[oldTagKey];
                delete tags[oldTagKey];
            // exact match
            } else if (oldTags[oldTagKey] === tags[oldTagKey]) {
                delete tags[oldTagKey];
            // match is within semicolon-delimited values
            } else {
                var vals = tags[oldTagKey].split(';').filter(Boolean);
                var oldIndex = vals.indexOf(oldTags[oldTagKey]);
                if (vals.length === 1 || oldIndex === -1) {
                    delete tags[oldTagKey];
                } else {
                    if (replaceTags && replaceTags[oldTagKey]) {
                        // replacing a value within a semicolon-delimited value, note the index
                        semiIndex = oldIndex;
                    }
                    vals.splice(oldIndex, 1);
                    tags[oldTagKey] = vals.join(';');
                }
            }
        }

        if (replaceTags) {
            for (var replaceKey in replaceTags) {
                var replaceValue = replaceTags[replaceKey];
                if (replaceValue === '*') {
                    if (tags[replaceKey] && tags[replaceKey] !== 'no') {
                        // allow any pre-existing value except `no` (troll tag)
                        continue;
                    } else {
                        // otherwise assume `yes` is okay
                        tags[replaceKey] = 'yes';
                    }
                } else if (replaceValue === '$1') {
                    tags[replaceKey] = transferValue;
                } else {
                    if (tags[replaceKey] && oldTags[replaceKey] && semiIndex !== undefined) {
                        // don't override preexisting values
                        var existingVals = tags[replaceKey].split(';').filter(Boolean);
                        if (existingVals.indexOf(replaceValue) === -1) {
                            existingVals.splice(semiIndex, 0, replaceValue);
                            tags[replaceKey] = existingVals.join(';');
                        }
                    } else {
                        tags[replaceKey] = replaceValue;
                    }
                }
            }
        }

        return graph.replace(entity.update({ tags: tags }));
    };
}
