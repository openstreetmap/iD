iD.svg.Surface = function() {
    function findStylesheet(name) {
        return _.find(document.styleSheets, function(stylesheet) {
            return stylesheet.href && stylesheet.href.indexOf(name) > 0;
        });
    }

    function sprites(stylesheetName, selectorRegexp) {
        var sprites = [];

        var stylesheet = findStylesheet(stylesheetName);
        if (!stylesheet) {
            return sprites;
        }

        _.forEach(stylesheet.cssRules, function(rule) {
            var klass = rule.selectorText,
                match = klass && klass.match(selectorRegexp);
            if (match) {
                var id = match[1];
                match = rule.style.backgroundPosition.match(/(-?\d+)px (-?\d+)px/);
                sprites.push({id: id, x: match[1], y: match[2]});
            }
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
            .attr('xlink:href', function(d) { return 'img/pattern/' + d[1] + '.png'; });

        defs.selectAll()
            .data([12, 20])
            .enter().append('clipPath')
            .attr('id', function(d) { return 'clip-square-' + d; })
            .append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', function(d) { return d; })
            .attr('height', function(d) { return d; });

        defs.append('image')
            .attr({
                id: 'sprite',
                width: 440,
                height: 200,
                'xlink:href': 'img/sprite.png'
            });

        defs.selectAll()
            .data(sprites("app.css", /^\.(icon-operation-[a-z0-9-]+)$/))
            .enter().append('use')
            .attr('id', function(d) { return d.id; })
            .attr('transform', function(d) { return "translate(" + d.x + "," + d.y + ")"; })
            .attr('xlink:href', '#sprite');

        defs.append('image')
            .attr({
                id: 'maki-sprite',
                width: 306,
                height: 294,
                'xlink:href': 'img/maki.png'
            });

        defs.selectAll()
            .data(sprites("maki.css", /^\.(maki-[a-z0-9-]+-12)$/))
            .enter().append('use')
            .attr('id', function(d) { return d.id; })
            .attr('transform', function(d) { return "translate(" + d.x + "," + d.y + ")"; })
            .attr('xlink:href', '#maki-sprite');

        var layers = selection.selectAll('.layer')
            .data(['fill', 'shadow', 'casing', 'stroke', 'text', 'hit', 'halo', 'label']);

        layers.enter().append('g')
            .attr('class', function(d) { return 'layer layer-' + d; });
    };
};
