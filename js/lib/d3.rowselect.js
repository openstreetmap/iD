d3.rowselect = function() {

    var input, data, wrap,
        event = d3.dispatch('change');

    var select = function(selection) {

        input = selection.select('input')
            .style('display', 'none');
        
        wrap = selection.append('div')
            .attr('class', 'rowselect');

        var labels = wrap.selectAll('div')
            .data(data)
            .enter()
                .append('div')
                .style('display', 'inline-block')
                .style('width', ~~(100 / data.length) + '%')
                .attr('class', 'item')
                .append('label')
                    .on('click', function() {
                        var checkbox = d3.select(this).select('input'),
                            val = !!checkbox.property('checked');
                        wrap.selectAll('input').property('checked', false);
                        checkbox.property('checked', val);
                        input.property('value', val ? checkbox.datum()  : '');

                        event.change();
                        d3.event.stopPropagation();
                    });

        var value = input.property('value');

        labels.append('div')
            .append('input')
                .attr('type', 'checkbox');

        labels.append('span').text(function(d) { return d; });

        input.on('change.select', update);

    };

    function update() {
        var value = input.property('value');

        wrap.selectAll('input')
            .property('checked', function(d) {
                return d === value;
            });
    }

    select.data = function(_) {
        if (!arguments.length) return data;
        data = _;
        return select;
    };

    select.update = update;

    return d3.rebind(select, event, 'on');
};
