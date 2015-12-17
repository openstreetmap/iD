iD.ui.preset.text =
iD.ui.preset.number =
iD.ui.preset.tel =
iD.ui.preset.email =
iD.ui.preset.url = function(field) {

    var dispatch = d3.dispatch('change'),
        input;

    function i(selection) {
        input = selection.selectAll('input')
            .data([0]);

        input.enter().append('input')
            .attr('type', field.type)
            .attr('id', 'preset-input-' + field.id)
            .attr('placeholder', field.placeholder() || t('inspector.unknown'));

        input
            .on('input', change(true))
            .on('blur', change())
            .on('change', change());

        if (field.type === 'number') {
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
                    d3.event.preventDefault();
                    var num = parseInt(input.node().value || 0, 10);
                    if (!isNaN(num)) input.node().value = num + d;
                    change()();
                });
        }
    }

    function change(onInput) {
        return function() {
            var t = {};
            t[field.key] = input.value() || undefined;
            dispatch.change(t, onInput);
        };
    }

    i.tags = function(tags) {
        input.value(tags[field.key] || '');
    };

    i.focus = function() {
        input.node().focus();
    };

    return d3.rebind(i, dispatch, 'on');
};
