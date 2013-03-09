iD.ui.preset.combo = function() {

    var event = d3.dispatch('change', 'close'),
        combobox,
        options,
        wrap,
        input;

    function combo(selection) {

        wrap = this.append('span').attr('class', 'input-wrap-position');

        input = wrap.append('input')
            .attr('type', 'text')
            .on('change', change)
            .on('blur', change);

        combobox = d3.combobox();
        wrap.call(combobox);

        if (options) combo.options(options);
    }

    function change() {
        event.change(input.property('value').replace(' ', '_'));
    }

    combo.options = function(o) {
        options = o;
        if (combobox) {
            combobox.data(options.map(function(d) {
                var o = {};
                o.title = o.value = d.replace('_', ' ');
                return o;
            }));

            input.attr('placeholder', function() {
                if (!options || options.length < 3) return '';
                return options.slice(0, 3).join(', ') + '...';
            });
        }
    };

    combo.value = function(v) {
        input.property('value', v || '');
    };

    return d3.rebind(combo, event, 'on');
};
