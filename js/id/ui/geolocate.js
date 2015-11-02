iD.ui.Geolocate = function(map) {
    function click() {
        navigator.geolocation.getCurrentPosition(
            success, error);
    }

    function success(position) {
        var extent = iD.geo.Extent([position.coords.longitude, position.coords.latitude])
            .padByMeters(position.coords.accuracy);

        map.centerZoom(extent.center(), Math.min(20, map.extentZoom(extent)));
    }

    function error() { }

    return function(selection) {
        if (!navigator.geolocation) return;

        selection.append('button')
            .attr('tabindex', -1)
            .attr('title', t('geolocate.title'))
            .on('click', click)
            .call(iD.svg.Icon('#icon-geolocate', 'light'))
            .call(bootstrap.tooltip()
                .placement('left'));
    };
};
