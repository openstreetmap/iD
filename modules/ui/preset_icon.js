import { select as d3_select } from 'd3-selection';

import { svgIcon, svgTagClasses } from '../svg';
import { utilFunctor } from '../util';

export function uiPresetIcon() {
    var preset, geometry, sizeClass = 'medium';

    function isSmall() {
        return sizeClass === 'small';
    }


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

    function renderCircleFill(fillEnter) {
        var w = 60, h = 60, d = 40;
        fillEnter = fillEnter
            .append('svg')
            .attr('class', 'preset-icon-fill preset-icon-fill-vertex')
            .attr('width', w)
            .attr('height', h)
            .attr('viewBox', '0 0 ' + w + ' ' + h);

        fillEnter.append('circle')
            .attr('cx', w/2)
            .attr('cy', h/2)
            .attr('r', d/2);
    }

    function renderSquareFill(fillEnter) {
        var d = isSmall() ? 40 : 60;
        var w = d, h = d, l = d*2/3, c1 = (w-l)/2, c2 = c1 + l;
        fillEnter = fillEnter
            .append('svg')
            .attr('class', 'preset-icon-fill preset-icon-fill-area')
            .attr('width', w)
            .attr('height', h)
            .attr('viewBox', '0 0 ' + w + ' ' + h);

        var data = 'M' + c1 + ' ' + c1 + ' L' + c1 + ' ' + c2 + ' L' + c2 + ' ' + c2 + ' L' + c2 + ' ' + c1 + ' Z';

        fillEnter.append('path')
            .attr('d', data)
            .attr('class', 'line area fill');

        fillEnter.append('path')
            .attr('d', data)
            .attr('class', 'line area stroke');

        var r = 2.5;
        var coordinates = [c1, c2];
        for (var xIndex in coordinates) {
            for (var yIndex in coordinates) {
                fillEnter.append('circle')
                    .attr('class', 'vertex')
                    .attr('cx', coordinates[xIndex])
                    .attr('cy', coordinates[yIndex])
                    .attr('r', r);
            }
        }

        if (!isSmall()) {
            var midCoordinates = [[c1, w/2], [c2, w/2], [h/2, c1], [h/2, c2]];
            for (var index in midCoordinates) {
                var loc = midCoordinates[index];
                fillEnter.append('circle')
                    .attr('class', 'midpoint')
                    .attr('cx', loc[0])
                    .attr('cy', loc[1])
                    .attr('r', 1.25);
            }
        }

    }

    function renderLine(lineEnter) {
        var d = isSmall() ? 40 : 60;
        // draw the line parametrically
        var w = d, h = d, y = Math.round(d*0.72), l = Math.round(d*0.6), r = 2.5;
        var x1 = (w - l)/2, x2 = x1 + l;

        lineEnter = lineEnter
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
    }


    function render() {
        var selection = d3_select(this);

        var container = selection.selectAll('.preset-icon-container')
            .data([0]);

        container = container.enter()
            .append('div')
            .attr('class', 'preset-icon-container ' + sizeClass)
            .merge(container);

        var p = preset.apply(this, arguments);
        var geom = geometry.apply(this, arguments);
        var picon = getIcon(p, geom);
        var isMaki = /^maki-/.test(picon);
        var isTemaki = /^temaki-/.test(picon);
        var isFa = /^fa[srb]-/.test(picon);
        var isiDIcon = !(isMaki || isTemaki || isFa);
        var isCategory = !p.setTags;
        var drawLine = geom === 'line' && !isCategory;
        var drawFill = geom === 'area' || geom === 'vertex';
        var isFramed = (drawFill || drawLine);

        var tags = !isCategory ? p.setTags({}, geom) : {};
        for (var k in tags) {
            if (tags[k] === '*') {
                tags[k] = 'yes';
            }
        }
        var tagClasses = svgTagClasses().getClassesString(tags, '');


        var vertexFill = container.selectAll('.preset-icon-fill-vertex')
            .data(geom === 'vertex' ? [0] : []);

        vertexFill.exit()
            .remove();

        var vertexFillEnter = vertexFill.enter();
        renderCircleFill(vertexFillEnter);
        vertexFill = vertexFillEnter.merge(vertexFill);


        var fill = container.selectAll('.preset-icon-fill-area')
            .data(geom === 'area' ? [0] : []);

        fill.exit()
            .remove();

        var fillEnter = fill.enter();
        renderSquareFill(fillEnter);
        fill = fillEnter.merge(fill);

        fill.selectAll('path.stroke')
            .attr('class', 'area stroke ' + tagClasses);
        fill.selectAll('path.fill')
            .attr('class', 'area fill ' + tagClasses);


        var line = container.selectAll('.preset-icon-line')
            .data(drawLine ? [0] : []);

        line.exit()
            .remove();

        var lineEnter = line.enter();
        renderLine(lineEnter);

        line = lineEnter.merge(line);

        line.selectAll('path.stroke')
            .attr('class', 'line stroke ' + tagClasses);
        line.selectAll('path.casing')
            .attr('class', 'line casing ' + tagClasses);


        var icon = container.selectAll('.preset-icon')
            .data([0]);

        icon = icon.enter()
            .append('div')
            .attr('class', 'preset-icon')
            .call(svgIcon(''))
            .merge(icon);

        icon
            .attr('class', 'preset-icon ' + geom + '-geom')
            .classed('framed', isFramed)
            .classed('preset-icon-iD', isiDIcon);

        icon.selectAll('svg')
            .attr('class', function() {
                return 'icon ' + picon + ' ' + (!isiDIcon && geom !== 'line'  ? '' : tagClasses);
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


    presetIcon.sizeClass = function(val) {
        if (!arguments.length) return sizeClass;
        sizeClass = val;
        return presetIcon;
    };

    return presetIcon;
}
