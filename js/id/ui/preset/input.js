iD.ui.preset.text =
iD.ui.preset.number =
iD.ui.preset.tel =
iD.ui.preset.email =
iD.ui.preset.url = function(field) {

    var event = d3.dispatch('change'),
        input;

    function i(selection) {
        input = selection.selectAll('input')
            .data([0]);

        input.enter().append('input')
            .attr('type', field.type)
            .attr('id', 'preset-input-' + field.id)
            .attr('placeholder', field.placeholder || '');

        input
            .on('blur', change)
            .on('change', change);

        function pm(elem, x) {
            var num = elem.value ?
                parseInt(elem.value, 10) : 0;
            if (!isNaN(num)) elem.value = num + x;
            change();
        }

        if (field.type == 'number') {
            input.attr('type', 'text');

            var spinControl = selection.selectAll('.spin-control')
                .data([0]);

            var enter = spinControl.enter().append('div')
                .attr('class', 'spin-control');

            enter.append('button')
                .datum(1)
                .attr('class', 'increment');

            enter.append('button')
                .datum(-1)
                .attr('class', 'decrement');

            spinControl.selectAll('button')
                .on('click', function(d) {
                    pm(input.node(), d);
                });
        }
    }

    function change() {
        var t = {};
        t[field.key] = input.property('value');
        event.change(t);
    }

    i.tags = function(tags) {
        input.property('value', tags[field.key] || '');
    };

    i.focus = function() {
        input.node().focus();
    };

    return d3.rebind(i, event, 'on');
};
