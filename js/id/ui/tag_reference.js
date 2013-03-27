iD.ui.TagReference = function(entity, tag) {
    var taginfo = iD.taginfo();

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

    return function(selection) {
        selection.html('');

        selection.classed('cf', true);

        var spinner = selection.append('img')
            .attr('class', 'tag-reference-spinner')
            .attr('src', 'img/loader-white.gif');

        taginfo.docs(tag, function(err, docs) {
            spinner
                .style('position', 'absolute')
                .transition()
                .style('opacity', 0)
                .remove();

            var referenceBody = selection.append('div')
                .attr('class', 'tag-reference-wrap')
                .style('opacity', 0);

            referenceBody
                .transition()
                .style('opacity', 1);

            if (!err && docs) {
                docs = findLocal(docs);
            }

            if (!docs || !docs.description) {
                return referenceBody.text(t('inspector.no_documentation_key'));
            }

            if (docs.image && docs.image.thumb_url_prefix) {
                referenceBody
                    .append('img')
                    .attr('class', 'wiki-image')
                    .attr('src', docs.image.thumb_url_prefix + "100" + docs.image.thumb_url_suffix)
                    .on('error', function() { d3.select(this).remove(); });
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
    };
};
