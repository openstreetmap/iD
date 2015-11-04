iD.ui.PresetIcon = function() {
    var preset, geometry;

    function presetIcon(selection) {
        selection.each(setup);
    }

    function setup() {
        var selection = d3.select(this),
            p = preset.apply(this, arguments),
            geom = geometry.apply(this, arguments),
            icon = p.icon || (geom === 'line' ? 'other-line' : 'marker-stroked'),
            isMaki = iD.data.featureIcons.hasOwnProperty(icon + '-24');

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

        $icon
            .classed('preset-icon-60', !isMaki)
            .classed('preset-icon-32', isMaki);

        $icon.selectAll('use')
            .attr('href', function() {
                // workaround: maki parking-24 broken?
                return '#' + icon + (isMaki ? ( icon === 'parking' ? '-18' : '-24') : '');
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
