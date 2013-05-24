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

                var featureicon = iD.data.featureIcons[icon];
                if (featureicon && featureicon[geometry]) {
                    klass += ' preset-icon-' + geometry;
                } else if (icon === 'multipolygon') {
                    // Special case (geometry === 'area')
                    klass += ' preset-icon-relation';
                }

                return klass;
            });
    };
};
