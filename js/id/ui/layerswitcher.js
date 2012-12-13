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
        opacities = [1, 0.5, 0];

    function layerswitcher(selection) {

        var content = selection
            .append('div').attr('class', 'content map-overlay hide');

        var toggle = selection
            .append('button')
            .attr('class', 'narrow')
            .html("<span class='layers icon'></span>")
            .on('click.toggle', function() {
                d3.select(this)
                    .classed('active', function() {
                        return content.classed('hide');
                    });
                content.classed('hide', function() {
                    if (content.classed('hide')) clickoutside(selection);
                    else {
                        d3.select('body').on('click.outside', null);
                        selection.on('click.inside', null);
                    }
                    return !content.classed('hide');
                });
            });

        function clickoutside(selection) {
            selection
                .on('click.inside', function() {
                    return d3.event.stopPropagation();
                });
            d3.select('body')
                .on('click.outside', function() {
                    toggle.on('click.toggle').apply(toggle.node(), d3.event);
                });
        }

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
                    .on('click.set-source', function(d) {
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
