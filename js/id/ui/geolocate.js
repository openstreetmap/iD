iD.ui.Geolocate = function(map) {
    function click() {
        navigator.geolocation.getCurrentPosition(
            success, error);
    }

    function success(position) {
        map.center([position.coords.longitude, position.coords.latitude]);
    }

    function error() { }

    return function(selection) {
        if (!navigator.geolocation) return;

        var button = selection.append('button')
            .attr('tabindex', -1)
            .attr('title', t('geolocate.title'))
            .on('click', click)
            .call(bootstrap.tooltip()
                .placement('right'));

         button.append('span')
             .attr('class', 'icon geolocate');
    };
};
