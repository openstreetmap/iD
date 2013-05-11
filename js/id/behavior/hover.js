/*
   The hover behavior adds the `.hover` class on mouseover to all elements to which
   the identical datum is bound, and removes it on mouseout.

   The :hover pseudo-class is insufficient for iD's purposes because a datum's visual
   representation may consist of several elements scattered throughout the DOM hierarchy.
   Only one of these elements can have the :hover pseudo-class, but all of them will
   have the .hover class.
 */
iD.behavior.Hover = function(context) {
    var selection,
        altDisables,
        target;

    function keydown() {
        if (altDisables && d3.event.keyCode === d3.keybinding.modifierCodes.alt) {
            context.hover(null);
            selection.selectAll('.hover')
                .classed('hover-suppressed', true)
                .classed('hover', false);
        }
    }

    function keyup() {
        if (altDisables && d3.event.keyCode === d3.keybinding.modifierCodes.alt) {
            context.hover(target);
            selection.selectAll('.hover-suppressed')
                .classed('hover-suppressed', false)
                .classed('hover', true);
        }
    }

    var hover = function(__) {
        selection = __;

        function mouseover() {
            target = d3.event.target.__data__;

            if (target && target.type) {
                var selector = '.' + target.id;

                if (target.type === 'relation') {
                    target.members.forEach(function(member) {
                        selector += ', .' + member.id;
                    });
                }

                var suppressed = altDisables && d3.event && d3.event.altKey;

                selection.selectAll(selector)
                    .classed(suppressed ? 'hover-suppressed' : 'hover', true);

                context.hover(target);
            }
        }

        function mouseout() {
            context.hover(null);
            target = null;

            selection.selectAll('.hover')
                .classed('hover', false);
            selection.selectAll('.hover-suppressed')
                .classed('hover-suppressed', false);
        }

        selection
            .on('mouseover.hover', mouseover)
            .on('mouseout.hover', mouseout);

        d3.select(document)
            .on('keydown.hover', keydown)
            .on('keyup.hover', keyup);
    };

    hover.off = function(selection) {
        selection.selectAll('.hover')
            .classed('hover', false);
        selection.selectAll('.hover-suppressed')
            .classed('hover-suppressed', false);

        selection
            .on('mouseover.hover', null)
            .on('mouseout.hover', null);

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
