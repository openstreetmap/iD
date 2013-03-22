iD.ui.preset.radio = function(field) {

    var event = d3.dispatch('change', 'close'),
        buttons;

    function radio(selection) {
        selection.classed('preset-radio', true);

        var buttonwrap = selection.append('div')
            .attr('class', 'preset-input-wrap radio-wrap');

        buttons = buttonwrap.selectAll('button')
            .data(field.keys || field.options)
            .enter()
            .append('button')
            .text(function(d) { return field.t('options.' + d, { 'default': d }); })
            .on('click', function(d) {
                buttons.classed('active', function(e) { return d === e; });
                change();
            });

        buttonwrap.append('button')
            .on('click', function() {
                buttons.classed('active', false);
                change();
            })
            .append('span')
                .attr('class', 'icon remove');
    }

    function change() {
        var t = {};
        if (field.key) t[field.key] = null;
        buttons.each(function(d) {
            var active = d3.select(this).classed('active');
            if (field.key) {
                if (active) t[field.key] = d;
            } else {
                t[d] = active ? 'yes' : '';
            }
        });
        event.change(t);
    }

    radio.tags = function(tags) {
        buttons.classed('active', function(d) {
            if (field.key) {
                return tags[field.key] === d;
            } else {
                return tags[d] && tags[d] !== 'no';
            }
        });
    };

    return d3.rebind(radio, event, 'on');
};
