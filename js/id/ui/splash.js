iD.ui.Splash = function(context) {
    return function(selection) {
        // if (context.storage('sawSplash'))
        //     return;

        context.storage('sawSplash', true);

        var modal = iD.ui.modal(selection);

        modal.select('.modal')
            .attr('class', 'modal-splash modal col6');

        var introModal = modal.select('.content')
            .append('div')
            .attr('class', 'fillL');

        introModal.append('div')
            .attr('class','modal-section cf')
            .append('h3').text(t('splash.welcome'));

        var buttons = introModal.append('div').attr('class', 'cf');

        buttons.append('button')
            .attr('class', 'col6 action modal-section walkthrough')
            .text(t('splash.walkthrough'))
            .on('click', function() {
                d3.select(document.body).call(iD.ui.intro(context));
                modal
                    .transition()
                    .duration(200)
                    .style('opacity','0')
                    .remove();

                modal.select('.modal')
                    .transition()
                    .duration(200)
                    .style('top','0px')
                    .remove();
            });

        buttons.append('button')
            .attr('class', 'col6 action modal-section start')
            .text(t('splash.start'))
            .on('click', function() {
                modal
                    .transition()
                    .duration(200)
                    .style('opacity','0')
                    .remove();

                modal.select('.modal')
                    .transition()
                    .duration(200)
                    .style('top','0px')
                    .remove();
            });

        introModal.append('div')
            .attr('class','modal-section')
            .append('p')
            .html(t('splash.text', {
                version: iD.version,
                website: '<a href="http://ideditor.com/">ideditor.com</a>',
                github: '<a href="https://github.com/systemed/iD">github.com</a>'
            }));

        modal.select('button.close').attr('class','hide');

    };
};
