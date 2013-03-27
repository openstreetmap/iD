iD.ui.intro.startEditing = function(context, curtain) {

    var event = d3.dispatch('done', 'startEditing'),
        timeouts = [];

    var step = {
        name: 'Start Editing'
    };

    function timeout(f, t) {
        timeouts.push(window.setTimeout(f, t));
    }

    step.enter = function() {

        curtain.reveal('.map-control.help-control', t('intro.startediting.help'));

        timeout(function() {
            curtain.reveal('#bar button.save', t('intro.startediting.save'));
        }, 3500);

        timeout(function() {
            curtain.reveal('#surface', t('intro.startediting.save'));
        }, 7000);

        timeout(event.startEditing, 7500);
    };

    step.exit = function() {
        timeouts.forEach(window.clearTimeout);
    };

    return d3.rebind(step, event, 'on');
};
