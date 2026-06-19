import { svg as d3_svg } from 'd3-fetch';
import { select as d3_select } from 'd3-selection';

import { utilArrayUniq } from '../util';
import {
    DIRECTIONAL_COMBO_ARROW_DOWN_PATH, DIRECTIONAL_COMBO_ARROW_UP_PATH, DIRECTIONAL_COMBO_ARROW_VIEWBOX
} from './directional_combo_arrow';


/*
    A standalone SVG element that contains only a `defs` sub-element. To be
    used once globally, since defs IDs must be unique within a document.
*/
export function svgDefs(context) {

    var _defsSelection = d3_select(null);

    var _spritesheetIds = [
        'iD-sprite', 'maki-sprite', 'temaki-sprite', 'fa-sprite', 'roentgen-sprite', 'community-sprite'
    ];

    function drawDefs(selection) {
        _defsSelection = selection.append('defs');

        // add markers

        // SVG markers have to be given a colour where they're defined
        // (they can't inherit it from the line they're attached to),
        // so we need to manually define markers for each color of tag
        // (also, it's slightly nicer if we can control the
        // positioning for different tags)

        /** @param {string} name @param {string} colour */
        function addOnewayMarker(name, colour) {
            _defsSelection
                .append('marker')
                .attr('id', `ideditor-oneway-marker-${name}`)
                .attr('viewBox', '0 0 10 5')
                .attr('refX', 4)
                .attr('refY', 2.5)
                .attr('markerWidth', 2)
                .attr('markerHeight', 2)
                .attr('markerUnits', 'strokeWidth')
                .attr('orient', 'auto')
                .append('path')
                .attr('class', 'oneway-marker-path')
                .attr('d', 'M 6,3 L 0,3 L 0,2 L 6,2 L 5,0 L 10,2.5 L 5,5 z')
                .attr('stroke', 'none')
                .attr('fill', colour)
                .attr('opacity', '1');
        }
        addOnewayMarker('black', '#333'); // default
        addOnewayMarker('white', '#fff'); // for dark lines (bridges under construction, railways, etc.)
        addOnewayMarker('gray', '#eee'); // for railway lines


        function addSidedMarker(name, options) {
            const path = {
                circle: 'M 0,0.5 a 0.5,0.5 0 1,0 1,0 a 0.5,0.5 0 1,0 -1,0',
                mirrored: 'M 0,1 l 1,-1 l 1,1 z',
                default: 'M 0,0 l 1,1 l 1,-1 z'
            }[options.style || 'default'];
            _defsSelection
                .append('marker')
                .attr('id', 'ideditor-sided-marker-' + name)
                .attr('viewBox', '0 0 2 2')
                .attr('refX', 1)
                .attr('refY', -options.offset)
                .attr('markerWidth', 1.5)
                .attr('markerHeight', 1.5)
                .attr('markerUnits', 'strokeWidth')
                .attr('orient', 'auto')
                .append('path')
                .attr('class', 'sided-marker-path sided-marker-' + name + '-path')
                .attr('d', path)
                .attr('stroke', options.strokeColor || 'none')
                .attr('stroke-width', options.strokeColor ? 0.1 : 0)
                .attr('fill', options.color);
        }
        addSidedMarker('natural', { color: 'rgb(170, 170, 170)', offset: 0 });
        // for a coastline, the arrows are (somewhat unintuitively) on
        // the water side, so let's color them blue (with a gap) to
        // give a stronger indication
        addSidedMarker('coastline', { color: '#77dede', offset: 1 });
        addSidedMarker('waterway', { color: '#77dede', offset: 1 });
        // barriers have a dashed line, and separating the triangle
        // from the line visually suits that
        addSidedMarker('barrier', { color: '#ddd', offset: 1 });
        // dedicated style for guard rails (#9594):
        // marker on opposite side, circles instead of triangles
        addSidedMarker('guard_rail', { color: '#ddd', offset: -1.5, style: 'circle' });
        addSidedMarker('man_made', { color: '#fff', offset: 0 });
        function addBothSidedMarker(name, options) {
            let mirror = false;
            if (options.offset < 0) {
                options.offset = Math.abs(options.offset);
                mirror = true;
            }
            _defsSelection
                .append('marker')
                .attr('id', 'ideditor-sided-marker-' + name)
                .attr('viewBox', `0,-${1+options.offset}, 2,${2*(1+options.offset)}`)
                .attr('refX', 1)
                .attr('refY', 0)
                .attr('markerWidth', 1.5)
                .attr('markerHeight', 1.5 * (2 + options.offset))
                .attr('markerUnits', 'strokeWidth')
                .attr('orient', 'auto')
                .append('path')
                .attr('class', 'sided-marker-path sided-marker-' + name + '-path')
                .attr('d', mirror
                    ? `M 0,${-options.offset-1} l 1,1 l 1,-1 z M 0,${1+options.offset} l 1,-1 l 1,1 z`
                    : `M 0,${options.offset} l 1,1 l 1,-1 z M 0,${-options.offset} l 1,-1 l 1,1 z`)
                .attr('stroke', options.strokeColor || 'none')
                .attr('stroke-width', options.strokeColor ? 0.1 : 0)
                .attr('fill', options.color);
        }
        const embankmentColors = {
            strokeColor: '#444',
            color: 'rgba(200, 200, 200, 0.75)'
        };
        addBothSidedMarker('embankment', { ...embankmentColors, offset: 1.5 });
        addSidedMarker('embankment-right', { ...embankmentColors, offset: 1.5 });
        addSidedMarker('embankment-left', { ...embankmentColors, offset: -2.5, style: 'mirrored' });
        addSidedMarker('embankment-man_made', { ...embankmentColors, offset: 1 });
        addBothSidedMarker('cutting', { ...embankmentColors, offset: -1.5 });
        addSidedMarker('cutting-right', { ...embankmentColors, offset: 1.5, style: 'mirrored' });
        addSidedMarker('cutting-left', { ...embankmentColors, offset: -2.5 });

        /**
         * Adds directional combo indicator marker on one side of a way.
         * @param {'left' | 'right'} side
         * @returns {void}
         */
        function addDirectionalComboMarker(side) {
            const gap = 1.4;
            const pathD = side === 'left' ? DIRECTIONAL_COMBO_ARROW_UP_PATH : DIRECTIONAL_COMBO_ARROW_DOWN_PATH;
            const refY = side === 'left' ? 2 + gap : -gap;
            const markerW = 3;
            const markerH = 6;
            _defsSelection
                .append('marker')
                .attr('id', 'ideditor-directionalcombo-marker-' + side)
                .attr('viewBox', DIRECTIONAL_COMBO_ARROW_VIEWBOX)
                .attr('refX', 1)
                .attr('refY', refY)
                .attr('markerWidth', markerW)
                .attr('markerHeight', markerH)
                .attr('markerUnits', 'strokeWidth')
                .attr('orient', 'auto')
                .append('path')
                .attr('class', 'directionalcombo-marker-path directionalcombo-marker-' + side + '-path')
                .attr('d', pathD)
                .attr('stroke', 'none')
                .attr('fill', '#7092ff');
        }
        addDirectionalComboMarker('left');
        addDirectionalComboMarker('right');

        _defsSelection
            .append('marker')
            .attr('id', 'ideditor-viewfield-marker')
            .attr('viewBox', '0 0 16 16')
            .attr('refX', 8)
            .attr('refY', 16)
            .attr('markerWidth', 4)
            .attr('markerHeight', 4)
            .attr('markerUnits', 'strokeWidth')
            .attr('orient', 'auto')
            .append('path')
            .attr('class', 'viewfield-marker-path')
            .attr('d', 'M 6,14 C 8,13.4 8,13.4 10,14 L 16,3 C 12,0 4,0 0,3 z')
            .attr('fill', '#333')
            .attr('fill-opacity', '0.75')
            .attr('stroke', '#fff')
            .attr('stroke-width', '0.5px')
            .attr('stroke-opacity', '0.75');

        _defsSelection
            .append('marker')
            .attr('id', 'ideditor-viewfield-marker-wireframe')
            .attr('viewBox', '0 0 16 16')
            .attr('refX', 8)
            .attr('refY', 16)
            .attr('markerWidth', 4)
            .attr('markerHeight', 4)
            .attr('markerUnits', 'strokeWidth')
            .attr('orient', 'auto')
            .append('path')
            .attr('class', 'viewfield-marker-path')
            .attr('d', 'M 6,14 C 8,13.4 8,13.4 10,14 L 16,3 C 12,0 4,0 0,3 z')
            .attr('fill', 'none')
            .attr('stroke', '#fff')
            .attr('stroke-width', '0.5px')
            .attr('stroke-opacity', '0.75');

        _defsSelection
            .append('marker')
            .attr('id', 'ideditor-viewfield-marker-side')
            .attr('viewBox', '0 0 16 16')
            .attr('refX', 8)
            .attr('refY', 16)
            .attr('markerWidth', 4)
            .attr('markerHeight', 4)
            .attr('markerUnits', 'strokeWidth')
            .attr('orient', 'auto')
            .append('path')
            .attr('class', 'viewfield-marker-path')
            .attr('d', 'M 3 14 C 8 13 8 13 13 14 L 8 5 Z')
            .attr('fill', '#333')
            .attr('fill-opacity', '0.75')
            .attr('stroke', '#fff')
            .attr('stroke-width', '0.5px')
            .attr('stroke-opacity', '0.75');

        _defsSelection
            .append('marker')
            .attr('id', 'ideditor-viewfield-marker-side-wireframe')
            .attr('viewBox', '0 0 16 16')
            .attr('refX', 8)
            .attr('refY', 16)
            .attr('markerWidth', 4)
            .attr('markerHeight', 4)
            .attr('markerUnits', 'strokeWidth')
            .attr('orient', 'auto')
            .append('path')
            .attr('class', 'viewfield-marker-path')
            .attr('d', 'M 3 14 C 8 13 8 13 13 14 L 8 5 Z')
            .attr('fill', 'none')
            .attr('stroke', '#fff')
            .attr('stroke-width', '0.5px')
            .attr('stroke-opacity', '0.75');


        // add patterns
        var patterns = _defsSelection.selectAll('pattern')
            .data([
                // pattern name, pattern image name
                ['beach', 'dots'],
                ['construction', 'construction'],
                ['cemetery', 'cemetery'],
                ['cemetery_christian', 'cemetery_christian'],
                ['cemetery_buddhist', 'cemetery_buddhist'],
                ['cemetery_muslim', 'cemetery_muslim'],
                ['cemetery_jewish', 'cemetery_jewish'],
                ['farmland', 'farmland'],
                ['farmyard', 'farmyard'],
                ['flowers', 'flowers'],
                ['forest', 'forest'],
                ['forest_broadleaved', 'forest_broadleaved'],
                ['forest_needleleaved', 'forest_needleleaved'],
                ['forest_leafless', 'forest_leafless'],
                ['golf_green', 'grass'],
                ['grass', 'grass'],
                ['landfill', 'landfill'],
                ['meadow', 'grass'],
                ['orchard', 'orchard'],
                ['pond', 'pond'],
                ['quarry', 'quarry'],
                ['scrub', 'bushes'],
                ['vineyard', 'vineyard'],
                ['water_standing', 'lines'],
                ['waves', 'waves'],
                ['wetland', 'wetland'],
                ['wetland_marsh', 'wetland_marsh'],
                ['wetland_swamp', 'wetland_swamp'],
                ['wetland_bog', 'wetland_bog'],
                ['wetland_reedbed', 'wetland_reedbed']
            ])
            .enter()
            .append('pattern')
            .attr('id', function (d) { return 'ideditor-pattern-' + d[0]; })
            .attr('width', 32)
            .attr('height', 32)
            .attr('patternUnits', 'userSpaceOnUse');

        patterns
            .append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', 32)
            .attr('height', 32)
            .attr('class', function (d) { return 'pattern-color-' + d[0]; });

        patterns
            .append('image')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', 32)
            .attr('height', 32)
            .attr('xlink:href', function (d) {
                return context.imagePath('pattern/' + d[1] + '.png');
            });

        // add clip paths
        _defsSelection.selectAll('clipPath')
            .data([12, 18, 20, 32, 45])
            .enter()
            .append('clipPath')
            .attr('id', function (d) { return 'ideditor-clip-square-' + d; })
            .append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', function (d) { return d; })
            .attr('height', function (d) { return d; });

        // add svg filters
        const filters = _defsSelection.selectAll('filter')
            .data(['alpha-slope5'])
            .enter()
            .append('filter')
            .attr('id', d => d);
        // Alters the alpha channel such that everything but
        // (almost) transparent pixels are rendered fully opaque:
        // This is used in a workaround for how chrome is rendering
        // the edges of `img` elements when the page zoom is not a
        // "round value": the semi-transparent pixels of neighboring
        // tiles cannot "add up" to a fully opaque background layer.
        // See https://github.com/openstreetmap/iD/issues/10747
        // and https://github.com/openstreetmap/iD/pull/10594
        const alphaSlope5 = filters.filter('#alpha-slope5')
            .append('feComponentTransfer');
        alphaSlope5.append('feFuncR').attr('type', 'identity');
        alphaSlope5.append('feFuncG').attr('type', 'identity');
        alphaSlope5.append('feFuncB').attr('type', 'identity');
        alphaSlope5.append('feFuncA')
            .attr('type', 'linear')
            .attr('slope', 5);

        // add symbol spritesheets
        addSprites(_spritesheetIds, true);
    }

    function addSprites(ids, overrideColors) {
        _spritesheetIds = utilArrayUniq(_spritesheetIds.concat(ids));

        var spritesheets = _defsSelection
            .selectAll('.spritesheet')
            .data(_spritesheetIds);

        spritesheets
            .enter()
            .append('g')
            .attr('class', function(d) { return 'spritesheet spritesheet-' + d; })
            .each(function(d) {
                var url = context.imagePath(d + '.svg');
                var node = d3_select(this).node();

                d3_svg(url)
                    .then(function(svg) {
                        node.appendChild(
                            d3_select(svg.documentElement).attr('id', 'ideditor-' + d).node()
                        );
                        if (overrideColors && d !== 'iD-sprite') {   // allow icon colors to be overridden..
                            d3_select(node).selectAll('path')
                                .attr('fill', 'currentColor');
                        }
                    })
                    .catch(function() {
                        /* ignore */
                    });
            });

        spritesheets
            .exit()
            .remove();
    }

    drawDefs.addSprites = addSprites;

    return drawDefs;
}
