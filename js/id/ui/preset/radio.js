iD.ui.preset.radio = function(form) {

    var event = d3.dispatch('change', 'close'),
        buttons;

    function radio(selection) {
        selection.classed('preset-radio', true);

        var buttonwrap = selection.append('div').attr('class','radio-wrap');

        buttons = buttonwrap.selectAll('button')
            .data(form.options)
            .enter()
            .append('button')
                .text(function(d) { return form.t('options.' + d, {default: d}); })
                .on('click', function() {
                    buttons.classed('active', false);
                    d3.select(this).classed('active', true);
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
        buttons.each(function(d) {
            t[d] = d3.select(this).classed('active') ? 'yes' : '';
        });
        event.change(t);
    }

    radio.tags = function(tags) {
        buttons.classed('active', function(d) {
            return tags[d] && tags[d] !== 'no';
        });
    };

    return d3.rebind(radio, event, 'on');
};
