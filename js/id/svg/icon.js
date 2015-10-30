iD.svg.Icon = function(name) {
    return function (selection) {
        selection.selectAll('icon')
            .data([0])
            .enter()
            .append('svg')
            .attr('class','icon')
            .append('use')
            .attr('xlink:href', name);
    };
};
