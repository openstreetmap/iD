export function uiSpinner(context) {
    var connection = context.connection();


    return function(selection) {
        var img = selection
            .append('img')
            .attr('src', context.imagePath('loader-black.gif'))
            .style('opacity', 0);

        connection.event
            .on('loading.spinner', function() {
                img.transition()
                    .style('opacity', 1);
            });

        connection.event
            .on('loaded.spinner', function() {
                img.transition()
                    .style('opacity', 0);
            });
    };
}
