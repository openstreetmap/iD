import type { coreContext } from '../core';

export function uiSpinner(context: coreContext) {
    var osm = context.connection();


    return function(selection: d3.Selection) {
        var img = selection
            .append('img')
            .attr('src', context.imagePath('loader-black.gif'))
            .style('opacity', 0);

        if (osm) {
            osm
                // @ts-expect-error -- fixed in a different PR
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
