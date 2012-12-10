iD.layerswitcher = function(map) {
    var event = d3.dispatch('cancel', 'save'),
        sources = [{
            name: 'Bing',
            source: iD.BackgroundSource.Bing
        }, {
            name: 'TIGER 2012',
            source: iD.BackgroundSource.Tiger2012
        }, {
            name: 'OSM',
            source: iD.BackgroundSource.OSM
        }],
        opacities = [1, 0.5, 0];

    function layerswitcher(selection) {
        selection
            .append('button')
            .attr('class', 'narrow')
            .text('Layers')
            .on('click', function() {
                content.classed('hide', function() {
                    return !content.classed('hide');
                });
            });

        var content = selection
            .append('div').attr('class', 'content map-overlay hide');

        opa = content
            .append('div')
            .attr('class', 'opacity-options-wrapper fillL2')
            .html("<em>Layers</em>")
            .append('ul')
            .attr('data-original-title', 'Adjust the opacity')
            .call(bootstrap.tooltip().placement('right'))
            .attr('class', 'opacity-options')
            .selectAll('a.opacity')
            .data(opacities)
            .enter()
            .append('li').append('a').attr('class', 'opacity')
            .style('opacity', function(d) {
                return d;
            })
            .on('mouseover', function(d) {
                d3.select('#tile-g')
                    .transition()
                    .style('opacity', d);
            })
            .on('mouseout', function(d) {
                var o = d3.select('#tile-g').attr('data-opacity');
                d3.select('#tile-g')
                    .transition()
                    .style('opacity', o);
            })
            .on('click', function(d) {
                d3.select('#tile-g')
                    .transition()
                    .style('opacity', d)
                    .attr('data-opacity', d);
            });

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
            .attr('href', '#')
            .attr('class', 'layer')
            .text(function(d) {
                return d.name;
            })
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
