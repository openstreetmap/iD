/*
   The hover behavior adds the `.hover` class on mouseover to all elements to which
   the identical datum is bound, and removes it on mouseout.

   The :hover pseudo-class is insufficient for iD's purposes because a datum's visual
   representation may consist of several elements scattered throughout the DOM hierarchy.
   Only one of these elements can have the :hover pseudo-class, but all of them will
   have the .hover class.
 */
iD.behavior.Hover = function() {
    var dispatch = d3.dispatch('hover'),
        selection,
        altDisables,
        target;

    function keydown() {
        if (altDisables && d3.event.keyCode === d3.keybinding.modifierCodes.alt) {
            dispatch.hover(null);
            selection.selectAll('.hover')
                .classed('hover-suppressed', true)
                .classed('hover', false);
        }
    }

    function keyup() {
        if (altDisables && d3.event.keyCode === d3.keybinding.modifierCodes.alt) {
            dispatch.hover(target ? target.id : null);
            selection.selectAll('.hover-suppressed')
                .classed('hover-suppressed', false)
                .classed('hover', true);
        }
    }

    var hover = function(__) {
        selection = __;

        function enter(d) {
            if (d === target) return;

            target = d;

            selection.selectAll('.hover')
                .classed('hover', false);
            selection.selectAll('.hover-suppressed')
                .classed('hover-suppressed', false);

            if (target instanceof iD.Entity) {
                var selector = '.' + target.id;

                if (target.type === 'relation') {
                    target.members.forEach(function(member) {
                        selector += ', .' + member.id;
                    });
                }

                var suppressed = altDisables && d3.event && d3.event.altKey;

                selection.selectAll(selector)
                    .classed(suppressed ? 'hover-suppressed' : 'hover', true);

                dispatch.hover(target.id);
            } else {
                dispatch.hover(null);
            }
        }

        var down;

        function mouseover() {
            if (down) return;
            var target = d3.event.target;
            enter(target ? target.__data__ : null);
        }

        function mouseout() {
            if (down) return;
            var target = d3.event.relatedTarget;
            enter(target ? target.__data__ : null);
        }

        function mousedown() {
            down = true;
            d3.select(window)
                .on('mouseup.hover', mouseup);
        }

        function mouseup() {
            down = false;
        }

        selection
            .on('mouseover.hover', mouseover)
            .on('mouseout.hover', mouseout)
            .on('mousedown.hover', mousedown)
            .on('mouseup.hover', mouseup);

        d3.select(window)
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
            .on('mouseout.hover', null)
            .on('mousedown.hover', null)
            .on('mouseup.hover', null);

        d3.select(window)
            .on('keydown.hover', null)
            .on('keyup.hover', null)
            .on('mouseup.hover', null);
    };

    hover.altDisables = function(_) {
        if (!arguments.length) return altDisables;
        altDisables = _;
        return hover;
    };

    return d3.rebind(hover, dispatch, 'on');
};
