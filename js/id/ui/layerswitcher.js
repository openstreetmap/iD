iD.layerswitcher = function(map) {
    var event = d3.dispatch('cancel', 'save'),
        sources = [{
            name: 'Bing',
            source: iD.BackgroundSource.Bing,
            description: 'Satellite imagery.'
        }, {
            name: 'TIGER 2012',
            source: iD.BackgroundSource.Tiger2012,
            description: 'Public domain road data from the US Government.'
        }, {
            name: 'OSM',
            source: iD.BackgroundSource.OSM,
            description: 'The default OpenStreetMap layer.'
        }],
        opacities = [{
            level: 1,
            label: "0%"
        }, {
            level: 0.5,
            label: "50%"
        }, {
            level: 0,
            label: "100%"
        }];

    function layerswitcher(selection) {
        selection
            .append('button')
                .attr('class', 'narrow')
                .text('Layers')
                .on('click', function() {
                    d3.select(this)
                    .classed('active', function() {
                        if ( !content.classed('hide')) {
                            return false;
                        } else {
                            return true;
                        }
                    })
                    content.classed('hide', function() {
                        return !content.classed('hide');
                    });
                });

        var content = selection
            .append('div')
                .attr('class', 'content map-overlay hide');

        opa = content
            .append('div')
                .attr('class', 'opacity-options-wrapper fillL2')
                .html("<em>Layers</em>")
                    .append('ul')
                        .attr('class', 'opacity-options')
                        .selectAll('div.opacity')
                        .data(opacities)
                        .enter()
                            .append('li')
                                .attr('data-original-title', function(d) {
                                    return d.label + " opacity";
                                })
                                .on('click', function(d) {
                                    d3.select('#tile-g')
                                        .transition()
                                        .style('opacity', d.level)
                                        .attr('data-opacity', d.level);
                                    d3.selectAll('.opacity-options li')
                                    .classed('selected', false)
                                    d3.select(this)
                                    .classed('selected', true)
                                })
                                .html("<div class='select-box'></div>")
                                .call(bootstrap.tooltip().placement('top'))
                                    .append('div')
                                        .attr('class', 'opacity')
                                        .style('opacity', function(d) {
                                            return d.level;
                                        });

            // Make sure there is an active selection by default
            d3.select('.opacity-options li').classed('selected', true)

        function selectLayer(d) {
            content.selectAll('a.layer')
                .classed('selected', function(d) {
                    return d.source === map.background.source();
                });
        }

        content
        .append('ul')
            .attr('class', 'toggle-list')

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
                    .on('click', function(d) {
                        d3.event.preventDefault();
                        map.background.source(d.source);
                        map.redraw();
                        selectLayer(d);
                    })
                    .insert('span')
                    .attr('class','icon toggle');
                selectLayer(map.background.source());
    }

    return d3.rebind(layerswitcher, event, 'on');
};
