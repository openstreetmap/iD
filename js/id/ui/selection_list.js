iD.ui.SelectionList = function(context, selectedIDs) {

    function selectionList(selection) {
        selection.classed('selection-list-pane', true);

        var header = selection.append('div')
            .attr('class', 'header fillL cf');

        header.append('h3')
            .text(t('inspector.multiselect'));

        var listWrap = selection.append('div')
            .attr('class', 'inspector-body');

        var list = listWrap.append('div')
            .attr('class', 'feature-list cf');

        context.history().on('change.selection-list', drawList);
        drawList();

        function drawList() {
            var entities = selectedIDs
                .map(function(id) { return context.hasEntity(id); })
                .filter(function(entity) { return entity; });

            var items = list.selectAll('.feature-list-item')
                .data(entities, iD.Entity.key);

            var enter = items.enter().append('button')
                .attr('class', 'feature-list-item')
                .on('click', function(entity) {
                    context.enter(iD.modes.Select(context, [entity.id]));
                });

            // Enter

            var label = enter.append('div')
                .attr('class', 'label');

            label.append('span')
                .attr('class', 'icon icon-pre-text');

            label.append('span')
                .attr('class', 'entity-type');

            label.append('span')
                .attr('class', 'entity-name');

            // Update

            items.selectAll('.icon')
                .attr('class', function(entity) { return context.geometry(entity.id) + ' icon icon-pre-text'; });

            items.selectAll('.entity-type')
                .text(function(entity) { return context.presets().match(entity, context.graph()).name(); });

            items.selectAll('.entity-name')
                .text(function(entity) { return iD.util.displayName(entity); });

            // Exit

            items.exit()
                .remove();
        }
    }

    return selectionList;

};
