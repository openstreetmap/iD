iD.confirm = function(message) {
    var modal = iD.modal();
    modal.select('.modal').classed('modal-alert', true);
    modal.select('.content')
        .append('p').attr('class', 'description');
    modal.select('.content')
        .append('button')
        .text('OK')
        .on('click', function() {
            modal.remove();
        });

    return modal;
};
