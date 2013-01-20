iD.ui.layerswitcher = function(map) {
    var event = d3.dispatch('cancel', 'save'),
        sources = [{
            name: 'Bing',
            source: iD.BackgroundSource.Bing,
            description: 'Satellite imagery.',
            link: 'http://opengeodata.org/microsoft-imagery-details'
        }, {
            name: 'TIGER 2012',
            source: iD.BackgroundSource.Tiger2012,
            description: 'Public domain road data from the US Government.'
        }, {
            name: 'OSM',
            source: iD.BackgroundSource.OSM,
            description: 'The default OpenStreetMap layer.',
            link: 'http://www.openstreetmap.org/'
        }, {
            name: 'MapBox',
            source: iD.BackgroundSource.MapBox,
            description: 'Satellite and Aerial Imagery',
            link: 'http://mapbox.com'
        }, {
            name: 'Custom',
            source: iD.BackgroundSource.Custom,
            description: 'A custom layer (requires configuration)'
        }],
        opacities = [1, 0.5, 0];

    function layerswitcher(selection) {

        var content = selection
            .append('div').attr('class', 'content fillD map-overlay hide');

        var button = selection
            .append('button')
            .attr('class', 'fillD')
            .attr('title', 'Layer Settings')
            .html("<span class='layers icon'></span>")
            .on('click.layerswitcher-toggle', toggle);

        function show() { setVisible(true); }
        function hide() { setVisible(false); }
        function toggle() { setVisible(content.classed('hide')); }

        function setVisible(show) {
            button.classed('active', show);
            content.classed('hide', !show);
        }

        function clickoutside(selection) {
            selection.on('click.layerswitcher-inside', function() {
                return d3.event.stopPropagation();
            });
            d3.select('body').on('click.layerswitcher-outside', hide);
        }

        var opa = content
            .append('div')
            .attr('class', 'opacity-options-wrapper');

        opa.append('h4').text('Layers');

        opa.append('ul')
            .attr('class', 'opacity-options')
            .selectAll('div.opacity')
            .data(opacities)
            .enter()
            .append('li')
                .attr('data-original-title', function(d) {
                    return (d * 100) + "% opacity";
                })
                .on('click.set-opacity', function(d) {
                    d3.select('#tile-g')
                        .transition()
                        .style('opacity', d)
                        .attr('data-opacity', d);
                    d3.selectAll('.opacity-options li')
                        .classed('selected', false);
                    d3.select(this)
                        .classed('selected', true);
                })
                .html("<div class='select-box'></div>")
                .call(bootstrap.tooltip().placement('top'))
                .append('div')
                    .attr('class', 'opacity')
                    .style('opacity', function(d) {
                        return d;
                    });

        // Make sure there is an active selection by default
        d3.select('.opacity-options li').classed('selected', true);

        function selectLayer(d) {
            content.selectAll('a.layer')
                .classed('selected', function(d) {
                    return d.source === map.background.source();
                });
            d3.select('#attribution a')
                .attr('href', d.link)
                .text('provided by ' + d.name);
        }

        content
            .append('ul')
            .attr('class', 'toggle-list fillL')
            .selectAll('a.layer')
                .data(sources)
                .enter()
                .append('li')
                .append('a')
                    .attr('data-original-title', function(d) {
                        return d.description;
                    })
                    .attr('href', '#')
                    .attr('class', 'layer')
                    .text(function(d) {
                        return d.name;
                    })
                    .call(bootstrap.tooltip().placement('right'))
                    .on('click.set-source', function(d) {
                        d3.event.preventDefault();
                        if (d.name === 'Custom') {
                            var configured = d.source();
                            if (!configured) return;
                            d.source = configured;
                            d.name = 'Custom (configured)';
                        }
                        map.background.source(d.source);
                        map.history().imagery_used(d.name);
                        map.redraw();
                        selectLayer(d);
                    })
                    .insert('span')
                    .attr('class','icon toggle');

        var adjustments = content
            .append('div')
            .attr('class', 'adjustments pad1');

        var directions = [
            ['←', [-1, 0]],
            ['↑', [0, -1]],
            ['→', [1, 0]],
            ['↓', [0, 1]]];

        function nudge(d) {
            map.background.nudge(d[1]);
            map.redraw();
        }

        adjustments.selectAll('button')
            .data(directions).enter()
            .append('button')
            .attr('class', 'nudge')
            .text(function(d) { return d[0]; })
            .on('click', nudge);

        adjustments.append('button')
            .text('reset')
            .attr('class', 'reset')
            .on('click', function() {
                map.background.offset([0, 0]);
                map.redraw();
            });


        selection.call(clickoutside);
        selectLayer(map.background.source());
    }

    return d3.rebind(layerswitcher, event, 'on');
};
