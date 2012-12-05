d3.typeahead = function() {
    var data, hidden;

    var typeahead = function(selection) {
        var container;
        function setup() {
            var rect = selection.node().getBoundingClientRect();
            container = d3.select(document.body)
                .append('div').attr('class', 'typeahead')
                .style({
                    position: 'absolute',
                    left: rect.left + 'px',
                    top: rect.bottom + 'px'
                });
            selection
                .on('keyup.typeahead', update);
            hidden = false;
        }

        function hide() {
            window.setTimeout(function() {
                container.remove();
                idx = 0;
                hidden = true;
            }, 500);
        }

        selection
            .on('focus.typeahead', setup)
            .on('blur.typeahead', hide);

        var idx = 0;
        function update() {
            if (hidden) setup();
            if (d3.event.keyCode === 40) idx++;
            if (d3.event.keyCode === 38) idx--;
            if (d3.event.keyCode === 13) {
                selection.property('value', container.select('a.active').datum().value);
                hide();
            }
            container
                .selectAll('a')
                .classed('active', function(d, i) { return i == idx; });
            // if (d3.event.keyCode === 13) // return
            data(selection, function(data) {
                var val = selection.property('value'),
                    matches = data.filter(function(d) {
                        return d.value.toLowerCase().indexOf(val) === 0;
                    }).map(function(d) {
                        return { value: d.value, description: d.description };
                    });
                container.style('display', function() {
                    return matches.length ? 'block' : 'none';
                });
                var options = container
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
            });
        }
    };

    typeahead.data = function(_) {
        if (!arguments.length) return data;
        data = _;
        return typeahead;
    };

    return typeahead;
};
