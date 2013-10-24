iD.ui.preset.localized = function(field) {

    var event = d3.dispatch('change'),
        wikipedia = iD.wikipedia(),
        input, localizedInputs, wikiTitles;

    function i(selection) {
        input = selection.selectAll('.localized-main')
            .data([0]);

        input.enter().append('input')
            .attr('type', 'text')
            .attr('id', 'preset-input-' + field.id)
            .attr('class', 'localized-main')
            .attr('placeholder', field.placeholder());

        input
            .on('blur', change)
            .on('change', change);

        var translateButton = selection.selectAll('.localized-add')
            .data([0]);

        translateButton.enter().append('button')
            .attr('class', 'button-input-action localized-add minor')
            .call(bootstrap.tooltip()
                .title(t('translate.translate'))
                .placement('left'))
            .append('span')
            .attr('class', 'icon plus');

        translateButton
            .on('click', addBlank);

        localizedInputs = selection.selectAll('.localized-wrap')
            .data([0]);

        localizedInputs.enter().append('div')
            .attr('class', 'localized-wrap');
    }

    function addBlank() {
        d3.event.preventDefault();
        var data = localizedInputs.selectAll('div.entry').data();
        data.push({ lang: '', value: '' });
        localizedInputs.call(render, data);
    }

    function change() {
        var t = {};
        t[field.key] = d3.select(this).value() || undefined;
        event.change(t);
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
        event.change(t);
    }

    function changeValue(d) {
        if (!d.lang) return;
        var t = {};
        t[key(d.lang)] = d3.select(this).value() || undefined;
        event.change(t);
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
                        event.change(t);
                        d3.select(this.parentNode.parentNode)
                            .style('top','0')
                            .style('max-height','240px')
                            .transition()
                            .style('opacity', '0')
                            .style('max-height','0px')
                            .remove();
                    })
                    .append('span').attr('class', 'icon delete');

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

        var postfixed = [];
        for (var i in tags) {
            var m = i.match(new RegExp(field.key + ':([a-zA-Z_-]+)$'));
            if (m && m[1]) {
                postfixed.push({ lang: m[1], value: tags[i]});
            }
        }

        localizedInputs.call(render, postfixed.reverse());
    };

    i.focus = function() {
        input.node().focus();
    };

    return d3.rebind(i, event, 'on');
};
