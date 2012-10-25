iD.Inspector = function(selection) {
    var inspector = {};

    // http://jsfiddle.net/7WQjr/
    selection.each(function(d, i) {
        d3.select(this).selectAll('table').remove();

        var table = d3.select(this)
            .append('table')
            .attr('class', 'inspector');

        var tbody = table.append('tbody');

        table.append('thead').append('tr').selectAll('th')
            .data(['tag', 'value'])
            .enter()
            .append('th')
                .text(String);

        var row = tbody.selectAll('tr')
            .data(d3.entries(d.tags))
            .enter()
            .append('tr');

        row.append('td').append('input')
            .property('value', function(d) { return d.key; });

        row.append('td').append('input')
            .attr('class', 'tag-value')
            .property('value', function(d) { return d.value; });

        var save = d3.select(this)
            .append('button')
            .text('Save')
            .on('click', function(d, i) {
                var inputs = table.selectAll('input.tag-value')
                    .data();
                console.log(inputs);
            });
    });
};
