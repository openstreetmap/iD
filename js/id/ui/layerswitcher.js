iD.layerswitcher = function(map) {
    var event = d3.dispatch('cancel', 'save'),
        sources = [{
            name: 'Bing',
            source: iD.BackgroundSource.Bing
        }, {
            name: 'TIGER 2012',
            source: iD.BackgroundSource.Tiger2012
        }],
        opacities = [1, 0.5, 0];

    function layerswitcher(selection) {
        selection
            .append('button')
            .attr('class', 'white')
            .text('L');

        var content = selection
            .append('div').attr('class', 'content');

        opa = content.append('div')
            .attr('class', 'opacity-options')
            .selectAll('a.opacity')
            .data(opacities)
            .enter()
            .append('a').attr('class', 'opacity')
            .style('opacity', function(d) {
                return d;
            })
            .on('click', function(d) {
                d3.select('#tile-g')
                    .transition()
                    .style('opacity', d);
            });

        content.selectAll('a.layer')
            .data(sources)
            .enter()
            .append('a')
            .attr('class', 'layer')
            .text(function(d) {
                return d.name;
            })
            .on('click', function(d) {
                map.background.source(d.source);
                map.redraw();
            });
    }

    return d3.rebind(layerswitcher, event, 'on');
};
