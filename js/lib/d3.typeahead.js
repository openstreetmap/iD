d3.typeahead = function() {

    var data = [], limit = 10;

    var typeahead = function(selection) {
        var option_div = d3.select(document.body).append('div')
            .attr({
                'class': 'typeahead',
                position: 'absolute',
                left: selection.node().offsetLeft,
                top: selection.node().offsetTop
            });

        selection
            .on('keyup', function() {
                var val = d3.select(d3.event.target).property('value');
                var matches = data.filter(function(d) {
                    return d.toLowerCase().indexOf(val) === 0;
                });
                if (matches.length === 1 && matches[0] === val) {
                    matches = [];
                }
                var options = option_div.selectAll('a').data(matches);
                options.enter()
                    .append('a')
                    .text(String)
                    .on('click', function(d) {
                        selection.property('value', d);
                    });
                options.exit().remove();
            });
    };

    typeahead.limit = function(_) {
        if (!arguments.length) return limit;
        limit = _;
        return typeahead;
    };

    typeahead.data = function(_) {
        if (!arguments.length) return data;
        data = _;
        return typeahead;
    };

    return typeahead;

};
