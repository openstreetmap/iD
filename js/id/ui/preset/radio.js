iD.ui.preset.radio = function(field) {

    var event = d3.dispatch('change'),
        labels, radios;

    function radio(selection) {
        selection.classed('preset-radio', true);

        var wrap = selection.selectAll('.preset-input-wrap')
            .data([0]);

        var buttonWrap = wrap.enter().append('div')
            .attr('class', 'preset-input-wrap toggle-list');

        labels = wrap.selectAll('label')
            .data(field.options || field.keys);

        var enter = labels.enter().append('label');

        enter.append('input')
            .attr('type', 'radio')
            .attr('name', field.id)
            .attr('value', function(d) { return field.t('options.' + d, { 'default': d }); })
            .attr('checked', false);

        enter.append('span')
            .text(function(d) { return field.t('options.' + d, { 'default': d }); });

        radios = labels.selectAll('input')
            .on('change', change);

        buttonWrap.append('span')
            .attr('class', 'placeholder')
            .text(field.placeholder());

        var remove = wrap.selectAll('label.remove')
            .data([0]);

        remove.enter().append('label')
            .attr('class', 'remove')
            .text(t('inspector.remove'))
            .append('span')
            .attr('class', 'icon remove');

        remove
            .on('click', function() {
                d3.event.preventDefault();
                radios.property('checked', false);
                change();
            });
    }

    function change() {
        var t = {};
        if (field.key) t[field.key] = undefined;
        radios.each(function(d) {
            var active = d3.select(this).property('checked');
            if (field.key) {
                if (active) t[field.key] = d;
            } else {
                t[d] = active ? 'yes' : undefined;
            }
        });
        event.change(t);
    }

    radio.tags = function(tags) {
        function checked(d) {
            if (field.key) {
                return tags[field.key] === d;
            } else {
                return !!(tags[d] && tags[d] !== 'no');
            }
        }

        labels.classed('active', checked);
        radios.property('checked', checked);
    };

    radio.focus = function() {
        radios.node().focus();
    };

    return d3.rebind(radio, event, 'on');
};
