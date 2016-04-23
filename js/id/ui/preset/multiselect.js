iD.ui.preset.multiselect = function(field, context) {
    var dispatch = d3.dispatch('init', 'change'),
        optstrings = field.strings && field.strings.options,
        optarray = field.options,
        strings = {},
        multiselectContainer,
        combobox,
        comboboxData,
        input,
        isInitialized;

    // ensure field.key ends with a ':'
    if (field.key.match(/.*:$/) === null) {
        field.key += ':';
    }

    function getOptStringKey(val) {
        if (optstrings) {
            var match = _.find(strings, function(o) {
                return o.value === val;
            });
            return match && match.key;
        }
    }

    function getOptStringVal(key) {
        if (optstrings) {
            var match = _.find(strings, function(o) {
                return o.key === key;
            });
            return match && match.value;
        }
    }

    function objectDifference(a, b) {
        var bObj = {};
        b.forEach(function(obj){
            bObj[obj.key] = obj;
        });
        // Return all elements in a, unless in b
        return a.filter(function(obj) {
            return !(obj.key in bObj);
        });
    }

    function multiselect(selection) {
        isInitialized = false;
        combobox = d3.combobox().minItems(1);

        multiselectContainer = selection.selectAll('ul').data([0]);

        multiselectContainer.enter()
            .append('ul')
            .on('click', function() {
                window.setTimeout(function(){input.node().focus();}, 100);
            })
            .attr('class', 'form-field-multiselect');

        input = multiselectContainer.selectAll('input')
            .data([0]);

        var enter = input.enter()
            .append('input')
            .attr('type', 'text')
            .attr('id', 'preset-input-' + field.id);

        if (optstrings) { enter.attr('readonly', 'readonly'); }

        input
            .call(function() {combobox(input, selection);})
            .on('change', change)
            .on('blur', change)
            .on('focus', function() {multiselectContainer.classed('active', true);})
            .each(function() {
                if (optstrings) {
                    strings = Object.keys(optstrings).map(function(k) {
                        return {
                            key: k,
                            value: field.t('options.' + k, { 'default': optstrings[k] })
                        };
                    });
                    dispatch.init();
                    isInitialized = true;
                } else if (optarray) {
                    strings = optarray.map(function(k) {return {key: k, value: k};});
                    dispatch.init();
                    isInitialized = true;
                } else if (context.taginfo()) {
                    context.taginfo().keys({query: field.key}, function(err, data) {
                        if (!err) {
                            strings = data.map(function(k) {
                                var d = k.value.replace(field.key, '');
                                return {
                                    key: d,
                                    value: d
                                };
                            });
                            dispatch.init();
                            isInitialized = true;
                        }
                    });
                }
            });
    }

    function updateStrings(tagsData) {
        comboboxData = objectDifference(strings, tagsData);
        combobox.data(comboboxData.map(comboValues));
        input.attr('placeholder', field.placeholder() ||
            ( 'Type here'));
    }


    function update(data) {
        var chips = multiselectContainer.selectAll('.chips').data(data);

        var enter = chips.enter()
            .insert('li', 'input')
            .attr('class', 'chips');

        enter.append('span');
        enter.append('a');

        chips.select('span').text(function(d) {return d.value;});

        chips.select('a')
            .on('click', removeKey)
            .attr('class', 'remove')
            .text('×');

        chips.exit().remove();
    }

    function comboValues(d) {
        return {
            value: d.value,
            title: d.value
        };
    }

    function change() {
        multiselectContainer.classed('active', false);
        var key = getOptStringKey(input.value()) || input.value();
        if (key && key !== '') {
            var t = {};
            t[field.key + key] = 'yes';
            input.value('');
            field.keys.push(field.key + key);
            dispatch.change(t);
        }
    }

    function removeKey(d) {
        d3.event.stopPropagation();
        var t = {};
        t[field.key + d.key] = undefined;
        dispatch.change(t);
    }

    multiselect.tags = function(tags) {
        var tagsData = [];
        Object.keys(tags).forEach(function(d) {
            if (d.indexOf(field.key) > -1 && tags[d] === 'yes') {
                var datum = d.replace(field.key, '');

                if (!optstrings) {
                    return tagsData.push({
                        key: datum,
                        value: datum
                    });
                }
                // discards any pair not found in optstrings
                if (optstrings && getOptStringVal(datum)) {
                    return tagsData.push({
                        key: datum,
                        value: getOptStringVal(datum)
                    });
                }
            }
        });

        field.keys = _.map(_.pluck(tagsData, 'key'), function(v) { return field.key + v; });

        update(tagsData);

        if (isInitialized) {
            updateStrings(tagsData);
        } else {
            dispatch.on('init', function () {
                updateStrings(tagsData);
            });
        }
    };

    multiselect.focus = function() {
        input.node().focus();
    };

    return d3.rebind(multiselect, dispatch, 'on');
};
