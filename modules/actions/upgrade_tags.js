export function actionUpgradeTags(entityId, oldTags, replaceTags) {

    return function(graph) {
        var entity = graph.entity(entityId);
        var tags = Object.assign({}, entity.tags);  // shallow copy
        var transferValue;

        for (var oldTagKey in oldTags) {
            if (oldTags[oldTagKey] === '*') {
                transferValue = tags[oldTagKey];
                delete tags[oldTagKey];
            } else {
                var vals = tags[oldTagKey].split(';').filter(Boolean);
                var oldIndex = vals.indexOf(oldTags[oldTagKey]);
                if (vals.length === 1 || oldIndex === -1) {
                    delete tags[oldTagKey];
                } else {
                    vals.splice(oldIndex, 1);
                    tags[oldTagKey] = vals.join(';');
                }
            }
        }

        if (replaceTags) {
            for (var replaceKey in replaceTags) {
                var replaceValue = replaceTags[replaceKey];
                if (replaceValue === '*') {
                    if (tags[replaceKey]) {
                        // any value is okay and there already
                        // is one, so don't update it
                        continue;
                    } else {
                        // otherwise assume `yes` is okay
                        tags[replaceKey] = 'yes';
                    }
                } else if (replaceValue === '$1') {
                    tags[replaceKey] = transferValue;
                } else {
                    tags[replaceKey] = replaceValue;
                }
            }
        }

        return graph.replace(entity.update({ tags: tags }));
    };
}
