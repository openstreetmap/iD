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
                var icon = preset.icon || fallbackIcon,
                    klass = 'feature-' + icon + ' preset-icon';

                icon = iD.data.featureIcons[icon];
                if (geometry === 'line' && icon && icon.line) {
                    klass += ' preset-icon-line';
                }

                return klass;
            });
    };
};
