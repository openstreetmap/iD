import _ from 'lodash';
import { assign } from '../util/map_collection';
export function svgRelationMemberTags(graph) {
    return function(entity) {
        var tags = entity.tags;
        graph.parentRelations(entity).forEach(function(relation) {
            var type = relation.tags.get('type');
            window.ifNotMap(relation.tags);
            window.ifNotMap(tags);
            if (type === 'multipolygon' || type === 'boundary') {
                tags = assign(new Map(), relation.tags, tags); // TODO using assign here :/
            }
        });
        return tags;
    };
}
