iD.ui.PresetIcon = function(geometry) {
    return function(selection) {
        selection.append('div')
            .attr('class', function(preset) {
                var s = 'preset-icon-fill icon-' + geometry;
                for (var i in preset.tags) {
                    s += ' tag-' + i + ' tag-' + i + '-' + preset.tags[i];
                }
                return s;
            });

        var fallbackIcon = geometry === 'line' ? 'other-line' : 'marker-stroked';

        selection.append('div')
            .attr('class', function(preset) {
                return (geometry === 'line' ? 'preset-line-icon ' : 'feature-') +
                    (preset.icon || fallbackIcon) +
                    ' preset-icon preset-icon-' + geometry;
            });
    };
};
