iD.behavior.Paste = function(context) {
    var keybinding = d3.keybinding('paste');

    function omitTag(v, k) {
        return (
            k === 'phone' ||
            k === 'fax' ||
            k === 'email' ||
            k === 'website' ||
            k === 'url' ||
            k === 'note' ||
            k === 'description' ||
            k.indexOf('name') !== -1 ||
            k.indexOf('wiki') === 0 ||
            k.indexOf('addr:') === 0 ||
            k.indexOf('contact:') === 0
        );
    }

    function doPaste() {
        d3.event.preventDefault();

        var mouse = context.mouse(),
            projection = context.projection,
            viewport = iD.geo.Extent(projection.clipExtent()).polygon();

        if (!iD.geo.pointInPolygon(mouse, viewport)) return;

        var graph = context.graph(),
            extent = iD.geo.Extent(),
            oldIDs = context.copiedIDs(),
            newIDs = [],
            i, j;

        for (i = 0; i < oldIDs.length; i++) {
            var oldEntity = graph.entity(oldIDs[i]),
                action = iD.actions.CopyEntity(oldEntity, true),
                newEntities;

            extent._extend(oldEntity.extent(graph));
            context.perform(action);

            // First element in `newEntities` contains the copied Entity,
            // Subsequent array elements contain any descendants..
            newEntities = action.newEntities();
            newIDs.push(newEntities[0].id);

            for (j = 0; j < newEntities.length; j++) {
                var newEntity = newEntities[j],
                    tags = _.omit(newEntity.tags, omitTag);

                context.perform(iD.actions.ChangeTags(newEntity.id, tags));
            }
        }

        // Put pasted objects where mouse pointer is..
        var center = projection(extent.center()),
            delta = [ mouse[0] - center[0], mouse[1] - center[1] ];

        context.perform(iD.actions.Move(newIDs, delta, projection));
        context.enter(iD.modes.Move(context, newIDs));
    }

    function paste() {
        keybinding.on(iD.ui.cmd('⌘V'), doPaste);
        d3.select(document).call(keybinding);
        return paste;
    }

    paste.off = function() {
        d3.select(document).call(keybinding.off);
    };

    return paste;
};
