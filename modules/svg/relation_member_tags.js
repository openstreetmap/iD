import _ from 'lodash';

export function svgRelationMemberTags(graph) {
    return function(entity) {
        var tags = entity.tags;
        graph.parentRelations(entity).forEach(function(relation) {
            var type = relation.tags.type;
            if (type === 'multipolygon' || type === 'boundary') {
                tags = _.extend({}, relation.tags, tags);
            }
        });
        return tags;
    };
}
