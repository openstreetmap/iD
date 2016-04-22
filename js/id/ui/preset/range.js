iD.ui.preset.range = function (field) {

    var dispatch = d3.dispatch('change'),
        inputs;

    function i(selection) {
        inputs = selection.selectAll('input')
            .data([0, 1]);

        inputs.enter().append('input')
            .attr('type', 'number')
            .attr('id', function (d) { return 'preset-input-' + field.id + '-' + d; })
            .style('width', '50%')
            .style('border-radius', function (d) { return d === 0 ? '0 0 0 4px' : '0 0 4px 0'; })
            .attr('placeholder', function (d) { return field.t('placeholder-' + d); })

        inputs
            .on('input', change(true))
            .on('blur', change())
            .on('change', change());
    }

    function change(onInput) {
        return function (d) {
            var t = {};
            t[field.keys[d]] = this.value || undefined;
            dispatch.change(t, onInput);
        };
    }

    i.tags = function (tags) {
        inputs.value(function(d){ return tags[field.keys[d]] || ''; });
    };

    i.focus = function () {
        inputs.node().focus();
    };

    return d3.rebind(i, dispatch, 'on');
};
