iD.ui.Background = function(context) {
    var key = 'b',
        opacities = [1, 0.5, 0],
        directions = [
            ['left', [1, 0]],
            ['top', [0, -1]],
            ['right', [-1, 0]],
            ['bottom', [0, 1]]],
        layers = context.backgroundSources();

    function getSources() {
        var ext = context.map().extent();
        return layers.filter(function(layer) {
            return !layer.data.extent ||
                iD.geo.Extent(layer.data.extent).intersects(ext);
        });
    }

    function background(selection) {

        function toggle() {
            tooltip.hide(button);
            setVisible(content.classed('hide'));
            content.selectAll('.toggle-list li:first-child a').node().focus();
        }

        function setVisible(show) {
            if (show !== shown) {
                button.classed('active', show);
                content.call(iD.ui.Toggle(show));
                shown = show;

                if (show) {
                    selection.on('mousedown.background-inside', function() {
                        return d3.event.stopPropagation();
                    });
                } else {
                    selection.on('mousedown.background-inside', null);
                }
            }
        }

        function setOpacity(d) {
            context.map().layersurface.selectAll('.layer-layer')
                .filter(function(d) { return d == context.map().layers[0]; })
                .transition()
                .style('opacity', d)
                .attr('data-opacity', d);

            opacityList.selectAll('li')
                .classed('selected', false);

            if (d3.event) {
                d3.select(this)
                    .classed('selected', true);
            }
        }

        function selectLayer() {
            content.selectAll('a.layer')
                .classed('selected', function(d) {
                    return d.data.name === context.background().source().data.name;
                });
        }

        function clickSetSource(d) {
            d3.event.preventDefault();
            if (d.data.name === 'Custom') {
                var configured = d();
                if (!configured) return;
                d = configured;
            }
            context.background().source(d);
            if (d.data.name === 'Custom (customized)') {
                context.history()
                    .imagery_used('Custom (' + d.data.template + ')');
            } else {
                context.history()
                    .imagery_used(d.data.sourcetag || d.data.name);
            }
            context.redraw();
            selectLayer();
        }

        function clickGpx(d) {
            d3.event.preventDefault();
            if (!_.isEmpty(context.map().layers[1].geojson())) {
                context.map().layers[1]
                    .enable(!context.map().layers[1].enable());
                d3.select(this)
                    .classed('selected', context.map().layers[1].enable());
                context.redraw();
            }
        }

        function update() {
            var layerLinks = layerList.selectAll('a.layer')
                .data(getSources(), function(d) {
                    return d.data.name;
                });

            var layerInner = layerLinks.enter()
                .append('li')
                .append('a');

            layerInner
                .attr('href', '#')
                .attr('class', 'layer')
                .on('click.set-source', clickSetSource);

            // only set tooltips for layers with tooltips
            layerInner
                .filter(function(d) { return d.data.description; })
                .call(bootstrap.tooltip()
                    .title(function(d) { return d.data.description; })
                    .placement('right')
                );

            layerInner.insert('span')
                .attr('class', 'icon toggle icon-pre-text');

            layerInner.insert('span').text(function(d) {
                return d.data.name;
            });

            gpxLayerItem
                .classed('selected', function() {
                    var gpxLayer = context.map().layers[1];
                    return !_.isEmpty(gpxLayer.geojson()) &&
                        gpxLayer.enable();
                });

            layerLinks.exit()
                .remove();

            selectLayer();
        }

        function clickNudge(d) {
            var interval = window.setInterval(nudge, 100);

            d3.select(this).on('mouseup', function() {
                window.clearInterval(interval);
                nudge();
            });

            function nudge() {
                context.background().nudge(d[1], context.map().zoom());
                context.redraw();
            }
        }

        var content = selection.append('div')
                .attr('class', 'content fillD map-overlay hide'),
            tooltip = bootstrap.tooltip()
                .placement('right')
                .html(true)
                .title(iD.ui.tooltipHtml(t('background.description'), key)),
            button = selection.append('button')
                .attr('tabindex', -1)
                .attr('class', 'fillD')
                .on('click.background-toggle', toggle)
                .call(tooltip),
            opa = content
                .append('div')
                .attr('class', 'opacity-options-wrapper'),
            shown = false;

        button.append('span')
            .attr('class', 'layers icon');

        opa.append('h4')
            .text(t('background.title'));

        context.surface().on('mousedown.background-outside', function() {
            setVisible(false);
        });

        context.container().on('mousedown.background-outside', function() {
            setVisible(false);
        });

        var opacityList = opa.append('ul')
            .attr('class', 'opacity-options');

        opacityList.selectAll('div.opacity')
            .data(opacities)
            .enter()
            .append('li')
            .attr('data-original-title', function(d) {
                return t('background.percent_brightness', { opacity: (d * 100) });
            })
            .on('click.set-opacity', setOpacity)
            .html("<div class='select-box'></div>")
            .call(bootstrap.tooltip()
                .placement('top'))
            .append('div')
            .attr('class', 'opacity')
            .style('opacity', String);

        // Make sure there is an active selection by default
        opa.select('.opacity-options li:nth-child(2)')
            .classed('selected', true);

        var layerList = content
            .append('ul')
            .attr('class', 'toggle-list fillL');

        var gpxLayerItem = content
            .append('ul')
            .style('display', iD.detect().filedrop ? 'block' : 'none')
            .attr('class', 'toggle-list fillL')
            .append('li')
            .append('a')
            .classed('layer-toggle-gpx', true)
            .call(bootstrap.tooltip()
                .title(t('gpx.drag_drop'))
                .placement('right'))
            .on('click.set-gpx', clickGpx);

        gpxLayerItem
            .append('span')
            .attr('class', 'icon toggle icon-pre-text');

        gpxLayerItem.append('span')
            .text(t('gpx.local_layer'));

        gpxLayerItem
            .append('a')
            .attr('class', 'icon geocode layer-extent')
            .on('click', function() {
                d3.event.preventDefault();
                d3.event.stopPropagation();
                context.map()
                    .extent(d3.geo.bounds(context.map().layers[1].geojson()));
            });

        var adjustments = content
            .append('div')
            .attr('class', 'adjustments');

        adjustments.append('a')
            .text(t('background.fix_misalignment'))
            .attr('href', '#')
            .classed('hide-toggle', true)
            .classed('expanded', false)
            .on('click', function() {
                var exp = d3.select(this).classed('expanded');
                nudge_container.style('display', exp ? 'none' : 'block');
                d3.select(this).classed('expanded', !exp);
                d3.event.preventDefault();
            });

        var nudge_container = adjustments
            .append('div')
            .attr('class', 'nudge-container')
            .style('display', 'none');

        nudge_container.selectAll('button')
            .data(directions).enter()
            .append('button')
            .attr('class', function(d) { return d[0] + ' nudge'; })
            .text(function(d) { return d[0]; })
            .on('mousedown', clickNudge);

        nudge_container.append('button')
            .text(t('background.reset'))
            .attr('class', 'reset')
            .on('click', function() {
                context.background().offset([0, 0]);
                context.redraw();
            });

        context.map()
            .on('move.background-update', _.debounce(update, 1000));
        update();
        setOpacity(0.5);

        var keybinding = d3.keybinding('background');
        keybinding.on(key, toggle);

        d3.select(document)
            .call(keybinding);
    }

    return background;
};
