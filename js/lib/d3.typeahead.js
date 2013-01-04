d3.typeahead = function() {
    var data;

    var typeahead = function(selection) {
        var container, hidden, idx = 0;

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
                .on('keyup.typeahead', key);
            hidden = false;
        }

        function hide() {
            container.remove();
            idx = 0;
            hidden = true;
        }

        function slowHide() {
            window.setTimeout(hide, 150);
        }

        selection
            .on('focus.typeahead', setup)
            .on('blur.typeahead', slowHide);

        function key() {
           if (d3.event.keyCode === 40) {
               idx++;
               return highlight();
           } else if (d3.event.keyCode === 38) {
               idx--;
               return highlight();
           } else if (d3.event.keyCode === 13) {
               select(container.select('a.selected').datum());
               hide();
           } else {
               update();
           }
        }

        function highlight() {
            container
                .selectAll('a')
                .classed('selected', function(d, i) { return i == idx; });
        }

        function update() {
            if (hidden) setup();

            data(selection, function(data) {
                container.style('display', function() {
                    return data.length ? 'block' : 'none';
                });

                var options = container
                    .selectAll('a')
                    .data(data, function(d) { return d.value; });

                options.enter()
                    .append('a')
                    .text(function(d) { return d.value; })
                    .attr('title', function(d) { return d.title; })
                    .on('click', select);

                options.exit().remove();

                options
                    .classed('selected', function(d, i) { return i == idx; });
            });
        }

        function select(d) {
            selection
                .property('value', d.value)
                .trigger('change');
        }

    };

    typeahead.data = function(_) {
        if (!arguments.length) return data;
        data = _;
        return typeahead;
    };

    return typeahead;
};
