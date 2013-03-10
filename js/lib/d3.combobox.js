d3.combobox = function() {
    var event = d3.dispatch('accept'),
        container, input, shown = false, data = [];

    var fetcher = function(val, data, cb) {
        cb(data.filter(function(d) {
            return d.title
                .toString()
                .toLowerCase()
                .indexOf(val.toLowerCase()) !== -1;
        }));
    };

    var typeahead = function(selection) {
        var idx = -1;
        input = selection.select('input').classed('combobox-input', true);

        selection.append('a', selection.select('input'))
            .attr('class', 'combobox-carat')
            .on('mousedown', stop)
            .on('click', click);

        function updateSize() {
            var rect = selection.select('input')
                .node()
                .getBoundingClientRect();
            container.style({
                'left': rect.left + 'px',
                'width': rect.width + 'px',
                'top': rect.height + rect.top + 'px'
            });
        }

        function stop() {
            // prevent the form element from blurring. it blurs
            // on mousedown
            d3.event.stopPropagation();
            d3.event.preventDefault();
        }

        function click() {
            d3.event.preventDefault();
            d3.event.stopPropagation();
            update();
            show();
            // focus the node so that a click outside of the
            // combo box will hide it
            input.node().focus();
        }

        function blur() {
            // hide the combobox whenever the input element
            // loses focus
            slowHide();
        }

        function show() {
            if (!shown) {
                container = d3.select(document.body)
                    .insert('div', ':first-child')
                    .attr('class', 'combobox')
                    .style({
                        position: 'absolute',
                        display: 'block',
                        left: '0px'
                    });

                shown = true;
            }
        }

        function hide() {
            if (shown) {
                idx = -1;
                container.remove();
                shown = false;
            }
        }

        function slowHide() {
            window.setTimeout(hide, 150);
        }
        function keydown() {
           if (!shown) return;
           switch (d3.event.keyCode) {
               // down arrow
               case 40:
                   next();
                   d3.event.preventDefault();
                   break;
               // up arrow
               case 38:
                   prev();
                   d3.event.preventDefault();
                   break;
               // escape, tab
               case 13:
                   d3.event.preventDefault();
                   break;
           }
           d3.event.stopPropagation();
        }

        function keyup() {
            switch (d3.event.keyCode) {
                // escape
                case 27:
                    hide();
                    break;
                // escape, tab
                case 9:
                case 13:
                    if (!shown) return;
                    accept();
                    break;
                default:
                    update();
                    d3.event.preventDefault();
            }
            d3.event.stopPropagation();
        }

        function accept() {
            if (container.select('a.selected').node()) {
                select(container.select('a.selected').datum());
            }
            hide();
        }

        function next() {
            var len = container.selectAll('a').data().length;
            idx = Math.min(idx + 1, len - 1);
            highlight();
        }

        function prev() {
            idx = Math.max(idx - 1, 0);
            highlight();
        }

        var prevValue, prevCompletion;

        function autocomplete(e, data) {

            var value = input.property('value'),
                match;

            for (var i = 0; i < data.length; i++) {
                if (data[i].value.indexOf(value) === 0) {
                    match = data[i].value;
                    break;
                }
            }

            // backspace
            if (e.keyCode === 8) {
                prevValue = value;
                prevCompletion = '';

            } else if (value && match && value !== prevValue + prevCompletion) {
                prevValue = value;
                prevCompletion = match.substr(value.length);
                input.property('value', prevValue + prevCompletion);
                input.node().setSelectionRange(value.length, value.length + prevCompletion.length);
            }
        }


        function highlight() {
            container
                .selectAll('a')
                .classed('selected', function(d, i) { return i == idx; });
            var height = container.node().offsetHeight,
                top = container.select('a.selected').node().offsetTop,
                selectedHeight = container.select('a.selected').node().offsetHeight;
            if ((top + selectedHeight) < height) {
                container.node().scrollTop = 0;
            } else {
                container.node().scrollTop = top;
            }
        }

        function update(value) {

            if (typeof value === 'undefined') {
                value = input.property('value');
            }

            var e = d3.event;

            function render(data) {

                if (data.length &&
                    document.activeElement === input.node()) show();
                else return hide();

                autocomplete(e, data);

                updateSize();

                var options = container
                    .selectAll('a.combobox-option')
                    .data(data, function(d) { return d.value; });

                options.enter()
                    .append('a')
                    .text(function(d) { return d.value; })
                    .attr('class', 'combobox-option')
                    .attr('title', function(d) { return d.title; })
                    .on('click', select);

                options.exit().remove();

                options
                    .classed('selected', function(d, i) { return i == idx; })
                    .order();
            }

            fetcher.apply(selection, [value, data, render]);
        }

        // select the choice given as d
        function select(d) {
            input
                .property('value', d.value)
                .trigger('change');
            event.accept(d);
            hide();
        }

        function mousedown() {

            input.node().focus();
            update('');

            if (!container) return;

            var entries = container.selectAll('a'),
                height = container.node().scrollHeight / entries[0].length,
                w = d3.select(window);

            function getIndex(m) {
                return Math.floor((m[1] + container.node().scrollTop) / height);
            }

            function withinBounds(m) {
                var n = container.node();
                return m[0] >= 0 && m[0] < n.offsetWidth &&
                    m[1] >= 0 && m[1] < n.offsetHeight;
            }

            w.on('mousemove.typeahead', function() {
                var m = d3.mouse(container.node());
                var within = withinBounds(m);
                var n = getIndex(m);
                entries.classed('selected', function(d, i) { return within && i === n; });
            });

            w.on('mouseup.typeahead', function() {
                var m = d3.mouse(container.node());
                if (withinBounds(m)) select(d3.select(entries[0][getIndex(m)]).datum());
                entries.classed('selected', false);
                w.on('mouseup.typeahead', null);
                w.on('mousemove.typeahead', null);
            });
        }

        input
            .on('blur.typeahead', blur)
            .on('keydown.typeahead', keydown)
            .on('keyup.typeahead', keyup)
            .on('mousedown.typeahead', mousedown);
    };

    typeahead.fetcher = function(_) {
        if (!arguments.length) return fetcher;
        fetcher = _;
        return typeahead;
    };

    typeahead.data = function(_) {
        if (!arguments.length) return data;
        data = _;
        return typeahead;
    };

    return d3.rebind(typeahead, event, 'on');
};
