export function uiSpinner(context) {
    const osm = context.connection();


    return function(selection) {
        const img = selection
            .append('img')
            .attr('src', context.imagePath('loader-black.gif'))
            .style('opacity', 0);

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
