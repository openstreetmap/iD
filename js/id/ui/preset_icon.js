iD.ui.PresetIcon = function(geometry) {
    return function(selection) {
        selection.append('div')
            .attr('class', function(preset) {
                var s = 'preset-icon-fill ' + geometry;
                for (var i in preset.tags) {
                    s += ' tag-' + i + ' tag-' + i + '-' + preset.tags[i];
                }
                return s;
            });

        var fallbackIcon = geometry === 'line' ? 'other-line' : 'marker-stroked';

        selection.append('div')
            .attr('class', function(preset) {
                return 'feature-' + (preset.icon || fallbackIcon) + ' icon preset-icon preset-icon-' + geometry;
            });
    }
};
