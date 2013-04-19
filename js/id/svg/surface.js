iD.svg.Surface = function(context) {
    function autosize(image) {
        var img = document.createElement('img');
        img.src = image.attr('xlink:href');
        img.onload = function() {
            image.attr({
                width: img.width,
                height: img.height
            });
        };
    }

    function sprites(selectorRegexp) {
        var sprites = [];

        _.forEach(document.styleSheets, function(stylesheet) {
            _.forEach(stylesheet.cssRules, function(rule) {
                var klass = rule.selectorText,
                    match = klass && klass.match(selectorRegexp);
                if (match) {
                    var id = match[1];
                    match = rule.style.backgroundPosition.match(/(-?\d+)px (-?\d+)px/);
                    sprites.push({id: id, x: match[1], y: match[2]});
                }
            });
        });

        return sprites;
    }

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
            .attr('xlink:href', function(d) { return context.imagePath('pattern/' + d[1] + '.png'); });

        defs.selectAll()
            .data([12, 18, 20])
            .enter().append('clipPath')
            .attr('id', function(d) { return 'clip-square-' + d; })
            .append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', function(d) { return d; })
            .attr('height', function(d) { return d; });

        defs.append('image')
            .attr('id', 'sprite')
            .attr('xlink:href', context.imagePath('sprite.svg'))
            .call(autosize);

        defs.selectAll()
            .data(sprites(/^\.(icon-operation-[a-z0-9-]+)$/))
            .enter().append('use')
            .attr('id', function(d) { return d.id; })
            .attr('transform', function(d) { return "translate(" + d.x + "," + d.y + ")"; })
            .attr('xlink:href', '#sprite');

        defs.append('image')
            .attr('id', 'maki-sprite')
            .attr('xlink:href', context.imagePath('maki-sprite.png'))
            .call(autosize);

        defs.selectAll()
            .data(iD.data.maki.images)
            .enter().append('use')
            .attr('id', function(d) { return 'maki-' + d.name; })
            .attr('transform', function(d) { return "translate(-" + d.positionX + ",-" + d.positionY + ")"; })
            .attr('xlink:href', '#maki-sprite');

        var layers = selection.selectAll('.layer')
            .data(['fill', 'shadow', 'casing', 'stroke', 'text', 'hit', 'halo', 'label']);

        layers.enter().append('g')
            .attr('class', function(d) { return 'layer layer-' + d; });
    };
};
