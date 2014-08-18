iD.ui.Features = function(context) {
    var key = 'f';

    function features(selection) {

        function showsFeature(d) {
            return context.features().enabled(d);
        }

        function clickFeature(d) {
            context.features().toggle(d);
        }

        function drawList(selection) {
            var data = context.features().keys();

            var layerLinks = selection.selectAll('li.layer')
                .data(data);

            var enter = layerLinks.enter()
                .insert('li', '.custom_layer')
                .attr('class', 'layer');

            // only set tooltips for layers with tooltips
            enter.filter(function(d) { return d; })
                .call(bootstrap.tooltip()
                    .title(function(d) { return t('features.' + d + '.tooltip'); })
                    .placement('top'));

            var label = enter.append('label');

            label.append('input')
                .attr('type', 'checkbox')
                .attr('name', 'layers')
                .property('checked', showsFeature)
                .on('change', clickFeature);

            label.append('span')
                .text(function(d) { return t('features.' + d + '.description'); });

            layerLinks.exit()
                .remove();

            selection.style('display', selection.selectAll('li.layer').data().length > 0 ? 'block' : 'none');
        }

        function update() {
            featureList.call(drawList);
        }

        var content = selection.append('div')
                .attr('class', 'fillL map-overlay col3 content hide'),
            tooltip = bootstrap.tooltip()
                .placement('left')
                .html(true)
                .title(iD.ui.tooltipHtml(t('features.description'), key));

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
                    selection.on('mousedown.features-inside', function() {
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
                    selection.on('mousedown.features-inside', null);
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
            .text(t('features.title'));

        var featureList = content.append('ul')
            .attr('class', 'layer-list');

        context.features()
            .on('change.features-update', update);

        update();

        var keybinding = d3.keybinding('features');
        keybinding.on(key, toggle);

        d3.select(document)
            .call(keybinding);

        context.surface().on('mousedown.features-outside', hide);
        context.container().on('mousedown.features-outside', hide);
    }

    return features;
};
