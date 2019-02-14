import { select as d3_select } from 'd3-selection';

import { svgIcon, svgTagClasses } from '../svg';
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
        var isCategory = !p.setTags;
        var drawLine = geom === 'line' && !isCategory;
        var isFramed = (geom === 'area' || drawLine || geom === 'vertex');

        var tags = !isCategory ? p.setTags({}, geom) : {};
        for (var k in tags) {
            if (tags[k] === '*') {
                tags[k] = 'yes';
            }
        }
        var tagClasses = svgTagClasses().getClassesString(tags, '');

        var fill = selection.selectAll('.preset-icon-fill')
            .data([0]);

        fill = fill.enter()
            .append('div')
            .merge(fill);

        fill
            .attr('class', function() {
                return 'preset-icon-fill preset-icon-fill-' + geom + ' ' + tagClasses;
            });

        var line = selection.selectAll('.preset-icon-line')
            .data(drawLine ? [0] : []);

        line.exit()
            .remove();

        // draw the line parametrically
        var w = 60, h = 60, y = 43, l = 36, r = 2.5;
        var x1 = (w - l)/2, x2 = x1 + l;

        var lineEnter = line.enter()
            .append('svg')
            .attr('class', 'preset-icon-line')
            .attr('width', w)
            .attr('height', h)
            .attr('viewBox', '0 0 ' + w + ' ' + h);

        lineEnter.append('path')
            .attr('d', 'M' + x1 + ' ' + y + ' L' + x2 + ' ' + y)
            .attr('class', 'line casing');
        lineEnter.append('path')
            .attr('d', 'M' + x1 + ' ' + y + ' L' + x2 + ' ' + y)
            .attr('class', 'line stroke');
        lineEnter.append('circle')
            .attr('class', 'vertex')
            .attr('cx', x1 - 1)
            .attr('cy', y)
            .attr('r', r);
        lineEnter.append('circle')
            .attr('class', 'vertex')
            .attr('cx', x2 + 1)
            .attr('cy', y)
            .attr('r', r);

        line = lineEnter.merge(line);

        line.selectAll('path.stroke')
            .attr('class', 'line stroke ' + tagClasses);
        line.selectAll('path.casing')
            .attr('class', 'line casing ' + tagClasses);


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
            .attr('class', 'preset-icon ' + geom + '-geom ' + 'preset-icon-' +
                (isPOI ? (isFramed ? '24' : '28') : (isFramed ? '44' : '60'))
            );

        icon.selectAll('svg')
            .attr('class', function() {
                return 'icon ' + picon + ' ' + (isPOI && geom !== 'line'  ? '' : tagClasses);
            });

        icon.selectAll('use')
            .attr('href', '#' + picon + (isMaki ? '-15' : ''));
    }


    presetIcon.preset = function(val) {
        if (!arguments.length) return preset;
        preset = utilFunctor(val);
        return presetIcon;
    };


    presetIcon.geometry = function(val) {
        if (!arguments.length) return geometry;
        geometry = utilFunctor(val);
        return presetIcon;
    };

    return presetIcon;
}
