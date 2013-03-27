iD.ui.intro.startEditing = function(context, reveal) {

    var event = d3.dispatch('done', 'startEditing'),
        timeouts = [];

    var step = {
        name: 'Start Editing'
    };

    function timeout(f, t) {
        timeouts.push(window.setTimeout(f, t));
    }

    step.enter = function() {

        reveal('.map-control.help-control', 'intro.startediting.help');

        timeout(function() {
            reveal('#bar button.save', 'intro.startediting.save');
        }, 3500);

        timeout(function() {
            reveal('#surface', 'intro.startediting.save');
        }, 7000);

        timeout(event.startEditing, 7500);
    };

    step.exit = function() {
        timeouts.forEach(window.clearTimeout);
    };

    return d3.rebind(step, event, 'on');
};
