iD.layerswitcher = function(map) {
    var event = d3.dispatch('cancel', 'save');
    var sources = [{
        name: 'Bing',
        source: iD.BackgroundSource.Bing
    }];

    var opacities = [1, 0.5, 0];

    function layerswitcher(selection) {
        selection
            .append('button')
            .attr('class', 'white')
            .text('L');

        var content = selection
            .append('div').attr('class', 'content');

        var opa = content.append('div')
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

        var s = content.selectAll('a.layer')
            .data(sources);

        s.enter()
            .append('a')
            .attr('class', 'layer')
            .text(function(d) {
                return d.name;
            });
    }

    return d3.rebind(layerswitcher, event, 'on');
};
