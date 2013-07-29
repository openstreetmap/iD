iD.ui.Background = function(context) {
    var key = 'b',
        opacities = [1, 0.5, 0],
        directions = [
            ['left', [1, 0]],
            ['top', [0, -1]],
            ['right', [-1, 0]],
            ['bottom', [0, 1]]],
        opacityDefault = (context.storage('background-opacity') !== undefined) ?
            (+context.storage('background-opacity')) : 0.5;

    function background(selection) {

        function setOpacity(d) {
            context.container().selectAll('.background-layer')
                .transition()
                .style('opacity', d)
                .attr('data-opacity', d);

            opacityList.selectAll('li')
                .classed('active', function(_) { return _ === d; });

            context.storage('background-opacity', d);
        }

        function selectLayer() {
            function active(d) {
                return context.background().showsLayer(d);
            }

            content.selectAll('label.layer')
                .classed('active', active)
                .selectAll('input')
                .property('checked', active);
        }

        function clickSetSource(d) {
            d3.event.preventDefault();
            if (d.data.name === 'Custom') {
                var configured = d();
                if (!configured) {
                    selectLayer();
                    return;
                }
                d = configured;
            }
            context.background().baseLayerSource(d);
            selectLayer();
        }

        function clickSetOverlay(d) {
            d3.event.preventDefault();
            context.background().toggleOverlayLayer(d);
            selectLayer();
        }

        function clickGpx() {
            context.background().toggleGpxLayer();
            update();
        }

        function drawList(layerList, type, change, filter) {
            var sources = context.background()
                .sources(context.map().extent())
                .filter(filter);

            var layerLinks = layerList.selectAll('label.layer')
                .data(sources, function(d) { return d.data.name; });

            var layerInner = layerLinks.enter()
                .append('label')
                .attr('class', 'layer');

            // only set tooltips for layers with tooltips
            layerInner
                .filter(function(d) { return d.data.description; })
                .call(bootstrap.tooltip()
                    .title(function(d) { return d.data.description; })
                    .placement('right')
                );

            layerInner.append('input')
                .attr('type', type)
                .attr('name', 'layers')
                .attr('value', function(d) { return d.data.name; })
                .on('change', change);

            layerInner.insert('span').text(function(d) {
                return d.data.name;
            });

            layerLinks.exit()
                .remove();

            layerList.style('display', layerList.selectAll('label.layer').data().length > 0 ? 'block' : 'none');
        }

        function update() {
            backgroundList.call(drawList, 'radio', clickSetSource, function(d) {
                return !d.data.overlay;
            });

            overlayList.call(drawList, 'checkbox', clickSetOverlay, function(d) {
                return d.data.overlay;
            });

            var hasGpx = context.background().hasGpxLayer(),
                showsGpx = context.background().showsGpxLayer();

            gpxLayerItem
                .classed('active', showsGpx)
                .selectAll('input')
                .property('disabled', !hasGpx)
                .property('checked', showsGpx);

            selectLayer();
        }

        function clickNudge(d) {

            var timeout = window.setTimeout(function() {
                    interval = window.setInterval(nudge, 100);
                }, 500),
                interval;

            d3.select(this).on('mouseup', function() {
                window.clearInterval(interval);
                window.clearTimeout(timeout);
                nudge();
            });

            function nudge() {
                var offset = context.background()
                    .nudge(d[1], context.map().zoom())
                    .offset();
                resetButton.classed('disabled', offset[0] === 0 && offset[1] === 0);
            }
        }

        var content = selection.append('div')
                .attr('class', 'fillL map-overlay content hide'),
            tooltip = bootstrap.tooltip()
                .placement('right')
                .html(true)
                .title(iD.ui.tooltipHtml(t('background.description'), key));

        function hide() { setVisible(false); }

        function toggle() {
            if (d3.event) d3.event.preventDefault();
            tooltip.hide(button);
            var visible = !button.classed('active');
            setVisible(visible);
            if (visible) content.selectAll('.toggle-list label:first-child').node().focus();
        }

        function setVisible(show) {
            if (show !== shown) {
                button.classed('active', show);
                shown = show;

                if (show) {
                    selection.on('mousedown.background-inside', function() {
                        return d3.event.stopPropagation();
                    });
                    content.style('display', 'block')
                        .style('left', '0px')
                        .transition()
                        .duration(200)
                        .style('left', '-260px');
                } else {
                    content.style('display', 'block')
                        .style('left', '-260px')
                        .transition()
                        .duration(200)
                        .style('left', '0px')
                        .each('end', function() {
                            d3.select(this).style('display', 'none');
                        });
                    selection.on('mousedown.background-inside', null);
                }
            }
        }

        var button = selection.append('button')
                .attr('tabindex', -1)
                .on('click', toggle)
                .call(tooltip),
            opa = content
                .append('div')
                .attr('class', 'opacity-options-wrapper'),
            shown = false;

        button.append('span')
            .attr('class', 'icon layers light');

        opa.append('h4')
            .text(t('background.title'));

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

        var backgroundList = content
            .append('div')
            .attr('class', 'toggle-list layer-list');

        var overlayList = content
            .append('div')
            .attr('class', 'toggle-list layer-list');

        var gpxLayerItem = content
            .append('div')
            .style('display', iD.detect().filedrop ? 'block' : 'none')
            .attr('class', 'toggle-list layer-list')
            .append('label')
            .classed('layer-toggle-gpx', true);

        gpxLayerItem.call(bootstrap.tooltip()
            .title(t('gpx.drag_drop'))
            .placement('right'));

        gpxLayerItem.append('input')
            .attr('type', 'checkbox')
            .property('disabled', true)
            .on('change', clickGpx);

        gpxLayerItem.append('span')
            .text(t('gpx.local_layer'));

        gpxLayerItem
            .append('button')
            .attr('class', 'minor layer-extent')
            .on('click', function() {
                d3.event.preventDefault();
                d3.event.stopPropagation();
                context.background().zoomToGpxLayer();
            })
            .append('span')
                .attr('class', 'icon geocode' );

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
                nudgeContainer.style('display', exp ? 'none' : 'block');
                d3.select(this).classed('expanded', !exp);
                d3.event.preventDefault();
            });

        var nudgeContainer = adjustments
            .append('div')
            .attr('class', 'nudge-container cf')
            .style('display', 'none');

        nudgeContainer.selectAll('button')
            .data(directions).enter()
            .append('button')
            .attr('class', function(d) { return d[0] + ' nudge'; })
            .on('mousedown', clickNudge);

        var resetButton = nudgeContainer.append('button')
            .attr('class', 'reset disabled')
            .on('click', function () {
                context.background().offset([0, 0]);
                resetButton.classed('disabled', true);
            });

        resetButton.append('div')
            .attr('class', 'icon undo');

        resetButton.call(bootstrap.tooltip()
            .title(t('background.reset'))
            .placement('right'));

        context.map()
            .on('move.background-update', _.debounce(update, 1000));
        update();
        setOpacity(opacityDefault);

        var keybinding = d3.keybinding('background');
        keybinding.on(key, toggle);

        d3.select(document)
            .call(keybinding);

        context.surface().on('mousedown.background-outside', hide);
        context.container().on('mousedown.background-outside', hide);
    }

    return background;
};
