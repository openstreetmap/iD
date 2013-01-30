iD.ui.splash = function() {
    var modal = iD.ui.modal();

    modal.select('.modal')
        .classed('modal-splash', true);

    modal.select('.content')
        .html('Welcome to iD!');

    return modal;
};
