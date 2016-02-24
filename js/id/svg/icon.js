iD.svg.Icon = function(name, svgklass, useklass) {
    return function drawIcon(selection) {
        selection.selectAll('svg')
            .data([0])
            .enter()
            .append('svg')
            .attr('class', 'icon ' + (svgklass || ''))
            .append('use')
            .attr('xlink:href', name)
            .attr('class', useklass);
    };
};
