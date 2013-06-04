iD.ui.PresetIcon = function() {
    var preset, geometry;

    function presetIcon(selection) {
        selection.each(setup);
    }

    function setup() {
        var selection = d3.select(this),
            p = preset.apply(this, arguments),
            geom = geometry.apply(this, arguments);

        var $fill = selection.selectAll('.preset-icon-fill')
            .data([0]);

        $fill.enter().append('div');

        $fill.attr('class', function() {
            var s = 'preset-icon-fill icon-' + geom;
            for (var i in p.tags) {
                s += ' tag-' + i + ' tag-' + i + '-' + p.tags[i];
            }
            return s;
        });

        var $icon = selection.selectAll('.preset-icon')
            .data([0]);

        $icon.enter().append('div');

        $icon.attr('class', function() {
            var icon = p.icon || (geom === 'line' ? 'other-line' : 'marker-stroked'),
                klass = 'feature-' + icon + ' preset-icon';

            var featureicon = iD.data.featureIcons[icon];
            if (featureicon && featureicon[geom]) {
                klass += ' preset-icon-' + geom;
            } else if (icon === 'multipolygon') {
                // Special case (geometry === 'area')
                klass += ' preset-icon-relation';
            }

            return klass;
        });
    }

    presetIcon.preset = function(_) {
        if (!arguments.length) return preset;
        preset = d3.functor(_);
        return presetIcon;
    };

    presetIcon.geometry = function(_) {
        if (!arguments.length) return geometry;
        geometry = d3.functor(_);
        return presetIcon;
    };

    return presetIcon;
};
