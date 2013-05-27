iD.ui.Sidebar = function(context) {
    return function(selection) {
        var wrap = selection.append('div')
            .attr('class', 'inspector-hidden inspector-wrap fr');

        context.on('hover.sidebar', function(entity) {
            if (context.selection().length === 1) return;

            if (entity) {
                wrap.classed('inspector-hidden', false)
                    .classed('inspector-hover', true)
                    .call(iD.ui.Inspector(context)
                        .state('hover')
                        .entityID(entity.id));
            } else {
                wrap.classed('inspector-hidden', true);
            }
        });

        context.on('select.sidebar', function(selection) {
            if (selection.length === 1) {
                wrap.classed('inspector-hidden', false)
                    .classed('inspector-hover', false)
                    .call(iD.ui.Inspector(context)
                        .state('select')
                        .entityID(selection[0]));
            } else {
                wrap.classed('inspector-hidden', true);
            }
        })
    }
};
