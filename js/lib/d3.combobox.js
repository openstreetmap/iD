d3.combobox = function() {
    var event = d3.dispatch('accept'),
        data = [],
        suggestions = [];

    var fetcher = function(val, cb) {
        cb(data.filter(function(d) {
            return d.title
                .toString()
                .toLowerCase()
                .indexOf(val.toLowerCase()) !== -1;
        }));
    };

    var combobox = function(input) {
        var idx = -1,
            container = d3.select(document.body)
                .selectAll('div.combobox')
                .filter(function(d) { return d === input.node(); }),
            shown = !container.empty();

        input
            .classed('combobox-input', true)
            .on('focus.typeahead', focus)
            .on('blur.typeahead', blur)
            .on('keydown.typeahead', keydown)
            .on('keyup.typeahead', keyup)
            .on('input.typeahead', change)
            .each(function() {
                var parent = this.parentNode,
                    sibling = this.nextSibling;

                var carat = d3.select(parent).selectAll('.combobox-carat')
                    .filter(function(d) { return d === input.node(); })
                    .data([input.node()]);

                carat.enter().insert('div', function() { return sibling; })
                    .attr('class', 'combobox-carat');

                carat
                    .on('mousedown', function () {
                        // prevent the form element from blurring. it blurs
                        // on mousedown
                        d3.event.stopPropagation();
                        d3.event.preventDefault();
                        input.node().focus();
                    });
            });

        function focus() {
            fetch(render);
        }

        function blur() {
            window.setTimeout(hide, 150);
        }

        function show() {
            if (!shown) {
                container = d3.select(document.body)
                    .insert('div', ':first-child')
                    .datum(input.node())
                    .attr('class', 'combobox')
                    .style({
                        position: 'absolute',
                        display: 'block',
                        left: '0px'
                    });

                d3.select(document.body)
                    .on('scroll.combobox', render, true);

                shown = true;
            }
        }

        function hide() {
            if (shown) {
                idx = -1;
                container.remove();

                d3.select(document.body)
                    .on('scroll.combobox', null);

                shown = false;
            }
        }

        function keydown() {
           switch (d3.event.keyCode) {
               // backspace, delete
               case 8:
               case 46:
                   console.log('keydown backspace');
                   input.on('input.typeahead', function() {
                       idx = -1;
                       render();
                       input.on('input.typeahead', change);
                   });
                   break;
               // tab
               case 9:
                   container.selectAll('a.selected').trigger('click');
                   break;
               // return
               case 13:
                   d3.event.preventDefault();
                   break;
               // up arrow
               case 38:
                   prev();
                   d3.event.preventDefault();
                   break;
               // down arrow
               case 40:
                   next();
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
                // return
                case 13:
                    container.selectAll('a.selected').trigger('click');
                    break;
            }
        }

        function change() {
            console.log('input, value=' + input.property('value'));
            fetch(function() {
                autocomplete();
                render();
            });
        }

        function next() {
            idx = Math.min(idx + 1, suggestions.length - 1);
            input.property('value', suggestions[idx].value);
            console.log('next ' + idx + ' ' + suggestions[idx].value)
            render();
        }

        function prev() {
            idx = Math.max(idx - 1, 0);
            input.property('value', suggestions[idx].value);
            console.log('prev ' + idx + ' ' + suggestions[idx].value)
            render();
        }

        function value() {
            var value = input.property('value'),
                start = input.property('selectionStart'),
                end = input.property('selectionEnd');

            if (start && end) {
                value = value.substring(0, start);
            }

            return value;
        }

        function fetch(cb) {
            fetcher.call(input, value(), function(_) {
                suggestions = _;
                cb();
            });
        }

        function autocomplete() {
            var v = value();

            if (!v) {
                idx = -1;
                return;
            }

            for (var i = 0; i < suggestions.length; i++) {
                if (suggestions[i].value.toLowerCase().indexOf(v.toLowerCase()) === 0) {
                    var completion = v + suggestions[i].value.substr(v.length);
                    idx = i;
                    input.property('value', completion);
                    input.node().setSelectionRange(v.length, completion.length);
                    console.log('autocompleted ' + v + '[' + suggestions[i].value.substr(v.length) + '] ' + v.length + ',' + completion.length);
                    return;
                }
            }
        }

        function render() {
            if (suggestions.length && document.activeElement === input.node()) {
                show();
            } else {
                hide();
                return;
            }

            var options = container
                .selectAll('a.combobox-option')
                .data(suggestions, function(d) { return d.value; });

            options.enter().append('a')
                .attr('class', 'combobox-option')
                .text(function(d) { return d.value; });

            options
                .attr('title', function(d) { return d.title; })
                .classed('selected', function(d, i) { return i == idx; })
                .on('mouseover', select)
                .on('click', accept)
                .order();

            options.exit()
                .remove();

            var rect = input.node().getBoundingClientRect();

            container.style({
                'left': rect.left + 'px',
                'width': rect.width + 'px',
                'top': rect.height + rect.top + 'px'
            });

            if (idx >= 0) {
                var height = container.node().offsetHeight,
                    top = container.selectAll('a.selected').node().offsetTop,
                    selectedHeight = container.selectAll('a.selected').node().offsetHeight;

                if ((top + selectedHeight) < height) {
                    container.node().scrollTop = 0;
                } else {
                    container.node().scrollTop = top;
                }
            }
        }

        function select(d, i) {
            idx = i;
            console.log('selected ' + idx);
            render();
        }

        function accept(d) {
            if (!shown) return;
            input
                .property('value', d.value)
                .trigger('change');
            event.accept(d);
            hide();
        }
    };

    combobox.fetcher = function(_) {
        if (!arguments.length) return fetcher;
        fetcher = _;
        return combobox;
    };

    combobox.data = function(_) {
        if (!arguments.length) return data;
        data = _;
        return combobox;
    };

    return d3.rebind(combobox, event, 'on');
};
