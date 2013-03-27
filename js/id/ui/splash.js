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

        introModal.append('div')
            .attr('class','modal-section')
            .append('p')
            .html(t('splash.text', {
                version: iD.version,
                website: '<a href="http://ideditor.com/">ideditor.com</a>',
                github: '<a href="https://github.com/systemed/iD">github.com</a>'
            }));

        var buttons = introModal.append('div').attr('class', 'modal-actions cf');

        buttons.append('button')
            .attr('class', 'col6 walkthrough')
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
            .attr('class', 'col6 start')
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

        modal.select('button.close').attr('class','hide');

    };
};
