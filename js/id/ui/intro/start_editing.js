iD.ui.intro.startEditing = function(context, reveal) {

    var event = d3.dispatch('done', 'startEditing'),
        modal,
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
            reveal('#surface');
        }, 7000);

        timeout(function() {
            modal = iD.ui.modal(context.container());

            modal.select('.modal')
                .attr('class', 'modal-splash modal col6');

            modal.selectAll('.close').remove();

            modal.select('.content')
                .append('div')
                    .attr('class', 'fillL')
                    .append('div')
                        .attr('class','modal-section')
                        .append('button')
                            .attr('class', 'huge-modal-button')
                            .on('click', function() {
                                event.startEditing();
                                modal.remove();
                            })
                            .append('h2')
                                .text(t('intro.startediting.start'));
        }, 7500);
    };

    step.exit = function() {
        if (modal) modal.remove();
        timeouts.forEach(window.clearTimeout);
    };

    return d3.rebind(step, event, 'on');
};
