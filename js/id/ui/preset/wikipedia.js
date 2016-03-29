iD.ui.preset.wikipedia = function(field, context) {
    var dispatch = d3.dispatch('change'),
        wikipedia = iD.services.wikipedia(),
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
            .call(iD.svg.Icon('#icon-out-link', 'inline'));
    }

    function language() {
        var value = lang.value().toLowerCase();
        var locale = iD.detect().locale.toLowerCase();
        var localeLanguage;
        return _.find(iD.data.wikipedia, function(d) {
            if (d[2] === locale) localeLanguage = d;
            return d[0].toLowerCase() === value ||
                d[1].toLowerCase() === value ||
                d[2] === value;
        }) || localeLanguage || ['English', 'English', 'en'];
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
        dispatch.change(t);
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
            link.attr('href', 'https://' + m[1] + '.wikipedia.org/wiki/' +
                      m[2].replace(/ /g, '_') + (anchor ? ('#' + anchor) : ''));

        // unrecognized value format
        } else {
            title.value(value);
            link.attr('href', 'https://en.wikipedia.org/wiki/Special:Search?search=' + value);
        }
    };

    i.entity = function(_) {
        entity = _;
    };

    i.focus = function() {
        title.node().focus();
    };

    return d3.rebind(i, dispatch, 'on');
};
