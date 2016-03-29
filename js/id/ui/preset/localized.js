iD.ui.preset.localized = function(field, context) {
    var dispatch = d3.dispatch('change', 'input'),
        wikipedia = iD.services.wikipedia(),
        input, localizedInputs, wikiTitles,
        entity;

    function i(selection) {
        input = selection.selectAll('.localized-main')
            .data([0]);

        input.enter().append('input')
            .attr('type', 'text')
            .attr('id', 'preset-input-' + field.id)
            .attr('class', 'localized-main')
            .attr('placeholder', field.placeholder());

        if (field.id === 'name') {
            var preset = context.presets().match(entity, context.graph());
            input.call(d3.combobox().fetcher(
                iD.util.SuggestNames(preset, iD.data.suggestions)
            ));
        }

        input
            .on('input', change(true))
            .on('blur', change())
            .on('change', change());

        var translateButton = selection.selectAll('.localized-add')
            .data([0]);

        translateButton.enter()
            .append('button')
            .attr('class', 'button-input-action localized-add minor')
            .call(iD.svg.Icon('#icon-plus'))
            .call(bootstrap.tooltip()
                .title(t('translate.translate'))
                .placement('left'));

        translateButton
            .on('click', addNew);

        localizedInputs = selection.selectAll('.localized-wrap')
            .data([0]);

        localizedInputs.enter().append('div')
            .attr('class', 'localized-wrap');
    }

    function addNew() {
        d3.event.preventDefault();
        var data = localizedInputs.selectAll('div.entry').data();
        var defaultLang = iD.detect().locale.toLowerCase().split('-')[0];
        var langExists = _.find(data, function(datum) { return datum.lang === defaultLang;});
        var isLangEn = defaultLang.indexOf('en') > -1;
        if (isLangEn || langExists) {
          defaultLang = '';
        }
        data.push({ lang: defaultLang, value: '' });
        localizedInputs.call(render, data);
    }

    function change(onInput) {
        return function() {
            var t = {};
            t[field.key] = d3.select(this).value() || undefined;
            dispatch.change(t, onInput);
        };
    }

    function key(lang) { return field.key + ':' + lang; }

    function changeLang(d) {
        var lang = d3.select(this).value(),
            t = {},
            language = _.find(iD.data.wikipedia, function(d) {
                return d[0].toLowerCase() === lang.toLowerCase() ||
                    d[1].toLowerCase() === lang.toLowerCase();
            });

        if (language) lang = language[2];

        if (d.lang && d.lang !== lang) {
            t[key(d.lang)] = undefined;
        }

        var value = d3.select(this.parentNode)
            .selectAll('.localized-value')
            .value();

        if (lang && value) {
            t[key(lang)] = value;
        } else if (lang && wikiTitles && wikiTitles[d.lang]) {
            t[key(lang)] = wikiTitles[d.lang];
        }

        d.lang = lang;
        dispatch.change(t);
    }

    function changeValue(d) {
        if (!d.lang) return;
        var t = {};
        t[key(d.lang)] = d3.select(this).value() || undefined;
        dispatch.change(t);
    }

    function fetcher(value, cb) {
        var v = value.toLowerCase();

        cb(iD.data.wikipedia.filter(function(d) {
            return d[0].toLowerCase().indexOf(v) >= 0 ||
            d[1].toLowerCase().indexOf(v) >= 0 ||
            d[2].toLowerCase().indexOf(v) >= 0;
        }).map(function(d) {
            return { value: d[1] };
        }));
    }

    function render(selection, data) {
        var wraps = selection.selectAll('div.entry').
            data(data, function(d) { return d.lang; });

        var innerWrap = wraps.enter()
            .insert('div', ':first-child');

        innerWrap.attr('class', 'entry')
            .each(function() {
                var wrap = d3.select(this);
                var langcombo = d3.combobox().fetcher(fetcher);

                var label = wrap.append('label')
                    .attr('class','form-label')
                    .text(t('translate.localized_translation_label'))
                    .attr('for','localized-lang');

                label.append('button')
                    .attr('class', 'minor remove')
                    .on('click', function(d){
                        d3.event.preventDefault();
                        var t = {};
                        t[key(d.lang)] = undefined;
                        dispatch.change(t);
                        d3.select(this.parentNode.parentNode)
                            .style('top','0')
                            .style('max-height','240px')
                            .transition()
                            .style('opacity', '0')
                            .style('max-height','0px')
                            .remove();
                    })
                    .call(iD.svg.Icon('#operation-delete'));

                wrap.append('input')
                    .attr('class', 'localized-lang')
                    .attr('type', 'text')
                    .attr('placeholder',t('translate.localized_translation_language'))
                    .on('blur', changeLang)
                    .on('change', changeLang)
                    .call(langcombo);

                wrap.append('input')
                    .on('blur', changeValue)
                    .on('change', changeValue)
                    .attr('type', 'text')
                    .attr('placeholder', t('translate.localized_translation_name'))
                    .attr('class', 'localized-value');
            });

        innerWrap
            .style('margin-top', '0px')
            .style('max-height', '0px')
            .style('opacity', '0')
            .transition()
            .duration(200)
            .style('margin-top', '10px')
            .style('max-height', '240px')
            .style('opacity', '1')
            .each('end', function() {
                d3.select(this)
                    .style('max-height', '')
                    .style('overflow', 'visible');
            });

        wraps.exit()
            .transition()
            .duration(200)
            .style('max-height','0px')
            .style('opacity', '0')
            .style('top','-10px')
            .remove();

        var entry = selection.selectAll('.entry');

        entry.select('.localized-lang')
            .value(function(d) {
                var lang = _.find(iD.data.wikipedia, function(lang) { return lang[2] === d.lang; });
                return lang ? lang[1] : d.lang;
            });

        entry.select('.localized-value')
            .value(function(d) { return d.value; });
    }

    i.tags = function(tags) {
        // Fetch translations from wikipedia
        if (tags.wikipedia && !wikiTitles) {
            wikiTitles = {};
            var wm = tags.wikipedia.match(/([^:]+):(.+)/);
            if (wm && wm[0] && wm[1]) {
                wikipedia.translations(wm[1], wm[2], function(d) {
                    wikiTitles = d;
                });
            }
        }

        input.value(tags[field.key] || '');

        var postfixed = [], k, m;
        for (k in tags) {
            m = k.match(/^(.*):([a-zA-Z_-]+)$/);
            if (m && m[1] === field.key && m[2]) {
                postfixed.push({ lang: m[2], value: tags[k] });
            }
        }

        localizedInputs.call(render, postfixed.reverse());
    };

    i.focus = function() {
        input.node().focus();
    };

    i.entity = function(_) {
        entity = _;
    };

    return d3.rebind(i, dispatch, 'on');
};
