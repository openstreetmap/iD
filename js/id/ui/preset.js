iD.ui.preset = function(context) {
    var event = d3.dispatch('change', 'setTags', 'close'),
        taginfo = iD.taginfo(),
        entity,
        type,
        hidden,
        sections,
        tags,
        keys,
        preset;

    // generate form fields for a given field.
    function input(d) {
        var i, wrap;
        switch (d.type) {
            case 'text':
                i = iD.ui.preset.input()
                    .type('text');
                break;
            case 'number':
                i = iD.ui.preset.input()
                    .type('number');
                break;
            case 'tel':
                i = iD.ui.preset.input()
                    .placeholder('1-555-555-5555')
                    .type('tel');
                break;
            case 'email':
                i = iD.ui.preset.input()
                    .placeholder('email@example.com')
                    .type('email');
                break;
            case 'url':
                i = iD.ui.preset.input()
                    .placeholder('http://example.com')
                    .type('url');
                break;
            case 'check':
                i = iD.ui.preset.check();
                break;
            case 'combo':
                i = iD.ui.preset.combo();
                if (d.options) {
                    i.options(d.options);
                } else {
                    taginfo.values({
                        key: d.key
                    }, function(err, data) {
                        if (!err) i.options(_.pluck(data, 'value'));
                    });
                }
                break;
            case 'address':
                i = iD.ui.preset.address(context)
                    .entity(entity);
                break;
        }
        if (i) {
            this.call(i);

            if (d.key) keys.push(d.key);
            else if (d.keys) keys = keys.concat(d.keys);

            i.on('change', function(value) {
                var tags = {};
                if (d.key) {
                    tags[d.key] = value;
                } else {
                    tags = value;
                }
                event.change(tags);
            });

            i.on('close', event.close);

            event.on('setTags.' + d.key || d.type, function(tags) {
                if (d.key) {
                    i.value(tags[d.key]);
                } else {
                    i.value(_.clone(tags));
                }
            });
        }
    }

    function presets(selection) {

        selection.html('');
        keys = [];

        sections = selection.selectAll('div.preset-section')
            .data(preset.form)
            .enter()
            .append('div')
            .attr('class', 'preset-section inspector-inner col12');

        sections.each(function(d) {
            var s = d3.select(this);
            var wrap = s.append('div')
                .attr('class', 'preset-section-input');

           wrap.append('div')
                .attr('class', 'col3 preset-label')
                .append('label')
                .attr('for', 'input-' + d.key)
                .text(d.title || d.key);

            input.call(wrap.append('div')
                .attr('class', 'col9 preset-input'), d);
        });
        if (tags) event.setTags(tags);
    }

    presets.rendered = function() {
        return keys;
    };

    presets.preset = function(_) {
        if (!arguments.length) return preset;
        preset = _;
        return presets;
    };

    presets.change = function(_) {
        tags = _;
        event.setTags(_);
        return presets;
    };

    presets.entity = function(_) {
        if (!arguments.length) return entity;
        entity = _;
        type = entity.type === 'node' ? entity.type : entity.geometry();
        return presets;
    };

    return d3.rebind(presets, event, 'on');
};
