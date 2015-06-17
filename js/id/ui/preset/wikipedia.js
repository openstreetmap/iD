iD.ui.preset.wikipedia = function(field, context) {

    var event = d3.dispatch('change'),
        wikipedia = iD.wikipedia(),
        link, entity, lang, title;

    function i(selection) {

        var langcombo = d3.combobox()
            .fetcher(function(value, cb) {
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
            .fetcher(function(value, cb) {

                if (!value) value = context.entity(entity.id).tags.name || '';
                var searchfn = value.length > 7 ? wikipedia.search : wikipedia.suggestions;

                searchfn(language()[2], value, function(query, data) {
                    cb(data.map(function(d) {
                        return { value: d };
                    }));
                });
            });

        lang = selection.selectAll('input.wiki-lang')
            .data([0]);

        lang.enter().append('input')
            .attr('type', 'text')
            .attr('class', 'wiki-lang')
            .value('English');

        lang
            .call(langcombo)
            .on('blur', changeLang)
            .on('change', changeLang);

        title = selection.selectAll('input.wiki-title')
            .data([0]);

        title.enter().append('input')
            .attr('type', 'text')
            .attr('class', 'wiki-title')
            .attr('id', 'preset-input-' + field.id);

        title
            .call(titlecombo)
            .on('blur', change)
            .on('change', change);

        link = selection.selectAll('a.wiki-link')
            .data([0]);

        link.enter().append('a')
            .attr('class', 'wiki-link button-input-action minor')
            .attr('target', '_blank')
            .append('span')
            .attr('class', 'icon out-link');
    }

    function language() {
        var value = lang.value().toLowerCase();
        return _.find(iD.data.wikipedia, function(d) {
            return d[0].toLowerCase() === value ||
                d[1].toLowerCase() === value ||
                d[2].toLowerCase() === value;
        }) || iD.data.wikipedia[0];
    }

    function changeLang() {
        lang.value(language()[1]);
        change();
    }

    function change() {
        var value = title.value(),
            m = value.match(/https?:\/\/([-a-z]+)\.wikipedia\.org\/(?:wiki|\1-[-a-z]+)\/([^#]+)(?:#(.+))?/),
            l = m && _.find(iD.data.wikipedia, function(d) { return m[1] === d[2]; }),
            anchor;

        if (l) {
            // Normalize title http://www.mediawiki.org/wiki/API:Query#Title_normalization
            value = decodeURIComponent(m[2]).replace(/_/g, ' ');
            if (m[3]) {
                try {
                    // Best-effort `anchordecode:` implementation
                    anchor = decodeURIComponent(m[3].replace(/\.([0-9A-F]{2})/g, '%$1'));
                } catch (e) {
                    anchor = decodeURIComponent(m[3]);
                }
                value += '#' + anchor.replace(/_/g, ' ');
            }
            value = value.slice(0, 1).toUpperCase() + value.slice(1);
            lang.value(l[1]);
            title.value(value);
        }

        var t = {};
        t[field.key] = value ? language()[2] + ':' + value : undefined;
        event.change(t);
    }

    i.tags = function(tags) {
        var value = tags[field.key] || '',
            m = value.match(/([^:]+):([^#]+)(?:#(.+))?/),
            l = m && _.find(iD.data.wikipedia, function(d) { return m[1] === d[2]; }),
            anchor = m && m[3];

        // value in correct format
        if (l) {
            lang.value(l[1]);
            title.value(m[2] + (anchor ? ('#' + anchor) : ''));
            if (anchor) {
                try {
                    // Best-effort `anchorencode:` implementation
                    anchor = encodeURIComponent(anchor.replace(/ /g, '_')).replace(/%/g, '.');
                } catch (e) {
                    anchor = anchor.replace(/ /g, '_');
                }
            }
            link.attr('href', 'http://' + m[1] + '.wikipedia.org/wiki/' +
                      m[2].replace(/ /g, '_') + (anchor ? ('#' + anchor) : ''));

        // unrecognized value format
        } else {
            title.value(value);
            link.attr('href', 'http://en.wikipedia.org/wiki/Special:Search?search=' + value);
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
