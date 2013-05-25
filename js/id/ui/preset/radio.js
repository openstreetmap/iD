iD.ui.preset.radio = function(field) {

    var event = d3.dispatch('change'),
        buttons;

    function radio(selection) {
        selection.classed('preset-radio', true);

        var wrap = selection.selectAll('.preset-input-wrap')
            .data([0]);

        wrap.enter().append('div')
            .attr('class', 'preset-input-wrap toggle-list radio-wrap');

        buttons = wrap.selectAll('button')
            .data(field.options || field.keys);

        buttons.enter().append('button')
            .text(function(d) { return field.t('options.' + d, { 'default': d }); });

        buttons
            .on('click', function(d) {
                buttons.classed('active', function(e) { return d === e; });
                change();
            });

        var remove = wrap.selectAll('button.remove')
            .data([0]);

        remove.enter().append('button')
            .attr('class', 'remove')
            .text(t('inspector.remove'))
            .append('span')
            .attr('class', 'icon remove');

        remove
            .on('click', function() {
                buttons.classed('active', false);
                change();
            });
    }

    function change() {
        var t = {};
        if (field.key) t[field.key] = undefined;
        buttons.each(function(d) {
            var active = d3.select(this).classed('active');
            if (field.key) {
                if (active) t[field.key] = d;
            } else {
                t[d] = active ? 'yes' : undefined;
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

    radio.focus = function() {
        buttons.node().focus();
    };

    return d3.rebind(radio, event, 'on');
};
