iD.ui.layerswitcher = function(context) {
    var event = d3.dispatch('cancel', 'save'),
        opacities = [1, 0.5, 0];

    var layers = iD.layers;

    function getSources() {
        var ext = context.map().extent();
        return layers.filter(function(layer) {
            return !layer.data.extent ||
                iD.geo.Extent(layer.data.extent).intersects(ext);
        });
    }

    function layerswitcher(selection) {

        var content = selection
            .append('div').attr('class', 'content fillD map-overlay hide'),
            shown = false;

        var button = selection
            .append('button')
            .attr('tabindex', -1)
            .attr('class', 'fillD')
            .attr('title', t('layerswitcher.description'))
            .on('click.layerswitcher-toggle', toggle)
            .call(bootstrap.tooltip()
                .placement('right'));

        button.append('span')
            .attr('class', 'layers icon');

        function hide() { setVisible(false); }
        function toggle() { setVisible(content.classed('hide')); }

        function setVisible(show) {
            if (show !== shown) {
                button.classed('active', show);
                content.call(iD.ui.toggle(show));
                shown = show;
            }
        }

        function clickoutside(selection) {
            selection.on('click.layerswitcher-inside', function() {
                return d3.event.stopPropagation();
            });
            context.container().on('click.layerswitcher-outside', hide);
        }

        var opa = content
            .append('div')
            .attr('class', 'opacity-options-wrapper');

        opa.append('h4').text(t('layerswitcher.title'));

        var opacityList = opa.append('ul')
            .attr('class', 'opacity-options');

        function setOpacity(d) {
            context.map().tilesurface
                .transition()
                .style('opacity', d)
                .attr('data-opacity', d);
            opacityList.selectAll('li')
                .classed('selected', false);
            d3.select(this)
                .classed('selected', true);
        }

        opacityList.selectAll('div.opacity')
            .data(opacities)
            .enter()
            .append('li')
                .attr('data-original-title', function(d) {
                    return t('layerswitcher.percent_brightness', { opacity: (d * 100) });
                })
                .on('click.set-opacity', setOpacity)
                .html("<div class='select-box'></div>")
                .call(bootstrap.tooltip().placement('top'))
                .append('div')
                    .attr('class', 'opacity')
                    .style('opacity', String);

        // Make sure there is an active selection by default
        opa.select('.opacity-options li:nth-child(2)').classed('selected', true);

        function selectLayer(d) {

            content.selectAll('a.layer')
                .classed('selected', function(d) {
                    return d === context.background().source();
                });

            var provided_by = context.container().select('#attribution .provided-by')
                .html('');

            if (d.data.terms_url) {
                provided_by.append('a')
                    .attr('href', (d.data.terms_url || ''))
                    .classed('disabled', !d.data.terms_url)
                    .text(' provided by ' + (d.data.sourcetag || d.data.name));
            } else {
                provided_by
                    .text(' provided by ' + (d.data.sourcetag || d.data.name));
            }

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
            selectLayer(d);
        }

        var layerList = content
            .append('ul')
            .attr('class', 'toggle-list fillL');

        function update() {
            var layerLinks = layerList.selectAll('a.layer')
                .data(getSources(), function(d) {
                    return d.data.name;
                });
            layerLinks.exit().remove();
            layerLinks.enter()
                .append('li')
                .append('a')
                    .attr('data-original-title', function(d) {
                        return d.data.description || '';
                    })
                    .attr('href', '#')
                    .attr('class', 'layer')
                    .text(function(d) {
                        return d.data.name;
                    })
                    .each(function(d) {
                        // only set tooltips for layers with tooltips
                        if (d.data.description) {
                            d3.select(this).call(bootstrap.tooltip().placement('right'));
                        }
                    })
                    .on('click.set-source', clickSetSource)
                    .insert('span')
                    .attr('class','icon toggle');
            selectLayer(context.background().source());
        }

        context.map().on('move.layerswitcher-update', _.debounce(update, 1000));

        var adjustments = content
            .append('div')
            .attr('class', 'adjustments pad1');

        var directions = [
            ['left', [-1, 0]],
            ['top', [0, -1]],
            ['right', [1, 0]],
            ['bottom', [0, 1]]];

        function nudge(d) {
            context.background().nudge(d[1]);
            context.redraw();
        }

        adjustments.append('a')
            .text(t('layerswitcher.fix_misalignment'))
            .attr('href', '#')
            .classed('alignment-toggle', true)
            .classed('expanded', false)
            .on('click', function() {
                var exp = d3.select(this).classed('expanded');
                if (!exp) {
                    nudge_container.style('display', 'block');
                } else {
                    nudge_container.style('display', 'none');
                }
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
            .on('click', nudge);

        nudge_container.append('button')
            .text(t('layerswitcher.reset'))
            .attr('class', 'reset')
            .on('click', function() {
                context.background().offset([0, 0]);
                context.redraw();
            });

        selection.call(clickoutside);
        selectLayer(context.background().source());
    }

    return d3.rebind(layerswitcher, event, 'on');
};
