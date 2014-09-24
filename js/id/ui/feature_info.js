iD.ui.FeatureInfo = function(context) {
    function update(selection) {
        var features = context.features(),
            hidden = features.hidden();

        selection.html('');

        if (hidden.length) {
            var stats = features.stats(),
                hiddenList = _.map(hidden, function(k) {
                    return String(stats[k]) + ' ' + t('feature.' + k + '.description');
                });

            selection.append('span')
                .html(t('feature_info.hidden_features', { features: hiddenList.join(', ') }));
        }

        if (!hidden.length) {
            selection.transition().duration(200).style('opacity', 0);
        } else if (selection.style('opacity') === '0') {
            selection.transition().duration(200).style('opacity', 1);
        }
    }

    return function(selection) {
        update(selection);

        context.features().on('change.feature_info', function() {
            update(selection);
        });
    };
};
