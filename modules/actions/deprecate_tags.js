import _ from 'lodash';
import { dataDeprecated } from '../../data/index';
import { convertToMap, omit, assign } from '../util/map_collection';

export function actionDeprecateTags(entityId) {
    return function(graph) {
        window.ifNotMap(entity.tags);
        var entity = graph.entity(entityId),
            newtags = _.clone(entity.tags),
            change = false,
            rule;

        // This handles dataDeprecated tags with a single condition
        for (var i = 0; i < dataDeprecated.length; i++) {
            rule = dataDeprecated[i];
            var match = _.toPairs(rule.old)[0],
                replacements = rule.replace ? _.toPairs(rule.replace) : null;
            window.ifNotMap(entity.tags);
            if (entity.tags.get(match[0]) && match[1] === '*') {

                var value = entity.tags.get(match[0]);
                if (replacements && !newtags.get(replacements[0][0])) {
                    newtags.set(replacements[0][0], value);
                }
                newtags.delete(match[0]);
                change = true;

            } else if (entity.tags.get(match[0]) === match[1]) {
                newtags = assign(new Map(), convertToMap(rule.replace || {}), omit(newtags, match[0]));
                change = true;
            }
        }

        if (change) {
            return graph.replace(entity.update({tags: newtags}));
        } else {
            return graph;
        }
    };
}
