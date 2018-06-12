import { select as d3_select } from 'd3-selection';

import { svgIcon } from '../svg';
import { utilFunctor } from '../util';


export function uiPresetIcon() {
    var preset, geometry;


    function presetIcon(selection) {
        selection.each(render);
    }


    function getIcon(p, geom) {
        if (p.icon)
            return p.icon;
        else if (geom === 'line')
            return 'iD-other-line';
        else if (geom === 'vertex')
            return p.isFallback() ? '' : 'temaki-vertex';
        else
            return 'maki-marker-stroked';
    }


    function render() {
        var selection = d3_select(this);
        var p = preset.apply(this, arguments);
        var geom = geometry.apply(this, arguments);
        var picon = getIcon(p, geom);
        var isMaki = /^maki-/.test(picon);
        var isTemaki = /^temaki-/.test(picon);
        var isFa = /^fa[srb]-/.test(picon);
        var isPOI = isMaki || isTemaki || isFa;
        var isFramed = (geom === 'area' || geom === 'vertex');


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


        var areaFrame = selection.selectAll('.preset-icon-frame')
            .data((geom === 'area') ? [0] : []);

        areaFrame.exit()
            .remove();

        areaFrame = areaFrame.enter()
            .append('div')
            .attr('class', 'preset-icon-frame')
            .call(svgIcon('#iD-preset-icon-frame'));


        var icon = selection.selectAll('.preset-icon')
            .data([0]);

        icon = icon.enter()
            .append('div')
            .attr('class', 'preset-icon')
            .call(svgIcon(''))
            .merge(icon);

        icon
            .attr('class', 'preset-icon preset-icon-' +
                (isPOI ? (isFramed ? '24' : '28') : (isFramed ? '44' : '60'))
            );

        icon.selectAll('svg')
            .attr('class', function() {
                return 'icon ' + picon + (isPOI ? '' : tag_classes(p));
            });

        icon.selectAll('use')
            .attr('href', '#' + picon + (isMaki ? '-15' : ''));
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
