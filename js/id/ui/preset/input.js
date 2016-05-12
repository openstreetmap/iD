iD.ui.preset.text =
iD.ui.preset.number =
iD.ui.preset.tel =
iD.ui.preset.email =
iD.ui.preset.url = function(field, context) {

    var dispatch = d3.dispatch('change'),
        input,
        entity;

    function i(selection) {
        var fieldId = 'preset-input-' + field.id;

        input = selection.selectAll('input')
            .data([0]);

        input.enter().append('input')
            .attr('type', field.type)
            .attr('id', fieldId)
            .attr('placeholder', field.placeholder() || t('inspector.unknown'));

        input
            .on('input', change(true))
            .on('blur', change())
            .on('change', change());

        if (field.type === 'tel') {
            var center = entity.extent(context.graph()).center();
            iD.services.nominatim().countryCode(center, function (err, countryCode) {
                if (err || !iD.data.phoneFormats[countryCode]) return;
                selection.selectAll('#' + fieldId)
                    .attr('placeholder', iD.data.phoneFormats[countryCode]);
            });

        } else if (field.type === 'number') {
            input.attr('type', 'text');

            var spinControl = selection.selectAll('.spin-control')
                .data([0]);

            var enter = spinControl.enter().append('div')
                .attr('class', 'spin-control');

            enter.append('button')
                .datum(1)
                .attr('class', 'increment')
                .attr('tabindex', -1);

            enter.append('button')
                .datum(-1)
                .attr('class', 'decrement')
                .attr('tabindex', -1);

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

    i.entity = function(_) {
        if (!arguments.length) return entity;
        entity = _;
        return i;
    };

    i.tags = function(tags) {
        input.value(tags[field.key] || '');
    };

    i.focus = function() {
        var node = input.node();
        if (node) node.focus();
    };

    return d3.rebind(i, dispatch, 'on');
};
