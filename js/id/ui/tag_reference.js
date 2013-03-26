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

        taginfo.docs(tag, function(err, docs) {
            if (!err && docs) {
                docs = findLocal(docs);
            }

            if (!docs || !docs.description) {
                return selection.text(t('inspector.no_documentation_key'));
            }

            var referenceBody = selection.append('div')
                .attr('class','tag-reference-wrap');

            if (docs.image && docs.image.thumb_url_prefix) {
                referenceBody
                    .append('img')
                    .attr('class', 'wiki-image')
                    .attr('src', docs.image.thumb_url_prefix + "100" + docs.image.thumb_url_suffix);
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
