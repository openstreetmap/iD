iD.ui.TagReference = function(tag) {
    var tagReference = {},
        taginfo = iD.taginfo(),
        button, body,
        loaded = false,
        showing = false;

    function findLocal(docs) {
        var locale = iD.detect().locale.toLowerCase(),
            localized;

        localized = _.find(docs, function(d) {
            return d.lang.toLowerCase() === locale;
        });
        if (localized) return localized;

        // try the non-regional version of a language, like
        // 'en' if the language is 'en-US'
        if (locale.indexOf('-') !== -1) {
            var first = locale.split('-')[0];
            localized = _.find(docs, function(d) {
                return d.lang.toLowerCase() === first;
            });
            if (localized) return localized;
        }

        // finally fall back to english
        return _.find(docs, function(d) {
            return d.lang.toLowerCase() === 'en';
        });
    }

    tagReference.button = function(selection) {
        button = selection.selectAll('.tag-reference-button')
            .data([0]);

        var enter = button.enter().append('button')
            .attr('tabindex', -1)
            .attr('class', 'tag-reference-button minor');

        enter.append('span')
            .attr('class', 'icon inspect');

        button.on('click', function () {
            d3.event.stopPropagation();
            d3.event.preventDefault();
            if (showing) {
                tagReference.hide();
            } else {
                tagReference.load();
            }
        });
    };

    tagReference.body = function(selection) {
        body = selection.selectAll('.tag-reference-body')
            .data([0]);

        body.enter().append('div')
            .attr('class', 'tag-reference-body cf')
            .style('max-height', '0')
            .style('opacity', '0');
    };

    tagReference.load = function() {
        if (loaded) {
            tagReference.show();
            return;
        }

        button.classed('tag-reference-loading', true);

        taginfo.docs(tag, function(err, docs) {
            if (!err && docs) {
                docs = findLocal(docs);
            }

            body.html('');

            if (!docs || !docs.description) {
                body.append('p').text(t('inspector.no_documentation_key'));
                tagReference.show();
                return;
            }

            if (docs.image && docs.image.thumb_url_prefix) {
                body
                    .append('img')
                    .attr('class', 'wiki-image')
                    .attr('src', docs.image.thumb_url_prefix + "100" + docs.image.thumb_url_suffix)
                    .on('load', function() { tagReference.show(); })
                    .on('error', function() { d3.select(this).remove(); tagReference.show(); });
            } else {
                tagReference.show();
            }

            body
                .append('p')
                .text(docs.description);

            var wikiLink = body
                .append('a')
                .attr('target', '_blank')
                .attr('href', 'http://wiki.openstreetmap.org/wiki/' + docs.title);

            wikiLink.append('span')
                .attr('class','icon icon-pre-text out-link');

            wikiLink.append('span')
                .text(t('inspector.reference'));
        });
    };

    tagReference.show = function() {
        loaded = true;

        button.classed('tag-reference-loading', false);

        body.transition()
            .duration(200)
            .style('max-height', '200px')
            .style('opacity', '1');

        showing = true;
    };

    tagReference.hide = function() {
        body.transition()
            .duration(200)
            .style('max-height', '0px')
            .style('opacity', '0');

        showing = false;
    };

    return tagReference;
};