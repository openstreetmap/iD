iD.ui.Inspector = function(context) {
    var presetList = iD.ui.PresetList(context),
        entityEditor = iD.ui.EntityEditor(context),
        state = 'select',
        entityID,
        newFeature = false;

    function inspector(selection) {
        var $wrap = selection.selectAll('.panewrap')
            .data([0]);

        var $enter = $wrap.enter().append('div')
            .attr('class', 'panewrap');

        $enter.append('div')
            .attr('class', 'preset-list-pane pane');

        $enter.append('div')
            .attr('class', 'entity-editor-pane pane');

        var $presetPane = $wrap.select('.preset-list-pane')
            .call(presetList
                .entityID(entityID)
                .autofocus(newFeature)
                .on('choose', setPreset));

        var $editorPane = $wrap.select('.entity-editor-pane')
            .call(entityEditor
                .state(state)
                .entityID(entityID)
                .on('choose', showList));

        $wrap.style('right', context.entity(entityID).isUsed(context.graph()) ? '-0%' : '-100%');

        function showList(preset) {
            $wrap.transition()
                .style('right', '-100%');

            $presetPane.call(presetList
                .preset(preset)
                .autofocus(true));
        }

        function setPreset(preset) {
            $wrap.transition()
                .style('right', '0%');

            $editorPane.call(entityEditor
                .preset(preset));
        }
    }

    inspector.close = function(selection) {
        entityEditor.close();

        selection.style('display', 'none');
    };

    inspector.state = function(_) {
        if (!arguments.length) return state;
        state = _;
        return inspector;
    };

    inspector.entityID = function(_) {
        if (!arguments.length) return entityID;
        entityID = _;
        return inspector;
    };

    inspector.newFeature = function(_) {
        if (!arguments.length) return newFeature;
        newFeature = _;
        return inspector;
    };

    return inspector;
};
