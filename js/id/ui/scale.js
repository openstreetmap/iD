iD.ui.Scale = function(context) {
    var map = context.map();

    function update(selection) {
        selection.append('svg')
            .attr('id', 'scale')
    };

    return function(selection) {
        update(selection);
    };
};
