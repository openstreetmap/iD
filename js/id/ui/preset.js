iD.ui.preset = function(context) {
    var event = d3.dispatch('change', 'setTags', 'close'),
        entity,
        tags,
        keys,
        preset,
        formwrap,
        formbuttonwrap;

    function input(d) {
        var i = iD.ui.preset[d.type](d, context)
            .on('close', event.close)
            .on('change', event.change);

        event.on('setTags.' + d.key || d.type, function(tags) {
            i.tags(_.clone(tags));
        });

        if (d.type === 'address') i.entity(entity);

        keys = keys.concat(d.key ? [d.key] : d.keys);

        d3.select(this).call(i);
    }

    function presets(selection) {

        selection.html('');
        keys = [];

        formwrap = selection.append('div');
        draw(formwrap, preset.form);

        var wrap = selection.append('div')
            .attr('class', 'col12 inspector-inner');

        formbuttonwrap = wrap.append('div')
            .attr('class', 'col9 preset-input');

        formbuttonwrap.selectAll('button')
            .data(preset.additional)
            .enter()
            .append('button')
                .attr('class', 'preset-add-form')
                .attr('title', function(d) { return d.label(); })
                .on('click', addForm)
                .append('span')
                    .attr('class', function(d) { return 'icon ' + d.icon; });

        function addForm(d) {
            draw(formwrap, [d]);
            d3.select(this).remove();
            if (!wrap.selectAll('button').node()) wrap.remove();
        }
    }

    function formKey(d) {
        return d.key || String(d.keys);
    }

    function draw(selection, form) {

        var sections = selection.selectAll('div.preset-section')
            .data(form, formKey)
            .enter()
            .append('div')
            .attr('class', 'preset-section fillL inspector-inner col12')

           sections.append('h4')
                .attr('for', function(d) { return 'input-' + d.key; })
                .text(function(d) { return d.label(); });

           sections.each(input);
    }

    presets.rendered = function() {
        return keys;
    };

    presets.preset = function(_) {
        if (!arguments.length) return preset;
        preset = _;
        return presets;
    };

    presets.change = function(t) {
        tags = t;

        function haveKey(k) { return k && !!tags[k]; }

        formbuttonwrap.selectAll('button').each(function(p) {
            if (haveKey(p.key) || _.any(p.keys, haveKey)) {
                draw(formwrap, [p]);
                d3.select(this).remove();
            }
        });

        context.presets().universal().forEach(function(p) {
            if (haveKey(p.key) || _.any(p.keys, haveKey)) {
                draw(formwrap, [p]);
            }
        });

        event.setTags(tags);
        return presets;
    };

    presets.entity = function(_) {
        if (!arguments.length) return entity;
        entity = _;
        return presets;
    };

    return d3.rebind(presets, event, 'on');
};
