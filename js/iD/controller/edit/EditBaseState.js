// ----------------------------------------------------------------------
// EditBaseState class - provides shared UI functions to edit mode states

iD.controller.edit.EditBaseState = function() {};
iD.controller.edit.EditBaseState.prototype = {

	editortooltip: null,

    constructor: function() {
        // summary:	Base state for the 'Edit object' states - where an
        // object is selected and the user is making changes to it.
    },

    openEditorTooltip: function(entity) {
        // summary:		Open the initial 'Edit tags/Edit shape' tooltip.
        // entity: iD.Entity	The entity to be edited.
        $('.edit-pane h2').text(iD.Util.friendlyName(entity));
        $('.edit-pane').show().addClass('active');
        /*
        var $presets = $('.edit-pane .presets');
        // Build presets panel
        iD.Util.presets(entity.entityType, function(presets) {
            $presets.empty();
            _.each(presets, function(pre, category) {
                $('<h3></h3>')
                    .text(category)
                    .appendTo($presets);
                _.each(pre, function(set) {
                    var a = $('<a></a>')
                        .text(set.name)
                        .attr({
                            'class': 'preset-option',
                            'href': '#'
                        })
                        .appendTo($presets);
                    $('<span></span>')
                        .text(set.description)
                        .appendTo(a);
                });
            });
        });
        */

        // Build tag panel
        $('.edit-pane .tags tbody').empty();
        _.each(entity.tags, function(value, key) {
            var tr = $('<tr></tr>').appendTo(
                $('.edit-pane .tags tbody'));
            var keyfield = $('<input></input>')
                .attr({
                    type: 'text'
                })
                .val(key);
            var valuefield = $('<input></input>')
                .attr({
                    type: 'text'
                })
                .val(value);
            $('<td></td>').append(keyfield).appendTo(tr);
            $('<td></td>').append(valuefield).appendTo(tr);
        });

        $('.edit-pane a[href=#close]').click(this.closeEditorTooltip);
    },

    closeEditorTooltip: function(e) {
        if (e) e.preventDefault();
        // summary:		Close the tooltip.
        $('.edit-pane').removeClass('active').hide();
    }
};
