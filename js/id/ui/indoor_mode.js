iD.ui.IndoorMode = function (context) {
    var redrawButton = function (selection, enableButton) {

        //buttons.each(function(d) {
        //    d3.select(this)
        //        .call(iD.svg.Icon('#icon-' + d.id));
        //});

        //update selection
        buttons.select('span.label')
            .text('Good');

        if (context.indoorMode()) {
            commands[0].title = "Level " + context.indoorLevel();
            //selection.selectAll('button').data(commands)
        }

        buttons
            .property('disabled', !enableButton)
            .classed('hide', !enableButton)
        //.each(function() {
        //    var selection = d3.select(this);
        //    if (selection.property('tooltipVisible')) {
        //        selection.call(tooltip.show);
        //    }
        //});
    };

    var initButtons = function (selection) {
        var enterButtonTooltip = bootstrap.tooltip()
            .placement('bottom')
            .html(true)
            .title(iD.ui.tooltipHtml('Enter indoor editing mode', iD.ui.cmd('⌘I')));

        var exitButtonTooltip = bootstrap.tooltip()
            .placement('bottom')
            .html(true)
            .title(iD.ui.tooltipHtml('Exit indoor editing mode', iD.ui.cmd('⌘I')));


        var enterButton = selection.append('button')
            .attr('class', 'col6')
            .on('click', function () {
                context.enterIndoorMode();
            })
            .call(enterButtonTooltip);


        var buttons = selection.selectAll('button');

        //enter selection
        buttons
            .enter().append('button')


        //update selection
        buttons.append('span')
            .attr('class', 'label')
            .text(function (mode) {
                return mode.title;
            });


        buttons
            .property('disabled', !true)
            .classed('hide', !true);

    };


    return function (selection) {

        // draw both controls hidden
        initButtons(selection);

        // enable one of them and update labels
        redrawButton(selection, false);


        var keybinding = d3.keybinding('indoor')
            .on(commands[0].cmd, function () {
                d3.event.preventDefault();
                commands[0].action();
            })
        //.on(commands[1].cmd, function() { d3.event.preventDefault(); commands[1].action(); });

        d3.select(document)
            .call(keybinding);

        //context.history()
        //    .on('change.undo_redo', update);

        context
            .on('enter.indoor_mode', update)
        //.on('indoorModeChanged.indoor_mode', update);

        function update() {
            var enableButton = context.indoorMode();

            if (!enableButton) {
                var graph = context.graph();
                var ids = context.selectedIDs();
                var entities = ids.map(function (id) {
                    return graph.entity(id);
                });
                var hasIndoorRelatedTag = function (e) {
                    return e.tags.level || e.tags.indoor || e.tags.building;
                };
                enableButton = entities.some(hasIndoorRelatedTag);
            }

            console.log("context.on(enter) called");
            console.log('enableIndoor', enableButton)
            redrawButton(selection, enableButton);
        }
    };
};

/*

 init
 - vždy : vytvořit button, nastavit .hide
 - vždy : vytvořit select+buton, .hide


 update
 - indoorMode : nastavit správný level
 -vždy unhide to správné

 - přidat selectbox, přepsat text na X






 */




















