d3.typeahead = function() {
    var data;

    var typeahead = function(selection) {
        var container;
        function setup() {
            var rect = selection.node().getBoundingClientRect();
            d3.select(document.body)
                .append('div').attr('class', 'typeahead')
                .style({
                    position: 'absolute',
                    left: rect.left + 'px',
                    top: rect.bottom + 'px'
                });
            selection
                .on('keyup', update);
        }

        function hide() {
            window.setTimeout(function() {
                d3.selectAll('div.typeahead').remove();
            }, 500);
        }

        selection
            .on('focus', setup)
            .on('blur', hide);

        function update() {
            var val = selection.property('value'),
                matches = data.filter(function(d) {
                    return d.value.toLowerCase().indexOf(val) === 0;
                }).map(function(d) {
                    return { value: d.value, description: d.description };
                }),
                container = d3.select('div.typeahead')
                    .style('display', function() {
                        return matches.length ? 'block' : 'none';
                    }),
                options = container
                    .selectAll('a')
                    .data(matches, function(d) { return d.value; });

            options.enter()
                .append('a')
                .text(function(d) { return d.value; })
                .attr('title', function(d) { return d.description; })
                .on('click', function(d) {
                    selection.property('value', d.value);
                });
            options.exit().remove();
        }
    };

    typeahead.data = function(_) {
        if (!arguments.length) return data;
        data = _;
        return typeahead;
    };

    return typeahead;
};
