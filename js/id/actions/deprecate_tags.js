iD.actions.DeprecateTags = function(entityId) {
    return function(graph) {
        var entity = graph.entity(entityId),
            newtags = _.clone(entity.tags),
            change = false,
            rule;

        // This handles deprecated tags with a single condition
        for (var i = 0; i < iD.data.deprecated.length; i++) {

            rule = iD.data.deprecated[i];
            var match = _.pairs(rule.old)[0],
                replacements = _.pairs(rule.replace);

            if (entity.tags[match[0]] && match[1] === '*') {

                var value = entity.tags[match[0]];
                if (!newtags[replacements[0][0]]) {
                    newtags[replacements[0][0]] = value;
                }
                delete newtags[match[0]];
                change = true;

            } else if (entity.tags[match[0]] === match[1]) {
                newtags = _.assign({}, rule.replace, _.omit(newtags, match[0]));
                change = true;
            }
        }

        if (change) {
            return graph.replace(entity.update({tags: newtags}));
        } else {
            return graph;
        }
    };
};
