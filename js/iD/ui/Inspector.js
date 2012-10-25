iD.Inspector = function(selection) {
    var inspector = {};

    // http://jsfiddle.net/7WQjr/
    selection.each(function(d, i) {
        var tagpairs = d3.entries(d.tags);

        d3.select(this).selectAll('table').remove();

        var table = d3.select(this)
            .append('table')
            .attr('class', 'inspector');

        var thead = table.append('thead');
        var tbody = table.append('tbody');

        thead.append('tr')
            .selectAll('th')
            .data(['tag', 'value'])
            .enter()
            .append('th')
                .text(String);

        var row = tbody.selectAll('tr')
            .data(tagpairs)
            .enter()
            .append('tr');

        row.selectAll('td')
            .data(function(d) {
                return [d.key, d.value];
            })
            .enter()
            .append('td')
            .append('input')
                .attr('class', function(d, i) {
                    return i === 0 ? 'tag-input' : 'value-input';
                })
                .attr('placeholder', function(d, i) {
                    return i === 0 ? 'tag' : 'value';
                })
                .property('value', function(d) { return d; });
    });
};
