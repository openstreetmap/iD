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
        if (context.inIntro()) return;

        var baseGraph = context.graph(),
            mouse = context.mouse(),
            projection = context.projection,
            viewport = iD.geo.Extent(projection.clipExtent()).polygon();

        if (!iD.geo.pointInPolygon(mouse, viewport)) return;

        var extent = iD.geo.Extent(),
            oldIDs = context.copyIDs(),
            oldGraph = context.copyGraph(),
            newIDs = [];

        if (!oldIDs.length) return;

        var action = iD.actions.CopyEntities(oldIDs, oldGraph);
        context.perform(action);

        var copies = action.copies();
        for (var id in copies) {
            var oldEntity = oldGraph.entity(id),
                newEntity = copies[id];

            extent._extend(oldEntity.extent(oldGraph));
            newIDs.push(newEntity.id);
            context.perform(iD.actions.ChangeTags(newEntity.id, _.omit(newEntity.tags, omitTag)));
        }

        // Put pasted objects where mouse pointer is..
        var center = projection(extent.center()),
            delta = [ mouse[0] - center[0], mouse[1] - center[1] ];

        context.perform(iD.actions.Move(newIDs, delta, projection));
        context.enter(iD.modes.Move(context, newIDs, baseGraph));
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
