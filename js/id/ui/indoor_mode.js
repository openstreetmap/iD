iD.ui.IndoorMode = function (context) {
    var updateControls = function (selection, enableButton) {


        var enterButton = selection.select('.indoormode-enter-button');
        var indoorControl = selection.select('.indoormode-control');

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
            enterButton.classed('hide', false).property('disabled', !enableButton);
            indoorControl.classed('hide', true);
        }
    };

    var toggleIndoor = function () {
        d3.event.preventDefault();
        context.toggleIndoorMode();

    };

    var buttonTooltip = function (description) {
        return bootstrap.tooltip()
            .placement('bottom')
            .html(true)
            .title(iD.ui.tooltipHtml(description, iD.ui.cmd('⌘⇧I')));
    };

    var setLevel = function () {
        var input = d3.select(this);
        var data = input.value(); //string!
        if (data === '') return; //blank value
        console.log('setLevel', data);

        input
            .attr('placeholder', data)
            .value('');

        context.indoorLevel(data);

    };

    var createControls = function (selection) {
        var enterButton = selection.append('button')
            .attr('class', 'indoormode-enter-button col12 ')
            .on('click', toggleIndoor)
            .call(buttonTooltip('Enter indoor editing mode'))
            .append('span').attr('class', 'label').text('Indoor');


        var indoorControl = selection.append('div')
            .attr('class', 'indoormode-control joined ');

        indoorControl.append('div')
            .attr('class', 'col8 indoormode-level-combo')
            .append('input')
            .attr('type', 'text')
            .call(d3.combobox().data([0, 1, 2, 3, 4, 5, 6].map(comboValues)))
            .on('blur', setLevel)
            .on('change', setLevel)

        indoorControl.append('button')
            .attr('class', 'col4')
            .on('click', toggleIndoor)
            .call(buttonTooltip('Exit indoor editing mode'))
            .call(iD.svg.Icon('#icon-close'));

        enterButton.classed('hide', false).property('disabled', true);
        indoorControl.classed('hide', true);
    };


    return function (selection) {

        // draw both controls hidden
        createControls(selection);

        var keybinding = d3.keybinding('indoor')
            .on(iD.ui.cmd('⌘I'), toggleIndoor)

        d3.select(document)
            .call(keybinding);

        context
            .on('enter.indoor_mode', update)
            .on('indoor.indoor_mode', update);

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
            updateControls(selection, enableButton);
        }
    };


    function comboValues(d) {
        return {
            value: d.toString(),
            title: d.toString()
        };
    }
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




















