import _ from 'lodash';
import { dataDiscarded } from '../../data/index';


export function actionDiscardTags(difference) {

    return function(graph) {
        function discardTags(entity) {
            if (!_.isEmpty(entity.tags)) {
                var tags = {};
                _.each(entity.tags, function(v, k) {
                    if (v) tags[k] = v;
                });

                graph = graph.replace(entity.update({
                    tags: _.omit(tags, dataDiscarded)
                }));
            }
        }

        difference.modified().forEach(discardTags);
        difference.created().forEach(discardTags);

        return graph;
    };
}
