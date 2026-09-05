export function uiSpinner(context) {
    var osm = context.connection();


    return function(selection) {
        var img = selection
            .append('svg')
            .style('opacity', 0);
        img.append('use').attr('href', '#iD-loader');

        if (osm) {
            osm
                .on('loading.spinner', function() {
                    img.transition()
                        .style('opacity', 1);
                })
                .on('loaded.spinner', function() {
                    img.transition()
                        .style('opacity', 0);
                });
        }
    };
}
