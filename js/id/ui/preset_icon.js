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
            var s = 'preset-icon-fill preset-icon-fill-' + geom;
            for (var i in p.tags) {
                s += ' tag-' + i + ' tag-' + i + '-' + p.tags[i];
            }
            return s;
        });

        var $frame = selection.selectAll('.preset-icon-frame')
            .data([0]);

        $frame.enter()
            .append('div')
            .call(iD.svg.Icon('#preset-icon-frame'));

        $frame.attr('class', function() {
            return 'preset-icon-frame ' + (geom === 'area' ? '' : 'hide');
        });


        var $icon = selection.selectAll('.preset-icon')
            .data([0]);

        $icon.enter()
            .append('div')
            .attr('class', 'preset-icon')
            .call(iD.svg.Icon(''));

        $icon.selectAll('use')
            .attr('href', function() {
                var icon = p.icon || (geom === 'line' ? 'other-line' : 'marker-stroked');
                return '#' + icon;
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
