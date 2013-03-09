iD.ui.preset.input = function() {

    var event = d3.dispatch('change', 'close'),
        type,
        input;

    function i(selection) {
        input = selection.append('input')
            .attr('type', type)
            .on('blur', change)
            .on('change', change)
            .call(iD.behavior.accept().on('accept', event.close));
    }

    function change() {
        event.change(input.property('value'));
    }

    i.type = function(_) {
        type = _;
        return i;
    };

    i.value = function(value) {
        input.property('value', value || '');
    };

    return d3.rebind(i, event, 'on');
};
