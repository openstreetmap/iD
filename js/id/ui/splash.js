iD.ui.splash = function(selection) {
    var modal = iD.ui.modal(selection);

    modal.select('.modal')
        .attr('class', 'modal-splash modal');

    var introModal = modal.select('.content')
        .append('div')
        .attr('class', 'modal-section fillL');

    introModal.append('div')
        .attr('class','logo');

    introModal.append('div')
        .html("<h2 class>Welcome to the iD OpenStreetMap editor</h2><p>" + 
            "This is development version 0.0.0-alpha1. " +
            "For more information see <a href='http://ideditor.com/'>ideditor.com</a>" +
            " and report bugs at <a href='https://github.com'>github.com.systemed/iD</a>.</p>");

    return modal;
};
