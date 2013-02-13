iD.ui.Attribution = function(context) {
    return function(selection) {
        selection.append('span')
            .text('imagery');

        selection
            .append('span')
            .attr('class', 'provided-by');
    }
};
