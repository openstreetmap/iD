iD.ui.PresetIcon = function() {
    var preset, geometry;

    function presetIcon(selection) {
        var $fill = selection.selectAll('.preset-icon-fill')
            .data([0]);

        $fill.enter().append('div');

        $fill.attr('class', function() {
            var s = 'preset-icon-fill icon-' + geometry;
            for (var i in preset.tags) {
                s += ' tag-' + i + ' tag-' + i + '-' + preset.tags[i];
            }
            return s;
        });

        var fallbackIcon = geometry === 'line' ? 'other-line' : 'marker-stroked';

        var $icon = selection.selectAll('.preset-icon')
            .data([0]);

        $icon.enter().append('div');

        $icon.attr('class', function() {
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
    }

    presetIcon.preset = function(_) {
        if (!arguments.length) return preset;
        preset = _;
        return presetIcon;
    };

    presetIcon.geometry = function(_) {
        if (!arguments.length) return geometry;
        geometry = _;
        return presetIcon;
    };

    return presetIcon;
};
