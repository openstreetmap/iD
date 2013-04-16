iD.ui.Status = function(context) {
    var connection = context.connection(),
        errCount = 0;

    return function(selection) {

        function update() {

            connection.status(function(err, apiStatus) {

                selection.html('');

                if (err && errCount++ < 2) return;

                if (err) {
                    selection.text(t('status.error'));

                } else if (apiStatus === 'readonly') {
                    selection.text(t('status.readonly'));

                } else if (apiStatus === 'offline') {
                    selection.text(t('status.offline'));
                }

                selection.attr('class', 'api-status ' + (err ? 'error' : apiStatus));
                if (!err) errCount = 0;

            });
        }

        connection.on('auth', function() { update(selection); });
        window.setInterval(update, 90000);
        update(selection);
    };
};
