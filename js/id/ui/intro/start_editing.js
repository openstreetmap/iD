iD.ui.intro.startEditing = function(context, reveal) {
    var event = d3.dispatch('done', 'startEditing'),
        modal,
        timeouts = [];

    var step = {
        title: 'intro.startediting.title'
    };

    function timeout(f, t) {
        timeouts.push(window.setTimeout(f, t));
    }

    step.enter = function() {
        reveal('.map-control.help-control',
            t('intro.startediting.help', { button: iD.ui.intro.icon('#icon-help', 'pre-text') }));

        timeout(function() {
            reveal('#bar button.save', t('intro.startediting.save'));
        }, 5000);

        timeout(function() {
            reveal('#surface');
        }, 10000);

        timeout(function() {
            modal = iD.ui.modal(context.container());

            modal.select('.modal')
                .attr('class', 'modal-splash modal col6');

            modal.selectAll('.close').remove();

            var startbutton = modal.select('.content')
                .attr('class', 'fillL')
                    .append('button')
                        .attr('class', 'modal-section huge-modal-button')
                        .on('click', function() {
                            modal.remove();
                        });

                startbutton.append('div')
                    .attr('class','illustration');
                startbutton.append('h2')
                    .text(t('intro.startediting.start'));

            event.startEditing();
        }, 10500);
    };

    step.exit = function() {
        if (modal) modal.remove();
        timeouts.forEach(window.clearTimeout);
    };

    return d3.rebind(step, event, 'on');
};
