iD.ui.FeatureInfo = function(context) {
    function update(selection) {
        var features = context.features(),
            hidden = features.hidden();

        selection.html('');

        if (hidden.length) {
            var stats = features.stats(),
                count = 0,
                hiddenList = _.map(hidden, function(k) {
                    count += stats[k];
                    return String(stats[k]) + ' ' + t('feature.' + k + '.description');
                }),
                tooltip = bootstrap.tooltip()
                    .placement('top')
                    .html(true)
                    .title(function() {
                        return iD.ui.tooltipHtml(hiddenList.join('<br/>'));
                    });

            var warning = selection.append('a')
                .attr('href', '#')
                .attr('tabindex', -1)
                .html(t('feature_info.hidden_warning', { count: count }))
                .call(tooltip)
                .on('click', function() {
                    tooltip.hide(warning);
                    // open map data panel?
                    d3.event.preventDefault();
                });
        }

        selection
            .classed('hide', !hidden.length);
    }

    return function(selection) {
        update(selection);

        context.features().on('change.feature_info', function() {
            update(selection);
        });
    };
};
