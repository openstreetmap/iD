iD.ui.preset.text =
iD.ui.preset.number =
iD.ui.preset.tel =
iD.ui.preset.email =
iD.ui.preset.url = function(field) {

    var event = d3.dispatch('change', 'close'),
        input;

    function i(selection) {
        input = selection.append('input')
            .attr('type', field.type)
            .attr('id', 'preset-input-' + field.id)
            .attr('placeholder', field.placeholder || '')
            .on('blur', change)
            .on('change', change)
            .call(iD.behavior.accept().on('accept', event.close));

        function pm(elem, x) {
            var num = elem.value ?
                parseInt(elem.value, 10) : 0;
            if (!isNaN(num)) elem.value = num + x;
            change();
        }

        if (field.type == 'number') {
            var numbercontrols = selection.append('div')
                .attr('class', 'spin-control');

            numbercontrols
                .append('button')
                .attr('class', 'increment')
                .on('click', function() {
                    pm(input.node(), 1);
                });
            numbercontrols
                .append('button')
                .attr('class', 'decrement')
                .on('click', function() {
                    pm(input.node(), -1);
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

    return d3.rebind(i, event, 'on');
};
