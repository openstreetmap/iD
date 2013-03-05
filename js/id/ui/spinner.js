iD.ui.Spinner = function(context) {
    var connection = context.connection();

    return function(selection) {
        var img = selection.append('img')
            .attr('src', 'img/loader.gif')
            .style('opacity', 0);

        connection.on('loading.spinner', function() {
            img.transition()
                .style('opacity', 1);
        });

        connection.on('loaded.spinner', function() {
            img.transition()
                .style('opacity', 0);
        });
    }
};
