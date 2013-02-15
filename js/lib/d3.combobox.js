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
        var idx = -1,
            rect = selection.select('input')
                .node()
                .getBoundingClientRect();
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
            .insert('a', ':first-child')
            .attr('class', 'combobox-carat')
            .style({
                position: 'absolute',
                left: rect.width + 'px',
                top: '0px'
            })
            .on('mousedown', stop)
            .on('click', click);

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
            container.style('display', 'block');   
            shown = true;
        }

        function hide() {
            idx = -1;
            container.style('display', 'none');   
            shown = false;
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
               case 9:
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

        function update() {

            function render(data) {
                if (data.length) show();
                else hide();

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

            fetcher.apply(selection, [
                selection.select('input').property('value'),
                data, render]);
        }

        // select the choice given as d
        function select(d) {
            input
                .property('value', d.value)
                .trigger('change');
            event.accept(d);
            hide();
        }
        
        input
            .on('blur.typeahead', blur)
            .on('keydown.typeahead', keydown)
            .on('keyup.typeahead', keyup);
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
