iD.ui.Sidebar = function(context) {
    var current;

    function sidebar(selection) {
        var wrap = selection.append('div')
            .attr('class', 'inspector-hidden inspector-wrap fr');

        context.on('hover.sidebar', function(entity) {
            if (context.selection().length === 1) return;

            if (!current && entity) {
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
            if (!current && selection.length === 1) {
                wrap.classed('inspector-hidden', false)
                    .classed('inspector-hover', false)
                    .call(iD.ui.Inspector(context)
                        .state('select')
                        .entityID(selection[0]));
            } else {
                wrap.classed('inspector-hidden', true);
            }
        });

        sidebar.show = function(component) {
            wrap.classed('inspector-hidden', true);
            current = selection.append('div')
                .attr('class', 'sidebar-component')
                .call(component);
        };

        sidebar.hide = function() {
            current.remove();
            current = null;
        };
    }

    return sidebar;
};
