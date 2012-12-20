iD.confirm = function(message) {
    var modal = iD.modal();
    modal.select('.modal').classed('modal-alert', true);
    modal.select('.content')
        .classed('modal-section', true)
        .append('div').attr('class', 'description');
    var nochanges = modal.select('.content')
        .append('button')
        .attr('class','wide action centered')
        .on('click.confirm', function() {
            modal.remove();
        });
        nochanges.append('span').attr('class','label').text('Okay');

    return modal;
};
