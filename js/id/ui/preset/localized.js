iD.ui.preset.localized = function(field, context) {

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
            .attr('placeholder', field.placeholder || '');

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
        var data = localizedInputs.selectAll('div.entry').data();
        data.push({ lang: '', value: '' });
        localizedInputs.call(render, data);
    }

    function change() {
        var t = {};
        t[field.key] = d3.select(this).property('value') || undefined;
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

        var innerWrap = wraps.enter()
            .insert('div', ':first-child');

            innerWrap.attr('class', 'entry')
            .each(function(d) {
                var wrap = d3.select(this);
                var langcombo = d3.combobox().fetcher(fetcher);

                wrap.append('label')
                    .attr('class','form-label')
                    .text(t('translate.localized_translation_label'))
                    .attr('for','localized-lang');

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

                wrap.append('button')
                    .attr('class', 'minor button-input-action remove')
                    .on('click', function(d) {
                        var t = {};
                        t[key(d.lang)] = undefined;
                        event.change(t);
                        d3.select(this.parentNode)
                            .style('top','0')
                            .style('max-height','240px')
                            .style('overflow','hidden')
                            .transition()
                            .style('opacity', '0')
                            .style('max-height','0px')
                            .remove();
                    })
                    .append('span').attr('class', 'icon delete');

            });

        innerWrap.transition()
            .style('margin-top','0')
            .style('max-height', '0')
            .style('padding', '0')
            .style('opacity', '0')
            .style('border-width', '0')
            .transition()
            .duration(200)
            .style('margin-top','10px')
            .style('border-width', '1px')
            .style('padding', '10px')
            .style('max-height', '240px')
            .style('opacity', '1')
            .each('end', function(d) {
                d3.select(this).style('max-height', '');
                d3.select(this).style('overflow', 'visible');
            });;

        wraps.exit()
            .style('top','0')
            .style('overflow','hidden')
            .style('max-height','240px')
            .transition()
            .style('max-height','0')
            .style('opacity', '0')
            .style('top','-10px')
            .remove();

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
