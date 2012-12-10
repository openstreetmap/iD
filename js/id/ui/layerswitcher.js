iD.layerswitcher = function(map) {
    var event = d3.dispatch('cancel', 'save'),
        sources = [{
            name: 'Bing',
            source: iD.BackgroundSource.Bing,
            description: 'High quality satellite imagery'
        }, {
            name: 'TIGER 2012',
            source: iD.BackgroundSource.Tiger2012,
            description: 'Public domain road data from the US Government'
        }, {
            name: 'OSM',
            source: iD.BackgroundSource.OSM,
            description: 'The default OpenStreetMap layer'
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
            .selectAll('div.opacity')
            .data(opacities)
            .enter()
            .append('li')
              .on('click', function(d) {
                  d3.select('#tile-g')
                      .transition()
                      .style('opacity', d)
                      .attr('data-opacity', d);
                  d3.selectAll('.opacity-options li')
                  .classed('selected', false)
                  d3.select(this)
                  .classed('selected', true)
              })
            .html("<div class='select-box'></div>")
            .append('div')
            .attr('class', 'opacity')
            .style('opacity', function(d) {
                return d;
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
