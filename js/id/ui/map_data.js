iD.ui.MapData = function(context) {
    var key = 'f';

    function features(selection) {

        function showsFeature(d) {
            return context.features().enabled(d);
        }

        function clickFeature(d) {
            context.features().toggle(d);
        }

        function clickGpx() {
            context.background().toggleGpxLayer();
            update();
        }

        function clickMapillary() {
            context.background().toggleMapillaryLayer();
            update();
        }

        function drawFeatureList(selection) {
            var data = context.features().keys();

            var layerLinks = selection.selectAll('li.layer')
                .data(data);

            //enter
            var enter = layerLinks.enter()
                .insert('li', '.custom_layer')
                .attr('class', 'layer');

            enter.filter(function(d) { return d; })
                .call(bootstrap.tooltip()
                    .title(function(d) { return t('feature.' + d + '.tooltip'); })
                    .placement('top'));

            var label = enter.append('label');

            label.append('input')
                .attr('type', 'checkbox')
                .attr('name', function(d) { return d; })
                .on('change', clickFeature);

            label.append('span')
                .text(function(d) { return t('feature.' + d + '.description'); });

            //update
            layerLinks
                .classed('active', showsFeature)
                .selectAll('input')
                .property('checked', showsFeature);

            //exit
            layerLinks.exit()
                .remove();

            selection.style('display', selection.selectAll('li.layer').data().length > 0 ? 'block' : 'none');
        }

        function update() {
            featureList.call(drawFeatureList);

            var hasGpx = context.background().hasGpxLayer(),
                showsGpx = context.background().showsGpxLayer();

            gpxLayerItem
                .classed('active', showsGpx)
                .selectAll('input')
                .property('disabled', !hasGpx)
                .property('checked', showsGpx);

            var showsMapillary = context.background().showsMapillaryLayer();

            mapillaryLayerItem
                .classed('active', showsMapillary)
                .selectAll('input')
                .property('checked', showsMapillary);
        }

        var content = selection.append('div')
                .attr('class', 'fillL map-overlay col3 content hide'),
            tooltip = bootstrap.tooltip()
                .placement('left')
                .html(true)
                .title(iD.ui.tooltipHtml(t('map_data.description'), key));

        function hide() { setVisible(false); }

        function toggle() {
            if (d3.event) d3.event.preventDefault();
            tooltip.hide(button);
            setVisible(!button.classed('active'));
        }

        function setVisible(show) {
            if (show !== shown) {
                button.classed('active', show);
                shown = show;

                if (show) {
                    selection.on('mousedown.map_data-inside', function() {
                        return d3.event.stopPropagation();
                    });
                    content.style('display', 'block')
                        .style('right', '-300px')
                        .transition()
                        .duration(200)
                        .style('right', '0px');
                } else {
                    content.style('display', 'block')
                        .style('right', '0px')
                        .transition()
                        .duration(200)
                        .style('right', '-300px')
                        .each('end', function() {
                            d3.select(this).style('display', 'none');
                        });
                    selection.on('mousedown.map_data-inside', null);
                }
            }
        }

        var button = selection.append('button')
                .attr('tabindex', -1)
                .on('click', toggle)
                .call(tooltip),
            shown = false;

        button.append('span')
            .attr('class', 'icon layers light');

        content.append('h4')
            .text(t('map_data.title'));

        content.append('a')
            .text(t('map_data.show_features'))
            .attr('href', '#')
            .classed('hide-toggle', true)
            .classed('expanded', false)
            .on('click', function() {
                var exp = d3.select(this).classed('expanded');
                featureContainer.style('display', exp ? 'none' : 'block');
                d3.select(this).classed('expanded', !exp);
                d3.event.preventDefault();
            });

        var featureContainer = content.append('div')
            .attr('class', 'filters')
            .style('display', 'none');

        var featureList = featureContainer.append('ul')
            .attr('class', 'layer-list');


        content.append('a')
            .text(t('map_data.show_layers'))
            .attr('href', '#')
            .classed('hide-toggle', true)
            .classed('expanded', true)
            .on('click', function() {
                var exp = d3.select(this).classed('expanded');
                layerContainer.style('display', exp ? 'none' : 'block');
                d3.select(this).classed('expanded', !exp);
                d3.event.preventDefault();
            });

        var layerContainer = content.append('div')
            .attr('class', 'filters')
            .style('display', 'block');

        var mapillaryLayerItem = layerContainer.append('ul')
            .attr('class', 'layer-list')
            .append('li');

        var label = mapillaryLayerItem.append('label')
            .call(bootstrap.tooltip()
                .title(t('mapillary.tooltip'))
                .placement('top'));

        label.append('input')
            .attr('type', 'checkbox')
            .on('change', clickMapillary);

        label.append('span')
            .text(t('mapillary.title'));

        var gpxLayerItem = layerContainer.append('ul')
            .style('display', iD.detect().filedrop ? 'block' : 'none')
            .attr('class', 'layer-list')
            .append('li')
            .classed('layer-toggle-gpx', true);

        gpxLayerItem.append('button')
            .attr('class', 'layer-extent')
            .call(bootstrap.tooltip()
                .title(t('gpx.zoom'))
                .placement('left'))
            .on('click', function() {
                d3.event.preventDefault();
                d3.event.stopPropagation();
                context.background().zoomToGpxLayer();
            })
            .append('span')
            .attr('class', 'icon geolocate');

        gpxLayerItem.append('button')
            .attr('class', 'layer-browse')
            .call(bootstrap.tooltip()
                .title(t('gpx.browse'))
                .placement('left'))
            .on('click', function() {
                d3.select(document.createElement('input'))
                    .attr('type', 'file')
                    .on('change', function() {
                        context.background().gpxLayerFiles(d3.event.target.files);
                    })
                    .node().click();
            })
            .append('span')
            .attr('class', 'icon geocode');

        label = gpxLayerItem.append('label')
            .call(bootstrap.tooltip()
                .title(t('gpx.drag_drop'))
                .placement('top'));

        label.append('input')
            .attr('type', 'checkbox')
            .property('disabled', true)
            .on('change', clickGpx);

        label.append('span')
            .text(t('gpx.local_layer'));


        context.features()
            .on('change.map_data-update', update);

        update();

        var keybinding = d3.keybinding('features')
            .on(key, toggle)
            .on('w', function toggleWireframe() {
                if (d3.event) d3.event.preventDefault();
                var surface = context.surface(),
                    wf = surface.classed('style-wireframe');

                surface
                    .classed('style-wireframe', !wf);

            });

        d3.select(document)
            .call(keybinding);

        context.surface().on('mousedown.map_data-outside', hide);
        context.container().on('mousedown.map_data-outside', hide);
    }

    return features;
};
