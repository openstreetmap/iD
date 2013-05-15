iD.ui.preset.localized = function(field, context) {

    var event = d3.dispatch('change', 'close'),
        wikipedia = iD.wikipedia(),
        input, localizedInputs, wikiTitles;

    function i(selection) {

        input = selection.append('input')
            .attr('type', 'text')
            .attr('id', 'preset-input-' + field.id)
            .attr('class', 'localized-main')
            .attr('placeholder', field.placeholder || '')
            .on('blur', change)
            .on('change', change)
            .call(iD.behavior.accept().on('accept', event.close));

        var translateButton = selection.append('button')
            .attr('class', 'button-input-action localized-add minor')
            .on('click', addBlank);

        translateButton.append('span')
            .attr('class', 'icon plus');

        translateButton.call(bootstrap.tooltip()
            .title(t('translate'))
            .placement('top'));

        localizedInputs = selection.append('div')
            .attr('class', 'localized-wrap');

    }

    function addBlank() {
        var data = localizedInputs.selectAll('div.entry').data();
        data.push({ lang: '', value: '' });
        localizedInputs.call(render, data);
    }

    function change() {
        var t = {};
        t[field.key] = d3.select(this).property('value');
        event.change(t);
    }

    function key(lang) { return field.key + ':' + lang; }

    function changeLang(d) {
        var value = d3.select(this).property('value'),
            t = {},
            language = _.find(iD.data.wikipedia, function(d) {
                return d[0].toLowerCase() === value.toLowerCase() ||
                    d[1].toLowerCase() === value.toLowerCase();
            });

        if (language) value = language[2];

        t[key(d.lang)] = '';

        if (d.value) {
            t[key(value)] = d.value;
        } else if (wikiTitles && wikiTitles[d.lang]) {
            t[key(value)] = wikiTitles[d.lang];
        }

        event.change(t);

        d.lang = value;
    }

    function changeValue(d) {
        var t = {};
        t[key(d.lang)] = d3.select(this).property('value') || '';
        event.change(t);

    }

    function fetcher(value, __, cb) {
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

        wraps.enter().insert('div', ':first-child')
            .attr('class', 'entry')
            .each(function(d) {
                var wrap = d3.select(this);
                var langcombo = d3.combobox().fetcher(fetcher);

                wrap.append('label')
                    .attr('class','form-label')
                    .text(t('localized_translation_label'))
                    .attr('for','localized-lang');

                wrap.append('input')
                    .attr('class', 'localized-lang')
                    .attr('type', 'text')
                    .attr('placeholder','Choose language')
                    .on('blur', changeLang)
                    .on('change', changeLang)
                    .call(langcombo);

                wrap.append('input')
                    .on('blur', changeValue)
                    .on('change', changeValue)
                    .attr('type', 'text')
                    .attr('class', 'localized-value');

                wrap.append('button')
                    .attr('class', 'minor button-input-action localized-remove')
                    .on('click', function(d) {
                        var t = {};
                        t[key(d.lang)] = '';
                        event.change(t);
                        d3.select(this.parentNode).remove();
                    })
                    .append('span').attr('class', 'icon delete');

            });

        wraps.exit().remove();

        selection.selectAll('.entry').select('.localized-lang').property('value', function(d) {
            var lang = _.find(iD.data.wikipedia, function(lang) {
                return lang[2] === d.lang;
            });
            return lang ? lang[1] : d.lang;
        });

        selection.selectAll('.entry').select('.localized-value').property('value', function(d) {
            return d.value;
        });


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

        input.property('value', tags[field.key] || '');

        var postfixed = [];
        for (var i in tags) {
            var m = i.match(new RegExp(field.key + ':([a-z]+)'));
            if (m && m[1]) {
                postfixed.push({ lang: m[1], value: tags[i]});
            }
        }

        localizedInputs.call(render, postfixed.reverse());
    };

    i.focus = function() {
        title.node().focus();
    };

    return d3.rebind(i, event, 'on');
};
