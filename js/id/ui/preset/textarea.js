iD.ui.preset.textarea = function(form) {

    var event = d3.dispatch('change', 'close'),
        input;

    function i(selection) {
        input = selection.append('textarea')
            .attr('placeholder', form.placeholder || '')
            .attr('maxlength', 255)
            .on('blur', change)
            .on('change', change)
            .call(iD.behavior.accept().on('accept', event.close));
    }

    function change() {
        var t = {};
        t[form.key] = input.text();
        event.change(t);
    }

    i.tags = function(tags) {
        input.text(tags[form.key] || '');
    };

    return d3.rebind(i, event, 'on');
};
