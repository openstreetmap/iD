iD.ui.Loading = function(context) {
    var message = '',
        blocking = false,
        modal;

    var loading = function(selection) {
        modal = iD.ui.modal(selection, blocking);

        var loadertext = modal.select('.content')
            .classed('loading-modal', true)
            .append('div')
            .attr('class', 'modal-section fillL');

        loadertext.append('img')
            .attr('class', 'loader')
            .attr('src', context.imagePath('loader-white.gif'));

        loadertext.append('h3')
            .text(message);

        modal.select('button.close')
            .attr('class', 'hide');

        return loading;
    };

    loading.message = function(_) {
        if (!arguments.length) return message;
        message = _;
        return loading;
    };

    loading.blocking = function(_) {
        if (!arguments.length) return blocking;
        blocking = _;
        return loading;
    };

    loading.close = function() {
        modal.remove();
    };

    return loading;
};
