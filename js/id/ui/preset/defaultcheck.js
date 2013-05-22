iD.ui.preset.defaultcheck = function(field) {
    var event = d3.dispatch('change'),
        input;

    function check(selection) {
        input = selection.selectAll('input')
            .data([0]);

        input.enter().append('input')
            .attr('type', 'checkbox')
            .attr('id', 'preset-input-' + field.id);

        input
            .on('change', function() {
                var t = {};
                t[field.key] = input.property('checked') ? field.value || 'yes' : undefined;
                event.change(t);
            });
    }

    check.tags = function(tags) {
        input.property('checked', !!tags[field.key] && tags[field.key] !== 'no');
    };

    check.focus = function() {
        input.node().focus();
    };

    return d3.rebind(check, event, 'on');
};
