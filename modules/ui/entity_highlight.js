import _forEach from 'lodash-es/forEach';

export function highlightEntity(context, entity, highlighted) {

    // highlight the member feature in the map while hovering on the list item
    var selectorPrefix = entity.type === 'node' ? 'g.' : 'path.';
    context.surface().selectAll(selectorPrefix+entity.id).classed('highlighted', highlighted);
    if (entity.members) {
        // recursively highlight members so that relations will appear highlighted
        _forEach(entity.members, function(member){
            if (member.id && context.hasEntity(member.id)) {
                highlightEntity(context, context.entity(member.id), highlighted);
            }
        });
    }

}
