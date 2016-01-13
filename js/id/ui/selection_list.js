iD.ui.SelectionList = function(context, selectedIDs) {

    function selectEntity(entity) {
        context.enter(iD.modes.Select(context, [entity.id]).suppressMenu(true));
    }


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
                .on('click', selectEntity);

            // Enter
            var label = enter.append('div')
                .attr('class', 'label')
                .call(iD.svg.Icon('', 'pre-text'));

            label.append('span')
                .attr('class', 'entity-type');

            label.append('span')
                .attr('class', 'entity-name');

            // Update
            items.selectAll('use')
                .attr('href', function() {
                    var entity = this.parentNode.parentNode.__data__;
                    return '#icon-' + context.geometry(entity.id);
                });

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
