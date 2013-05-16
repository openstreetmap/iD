iD.ui.Disclosure = function() {
    var title,
        expanded = false,
        content = function () {},
        dispatch = d3.dispatch('toggled'),
        link, container;

    function toggle() {
        expanded = !expanded;
        link.classed('expanded', expanded);
        container.call(iD.ui.Toggle(expanded));
        dispatch.toggled(expanded);
    }

    var disclosure = function(selection) {
        link = selection.append('a')
            .attr('href', '#')
            .attr('class', 'hide-toggle')
            .text(title)
            .on('click', toggle)
            .classed('expanded', expanded);

        container = selection.append('div')
            .classed('hide', !expanded);

        container.call(content);
    };

    disclosure.title = function(_) {
        title = _;
        if (link) link.text(_);
        return disclosure;
    };

    disclosure.expanded = function(_) {
        if (link && expanded !== _) {
            toggle();
        } else {
            expanded = _;
        }
        return disclosure;
    };

    disclosure.content = function(_) {
        content = _;
        return disclosure;
    };

    return d3.rebind(disclosure, dispatch, 'on');
};
