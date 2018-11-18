import _uniq from 'lodash-es/uniq';

import { request as d3_request } from 'd3-request';
import { select as d3_select } from 'd3-selection';


/*
    A standalone SVG element that contains only a `defs` sub-element. To be
    used once globally, since defs IDs must be unique within a document.
*/
export function svgDefs(context) {

    function drawDefs(selection) {
        var defs = selection.append('defs');

        // add markers
        defs
            .append('marker')
            .attr('id', 'oneway-marker')
            .attr('viewBox', '0 0 10 5')
            .attr('refX', 2.5)
            .attr('refY', 2.5)
            .attr('markerWidth', 2)
            .attr('markerHeight', 2)
            .attr('markerUnits', 'strokeWidth')
            .attr('orient', 'auto')
            .append('path')
            .attr('class', 'oneway-marker-path')
            .attr('d', 'M 5,3 L 0,3 L 0,2 L 5,2 L 5,0 L 10,2.5 L 5,5 z')
            .attr('stroke', 'none')
            .attr('fill', '#000')
            .attr('opacity', '0.75');

        defs
            .append('marker')
            .attr('id', 'viewfield-marker')
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

        defs
            .append('marker')
            .attr('id', 'viewfield-marker-wireframe')
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

        // add patterns
        var patterns = defs.selectAll('pattern')
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
                ['forest', 'forest'],
                ['forest_broadleaved', 'forest_broadleaved'],
                ['forest_needleleaved', 'forest_needleleaved'],
                ['forest_leafless', 'forest_leafless'],
                ['grass', 'grass'],
                ['landfill', 'landfill'],
                ['meadow', 'grass'],
                ['orchard', 'orchard'],
                ['pond', 'pond'],
                ['quarry', 'quarry'],
                ['scrub', 'bushes'],
                ['vineyard', 'vineyard'],
                ['waves', 'waves'],
                ['wetland', 'wetland'],
                ['wetland_marsh', 'wetland_marsh'],
                ['wetland_swamp', 'wetland_swamp'],
                ['wetland_bog', 'wetland_bog'],
                ['wetland_reedbed', 'wetland_reedbed']
            ])
            .enter()
            .append('pattern')
            .attr('id', function (d) { return 'pattern-' + d[0]; })
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
        defs.selectAll('clipPath')
            .data([12, 18, 20, 32, 45])
            .enter()
            .append('clipPath')
            .attr('id', function (d) { return 'clip-square-' + d; })
            .append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', function (d) { return d; })
            .attr('height', function (d) { return d; });

        // add symbol spritesheets
        defs
            .call(drawDefs.addSprites, [
                'iD-sprite', 'maki-sprite', 'temaki-sprite', 'fa-sprite', 'community-sprite'
            ]);
    }


    drawDefs.addSprites = function(selection, ids) {
        var spritesheets = selection.selectAll('.spritesheet');
        var currData = spritesheets.data();
        var data = _uniq(currData.concat(ids));

        spritesheets
            .data(data)
            .enter()
            .append('g')
            .attr('class', function(d) { return 'spritesheet spritesheet-' + d; })
            .each(function(d) {
                var url = context.imagePath(d + '.svg');
                var node = d3_select(this).node();
                d3_request(url)
                    .mimeType('image/svg+xml')
                    .response(function(xhr) { return xhr.responseXML; })
                    .get(function(err, svg) {
                        if (err) return;
                        node.appendChild(
                            d3_select(svg.documentElement).attr('id', d).node()
                        );
                    });
            });
    };


    return drawDefs;
}
