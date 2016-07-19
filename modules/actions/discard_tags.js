import _ from 'lodash';
export function DiscardTags(difference) {
    return function(graph) {
        function discardTags(entity) {
            if (!_.isEmpty(entity.tags)) {
                var tags = {};
                _.each(entity.tags, function(v, k) {
                    if (v) tags[k] = v;
                });

                graph = graph.replace(entity.update({
                    tags: _.omit(tags, iD.data.discarded)
                }));
            }
        }

        difference.modified().forEach(discardTags);
        difference.created().forEach(discardTags);

        return graph;
    };
}
