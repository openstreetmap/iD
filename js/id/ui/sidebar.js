iD.ui.Sidebar = function(context) {
    var inspector = iD.ui.Inspector(context),
        imageView = iD.ui.ImageView(context),
        current;

    function sidebar(selection) {
        var featureListWrap = selection.append('div')
            .attr('class', 'feature-list-pane')
            .call(iD.ui.FeatureList(context));

        selection.call(iD.ui.Notice(context));

        var inspectorWrap = selection.append('div')
            .attr('class', 'inspector-hidden inspector-wrap fr');

        var imageWrap = selection.append('div')
            .attr('class', 'image-list-pane')
            .call(imageView);

        function isImage(id) {
            return id && id.properties != undefined && id.properties.entityType == 'image';
        }

        sidebar.hover = function(id) {
            if (isImage(id)) {
                featureListWrap.classed('inspector-hidden', true);
                inspectorWrap.classed('inspector-hidden', true)
                imageWrap.classed('inspector-hidden', false)
                    .classed('inspector-hover', true);
                imageView.hoverImage(id);

            } else if (!current && id) {
                featureListWrap.classed('inspector-hidden', true);
                inspectorWrap.classed('inspector-hidden', false)
                    .classed('inspector-hover', true);

                if (inspector.entityID() !== id || inspector.state() !== 'hover') {
                    inspector
                        .state('hover')
                        .entityID(id);

                    inspectorWrap.call(inspector);
                }
            } else if (!current) {
                featureListWrap.classed('inspector-hidden', false);
                inspectorWrap.classed('inspector-hidden', true);
                inspector.state('hide');
            }
        };

        sidebar.hover = _.throttle(sidebar.hover, 200);

        sidebar.select = function(id, newFeature) {
            if (!current && id) {
                featureListWrap.classed('inspector-hidden', true);
                inspectorWrap.classed('inspector-hidden', false)
                    .classed('inspector-hover', false);

                if (inspector.entityID() !== id || inspector.state() !== 'select') {
                    inspector
                        .state('select')
                        .entityID(id)
                        .newFeature(newFeature);

                    inspectorWrap.call(inspector);
                }
            } else if (!current) {
                featureListWrap.classed('inspector-hidden', false);
                inspectorWrap.classed('inspector-hidden', true);
                inspector.state('hide');
            }
        };

        sidebar.show = function(component) {
            featureListWrap.classed('inspector-hidden', true);
            inspectorWrap.classed('inspector-hidden', true);
            if (current) current.remove();
            current = selection.append('div')
                .attr('class', 'sidebar-component')
                .call(component);
        };

        sidebar.hide = function() {
            featureListWrap.classed('inspector-hidden', false);
            inspectorWrap.classed('inspector-hidden', true);
            if (current) current.remove();
            current = null;
        };

        sidebar.selectImage = function(image) {
            imageView.selectedImage(image);
            return sidebar;
        };


        sidebar.showImage = function(image) {
            featureListWrap.classed('inspector-hidden', true);
            inspectorWrap.classed('inspector-hidden', true);
            imageWrap.classed('inspector-hidden', false);
            inspectorWrap.classed('inspector-hidden', true);
            imageView.hoverImage(image)
        }
        sidebar.showSelectedImage = function(image) {
            featureListWrap.classed('inspector-hidden', true);
            inspectorWrap.classed('inspector-hidden', true);
            imageWrap.classed('inspector-hidden', false);
            inspectorWrap.classed('inspector-hidden', true);
            imageView.showSelectedImage();
        }
    }

    sidebar.hover = function() {};
    sidebar.select = function() {};
    sidebar.show = function() {};
    sidebar.hide = function() {};

    return sidebar;
};
