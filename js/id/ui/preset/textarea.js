iD.ui.preset.textarea = function(field) {

    var event = d3.dispatch('change', 'close'),
        input;

    function i(selection) {
        input = selection.append('textarea')
            .attr('id', 'preset-input-' + field.id)
            .attr('placeholder', field.placeholder || '')
            .attr('maxlength', 255)
            .on('blur', change)
            .on('change', change)
            .call(iD.behavior.accept().on('accept', event.close));
    }

    function change() {
        var t = {};
        t[field.key] = input.text();
        event.change(t);
    }

    i.tags = function(tags) {
        input.text(tags[field.key] || '');
    };

    return d3.rebind(i, event, 'on');
};
