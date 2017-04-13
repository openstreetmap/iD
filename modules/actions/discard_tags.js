import _ from 'lodash';
import { dataDiscarded } from '../../data/index';
import { omit } from '../util/map_collection';

export function actionDiscardTags(difference) {

    return function(graph) {
        function discardTags(entity) {
            window.ifNotMap(entity.tags);
            if (entity.tags.size > 0) {
                var tags = new Map();
                entity.tags.forEach(function (v, k) {
                    if (v) {
                        tags.set(k, v);
                    }
                });

                graph = graph.replace(entity.update({
                    tags: omit(tags, dataDiscarded)
                }));
            }
        }

        difference.modified().forEach(discardTags);
        difference.created().forEach(discardTags);

        return graph;
    };
}
