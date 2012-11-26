var iD = function(container) {
    container = d3.select(container);

    var m = container.append('div')
        .attr('id', 'map');

    var connection = iD.Connection()
        .url('http://api06.dev.openstreetmap.org/api/0.6/');

    var map = iD.Map(m.node(), connection);

    var controller = iD.Controller(map);

    var bar = container.append('div')
        .attr('id', 'bar');

    var buttons = bar.selectAll('button')
        .data([iD.modes.AddPlace, iD.modes.AddRoad, iD.modes.AddArea])
        .enter().append('button')
        .text(function (mode) { return mode.title; })
        .on('click', function (mode) { controller.enter(mode); });

    controller.on('enter', function (entered) {
        buttons.classed('active', function (mode) { return entered === mode; });
    });

    bar.append('button')
        .attr('id', 'undo')
        .attr('class', 'mini')
        .property('disabled', true)
        .html('&larr;<small></small>')
        .on('click', map.undo);

    bar.append('button')
        .attr('id', 'redo')
        .attr('class', 'mini')
        .property('disabled', true)
        .html('&rarr;<small></small>')
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
            connection.authenticate(function() {
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

    map.on('update', function() {
        var undo = map.history.undoAnnotation(),
            redo = map.history.redoAnnotation();

        bar.select('#undo')
            .property('disabled', !undo)
            .select('small')
            .text(undo);

        bar.select('#redo')
            .property('disabled', !redo)
            .select('small')
            .text(redo);
    });

    window.onresize = function() {
        map.setSize([m.node().offsetWidth, m.node().offsetHeight]);
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
        if (d3.event.which === 80) controller.enter(iD.modes.AddPlace);
        // r
        if (d3.event.which === 82) controller.enter(iD.modes.AddRoad);
        // a
        if (d3.event.which === 65) controller.enter(iD.modes.AddArea);
    });

    var hash = iD.Hash().map(map);
    if (!hash.hadHash) map.setZoom(19).setCenter([-1.49475, 51.87502]);

    if (connection.authenticated()) {
        connection.userDetails(function(user_details) {
            connection.user(user_details);
            d3.select('.messages').text('logged in as ' + user_details.display_name);
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
