iD.ui.Disclosure = function() {
    var dispatch = d3.dispatch('toggled'),
        title,
        expanded = false,
        content = function () {};

    var disclosure = function(selection) {
        var $link = selection.selectAll('.hide-toggle')
            .data([0]);

        $link.enter().append('a')
            .attr('href', '#')
            .attr('class', 'hide-toggle');

        $link.text(title)
            .on('click', toggle)
            .classed('expanded', expanded);

        var $body = selection.selectAll('div')
            .data([0]);

        $body.enter().append('div');

        $body.classed('hide', !expanded)
            .call(content);

        function toggle() {
            expanded = !expanded;
            $link.classed('expanded', expanded);
            $body.call(iD.ui.Toggle(expanded));
            dispatch.toggled(expanded);
        }
    };

    disclosure.title = function(_) {
        if (!arguments.length) return title;
        title = _;
        return disclosure;
    };

    disclosure.expanded = function(_) {
        if (!arguments.length) return expanded;
        expanded = _;
        return disclosure;
    };

    disclosure.content = function(_) {
        if (!arguments.length) return content;
        content = _;
        return disclosure;
    };

    return d3.rebind(disclosure, dispatch, 'on');
};
