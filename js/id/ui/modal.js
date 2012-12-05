iD.modal = function() {
    var animate = d3.select('div.modal').empty();

    d3.select('div.modal').transition()
        .style('opacity', 0).remove();

    var shaded = d3.select(document.body)
        .append('div').attr('class', 'shaded')
        .style('opacity', 0)
        .on('click', function() {
            if (d3.event.target == this) this.remove();
        });

    shaded.append('div')
        .attr('class', 'modal')
        .append('div')
        .attr('class', 'content');

    if (animate) {
        shaded.transition().style('opacity', 1);
    } else {
        shaded.style('opacity', 1);
    }

    return shaded;
};
