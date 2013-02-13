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

        div.append("p")
            .html(t('splash.text', {
                version: iD.version,
                website: '<a href="http://ideditor.com/">ideditor.com</a>',
                github: '<a href="https://github.com/systemed/iD">github.com</a>'
            }));
    }
};
