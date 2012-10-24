iD.Inspector = function(selection) {
    var inspector = {};
    var width = 300,
        height = 600;

    selection.each(function(d, i) {
        var rows = d3.select(this)
            .attr('class', 'inspector')
            .attr('width', width)
            .attr('height', height)
            .selectAll('div.row')
            .data(d3.entries(d.tags));

        rows.exit().remove();

        var row = rows.enter().append('div.row').data(function(d) { return d; });
        row.enter().append('input')
            .attr('type', 'text')
            .attr('value', function(d) { return d[0]; });

        row.enter().append('input')
            .attr('type', 'text')
            .attr('value', function(d) { return d[1]; });
    });
};
