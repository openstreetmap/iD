iD.ui.ZoomInToEdit = function(context) {
    return function(selection) {
        var button = selection.append('button')
            .attr('class', 'zoom-to')
            .on('click', function() { context.map().zoom(context.minEditableZoom()); });

        button
            .call(iD.svg.Icon('#icon-plus', 'pre-text'))
            .append('span')
            .attr('class', 'label')
            .text(t('zoom_in_edit'));

        function disableTooHigh() {
            selection.style('display', context.editable() ? 'none' : '');
        }

        context.map()
            .on('move.notice', _.debounce(disableTooHigh, 500));

        disableTooHigh();
    };
};
