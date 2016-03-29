iD.ui.Background = function(context) {
    var key = 'B',
        opacities = [1, 0.75, 0.5, 0.25],
        directions = [
            ['left', [1, 0]],
            ['top', [0, -1]],
            ['right', [-1, 0]],
            ['bottom', [0, 1]]],
        opacityDefault = (context.storage('background-opacity') !== null) ?
            (+context.storage('background-opacity')) : 1.0,
        customTemplate = context.storage('background-custom-template') || '';

    // Can be 0 from <1.3.0 use or due to issue #1923.
    if (opacityDefault === 0) opacityDefault = 1.0;

    function background(selection) {

        function sortSources(a, b) {
            return a.best() ? -1
                : b.best() ? 1
                : a.id === 'none' ? 1
                : b.id === 'none' ? -1
                : d3.ascending(a, b);
        }

        function setOpacity(d) {
            var bg = context.container().selectAll('.layer-background')
                .transition()
                .style('opacity', d)
                .attr('data-opacity', d);

            if (!iD.detect().opera) {
                iD.util.setTransform(bg, 0, 0);
            }

            opacityList.selectAll('li')
                .classed('active', function(_) { return _ === d; });

            context.storage('background-opacity', d);
        }

        function selectLayer() {
            function active(d) {
                return context.background().showsLayer(d);
            }

            content.selectAll('.layer, .custom_layer')
                .classed('active', active)
                .selectAll('input')
                .property('checked', active);
        }

        function clickSetSource(d) {
            d3.event.preventDefault();
            context.background().baseLayerSource(d);
            selectLayer();
        }

        function editCustom() {
            d3.event.preventDefault();
            var template = window.prompt(t('background.custom_prompt'), customTemplate);
            if (!template ||
                template.indexOf('google.com') !== -1 ||
                template.indexOf('googleapis.com') !== -1 ||
                template.indexOf('google.ru') !== -1) {
                selectLayer();
                return;
            }
            setCustom(template);
        }

        function setCustom(template) {
            context.background().baseLayerSource(iD.BackgroundSource.Custom(template));
            selectLayer();
            context.storage('background-custom-template', template);
        }

        function clickSetOverlay(d) {
            d3.event.preventDefault();
            context.background().toggleOverlayLayer(d);
            selectLayer();
        }

        function drawList(layerList, type, change, filter) {
            var sources = context.background()
                .sources(context.map().extent())
                .filter(filter);

            var layerLinks = layerList.selectAll('li.layer')
                .data(sources, function(d) { return d.name(); })
                .sort(sortSources);

            var enter = layerLinks.enter()
                .insert('li', '.custom_layer')
                .attr('class', 'layer')
                .classed('best', function(d) { return d.best(); });

            // only set tooltips for layers with tooltips
            enter.filter(function(d) { return d.description; })
                .call(bootstrap.tooltip()
                    .title(function(d) { return d.description; })
                    .placement('top'));

            enter.filter(function(d) { return d.best(); })
                .append('div')
                .attr('class', 'best')
                .call(bootstrap.tooltip()
                    .title(t('background.best_imagery'))
                    .placement('left'))
                .append('span')
                .html('&#9733;');

            var label = enter.append('label');

            label.append('input')
                .attr('type', type)
                .attr('name', 'layers')
                .on('change', change);

            label.append('span')
                .text(function(d) { return d.name(); });

            layerLinks.exit()
                .remove();

            layerList.style('display', layerList.selectAll('li.layer').data().length > 0 ? 'block' : 'none');
        }

        function update() {
            backgroundList.call(drawList, 'radio', clickSetSource, function(d) { return !d.overlay; });
            overlayList.call(drawList, 'checkbox', clickSetOverlay, function(d) { return d.overlay; });

            selectLayer();

            var source = context.background().baseLayerSource();
            if (source.id === 'custom') {
                customTemplate = source.template;
            }
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
                    selection.on('mousedown.background-inside', function() {
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
                    selection.on('mousedown.background-inside', null);
                }
            }
        }


        var content = selection.append('div')
                .attr('class', 'fillL map-overlay col3 content hide'),
            tooltip = bootstrap.tooltip()
                .placement('left')
                .html(true)
                .title(iD.ui.tooltipHtml(t('background.description'), key)),
            button = selection.append('button')
                .attr('tabindex', -1)
                .on('click', toggle)
                .call(iD.svg.Icon('#icon-layers', 'light'))
                .call(tooltip),
            shown = false;

        var opa = content.append('div')
                .attr('class', 'opacity-options-wrapper');

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
            .html('<div class="select-box"></div>')
            .call(bootstrap.tooltip()
                .placement('left'))
            .append('div')
            .attr('class', 'opacity')
            .style('opacity', function(d) { return 1.25 - d; });

        var backgroundList = content.append('ul')
            .attr('class', 'layer-list');

        var custom = backgroundList.append('li')
            .attr('class', 'custom_layer')
            .datum(iD.BackgroundSource.Custom());

        custom.append('button')
            .attr('class', 'layer-browse')
            .call(bootstrap.tooltip()
                .title(t('background.custom_button'))
                .placement('left'))
            .on('click', editCustom)
            .call(iD.svg.Icon('#icon-search'));

        var label = custom.append('label');

        label.append('input')
            .attr('type', 'radio')
            .attr('name', 'layers')
            .on('change', function () {
                if (customTemplate) {
                    setCustom(customTemplate);
                } else {
                    editCustom();
                }
            });

        label.append('span')
            .text(t('background.custom'));

        content.append('div')
          .attr('class', 'imagery-faq')
          .append('a')
          .attr('target', '_blank')
          .attr('tabindex', -1)
          .call(iD.svg.Icon('#icon-out-link', 'inline'))
          .attr('href', 'https://github.com/openstreetmap/iD/blob/master/FAQ.md#how-can-i-report-an-issue-with-background-imagery')
          .append('span')
          .text(t('background.imagery_source_faq'));

        var overlayList = content.append('ul')
            .attr('class', 'layer-list');

        var controls = content.append('div')
            .attr('class', 'controls-list');

        var minimapLabel = controls
            .append('label')
            .call(bootstrap.tooltip()
                .html(true)
                .title(iD.ui.tooltipHtml(t('background.minimap.tooltip'), '/'))
                .placement('top')
            );

        minimapLabel.classed('minimap-toggle', true)
            .append('input')
            .attr('type', 'checkbox')
            .on('change', function() {
                iD.ui.MapInMap.toggle();
                d3.event.preventDefault();
            });

        minimapLabel.append('span')
            .text(t('background.minimap.description'));

        var adjustments = content.append('div')
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

        var nudgeContainer = adjustments.append('div')
            .attr('class', 'nudge-container cf')
            .style('display', 'none');

        nudgeContainer.selectAll('button')
            .data(directions).enter()
            .append('button')
            .attr('class', function(d) { return d[0] + ' nudge'; })
            .on('mousedown', clickNudge);

        var resetButton = nudgeContainer
            .append('button')
            .attr('class', 'reset disabled')
            .on('click', function () {
                context.background().offset([0, 0]);
                resetButton.classed('disabled', true);
            })
            .call(iD.svg.Icon('#icon-undo'));

        context.map()
            .on('move.background-update', _.debounce(update, 1000));

        context.background()
            .on('change.background-update', update);

        update();
        setOpacity(opacityDefault);

        var keybinding = d3.keybinding('background')
            .on(key, toggle)
            .on('F', hide)
            .on('H', hide);

        d3.select(document)
            .call(keybinding);

        context.surface().on('mousedown.background-outside', hide);
        context.container().on('mousedown.background-outside', hide);
    }

    return background;
};
