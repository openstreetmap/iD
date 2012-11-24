var iD = function(container) {
    container = d3.select(container);

    var m = container.append('div')
        .attr('id', 'map');

    var connection = iD.Connection()
        .url('http://api06.dev.openstreetmap.org/api/0.6/');

    var map = iD.Map(m.node(), connection);

    var controller = iD.Controller(map);

    var oauth = iD.OAuth(map)
        .setAPI('http://api06.dev.openstreetmap.org/api/0.6');

    var bar = container.append('div')
        .attr('id', 'bar');

    bar.append('button')
        .attr('id', 'place')
        .html('+&nbsp;Place')
        .on('click', function() {
            controller.go(iD.actions.AddPlace);
        });

    bar.append('button')
        .attr('id', 'road')
        .html('+&nbsp;Road')
        .on('click', function() {
            controller.go(iD.actions.AddRoad);
        });

    bar.append('button')
        .attr('id', 'area')
        .html('+&nbsp;Area')
        .on('click', function() {
            controller.go(iD.actions.AddArea);
        });

    bar.append('button')
        .attr('id', 'undo')
        .attr('class', 'mini')
        .html('&larr;<small>&nbsp;</small>')
        .on('click', map.undo);

    bar.append('button')
        .attr('id', 'redo')
        .attr('class', 'mini')
        .html('&rarr;<small>&nbsp;</small>')
        .on('click', map.redo);

    bar.append('input')
        .attr('type', 'text')
        .attr('placeholder', 'find a place')
        .attr('id', 'geocode-location')
        .on('keydown', function () {
            if (d3.event.keyCode !== 13) return;
            d3.event.preventDefault();
            var val = d3.select('#geocode-location').node().value;
            var scr = document.body.appendChild(document.createElement('script'));
            scr.src = 'http://api.tiles.mapbox.com/v3/mapbox/geocode/' +
                encodeURIComponent(val) + '.jsonp?callback=grid';
        });

    function grid(resp) {
        map.setCentre(resp.results[0][0]);
    }

    bar.append('div')
        .attr('class', 'messages');


    bar.append('button')
        .attr('id', 'save')
        .html("Save<small id='as-username'></small>")
        .on('click', function() {
            oauth.authenticate(function() {
                map.commit();
            });
        });

    var zoom = bar.append('div')
        .attr('class', 'zoombuttons');

    zoom.append('button')
        .attr('class', 'zoom-in')
        .text('+')
        .on('click', map.zoomIn);

    zoom.append('button')
        .attr('class', 'zoom-out')
        .text('–')
        .on('click', map.zoomOut);

    container.append('div')
        .attr('class', 'inspector-wrap');

    container.append('div')
        .attr('id', 'about')
        .html("<p>Work in progress: <a href='http://www.geowiki.com/'>introduction</a>," +
              "<a href='http://github.com/systemed/iD'>code</a>," +
              "<a href='http://www.geowiki.com/docs'>docs</a>." +
              "Imagery <a href='http://opengeodata.org/microsoft-imagery-details'>&copy; 2012</a> Bing, GeoEye, Getmapping, Intermap, Microsoft.</p>");

    window.onresize = function() {
        map.setSize({
            width: m.node().offsetWidth,
            height: m.node().offsetHeight
        });
    };

    d3.select(document).on('keydown', function() {
        // console.log(d3.event);
        // cmd-z
        if (d3.event.which === 90 && d3.event.metaKey) {
            map.undo();
        }
        // cmd-shift-z
        if (d3.event.which === 90 && d3.event.metaKey && d3.event.shiftKey) {
            map.redo();
        }
        // p
        if (d3.event.which === 80) controller.go(iD.actions.AddPlace);
        // r
        if (d3.event.which === 82) controller.go(iD.actions.AddRoad);
        // a
        if (d3.event.which === 65) controller.go(iD.actions.AddArea);
    });

    var hash = iD.Hash().map(map);
    if (!hash.hadHash) {
        map.setZoom(19).setCenter({
            lat: 51.87502,
            lon: -1.49475
        });
    }

    if (oauth.authenticated()) {
        oauth.xhr({ method: 'GET', path: '/user/details' }, function(user_details) {
            var u = user_details.getElementsByTagName('user')[0];
            connection.user({
                display_name: u.attributes.display_name.nodeValue,
                id: u.attributes.id.nodeValue
            });
            d3.select('.messages').text('logged in as ' +
                connection.user().display_name);
        });
    }
};

iD.supported = function() {
    if (navigator.appName !== 'Microsoft Internet Explorer') {
        return true;
    } else {
        var ua = navigator.userAgent;
        var re = new RegExp("MSIE ([0-9]{1,}[\\.0-9]{0,})");
        if (re.exec(ua) !== null) {
            rv = parseFloat( RegExp.$1 );
        }
        if (rv && rv < 9) return false;
        else return true;
    }
};
