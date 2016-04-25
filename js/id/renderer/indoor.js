iD.Indoor = function(context) {
    var dispatch = d3.dispatch('levelChanged'),
        indoorMode = false,
        indoorLevel = '0',
        enabledFeaturesBeforeIndoor,
        features = context.features();


    function indoor() {}

    indoor.enabled = function () {
       return indoorMode;
    };

    indoor.level = function (newLevel) {
        if (newLevel) { // setter
            indoorLevel = newLevel;
            if (indoorMode)
                redraw();
            else
                indoor.toggle();
        }
        return indoorLevel;
    };

    indoor.toggle = function () {
        if (!context.surface()) { // hash calls before surface is initialized
            setTimeout(indoor.toggle, 200);
            return false;
        }

        if (indoorMode)
            disable();
        else
            enable();
    };

    indoor.levels = function () {
        return [-1, 0, 1, 1.5];
    };


    function enable() {
        indoorMode = true;

        var selectedFeatures = context.selectedIDs();
        if (selectedFeatures.length) {
            var entity = context.graph().entity(selectedFeatures[0]);
            if (entity.tags.level)
                indoorLevel = entity.tags.level.replace(/(-?\d+(\.\d+)?).+/, '$1');
        }

        enabledFeaturesBeforeIndoor = features.enabled();
        _.each(features.keys(), features.disable);
        _.each(['indoor', 'buildings', 'points', 'paths', 'traffic_roads', 'service_roads'], features.enable);

        redraw();

        if (selectedFeatures.length) {
            context.enter(iD.modes.Select(context, selectedFeatures));
        }
    }

    function disable() {
        indoorMode = false;

        _.each(_.difference(features.keys(), enabledFeaturesBeforeIndoor), features.disable);
        _.each(enabledFeaturesBeforeIndoor, features.enable);

        indoorLevel = '0';
        redraw();
    }

    function redraw() {
        context.surface().classed('indoor-mode', indoorMode);
        context.surface().classed('indoor-underground', indoorLevel < 0);
        context.surface().classed('indoor-aboveground', indoorLevel > 0);
        setBackgroundOpacity(indoorLevel < 0 ? 0.1 : 'revert');

        features.reset();
        dispatch.levelChanged(); // update hash & combo, redraw map
    }

    function setBackgroundOpacity(d) {
        var bg = context.container().selectAll('.layer-background');
        if (d === 'revert')
            d = bg.attr('data-opacity');
        bg.transition().style('opacity', d);
        if (!iD.detect().opera) {
            iD.util.setTransform(bg, 0, 0);
        }
    }


    return d3.rebind(indoor, dispatch, 'on');
};
