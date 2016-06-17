export function textarea(field) {
    var dispatch = d3.dispatch('change'),
        input;

    function textarea(selection) {
        input = selection.selectAll('textarea')
            .data([0]);

        input.enter().append('textarea')
            .attr('id', 'preset-input-' + field.id)
            .attr('placeholder', field.placeholder() || t('inspector.unknown'))
            .attr('maxlength', 255);

        input
            .on('input', change(true))
            .on('blur', change())
            .on('change', change());
    }

    function change(onInput) {
        return function() {
            var t = {};
            t[field.key] = input.value() || undefined;
            dispatch.change(t, onInput);
        };
    }

    textarea.tags = function(tags) {
        input.value(tags[field.key] || '');
    };

    textarea.focus = function() {
        input.node().focus();
    };

    return d3.rebind(textarea, dispatch, 'on');
}
