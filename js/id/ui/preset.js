iD.ui.preset = function() {
    var event = d3.dispatch('change'),
        taginfo = iD.taginfo(),
        context,
        entity,
        type,
        hidden,
        sections,
        exttags,
        preset;

    function getTags() {
        var tags = _.clone(preset.match.tags);
        sections.selectAll('input,select')
            .each(function(d) {
                tags[d.key] = d.type === 'combo' || d.type === 'select' ?
                    this.value.replace(' ', '_') :
                    this.value;
            });
        return tags;
    }

    function setTags(tags) {
        if (!sections) return;
        sections.selectAll('input,select')
            .each(function(d) {
                this.value = tags[d.key] || '';
                if (d.type === 'combo' || d.type === 'select') {
                    this.value = this.value.replace('_', ' ');
                }
            });
    }

    function clean(o) {
        var out = {};
        for (var k in o) {
            if (o[k] !== '') out[k] = o[k];
        }
        return out;
    }

    function key() {
        var tags = clean(getTags());
        event.change(tags);
    }

    // generate form fields for a given field.
    function input(d) {
        var i, wrap;
        switch (d.type) {
            case 'text':
                i = this.append('input')
                    .attr('type', 'text')
                    .attr('id', 'input-' + d.key);
                break;
            case 'tel':
                i = this.append('input')
                    .attr('type', 'tel')
                    .attr('id', 'input-' + d.key)
                    .attr('placeholder', '1-555-555-5555');
                break;
            case 'email':
                i = this.append('input')
                    .attr('type', 'email')
                    .attr('id', 'input-' + d.key)
                    .attr('placeholder', 'email@domain.com');
                break;
            case 'url':
                i = this.append('input')
                    .attr('type', 'url')
                    .attr('id', 'input-' + d.key)
                    .attr('placeholder', 'http://example.com/');
                break;
            case 'check':
                i = this.append('input')
                    .attr('type', 'checkbox')
                    .attr('id', 'input-' + d.key);
                break;
            case 'select':
                wrap = this.append('span').attr('class', 'input-wrap-position'),
                i = wrap.append('input').attr('type', 'text');
                wrap.call(d3.combobox().data(d.options.map(function(d) {
                    var o = {};
                    o.title = o.value = d.replace('_', ' ');
                    return o;
                })));
                break;
            case 'combo':
                var combobox = d3.combobox();
                wrap = this.append('span').attr('class', 'input-wrap-position'),
                i = wrap.append('input').attr('type', 'text');
                wrap.call(combobox);
                taginfo.values({
                    key: d.key
                }, function(err, data) {
                    if (!err) combobox.data(data.map(function(d) {
                        d.title = d.value = d.value.replace('_', ' ');
                        return d;
                    }));
                });
                break;
        }
        if (i) {
            i.on('change', key);
            i.on('blur', key);
        }
    }

    function presets(selection) {
        selection.html('');
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

            // Single input element
            if (d.key) {
                input.call(wrap.append('div')
                    .attr('class', 'col9 preset-input'), d);

            // Multiple elements, eg, address
            } else {
                if (d.type === 'address') {
                    wrap.append('div')
                        .attr('class', 'col9 preset-input', d)
                        .call(iD.ui.preset.address()
                            .context(context)
                            .on('change', key)
                            .entity(entity));
                }
            }
        });
        if (exttags) setTags(exttags);
    }

    presets.preset = function(_) {
        if (!arguments.length) return preset;
        preset = _;
        return presets;
    };

    presets.change = function(_) {
        exttags = _;
        setTags(_);
        return presets;
    };

    presets.tags = function() {
        if (hidden || !preset || !sections) return {};
        return clean(getTags());
    };

    presets.context = function(_) {
        if (!arguments.length) return context;
        context = _;
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
