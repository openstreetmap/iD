iD.ui.intro.navigation = function(context, curtain) {

    var event = d3.dispatch('done'),
        timeouts = [];

    var step = {
        name: 'Navigation'
    };

    function set(f, t) {
        timeouts.push(window.setTimeout(f, t));
    }

    /*
     * Steps:
     * Drag map
     * Select poi
     * Show editor header
     * Show editor pane
     * Select road
     * Show header
     */

    step.enter = function() {

        var map = { 
            left: 0,
            top: 60,
            width: window.innerWidth - 400,
            height: window.innerHeight - 200
        };

        context.map().centerZoom([-85.63591, 41.94285], 19);

        curtain.reveal(map, 'right', t('intro.navigation.drag'));

        context.map().on('move.intro', _.debounce(function() {
            context.map().on('move.intro', null);
            townhall();
            context.on('enter.intro', inspectTownHall);
        }, 400));

        function townhall() {
            var hall = d3.select('.node.tag-amenity-townhall');
            var box = iD.ui.intro.pointBox(context.projection(hall.datum().loc));
            curtain.reveal(box, 'right', t('intro.navigation.select'));

            context.map().on('move.intro', function() {
                var hall = d3.select('.node.tag-amenity-townhall');
                var box = iD.ui.intro.pointBox(context.projection(hall.datum().loc));
                curtain.reveal(box, 'right', t('intro.navigation.select'), 0);
            });
        }

        function primaryRoad() {
            curtain.reveal('.tag-highway-primary', 'right', t('intro.navigation.selectstreet'));
            context.on('enter.intro', inspectRoad);
        }

        function inspectTownHall(mode) {
            if (mode.id !== 'select') return;
            context.on('enter.intro', null);
            context.map().on('move.intro', null);
            set(curtain.getReveal('.header', 'left', t('intro.navigation.header')), 700);
            set(curtain.getReveal('.tag-wrap', 'left', t('intro.navigation.pane')), 4000);
            set(primaryRoad, 7001);
        }

        function inspectRoad(mode) {
            if (mode.id !== 'select') return;
            context.on('enter.intro', null);
            set(curtain.getReveal('.header', 'left', t('intro.navigation.headerstreet')), 700);
            set(event.done, 4000);
        }

    };

    step.exit = function() {
        context.map().on('move.intro', null);
        context.on('enter.intro', null);
        timeouts.forEach(window.clearTimeout);
    };

    return d3.rebind(step, event, 'on');
};
