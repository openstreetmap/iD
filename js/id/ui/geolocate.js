iD.ui.geolocate = function(map) {

    function success(position) {
        map.center([position.coords.longitude, position.coords.latitude]);
    }

    function error() { }

    return function(selection) {
        selection
            .attr('class', 'geolocate-control map-control')
            .append('button')
            .attr('title', 'Show My Location')
            .text('G')
            .on('click', function() {
                navigator.geolocation.getCurrentPosition(
                    success, error);
            });
    };

};
