iD.confirm = function(message) {
    var modal = iD.modal();
    modal.select('.modal').classed('modal-alert', true);
    modal.select('.content')
        .append('div').attr('class', 'description pad1');
    var nochanges = modal.select('.content')
        .append('button')
        .attr('class','wide action centered')
        .on('click.confirm', function() {
            modal.remove();
        });
        nochanges.append('span').attr('class','label').text('Okay');

    return modal;
};
