import _forEach from 'lodash-es/forEach';

export function highlightEntity(context, entity, highlighted) {

    var selectorPrefix = entity.type === 'node' ? 'g.' : 'path.';
    // set the class for the SVG to add or remove the highlighted styling
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
