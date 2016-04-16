iD.ui.IndoorMode = function (context) {

    var enterButton, indoorControl;

    function createControls(selection) {
        enterButton = selection.append('button')
            .attr('class', 'indoormode-enter-button col12 ')
            .on('click', toggleIndoor)
            .call(buttonTooltip('Enter indoor editing mode'));
        enterButton
            .append('span').attr('class', 'label').text('Indoor');


        indoorControl = selection.append('div')
            .attr('class', 'indoormode-control joined ');

        indoorControl.append('div')
            .attr('class', 'col8 indoormode-level-combo')
            .append('input')
            .attr('type', 'text')
            .call(d3.combobox().data([0, 1, 2, 3, 4, 5, 6].map(comboValues)))
            .on('blur', setLevel)
            .on('change', setLevel);

        indoorControl.append('button')
            .attr('class', 'col4')
            .on('click', toggleIndoor)
            .call(buttonTooltip('Exit indoor editing mode'))
            .call(iD.svg.Icon('#icon-close'));

        enterButton.classed('hide', true); //.property('disabled', true);
        indoorControl.classed('hide', true);
    }


    return function (selection) {
        createControls(selection);

        var keybinding = d3.keybinding('indoor')
            .on(iD.ui.cmd('⌘I'), toggleIndoor);

        d3.select(document)
            .call(keybinding);

        context
            .on('enter.indoor_mode', update)
            .on('indoorLevelChanged.indoor_mode', update);

        function update() {
            var enableButton = context.indoorMode();

            if (!enableButton) {
                var graph = context.graph();
                var ids = context.selectedIDs();
                var entities = ids.map(function (id) {
                    return graph.entity(id);
                });
                var hasIndoorRelatedTag = function (e) {
                    return e.tags.level || e.tags.repeat_on || e.tags.indoor || e.tags.building;
                };
                enableButton = entities.some(hasIndoorRelatedTag);
            }

            console.log("context.on(enter) called");
            console.log('enableIndoor', enableButton);
            updateControls(selection, enableButton);
        }
    };

    function updateControls(selection, enableButton) {
        if (context.indoorMode()) {
            console.log("updateControls indoor=true");
            enterButton.classed('hide', true);
            indoorControl.classed('hide', false);
            indoorControl.select('.combobox-input')
                .attr('placeholder', context.indoorLevel())
                .value('')
                .call(d3.combobox().data(context.indoorLevels().map(comboValues)));

        }
        else {
            enterButton.classed('hide', !enableButton); //.property('disabled', !enableButton);
            indoorControl.classed('hide', true);
        }
    }

    function toggleIndoor() {
        d3.event.preventDefault();
        context.toggleIndoorMode();

    }

    function buttonTooltip(description) {
        return bootstrap.tooltip()
            .placement('bottom')
            .html(true)
            .title(iD.ui.tooltipHtml(description, iD.ui.cmd('⌘⇧I')));
    }

    function setLevel() {
        var input = d3.select(this);
        var data = input.value(); //string!
        if (data === '') return; //blank value
        console.log('setLevel', data);

        input
            .attr('placeholder', data)
            .value('');

        context.indoorLevel(data);
    }

    function comboValues(d) {
        return {
            value: d.toString(),
            title: d.toString()
        };
    }
};
