iD.ui.confirm = function(selection) {
    var modal = iD.ui.modal(selection);
    modal.select('.modal').classed('modal-alert', true);
    modal.select('.content')
        .attr('class','modal-section fillD')
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
