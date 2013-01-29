/*
   The hover behavior adds the `.hover` class on mouseover to all elements to which
   the identical datum is bound, and removes it on mouseout.

   The :hover pseudo-class is insufficient for iD's purposes because a datum's visual
   representation may consist of several elements scattered throughout the DOM hierarchy.
   Only one of these elements can have the :hover pseudo-class, but all of them will
   have the .hover class.
 */
iD.behavior.Hover = function () {
    var hover = function(selection) {
        selection.classed('behavior-hover', true);

        selection.on('mouseover.hover', function () {
            var datum = d3.event.target.__data__;
            if (datum) {
                selection.selectAll('*')
                    .filter(function (d) { return d === datum; })
                    .classed('hover', true);
            }
        });

        selection.on('mouseout.hover', function () {
            selection.selectAll('.hover')
                .classed('hover', false);
        });
    };

    hover.off = function(selection) {
        selection.classed('behavior-hover', false)
            .on('mouseover.hover', null)
            .on('mouseout.hover', null);
    };

    return hover;
};
