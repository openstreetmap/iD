iD.ui.Attribution = function(context) {
    return function attribution(selection) {
        var d = selection.data()[0];

        var provided_by = selection
            .html('')
            .append('span')
            .attr('class', 'provided-by');

        if (!d) return;

        var desc = t('imagery.provided_by', {
            source: (d.data.sourcetag || d.data.name)
        });

        if (d.data.terms_url) {
            provided_by.append('a')
                .attr('href', (d.data.terms_url || ''))
                .attr('target', '_blank')
                .classed('disabled', !d.data.terms_url)
                .text(desc);
        } else {
            provided_by.text(desc);
        }
    };
};
