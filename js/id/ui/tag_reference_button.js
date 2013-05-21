iD.ui.TagReferenceButton = function() {
    var dispatch = d3.dispatch('click');

    function button(selection) {
        var button = selection.append('button')
            .attr('tabindex', -1)
            .attr('class', 'tag-reference-button minor')
            .on('click', dispatch.click);

        button.append('span')
            .attr('class', 'icon inspect');

        return button;
    }

    return d3.rebind(button, dispatch, 'on')
};
