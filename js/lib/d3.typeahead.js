d3.typeahead = function() {
    var event = d3.dispatch('accept'),
        autohighlight = false,
        data;

    var typeahead = function(selection) {
        var container,
            hidden,
            idx = autohighlight ? 0 : -1;

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
            idx = autohighlight ? 0 : -1;
            hidden = true;
        }

        function slowHide() {
            if (autohighlight) {
                if (container.select('a.selected').node()) {
                    select(container.select('a.selected').datum());
                    event.accept();
                }
            }
            window.setTimeout(hide, 150);
        }

        selection
            .on('focus.typeahead', setup)
            .on('blur.typeahead', slowHide);

        function key() {
           var len = container.selectAll('a').data().length;
           if (d3.event.keyCode === 40) {
               idx = Math.min(idx + 1, len - 1);
               return highlight();
           } else if (d3.event.keyCode === 38) {
               idx = Math.max(idx - 1, 0);
               return highlight();
           } else if (d3.event.keyCode === 13) {
               if (container.select('a.selected').node()) {
                   select(container.select('a.selected').datum());
               }
               event.accept();
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

    typeahead.autohighlight = function(_) {
        if (!arguments.length) return autohighlight;
        autohighlight = _;
        return typeahead;
    };

    return d3.rebind(typeahead, event, 'on');
};
