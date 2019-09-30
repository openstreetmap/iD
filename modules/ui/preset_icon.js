import { select as d3_select } from 'd3-selection';

import { svgIcon, svgTagClasses } from '../svg';
import { utilFunctor } from '../util';

export function uiPresetIcon(context) {
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

        ['casing', 'stroke'].forEach(function(klass) {
            lineEnter.append('path')
                .attr('d', 'M' + x1 + ' ' + y + ' L' + x2 + ' ' + y)
                .attr('class', 'line ' + klass);
        });

        [[x1 - 1, y], [x2 + 1, y]].forEach(function(loc) {
            lineEnter.append('circle')
                .attr('class', 'vertex')
                .attr('cx', loc[0])
                .attr('cy', loc[1])
                .attr('r', r);
        });
    }

    function renderRoute(routeEnter) {
        var d = isSmall() ? 40 : 60;
        // draw the route parametrically
        var w = d,
            h = d,
            y1 = Math.round(d*0.80),
            y2 = Math.round(d*0.68),
            l = Math.round(d*0.6),
            r = 2;
        var x1 = (w - l)/2, x2 = x1 + l/3, x3 = x2 + l/3, x4 = x3 + l/3;

        routeEnter = routeEnter
            .append('svg')
            .attr('class', 'preset-icon-route')
            .attr('width', w)
            .attr('height', h)
            .attr('viewBox', '0 0 ' + w + ' ' + h);

        ['casing', 'stroke'].forEach(function(klass) {
            routeEnter.append('path')
                .attr('d', 'M' + x1 + ' ' + y1 + ' L' + x2 + ' ' + y2)
                .attr('class', 'segment0 line ' + klass);
            routeEnter.append('path')
                .attr('d', 'M' + x2 + ' ' + y2 + ' L' + x3 + ' ' + y1)
                .attr('class', 'segment1 line ' + klass);
            routeEnter.append('path')
                .attr('d', 'M' + x3 + ' ' + y1 + ' L' + x4 + ' ' + y2)
                .attr('class', 'segment2 line ' + klass);
        });

        [[x1, y1], [x2, y2], [x3, y1], [x4, y2]].forEach(function(loc) {
            routeEnter.append('circle')
                .attr('class', 'vertex')
                .attr('cx', loc[0])
                .attr('cy', loc[1])
                .attr('r', r);
        });
    }

    var routeSegements = {
        bicycle: ['highway/cycleway', 'highway/cycleway', 'highway/cycleway'],
        bus: ['highway/unclassified', 'highway/secondary', 'highway/primary'],
        detour: ['highway/tertiary', 'highway/residential', 'highway/unclassified'],
        ferry: ['route/ferry', 'route/ferry', 'route/ferry'],
        foot: ['highway/footway', 'highway/footway', 'highway/footway'],
        hiking: ['highway/path', 'highway/path', 'highway/path'],
        horse: ['highway/bridleway', 'highway/bridleway', 'highway/bridleway'],
        light_rail: ['railway/light_rail', 'railway/light_rail', 'railway/light_rail'],
        monorail: ['railway/monorail', 'railway/monorail', 'railway/monorail'],
        pipeline: ['man_made/pipeline', 'man_made/pipeline', 'man_made/pipeline'],
        piste: ['piste/downhill', 'piste/hike', 'piste/nordic'],
        power: ['power/line', 'power/line', 'power/line'],
        road: ['highway/secondary', 'highway/primary', 'highway/trunk'],
        subway: ['railway/subway', 'railway/subway', 'railway/subway'],
        train: ['railway/rail', 'railway/rail', 'railway/rail'],
        tram: ['railway/tram', 'railway/tram', 'railway/tram'],
        waterway: ['waterway/stream', 'waterway/stream', 'waterway/stream']
    };

    function render() {

        var p = preset.apply(this, arguments);
        var isFallback = isSmall() && p.isFallback && p.isFallback();
        var geom = geometry ? geometry.apply(this, arguments) : null;
        if (geom === 'relation' && p.tags && ((p.tags.type === 'route' && p.tags.route && routeSegements[p.tags.route]) || p.tags.type === 'waterway')) {
            geom = 'route';
        }
        var imageURL = p.imageURL;
        var picon = imageURL ? null : getIcon(p, geom);
        var isMaki = picon && /^maki-/.test(picon);
        var isTemaki = picon && /^temaki-/.test(picon);
        var isFa = picon && /^fa[srb]-/.test(picon);
        var isTnp = picon && /^tnp-/.test(picon);
        var isiDIcon = picon && !(isMaki || isTemaki || isFa || isTnp);
        var isCategory = !p.setTags;
        var drawPoint = picon && geom === 'point' && isSmall() && !isFallback;
        var drawVertex = picon !== null && geom === 'vertex' && (!isSmall() || !isFallback);
        var drawLine = picon && geom === 'line' && !isFallback && !isCategory;
        var drawArea = picon && geom === 'area' && !isFallback;
        var drawRoute = picon && geom === 'route';
        var isFramed = (drawVertex || drawArea || drawLine || drawRoute);

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

        var route = container.selectAll('.preset-icon-route')
            .data(drawRoute ? [0] : []);

        route.exit()
            .remove();

        var routeEnter = route.enter();
        renderRoute(routeEnter);

        route = routeEnter.merge(route);

        if (drawRoute) {
            var routeType = p.tags.type === 'waterway' ? 'waterway' : p.tags.route;
            var segmentPresetIDs = routeSegements[routeType];
            for (var segmentIndex in segmentPresetIDs) {
                var segmentPreset = context.presets().item(segmentPresetIDs[segmentIndex]);
                var segmentTagClasses = svgTagClasses().getClassesString(segmentPreset.tags, '');
                route.selectAll('path.stroke.segment' + segmentIndex)
                    .attr('class', 'segment' + segmentIndex + ' line stroke ' + segmentTagClasses);
                route.selectAll('path.casing.segment' + segmentIndex)
                    .attr('class', 'segment' + segmentIndex + ' line casing ' + segmentTagClasses);
            }

        }


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
