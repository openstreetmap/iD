import _each from 'lodash-es/each';
import _isEmpty from 'lodash-es/isEmpty';
import _omit from 'lodash-es/omit';

import { dataDiscarded } from '../../data';


export function actionDiscardTags(difference) {

    return function(graph) {
        function discardTags(entity) {
            if (!_isEmpty(entity.tags)) {
                var tags = {};
                _each(entity.tags, function(v, k) {
                    if (v) tags[k] = v;
                });

                graph = graph.replace(entity.update({
                    tags: _omit(tags, dataDiscarded)
                }));
            }
        }

        difference.modified().forEach(discardTags);
        difference.created().forEach(discardTags);

        return graph;
    };
}
