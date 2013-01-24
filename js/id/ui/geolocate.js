iD.ui.geolocate = function(map) {

    function success(position) {
        map.center([position.coords.longitude, position.coords.latitude]);
    }

    function error() { }

    return function(selection) {
        selection
            .attr('class', 'geolocate-control map-control')
            .append('button')
            .attr('tabindex', -1)
            .attr('title', 'Show My Location')
            .on('click', function() {
                navigator.geolocation.getCurrentPosition(
                    success, error);
            })
            .append('span')
                .attr('class','icon geolocate');
    };

};
