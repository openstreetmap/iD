import _ from 'lodash';
import { dataDeprecated } from '../../data/index';


export function actionDeprecateTags(entityId) {

    return function(graph) {
        var entity = graph.entity(entityId),
            newtags = _.clone(entity.tags),
            change = false,
            rule;

        // This handles dataDeprecated tags with a single condition
        for (var i = 0; i < dataDeprecated.length; i++) {

            rule = dataDeprecated[i];
            var match = _.toPairs(rule.old)[0],
                replacements = rule.replace ? _.toPairs(rule.replace) : null;

            if (entity.tags[match[0]] && match[1] === '*') {

                var value = entity.tags[match[0]];
                if (replacements && !newtags[replacements[0][0]]) {
                    newtags[replacements[0][0]] = value;
                }
                delete newtags[match[0]];
                change = true;

            } else if (entity.tags[match[0]] === match[1]) {
                newtags = _.assign({}, rule.replace || {}, _.omit(newtags, match[0]));
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
