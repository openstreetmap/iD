iD.loading = function(message) {
    var loading = d3.select('div.loading');
    if (loading.empty()) loading = d3.select(document.body)
        .append('div').attr('class', 'loading shaded');
    loading.append('div')
        .attr('class', 'modal loading-pane')
        .text(message || '');

    var l = {};

    l.remove = function() {
        d3.select('div.loading').remove();
    };

    return l;
};
