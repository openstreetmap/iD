iD.ui.Sidebar = function(context) {
    var inspector = iD.ui.Inspector(context),
        current;

    function sidebar(selection) {
        var wrap = selection.append('div')
            .attr('class', 'inspector-hidden inspector-wrap fr');

        sidebar.hover = function(id) {
            if (!current && id) {
                wrap.classed('inspector-hidden', false)
                    .classed('inspector-hover', true);

                if (inspector.entityID() !== id || inspector.state() !== 'hover') {
                    inspector
                        .state('hover')
                        .entityID(id);

                    wrap.call(inspector);
                }
            } else {
                wrap.classed('inspector-hidden', true);
            }
        };

        sidebar.select = function(id, newFeature) {
            if (!current && id) {
                wrap.classed('inspector-hidden', false)
                    .classed('inspector-hover', false);

                if (inspector.entityID() !== id || inspector.state() !== 'select') {
                    inspector
                        .state('select')
                        .entityID(id)
                        .newFeature(newFeature);

                    wrap.call(inspector);
                }
            } else {
                wrap.classed('inspector-hidden', true);
            }
        };

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
