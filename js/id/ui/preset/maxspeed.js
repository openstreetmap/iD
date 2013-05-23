iD.ui.preset.maxspeed = function(field, context) {

    var event = d3.dispatch('change'),
        entity,
        imperial,
        unitInput,
        combobox,
        input;

    var metricValues = [20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120],
        imperialValues = [20, 25, 30, 40, 45, 50, 55, 65, 70];

    function maxspeed(selection) {
        combobox = d3.combobox();
        var unitCombobox = d3.combobox().data(['km/h', 'mph'].map(comboValues));

        input = selection.append('input')
            .attr('type', 'text')
            .attr('id', 'preset-input-' + field.id)
            .on('change', change)
            .on('blur', change)
            .call(combobox);

        var childNodes = context.graph().childNodes(context.entity(entity.id)),
            loc = childNodes[~~(childNodes.length/2)].loc;

        imperial = _.any(iD.data.imperial.features, function(f) {
            return _.any(f.geometry.coordinates, function(d) {
                return iD.geo.pointInPolygon(loc, d[0]);
            });
        });

        unitInput = selection.append('input')
            .attr('type', 'text')
            .attr('class', 'maxspeed-unit')
            .on('blur', changeUnits)
            .on('change', changeUnits)
            .call(unitCombobox);

        function changeUnits() {
            imperial = unitInput.property('value') === 'mph';
            unitInput.property('value', imperial ? 'mph' : 'km/h');
            setSuggestions();
            change();
        }

    }

    function setSuggestions() {
        combobox.data((imperial ? imperialValues : metricValues).map(comboValues));
        unitInput.property('value', imperial ? 'mph' : 'km/h');
    }

    function comboValues(d) {
        return {
            value: d.toString(),
            title: d.toString()
        };
    }

    function change() {
        var value = input.property('value');
        var t = {};
        if (value) {
            if (isNaN(value) || !imperial) {
                t[field.key] = value;
            } else {
                t[field.key] = value + ' mph';
            }
        } else {
            t[field.key] = '';
        }
        event.change(t);
    }

    maxspeed.tags = function(tags) {
        var value = tags[field.key];

        if (value && value.indexOf('mph') >= 0) {
            value = parseInt(value, 10);
            imperial = true;
        } else if (value) {
            imperial = false;
        }

        setSuggestions();

        input.property('value', value || '');
    };

    maxspeed.focus = function() {
        input.node().focus();
    };

    maxspeed.entity = function(_) {
        entity = _;
    };

    return d3.rebind(maxspeed, event, 'on');
};
