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
            .attr('placeholder', field.placeholder || '')
            .on('blur', change)
            .on('change', change)
            .call(iD.behavior.accept().on('accept', event.close));

            if (form.type == 'number') {
                var numbercontrols = selection.append('div')
                    .attr('class','spin-control');

                numbercontrols.append('button').attr('class','ascend');
                numbercontrols.append('button').attr('class','descend');

            };
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
