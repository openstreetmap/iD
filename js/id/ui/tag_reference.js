iD.ui.TagReference = function(entity, tag) {
    var taginfo = iD.taginfo(), wrap, showing = false;

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

    function tagReference(selection) {
        wrap = selection.classed('tag-help', true);
    }

    tagReference.show = function() {

        var referenceBody = wrap.selectAll('.tag-reference-wrap')
            .data([this])
            .enter().append('div')
            .attr('class', 'tag-reference-wrap cf')
            .style('opacity', 0);

        function show() {
            referenceBody
                .transition()
                .style('opacity', 1);
        }

        taginfo.docs(tag, function(err, docs) {

            if (!err && docs) {
                docs = findLocal(docs);
            }

            if (!docs || !docs.description) {
                referenceBody.text(t('inspector.no_documentation_key'));
                show();
                return;
            }

            if (docs.image && docs.image.thumb_url_prefix) {
                referenceBody
                    .append('img')
                    .attr('class', 'wiki-image')
                    .attr('src', docs.image.thumb_url_prefix + "100" + docs.image.thumb_url_suffix)
                    .on('load', function() { show(); })
                    .on('error', function() { d3.select(this).remove(); show(); });
            } else {
                show();
            }

            referenceBody
                .append('p')
                .text(docs.description);

            referenceBody
                .append('a')
                .attr('target', '_blank')
                .attr('href', 'http://wiki.openstreetmap.org/wiki/' + docs.title)
                .text(t('inspector.reference'));
        });

        wrap.style('max-height', '0px')
            .style('opacity', '0')
            .transition()
            .duration(200)
            .style('max-height', '200px')
            .style('opacity', '1');

        showing = true;
    };

    tagReference.hide = function() {
        wrap.transition()
            .duration(200)
            .style('max-height', '0px')
            .style('opacity', '0');

        showing = false;
    };

    tagReference.toggle = function() {
        showing ? tagReference.hide() : tagReference.show();
    };

    return tagReference;
};
