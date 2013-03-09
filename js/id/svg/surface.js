iD.svg.Surface = function() {
    return function drawSurface(selection) {
        var defs = selection.append('defs');

        defs.append('marker')
            .attr({
                id: 'oneway-marker',
                viewBox: '0 0 10 10',
                refY: 2.5,
                markerWidth: 2,
                markerHeight: 2,
                orient: 'auto'
            })
            .append('path')
            .attr('d', 'M 0 0 L 5 2.5 L 0 5 z');

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
                ['meadow', 'dots']])
            .enter()
            .append('pattern')
                .attr({
                    id: function(d) { return 'pattern-' + d[0]; },
                    width: 32,
                    height: 32,
                    patternUnits: 'userSpaceOnUse'
                });

        patterns.append('rect')
            .attr({
                x: 0,
                y: 0,
                width: 32,
                height: 32,
                'class': function(d) { return 'pattern-color-' + d[0]; }
            });

        patterns.append('image')
            .attr({
                x: 0,
                y: 0,
                width: 32,
                height: 32
            })
            .attr('xlink:href', function(d) { return 'img/pattern/' + d[1] + '.png'; });

        defs.append('clipPath')
            .attr('id', 'clip-square-12')
            .append('rect')
            .attr({
                x: 0,
                y: 0,
                width: 12,
                height: 12
            });

        defs.append('image')
            .attr({
                id: 'maki-sprite',
                width: 306,
                height: 294,
                'xlink:href': 'img/maki.png'
            });

        _.forEach(_.find(document.styleSheets, function(stylesheet) {
            return stylesheet.href.indexOf("maki.css") > 0;
        }).cssRules, function(rule) {
            var klass = rule.selectorText,
                match = klass.match(/^\.(maki-[a-z0-9-]+-12)$/);
            if (match) {
                var id = match[1];
                match = rule.style.backgroundPosition.match(/(-?\d+)px (-?\d+)px/);
                defs.append('use')
                    .attr('id', id)
                    .attr('transform', "translate(" + match[1] + "," + match[2] + ")")
                    .attr('xlink:href', '#maki-sprite');
            }
        });

        var layers = selection.selectAll('.layer')
            .data(['fill', 'shadow', 'casing', 'stroke', 'text', 'hit', 'halo', 'label']);

        layers.enter().append('g')
            .attr('class', function(d) { return 'layer layer-' + d; });
    };
};
