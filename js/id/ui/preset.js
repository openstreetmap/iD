iD.ui.preset = function() {
    var event = d3.dispatch('change'),
        sections,
        exttags,
        preset;

    function getTags() {
        var tags = {};
        sections.selectAll('input,select')
            .each(function(d) {
                tags[d.key] = this.value;
            });
        return tags;
    }

    function setTags(tags) {
        if (!sections) return;
        sections.selectAll('input,select')
            .each(function(d) {
                if (tags[d.key]) {
                    this.value = tags[d.key];
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
        var i;
        switch (d.type) {
            case 'text':
                i = this.append('input')
                    .attr('type', 'text')
                    .attr('id', 'input-' + d.key)
                    .attr('placeholder', d['default'] || '');
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
                    .attr('id', 'input-' + d.key)
                    .each(function() {
                        if (d['default']) {
                            this.attr('checked', 'checked');
                        }
                    });
                break;
            case 'select':
                i = this.append('select');
                var options = d.values.slice();
                options.unshift('');
                i.selectAll('option')
                    .data(options)
                    .enter()
                    .append('option')
                    .text(String);
                break;
        }
        if (i) {
            i.on('change', key);
        }
    }

    function presets(selection) {
        selection.html('');
        sections = selection.selectAll('div.preset-section')
            .data(preset.main)
            .enter()
            .append('div')
            .attr('class', 'preset-section cf');
        sections.each(function(d) {
            var s = d3.select(this);
            var wrap = s.append('div')
                .attr('class', 'preset-section-input cf');
           wrap.append('div')
                .attr('class', 'col4 preset-label')
                .append('label')
                .attr('for', 'input-' + d.key)
                .text(d.text);
            input.call(wrap.append('div')
                .attr('class', 'col8 preset-input'), d);
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

    return d3.rebind(presets, event, 'on');
};
