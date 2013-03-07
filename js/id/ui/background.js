iD.ui.Background = function(context) {
    var event = d3.dispatch('cancel', 'save'),
        opacities = [1, 0.5, 0];

    var layers = context.backgroundSources();

    function getSources() {
        var ext = context.map().extent();
        return layers.filter(function(layer) {
            return !layer.data.extent ||
                iD.geo.Extent(layer.data.extent).intersects(ext);
        });
    }

    function background(selection) {

        var content = selection.append('div')
                .attr('class', 'content fillD map-overlay hide'),
            shown = false;

        var tooltip = bootstrap.tooltip()
            .placement('right');

        var button = selection.append('button')
            .attr('tabindex', -1)
            .attr('class', 'fillD')
            .attr('title', t('background.description'))
            .on('click.background-toggle', toggle)
            .call(tooltip);

        button.append('span')
            .attr('class', 'layers icon');

        function toggle() {
            tooltip.hide(button);
            setVisible(content.classed('hide'));
        }

        function setVisible(show) {
            if (show !== shown) {
                button.classed('active', show);
                content.call(iD.ui.Toggle(show));
                shown = show;
            }
        }

        selection.on('click.background-inside', function() {
            return d3.event.stopPropagation();
        });

        context.container().on('click.background-outside', function() {
            setVisible(false);
        });

        var opa = content
            .append('div')
            .attr('class', 'opacity-options-wrapper');

        opa.append('h4')
            .text(t('background.title'));

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

        function selectLayer(d) {

            content.selectAll('a.layer')
                .classed('selected', function(d) {
                    return d.data.name === context.background().source().data.name;
                });

            var provided_by = context.container()
                .select('.attribution .provided-by')
                .html('');

            if (d.data.terms_url) {
                provided_by.append('a')
                    .attr('href', (d.data.terms_url || ''))
                    .attr('target', '_blank')
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
                .attr('class', 'icon toggle');

            layerInner.insert('span').text(function(d) {
                return d.data.name;
            });

            layerLinks.exit()
                .remove();

            selectLayer(context.background().source());
        }

        context.map().on('move.background-update', _.debounce(update, 1000));

        update();

        var adjustments = content
            .append('div')
            .attr('class', 'adjustments pad1');

        var directions = [
            ['left', [-1, 0]],
            ['top', [0, -1]],
            ['right', [1, 0]],
            ['bottom', [0, 1]]];

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
            .on('click', function(d) {
                context.background().nudge(d[1], context.map().zoom());
                context.redraw();
            });

        nudge_container.append('button')
            .text(t('background.reset'))
            .attr('class', 'reset')
            .on('click', function() {
                context.background().offset([0, 0]);
                context.redraw();
            });
    }

    return d3.rebind(background, event, 'on');
};
