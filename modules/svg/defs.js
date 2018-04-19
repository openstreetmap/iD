import { request as d3_request } from 'd3-request';
import { select as d3_select } from 'd3-selection';


/*
    A standalone SVG element that contains only a `defs` sub-element. To be
    used once globally, since defs IDs must be unique within a document.
*/
export function svgDefs(context) {

    function SVGSpriteDefinition(id, href) {
        return function(defs) {
            d3_request(href)
                .mimeType('image/svg+xml')
                .response(function(xhr) { return xhr.responseXML; })
                .get(function(err, svg) {
                    if (err) return;
                    defs.node().appendChild(
                        d3_select(svg.documentElement).attr('id', id).node()
                    );
                });
        };
    }


    return function drawDefs(selection) {
        var defs = selection.append('defs');

        // markers
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

        // patterns
        var patterns = defs.selectAll('pattern')
            .data([
                // pattern name, pattern image name
                ['wetland', 'wetland'],
                ['construction', 'construction'],
                ['cemetery', 'cemetery'],
                ['orchard', 'orchard'],
                ['farmland', 'farmland'],
                ['beach', 'dots'],
                ['scrub', 'dots'],
                ['meadow', 'dots']
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

        // clip paths
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

        // symbol spritesheets
        defs
            .call(SVGSpriteDefinition('iD-sprite', context.imagePath('iD-sprite.svg')))
            .call(SVGSpriteDefinition('maki-sprite', context.imagePath('maki-sprite.svg')))
            .call(SVGSpriteDefinition('community-sprite', context.imagePath('community-sprite.svg')));
    };
}
