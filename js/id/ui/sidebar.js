iD.ui.Sidebar = function(context) {
    var inspector = iD.ui.Inspector(context),
        current;

    function sidebar(selection) {
        var wrap = selection.append('div')
            .attr('class', 'inspector-hidden inspector-wrap fr');

        context.on('hover.sidebar', function(entity) {
            if (context.selection().length === 1) return;

            if (!current && entity) {
                wrap.classed('inspector-hidden', false)
                    .classed('inspector-hover', true);

                if (inspector.entityID() !== entity.id || inspector.state() !== 'hover') {
                    inspector
                        .state('hover')
                        .entityID(entity.id);

                    wrap.call(inspector);
                }
            } else {
                wrap.classed('inspector-hidden', true);
            }
        });

        context.on('select.sidebar', function(selection) {
            if (!current && selection.length === 1) {
                wrap.classed('inspector-hidden', false)
                    .classed('inspector-hover', false);

                if (inspector.entityID() !== selection[0] || inspector.state() !== 'select') {
                    inspector
                        .state('select')
                        .entityID(selection[0]);

                    wrap.call(inspector);
                }
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
