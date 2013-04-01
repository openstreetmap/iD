iD.ui.preset.wikipedia = function(field, context) {

    var event = d3.dispatch('change', 'close'),
        wikipedia = iD.wikipedia(),
        language = iD.data.wikipedia[0],
        link, entity, lang, input;

    function i(selection) {

        var langcombo = d3.combobox()
            .fetcher(function(value, __, cb) {
                var v = value.toLowerCase();

                cb(iD.data.wikipedia.filter(function(d) {
                    return d[0].toLowerCase().indexOf(v) >= 0 ||
                        d[1].toLowerCase().indexOf(v) >= 0 ||
                        d[2].toLowerCase().indexOf(v) >= 0;
                }).map(function(d) {
                    return { value: d[1] };
                }));
            });

        var titlecombo = d3.combobox()
            .fetcher(function(value, __, cb) {

                if (!value) value = context.entity(entity.id).tags.name || '';
                var searchfn = value.length > 7 ? wikipedia.search : wikipedia.suggestions;

                searchfn(language && language[2], value, function(query, data) {
                    cb(data.map(function(d) {
                        return { value: d };
                    }));
                });
            });

        lang = selection.append('input')
            .attr('type', 'text')
            .attr('class', 'wiki-lang')
            .on('blur', changeLang)
            .on('change', changeLang)
            .call(langcombo);

        title = selection.append('input')
            .attr('type', 'text')
            .attr('class', 'wiki-title')
            .attr('id', 'preset-input-' + field.id)
            .on('blur', change)
            .on('change', change)
            .call(titlecombo);

        link = selection.append('a')
            .attr('class', 'wiki-link')
            .attr('target', '_blank')
            .text('→');
    }

    function changeLang() {
        var value = lang.property('value').toLowerCase();
        console.log(value);
        language = _.find(iD.data.wikipedia, function(d) {
            return d[0].toLowerCase() === value ||
                d[1].toLowerCase() === value ||
                d[2].toLowerCase() === value;
        }) || iD.data.wikipedia[0];

        if (value !== language[0]) {
            lang.property('value', language[1]);
        }

        change();
    }

    function change() {
        var t = {};
        var value = title.property('value');
        t[field.key] = value ? language[2] + ':' + value : '';
        event.change(t);
        link.attr('href', 'http://' + language[2] + '.wikipedia.org/wiki/' + (value || ''));
    }

    i.tags = function(tags) {
        var m = tags[field.key] ? tags[field.key].match(/([^:]+):(.+)/) : null;

        // value in correct format
        if (m && m[1] && m[2]) {
            language = _.find(iD.data.wikipedia, function(d) {
                return m[1] === d[2];
            });

            if (language) lang.property('value', language[1]);
            else lang.property('value', m[1]);

            title.property('value', m[2]);
            link.attr('href', 'http://' + m[1] + '.wikipedia.org/wiki/' + m[2]);

        // unrecognized value format
        } else {
            lang.property('value', 'English');
            title.property('value', tags[field.key] || '');
            language = iD.data.wikipedia[0];
            link.attr('href', 'http://en.wikipedia.org/wiki/Special:Search?search=' + tags[field.key]);
        }
    };

    i.entity = function(_) {
        entity = _;
    };

    i.focus = function() {
        title.node().focus();
    };

    return d3.rebind(i, event, 'on');
};
