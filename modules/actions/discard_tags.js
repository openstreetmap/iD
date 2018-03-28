import { dataDiscarded } from '../../data';

export function actionDiscardTags(difference) {

    return function(graph) {
        function discardTags(entity) {
            var tags = {};
            var keys = Object.keys(entity.tags);
            var discarded = false;

            for (var i = 0; i < keys.length; i++) {
                var k = keys[i];
                if (dataDiscarded[k] || !entity.tags[k]) {
                    discarded = true;
                } else {
                    tags[k] = entity.tags[k];
                }
            }

            if (discarded) {
                graph = graph.replace(entity.update({ tags: tags }));
            }
        }

        difference.modified().forEach(discardTags);
        difference.created().forEach(discardTags);

        return graph;
    };
}
