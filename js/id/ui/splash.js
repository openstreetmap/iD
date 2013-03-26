iD.ui.Splash = function(context) {
    return function(selection) {
        if (context.storage('sawSplash'))
            return;

        context.storage('sawSplash', true);

        var modal = iD.ui.modal(selection);

        modal.select('.modal')
            .attr('class', 'modal-splash modal');

        var introModal = modal.select('.content')
            .append('div')
            .attr('class', 'modal-section fillL');

        introModal.append('div')
            .attr('class', 'logo');

        var div = introModal.append('div');

        div.append("h2")
            .text(t('splash.welcome'));

        var buttons = div.append('div').attr('class', 'col12 button-wrap joined');

        buttons.append('button')
            .attr('class', 'col6')
            .text(t('splash.walkthrough'))
            .on('click', function() {
                d3.select(document.body).call(iD.ui.intro(context));
                modal.remove();
            });

        buttons.append('button')
            .attr('class', 'col6')
            .text(t('splash.start'))
            .on('click', function() {
                modal.remove();
            });

        div.append("p")
            .html(t('splash.text', {
                version: iD.version,
                website: '<a href="http://ideditor.com/">ideditor.com</a>',
                github: '<a href="https://github.com/systemed/iD">github.com</a>'
            }));
    };
};
