d3.combobox = function() {
    var event = d3.dispatch('accept'),
        autohighlight = false,
        autofilter = false,
        input,
        container,
        data;

    var typeahead = function(selection) {
        var hidden, idx = autohighlight ? 0 : -1;

        var rect = selection.select('input').node().getBoundingClientRect();

        input = selection.select('input');

        container = selection
            .insert('div', ':first-child')
            .attr('class', 'combobox')
            .style({
                position: 'absolute',
                display: 'none',
                left: '0px',
                width: rect.width + 'px',
                top: rect.height + 'px'
            });

        carat = selection
            .insert('div', ':first-child')
            .attr('class', 'combobox-carat')
            .text('+')
            .style({
                position: 'absolute',
                left: (rect.width - 20) + 'px',
                top: '0px'
            })
            .on('click', function() {
                update();
                show();
            });

        selection
            .on('keyup.typeahead', key);

        hidden = false;

        function hide() {
            idx = autohighlight ? 0 : -1;
            hidden = true;
        }

        function show() {
            container.style('display', 'block');   
        }

        function slowHide() {
            if (autohighlight && container.select('a.selected').node()) {
                select(container.select('a.selected').datum());
                event.accept();
            }
            window.setTimeout(hide, 150);
        }

        selection
            .on('focus.typeahead', show)
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

            function run(data) {
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
            }

            if (typeof data === 'function') data(selection, run);
            else  run(data);
        }

        function select(d) {
            input
                .property('value', d.value)
                .trigger('change');
            container.style('display', 'none');
        }

    };

    typeahead.data = function(_) {
        if (!arguments.length) return data;
        data = _;
        return typeahead;
    };

    typeahead.autofilter = function(_) {
        if (!arguments.length) return autofilter;
        autofilter = _;
        return typeahead;
    };

    typeahead.autohighlight = function(_) {
        if (!arguments.length) return autohighlight;
        autohighlight = _;
        return typeahead;
    };

    return d3.rebind(typeahead, event, 'on');
};
