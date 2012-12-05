iD.loading = function(message) {
    var modal = iD.modal();

    modal.select('.content')
        .classed('loading-modal', true)
        .text(message || '');

    return modal;
};
