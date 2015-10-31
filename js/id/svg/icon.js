iD.svg.Icon = function(name, useklass, svgklass) {
    return function (selection) {
        selection.selectAll('svg')
            .data([0])
            .enter()
            .append('svg')
            .attr('class', (svgklass || 'icon'))
            .append('use')
            .attr('xlink:href', name)
            .attr('class', useklass);
    };
};
