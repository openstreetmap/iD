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
        if (isSmall() && p.isFallback && p.isFallback())
            return 'iD-icon-' + p.id;
        else if (p.icon)
            return p.icon;
        else if (geom === 'line')
            return 'iD-other-line';
        else if (geom === 'vertex')
            return p.isFallback() ? '' : 'temaki-vertex';
        else if (isSmall() && geom === 'point')
            return '';
        else
            return 'maki-marker-stroked';
    }

    function renderPointBorder(enter) {
        var w = 40, h = 40;
        enter = enter
            .append('svg')
            .attr('class', 'preset-icon-fill preset-icon-point-border')
            .attr('width', w)
            .attr('height', h)
            .attr('viewBox', '0 0 ' + w + ' ' + h);

        enter.append('path')
            .attr('transform', 'translate(11.5, 8)')
            .attr('d', 'M 17,8 C 17,13 11,21 8.5,23.5 C 6,21 0,13 0,8 C 0,4 4,-0.5 8.5,-0.5 C 13,-0.5 17,4 17,8 z');
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

        var p = preset.apply(this, arguments);
        var isFallback = isSmall() && p.isFallback && p.isFallback();
        var geom = geometry ? geometry.apply(this, arguments) : null;
        var imageURL = p.imageURL;
        var picon = imageURL ? null : getIcon(p, geom);
        var isMaki = picon && /^maki-/.test(picon);
        var isTemaki = picon && /^temaki-/.test(picon);
        var isFa = picon && /^fa[srb]-/.test(picon);
        var isiDIcon = picon && !(isMaki || isTemaki || isFa);
        var isCategory = !p.setTags;
        var drawPoint = picon && geom === 'point' && isSmall() && !isFallback;
        var drawVertex = picon !== null && geom === 'vertex' && (!isSmall() || !isFallback);
        var drawLine = picon && geom === 'line' && !isFallback && !isCategory;
        var drawArea = picon && geom === 'area' && !isFallback;
        var isFramed = (drawVertex || drawArea || drawLine);

        var tags = !isCategory ? p.setTags({}, geom) : {};
        for (var k in tags) {
            if (tags[k] === '*') {
                tags[k] = 'yes';
            }
        }
        var tagClasses = svgTagClasses().getClassesString(tags, '');

        var selection = d3_select(this);

        var container = selection.selectAll('.preset-icon-container')
            .data([0]);

        container = container.enter()
            .append('div')
            .attr('class', 'preset-icon-container ' + sizeClass)
            .merge(container);

        container.classed('fallback', isFallback);

        var imageIcon = container.selectAll('img.image-icon')
            .data(imageURL ? [0] : []);

        imageIcon.exit()
            .remove();

        imageIcon = imageIcon.enter()
            .append('img')
            .attr('class', 'image-icon')
            .merge(imageIcon);

        imageIcon
            .attr('src', imageURL);

        var pointBorder = container.selectAll('.preset-icon-point-border')
            .data(drawPoint ? [0] : []);

        pointBorder.exit()
            .remove();

        var pointBorderEnter = pointBorder.enter();
        renderPointBorder(pointBorderEnter);
        pointBorder = pointBorderEnter.merge(pointBorder);


        var vertexFill = container.selectAll('.preset-icon-fill-vertex')
            .data(drawVertex ? [0] : []);

        vertexFill.exit()
            .remove();

        var vertexFillEnter = vertexFill.enter();
        renderCircleFill(vertexFillEnter);
        vertexFill = vertexFillEnter.merge(vertexFill);


        var fill = container.selectAll('.preset-icon-fill-area')
            .data(drawArea ? [0] : []);

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
            .data(picon ? [0] : []);

        icon.exit()
            .remove();

        icon = icon.enter()
            .append('div')
            .attr('class', 'preset-icon')
            .call(svgIcon(''))
            .merge(icon);

        icon
            .attr('class', 'preset-icon ' + (geom ? geom + '-geom' : ''))
            .classed('framed', isFramed)
            .classed('preset-icon-iD', isiDIcon);

        icon.selectAll('svg')
            .attr('class', function() {
                return 'icon ' + picon + ' ' + (!isiDIcon && geom !== 'line'  ? '' : tagClasses);
            });

        icon.selectAll('use')
            .attr('href', '#' + picon + (isMaki ? (isSmall() && geom === 'point' ? '-11' : '-15') : ''));

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
