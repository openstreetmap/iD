iD.ui.confirm = function() {
    var modal = iD.ui.modal();
    modal.select('.modal').classed('modal-alert', true);
    modal.select('.content')
        .classed('modal-section', true)
        .append('div')
        .attr('class', 'description');
    var nochanges = modal.select('.content')
        .append('button')
        .attr('class','action centered')
        .on('click.confirm', function() {
            modal.remove();
        });
        nochanges.append('span').attr('class','label').text('Okay');

    return modal;
};
