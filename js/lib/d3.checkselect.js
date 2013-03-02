d3.checkselect = function() {
    
    var event = d3.dispatch('change'),
        values = ['', 'yes', 'no'],
        value = '',
        input, box, text, label;

    var check = function(selection) {

        selection.classed('checkselect', 'true');

        input = selection.select('input');
        input.style('display', 'none');

        label = selection.append('label');

        box = label.append('input')
            .attr('type', 'checkbox')
            .datum(undefined);

        text = label.append('span')
            .attr('class', 'value');

        box.on('click', function() {
            input.property('value', values[(values.indexOf(value) + 1) % 3]);
            update();
            event.change();
            d3.event.stopPropagation();
        });

        update();
    };

    function update() {
        value = input.property('value');

        box.property('indeterminate', !value);
        box.property('checked', value === 'yes');
        text.text(value || 'unknown');
        label.classed('set', !!value);
    }

    check.update = update;

    return d3.rebind(check, event, 'on');
};
