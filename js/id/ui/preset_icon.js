iD.ui.PresetIcon = function() {
    var preset, geometry;

    function presetIcon(selection) {
        selection.each(render);
    }

    function render() {
        var selection = d3.select(this),
            p = preset.apply(this, arguments),
            geom = geometry.apply(this, arguments),
            icon = p.icon || (geom === 'line' ? 'other-line' : 'marker-stroked'),
            maki = iD.data.featureIcons.hasOwnProperty(icon + '-24');

        if (icon === 'dentist') maki = true;  // workaround for dentist icon missing in `maki-sprite.json`

        function tag_classes(p) {
            var s = '';
            for (var i in p.tags) {
                s += ' tag-' + i;
                if (p.tags[i] !== '*') {
                    s += ' tag-' + i + '-' + p.tags[i];
                }
            }
            return s;
        }

        var $fill = selection.selectAll('.preset-icon-fill')
            .data([0]);

        $fill.enter().append('div');

        $fill.attr('class', function() {
            return 'preset-icon-fill preset-icon-fill-' + geom + tag_classes(p);
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
            .attr('class', 'preset-icon preset-icon-' + (maki ? '32' : (geom === 'area' ? '44' : '60')));

        $icon.selectAll('svg')
            .attr('class', function() {
                return 'icon ' + icon + tag_classes(p);
            });

        $icon.selectAll('use')       // workaround: maki parking-24 broken?
            .attr('href', '#' + icon + (maki ? ( icon === 'parking' ? '-18' : '-24') : ''));
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
