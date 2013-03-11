/*
   The hover behavior adds the `.hover` class on mouseover to all elements to which
   the identical datum is bound, and removes it on mouseout.

   The :hover pseudo-class is insufficient for iD's purposes because a datum's visual
   representation may consist of several elements scattered throughout the DOM hierarchy.
   Only one of these elements can have the :hover pseudo-class, but all of them will
   have the .hover class.
 */
iD.behavior.Hover = function() {
    var selection,
        altDisables;

    function keydown() {
        if (altDisables && d3.event.keyCode === d3.keybinding.modifierCodes.alt) {
            selection.classed('behavior-hover', false);
        }
    }

    function keyup() {
        if (altDisables && d3.event.keyCode === d3.keybinding.modifierCodes.alt) {
            selection.classed('behavior-hover', true);
        }
    }

    var hover = function(_) {
        selection = _;

        if (!altDisables || !d3.event || !d3.event.altKey) {
            selection.classed('behavior-hover', true);
        }

        function mouseover() {
            var datum = d3.event.target.__data__;
            if (datum) {
                selection.selectAll('*')
                    .filter(function(d) { return d === datum; })
                    .classed('hover', true);
            }
        }

        selection.on('mouseover.hover', mouseover);

        selection.on('mouseout.hover', function() {
            selection.selectAll('.hover')
                .classed('hover', false);
        });

        d3.select(document)
            .on('keydown.hover', keydown)
            .on('keyup.hover', keyup);
    };

    hover.off = function(selection) {
        selection.classed('behavior-hover', false)
            .on('mouseover.hover', null)
            .on('mouseout.hover', null);

        selection.selectAll('.hover')
            .classed('hover', false);

        d3.select(document)
            .on('keydown.hover', null)
            .on('keyup.hover', null);
    };

    hover.altDisables = function(_) {
        if (!arguments.length) return altDisables;
        altDisables = _;
        return hover;
    };

    return hover;
};
