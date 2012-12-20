iD.loading = function(message) {
    var modal = iD.modal();

    var loadertext = modal.select('.content')
        .classed('loading-modal', true)
        .append('div').classed('pad1',true);
        loadertext.append('img').attr('class','icon big').attr('src', '../img/loader.gif');
        loadertext.append('h3').text(message || '');

    return modal;
};
