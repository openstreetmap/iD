import * as d3 from 'd3';
import { dataFeatureIcons } from '../../data/index';
import { svgIcon } from '../svg/index';
import { utilFunctor } from '../util/index';


export function uiPresetIcon() {
    var preset, geometry;


    function presetIcon(selection) {
        selection.each(render);
    }


    function render() {
        var selection = d3.select(this),
            p = preset.apply(this, arguments),
            geom = geometry.apply(this, arguments),
            picon = p.icon || (geom === 'line' ? 'other-line' : 'marker-stroked'),
            isMaki = dataFeatureIcons.hasOwnProperty(picon + '-24');

        if (picon === 'dentist') {
            isMaki = true;  // workaround for dentist icon missing in `maki-sprite.json`
        }

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

        var fill = selection.selectAll('.preset-icon-fill')
            .data([0]);

        fill = fill.enter()
            .append('div')
            .merge(fill);

        fill
            .attr('class', function() {
                return 'preset-icon-fill preset-icon-fill-' + geom + tag_classes(p);
            });

        var frame = selection.selectAll('.preset-icon-frame')
            .data([0]);

        frame = frame.enter()
            .append('div')
            .call(svgIcon('#preset-icon-frame'))
            .merge(frame);

        frame
            .attr('class', function() {
                return 'preset-icon-frame ' + (geom === 'area' ? '' : 'hide');
            });


        var icon = selection.selectAll('.preset-icon')
            .data([0]);

        icon = icon.enter()
            .append('div')
            .attr('class', 'preset-icon')
            .call(svgIcon(''))
            .merge(icon);

        icon
            .attr('class', 'preset-icon preset-icon-' + (isMaki ? '32' : (geom === 'area' ? '44' : '60')));

        icon.selectAll('svg')
            .attr('class', function() {
                return 'icon ' + picon + tag_classes(p);
            });

        icon.selectAll('use')       // workaround: maki parking-24 broken?
            .attr('href', '#' + picon + (isMaki ? (picon === 'parking' ? '-18' : '-24') : ''));
    }


    presetIcon.preset = function(_) {
        if (!arguments.length) return preset;
        preset = utilFunctor(_);
        return presetIcon;
    };


    presetIcon.geometry = function(_) {
        if (!arguments.length) return geometry;
        geometry = utilFunctor(_);
        return presetIcon;
    };

    return presetIcon;
}
