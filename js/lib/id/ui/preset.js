(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.iD = global.iD || {}, global.iD.ui = global.iD.ui || {}, global.iD.ui.preset = global.iD.ui.preset || {})));
}(this, function (exports) { 'use strict';

  function access(field) {
      var dispatch = d3.dispatch('change'),
          items;

      function access(selection) {
          var wrap = selection.selectAll('.preset-input-wrap')
              .data([0]);

          wrap.enter().append('div')
              .attr('class', 'cf preset-input-wrap')
              .append('ul');

          items = wrap.select('ul').selectAll('li')
              .data(field.keys);

          // Enter

          var enter = items.enter().append('li')
              .attr('class', function(d) { return 'cf preset-access-' + d; });

          enter.append('span')
              .attr('class', 'col6 label preset-label-access')
              .attr('for', function(d) { return 'preset-input-access-' + d; })
              .text(function(d) { return field.t('types.' + d); });

          enter.append('div')
              .attr('class', 'col6 preset-input-access-wrap')
              .append('input')
              .attr('type', 'text')
              .attr('class', 'preset-input-access')
              .attr('id', function(d) { return 'preset-input-access-' + d; })
              .each(function(d) {
                  d3.select(this)
                      .call(d3.combobox()
                          .data(access.options(d)));
              });

          // Update

          wrap.selectAll('.preset-input-access')
              .on('change', change)
              .on('blur', change);
      }

      function change(d) {
          var tag = {};
          tag[d] = d3.select(this).value() || undefined;
          dispatch.change(tag);
      }

      access.options = function(type) {
          var options = ['no', 'permissive', 'private', 'destination'];

          if (type !== 'access') {
              options.unshift('yes');
              options.push('designated');

              if (type === 'bicycle') {
                  options.push('dismount');
              }
          }

          return options.map(function(option) {
              return {
                  title: field.t('options.' + option + '.description'),
                  value: option
              };
          });
      };

      var placeholders = {
          footway: {
              foot: 'designated',
              motor_vehicle: 'no'
          },
          steps: {
              foot: 'yes',
              motor_vehicle: 'no',
              bicycle: 'no',
              horse: 'no'
          },
          pedestrian: {
              foot: 'yes',
              motor_vehicle: 'no'
          },
          cycleway: {
              motor_vehicle: 'no',
              bicycle: 'designated'
          },
          bridleway: {
              motor_vehicle: 'no',
              horse: 'designated'
          },
          path: {
              foot: 'yes',
              motor_vehicle: 'no',
              bicycle: 'yes',
              horse: 'yes'
          },
          motorway: {
              foot: 'no',
              motor_vehicle: 'yes',
              bicycle: 'no',
              horse: 'no'
          },
          trunk: {
              motor_vehicle: 'yes'
          },
          primary: {
              foot: 'yes',
              motor_vehicle: 'yes',
              bicycle: 'yes',
              horse: 'yes'
          },
          secondary: {
              foot: 'yes',
              motor_vehicle: 'yes',
              bicycle: 'yes',
              horse: 'yes'
          },
          tertiary: {
              foot: 'yes',
              motor_vehicle: 'yes',
              bicycle: 'yes',
              horse: 'yes'
          },
          residential: {
              foot: 'yes',
              motor_vehicle: 'yes',
              bicycle: 'yes',
              horse: 'yes'
          },
          unclassified: {
              foot: 'yes',
              motor_vehicle: 'yes',
              bicycle: 'yes',
              horse: 'yes'
          },
          service: {
              foot: 'yes',
              motor_vehicle: 'yes',
              bicycle: 'yes',
              horse: 'yes'
          },
          motorway_link: {
              foot: 'no',
              motor_vehicle: 'yes',
              bicycle: 'no',
              horse: 'no'
          },
          trunk_link: {
              motor_vehicle: 'yes'
          },
          primary_link: {
              foot: 'yes',
              motor_vehicle: 'yes',
              bicycle: 'yes',
              horse: 'yes'
          },
          secondary_link: {
              foot: 'yes',
              motor_vehicle: 'yes',
              bicycle: 'yes',
              horse: 'yes'
          },
          tertiary_link: {
              foot: 'yes',
              motor_vehicle: 'yes',
              bicycle: 'yes',
              horse: 'yes'
          }
      };

      access.tags = function(tags) {
          items.selectAll('.preset-input-access')
              .value(function(d) { return tags[d] || ''; })
              .attr('placeholder', function() {
                  return tags.access ? tags.access : field.placeholder();
              });

          // items.selectAll('#preset-input-access-access')
          //     .attr('placeholder', 'yes');

          _.forEach(placeholders[tags.highway], function(v, k) {
              items.selectAll('#preset-input-access-' + k)
                  .attr('placeholder', function() { return (tags.access || v); });
          });
      };

      access.focus = function() {
          items.selectAll('.preset-input-access')
              .node().focus();
      };

      return d3.rebind(access, dispatch, 'on');
  }

  function address(field, context) {
      var dispatch = d3.dispatch('init', 'change'),
          wrap,
          entity,
          isInitialized;

      var widths = {
          housenumber: 1/3,
          street: 2/3,
          city: 2/3,
          state: 1/4,
          postcode: 1/3
      };

      function getStreets() {
          var extent = entity.extent(context.graph()),
              l = extent.center(),
              box = iD.geo.Extent(l).padByMeters(200);

          return context.intersects(box)
              .filter(isAddressable)
              .map(function(d) {
                  var loc = context.projection([
                      (extent[0][0] + extent[1][0]) / 2,
                      (extent[0][1] + extent[1][1]) / 2]),
                      choice = iD.geo.chooseEdge(context.childNodes(d), loc, context.projection);
                  return {
                      title: d.tags.name,
                      value: d.tags.name,
                      dist: choice.distance
                  };
              }).sort(function(a, b) {
                  return a.dist - b.dist;
              });

          function isAddressable(d) {
              return d.tags.highway && d.tags.name && d.type === 'way';
          }
      }

      function getCities() {
          var extent = entity.extent(context.graph()),
              l = extent.center(),
              box = iD.geo.Extent(l).padByMeters(200);

          return context.intersects(box)
              .filter(isAddressable)
              .map(function(d) {
                  return {
                      title: d.tags['addr:city'] || d.tags.name,
                      value: d.tags['addr:city'] || d.tags.name,
                      dist: iD.geo.sphericalDistance(d.extent(context.graph()).center(), l)
                  };
              }).sort(function(a, b) {
                  return a.dist - b.dist;
              });

          function isAddressable(d) {
              if (d.tags.name &&
                  (d.tags.admin_level === '8' || d.tags.border_type === 'city'))
                  return true;

              if (d.tags.place && d.tags.name && (
                      d.tags.place === 'city' ||
                      d.tags.place === 'town' ||
                      d.tags.place === 'village'))
                  return true;

              if (d.tags['addr:city']) return true;

              return false;
          }
      }

      function getPostCodes() {
          var extent = entity.extent(context.graph()),
              l = extent.center(),
              box = iD.geo.Extent(l).padByMeters(200);

          return context.intersects(box)
              .filter(isAddressable)
              .map(function(d) {
                  return {
                      title: d.tags['addr:postcode'],
                      value: d.tags['addr:postcode'],
                      dist: iD.geo.sphericalDistance(d.extent(context.graph()).center(), l)
                  };
              }).sort(function(a, b) {
                  return a.dist - b.dist;
              });

          function isAddressable(d) {
              return d.tags['addr:postcode'];
          }
      }

      function address(selection) {
          isInitialized = false;

          wrap = selection.selectAll('.preset-input-wrap')
              .data([0]);

          // Enter

          wrap.enter()
              .append('div')
              .attr('class', 'preset-input-wrap');

          var center = entity.extent(context.graph()).center(),
              addressFormat;

          iD.services.nominatim().countryCode(center, function (err, countryCode) {
              addressFormat = _.find(iD.data.addressFormats, function (a) {
                  return a && a.countryCodes && _.includes(a.countryCodes, countryCode);
              }) || _.first(iD.data.addressFormats);

              function row(r) {
                  // Normalize widths.
                  var total = _.reduce(r, function(sum, field) {
                      return sum + (widths[field] || 0.5);
                  }, 0);

                  return r.map(function (field) {
                      return {
                          id: field,
                          width: (widths[field] || 0.5) / total
                      };
                  });
              }

              wrap.selectAll('div')
                  .data(addressFormat.format)
                  .enter()
                  .append('div')
                  .attr('class', 'addr-row')
                  .selectAll('input')
                  .data(row)
                  .enter()
                  .append('input')
                  .property('type', 'text')
                  .attr('placeholder', function (d) { return field.t('placeholders.' + d.id); })
                  .attr('class', function (d) { return 'addr-' + d.id; })
                  .style('width', function (d) { return d.width * 100 + '%'; });

              // Update

              wrap.selectAll('.addr-street')
                  .call(d3.combobox()
                      .fetcher(function(value, callback) {
                          callback(getStreets());
                      }));

              wrap.selectAll('.addr-city')
                  .call(d3.combobox()
                      .fetcher(function(value, callback) {
                          callback(getCities());
                      }));

              wrap.selectAll('.addr-postcode')
                  .call(d3.combobox()
                      .fetcher(function(value, callback) {
                          callback(getPostCodes());
                      }));

              wrap.selectAll('input')
                  .on('blur', change())
                  .on('change', change());

              wrap.selectAll('input:not(.combobox-input)')
                  .on('input', change(true));

              dispatch.init();
              isInitialized = true;
          });
      }

      function change(onInput) {
          return function() {
              var tags = {};

              wrap.selectAll('input')
                  .each(function (field) {
                      tags['addr:' + field.id] = this.value || undefined;
                  });

              dispatch.change(tags, onInput);
          };
      }

      function updateTags(tags) {
          wrap.selectAll('input')
              .value(function (field) {
                  return tags['addr:' + field.id] || '';
              });
      }

      address.entity = function(_) {
          if (!arguments.length) return entity;
          entity = _;
          return address;
      };

      address.tags = function(tags) {
          if (isInitialized) {
              updateTags(tags);
          } else {
              dispatch.on('init', function () {
                  updateTags(tags);
              });
          }
      };

      address.focus = function() {
          var node = wrap.selectAll('input').node();
          if (node) node.focus();
      };

      return d3.rebind(address, dispatch, 'on');
  }

  function check(field) {
      var dispatch = d3.dispatch('change'),
          options = field.strings && field.strings.options,
          values = [],
          texts = [],
          entity, value, box, text, label;

      if (options) {
          for (var k in options) {
              values.push(k === 'undefined' ? undefined : k);
              texts.push(field.t('options.' + k, { 'default': options[k] }));
          }
      } else {
          values = [undefined, 'yes'];
          texts = [t('inspector.unknown'), t('inspector.check.yes')];
          if (field.type === 'check') {
              values.push('no');
              texts.push(t('inspector.check.no'));
          }
      }

      var check = function(selection) {
          // hack: pretend oneway field is a oneway_yes field
          // where implied oneway tag exists (e.g. `junction=roundabout`) #2220, #1841
          if (field.id === 'oneway') {
              for (var key in entity.tags) {
                  if (key in iD.oneWayTags && (entity.tags[key] in iD.oneWayTags[key])) {
                      texts[0] = t('presets.fields.oneway_yes.options.undefined');
                      break;
                  }
              }
          }

          selection.classed('checkselect', 'true');

          label = selection.selectAll('.preset-input-wrap')
              .data([0]);

          var enter = label.enter().append('label')
              .attr('class', 'preset-input-wrap');

          enter.append('input')
              .property('indeterminate', field.type === 'check')
              .attr('type', 'checkbox')
              .attr('id', 'preset-input-' + field.id);

          enter.append('span')
              .text(texts[0])
              .attr('class', 'value');

          box = label.select('input')
              .on('click', function() {
                  var t = {};
                  t[field.key] = values[(values.indexOf(value) + 1) % values.length];
                  dispatch.change(t);
                  d3.event.stopPropagation();
              });

          text = label.select('span.value');
      };

      check.entity = function(_) {
          if (!arguments.length) return entity;
          entity = _;
          return check;
      };

      check.tags = function(tags) {
          value = tags[field.key];
          box.property('indeterminate', field.type === 'check' && !value);
          box.property('checked', value === 'yes');
          text.text(texts[values.indexOf(value)]);
          label.classed('set', !!value);
      };

      check.focus = function() {
          box.node().focus();
      };

      return d3.rebind(check, dispatch, 'on');
  }

  function combo(field, context) {
      var dispatch = d3.dispatch('change'),
          isMulti = (field.type === 'multiCombo'),
          optstrings = field.strings && field.strings.options,
          optarray = field.options,
          snake_case = (field.snake_case || (field.snake_case === undefined)),
          combobox = d3.combobox().minItems(isMulti ? 1 : 2),
          comboData = [],
          multiData = [],
          container,
          input,
          entity;

      // ensure multiCombo field.key ends with a ':'
      if (isMulti && field.key.match(/:$/) === null) {
          field.key += ':';
      }


      function snake(s) {
          return s.replace(/\s+/g, '_');
      }

      function unsnake(s) {
          return s.replace(/_+/g, ' ');
      }

      function clean(s) {
          return s.split(';')
              .map(function(s) { return s.trim(); })
              .join(';');
      }


      // returns the tag value for a display value
      // (for multiCombo, dval should be the key suffix, not the entire key)
      function tagValue(dval) {
          dval = clean(dval || '');

          if (optstrings) {
              var match = _.find(comboData, function(o) {
                  return o.key && clean(o.value) === dval;
              });
              if (match) {
                  return match.key;
              }
          }

          if (field.type === 'typeCombo' && !dval) {
              return 'yes';
          }

          return (snake_case ? snake(dval) : dval) || undefined;
      }


      // returns the display value for a tag value
      // (for multiCombo, tval should be the key suffix, not the entire key)
      function displayValue(tval) {
          tval = tval || '';

          if (optstrings) {
              var match = _.find(comboData, function(o) { return o.key === tval && o.value; });
              if (match) {
                  return match.value;
              }
          }

          if (field.type === 'typeCombo' && tval.toLowerCase() === 'yes') {
              return '';
          }

          return snake_case ? unsnake(tval) : tval;
      }


      function objectDifference(a, b) {
          return _.reject(a, function(d1) {
              return _.some(b, function(d2) { return d1.value === d2.value; });
          });
      }


      function initCombo(selection, attachTo) {
          if (optstrings) {
              selection.attr('readonly', 'readonly');
              selection.call(combobox, attachTo);
              setStaticValues(setPlaceholder);

          } else if (optarray) {
              selection.call(combobox, attachTo);
              setStaticValues(setPlaceholder);

          } else if (context.taginfo()) {
              selection.call(combobox.fetcher(setTaginfoValues), attachTo);
              setTaginfoValues('', setPlaceholder);
          }
      }


      function setStaticValues(callback) {
          if (!(optstrings || optarray)) return;

          if (optstrings) {
              comboData = Object.keys(optstrings).map(function(k) {
                  var v = field.t('options.' + k, { 'default': optstrings[k] });
                  return {
                      key: k,
                      value: v,
                      title: v
                  };
              });

          } else if (optarray) {
              comboData = optarray.map(function(k) {
                  var v = snake_case ? unsnake(k) : k;
                  return {
                      key: k,
                      value: v,
                      title: v
                  };
              });
          }

          combobox.data(objectDifference(comboData, multiData));
          if (callback) callback(comboData);
      }


      function setTaginfoValues(q, callback) {
          var fn = isMulti ? 'multikeys' : 'values';
          context.taginfo()[fn]({
              debounce: true,
              key: field.key,
              geometry: context.geometry(entity.id),
              query: (isMulti ? field.key : '') + q
          }, function(err, data) {
              if (err) return;
              comboData = _.map(data, 'value').map(function(k) {
                  if (isMulti) k = k.replace(field.key, '');
                  var v = snake_case ? unsnake(k) : k;
                  return {
                      key: k,
                      value: v,
                      title: v
                  };
              });
              comboData = objectDifference(comboData, multiData);
              if (callback) callback(comboData);
          });
      }


      function setPlaceholder(d) {
          var ph;
          if (isMulti) {
              ph = field.placeholder() || t('inspector.add');
          } else {
              var vals = _.map(d, 'value').filter(function(s) { return s.length < 20; }),
                  placeholders = vals.length > 1 ? vals : _.map(d, 'key');
              ph = field.placeholder() || placeholders.slice(0, 3).join(', ');
          }

          input.attr('placeholder', ph + '…');
      }


      function change() {
          var val = tagValue(input.value()),
              t = {};

          if (isMulti) {
              if (!val) return;
              container.classed('active', false);
              input.value('');
              field.keys.push(field.key + val);
              t[field.key + val] = 'yes';
              window.setTimeout(function() { input.node().focus(); }, 10);

          } else {
              t[field.key] = val;
          }

          dispatch.change(t);
      }


      function removeMultikey(d) {
          d3.event.stopPropagation();
          var t = {};
          t[d.key] = undefined;
          dispatch.change(t);
      }


      function combo(selection) {
          if (isMulti) {
              container = selection.selectAll('ul').data([0]);

              container.enter()
                  .append('ul')
                  .attr('class', 'form-field-multicombo')
                  .on('click', function() {
                      window.setTimeout(function() { input.node().focus(); }, 10);
                  });

          } else {
              container = selection;
          }

          input = container.selectAll('input')
              .data([0]);

          input.enter()
              .append('input')
              .attr('type', 'text')
              .attr('id', 'preset-input-' + field.id)
              .call(initCombo, selection);

          input
              .on('change', change)
              .on('blur', change);

          if (isMulti) {
              combobox
                  .on('accept', function() {
                      input.node().blur();
                      input.node().focus();
                  });

              input
                  .on('focus', function() { container.classed('active', true); });
          }
      }


      combo.tags = function(tags) {
          if (isMulti) {
              multiData = [];

              // Build multiData array containing keys already set..
              Object.keys(tags).forEach(function(key) {
                  if (key.indexOf(field.key) !== 0 || tags[key].toLowerCase() !== 'yes') return;

                  var suffix = key.substring(field.key.length);
                  multiData.push({
                      key: key,
                      value: displayValue(suffix)
                  });
              });

              // Set keys for form-field modified (needed for undo and reset buttons)..
              field.keys = _.map(multiData, 'key');

              // Exclude existing multikeys from combo options..
              var available = objectDifference(comboData, multiData);
              combobox.data(available);

              // Hide "Add" button if this field uses fixed set of
              // translateable optstrings and they're all currently used..
              container.selectAll('.combobox-input, .combobox-caret')
                  .classed('hide', optstrings && !available.length);


              // Render chips
              var chips = container.selectAll('.chips').data(multiData);

              var enter = chips.enter()
                  .insert('li', 'input')
                  .attr('class', 'chips');

              enter.append('span');
              enter.append('a');

              chips.select('span')
                  .text(function(d) { return d.value; });

              chips.select('a')
                  .on('click', removeMultikey)
                  .attr('class', 'remove')
                  .text('×');

              chips.exit()
                  .remove();

          } else {
              input.value(displayValue(tags[field.key]));
          }
      };


      combo.focus = function() {
          input.node().focus();
      };


      combo.entity = function(_) {
          if (!arguments.length) return entity;
          entity = _;
          return combo;
      };


      return d3.rebind(combo, dispatch, 'on');
  }

  function cycleway(field) {
      var dispatch = d3.dispatch('change'),
          items;

      function cycleway(selection) {
          var wrap = selection.selectAll('.preset-input-wrap')
              .data([0]);

          wrap.enter().append('div')
              .attr('class', 'cf preset-input-wrap')
              .append('ul');

          items = wrap.select('ul').selectAll('li')
              .data(field.keys);

          // Enter

          var enter = items.enter().append('li')
              .attr('class', function(d) { return 'cf preset-cycleway-' + d; });

          enter.append('span')
              .attr('class', 'col6 label preset-label-cycleway')
              .attr('for', function(d) { return 'preset-input-cycleway-' + d; })
              .text(function(d) { return field.t('types.' + d); });

          enter.append('div')
              .attr('class', 'col6 preset-input-cycleway-wrap')
              .append('input')
              .attr('type', 'text')
              .attr('class', 'preset-input-cycleway')
              .attr('id', function(d) { return 'preset-input-cycleway-' + d; })
              .each(function(d) {
                  d3.select(this)
                      .call(d3.combobox()
                          .data(cycleway.options(d)));
              });

          // Update

          wrap.selectAll('.preset-input-cycleway')
              .on('change', change)
              .on('blur', change);
      }

      function change() {
          var inputs = d3.selectAll('.preset-input-cycleway')[0],
              left = d3.select(inputs[0]).value(),
              right = d3.select(inputs[1]).value(),
              tag = {};
          if (left === 'none' || left === '') { left = undefined; }
          if (right === 'none' || right === '') { right = undefined; }

          // Always set both left and right as changing one can affect the other
          tag = {
              cycleway: undefined,
              'cycleway:left': left,
              'cycleway:right': right
          };

          // If the left and right tags match, use the cycleway tag to tag both
          // sides the same way
          if (left === right) {
              tag = {
                  cycleway: left,
                  'cycleway:left': undefined,
                  'cycleway:right': undefined
              };
          }

          dispatch.change(tag);
      }

      cycleway.options = function() {
          return d3.keys(field.strings.options).map(function(option) {
              return {
                  title: field.t('options.' + option + '.description'),
                  value: option
              };
          });
      };

      cycleway.tags = function(tags) {
          items.selectAll('.preset-input-cycleway')
              .value(function(d) {
                  // If cycleway is set, always return that
                  if (tags.cycleway) {
                      return tags.cycleway;
                  }
                  return tags[d] || '';
              })
              .attr('placeholder', field.placeholder());
      };

      cycleway.focus = function() {
          items.selectAll('.preset-input-cycleway')
              .node().focus();
      };

      return d3.rebind(cycleway, dispatch, 'on');
  }

  function url(field, context) {

      var dispatch = d3.dispatch('change'),
          input,
          entity;

      function i(selection) {
          var fieldId = 'preset-input-' + field.id;

          input = selection.selectAll('input')
              .data([0]);

          input.enter().append('input')
              .attr('type', field.type)
              .attr('id', fieldId)
              .attr('placeholder', field.placeholder() || t('inspector.unknown'));

          input
              .on('input', change(true))
              .on('blur', change())
              .on('change', change());

          if (field.type === 'tel') {
              var center = entity.extent(context.graph()).center();
              iD.services.nominatim().countryCode(center, function (err, countryCode) {
                  if (err || !iD.data.phoneFormats[countryCode]) return;
                  selection.selectAll('#' + fieldId)
                      .attr('placeholder', iD.data.phoneFormats[countryCode]);
              });

          } else if (field.type === 'number') {
              input.attr('type', 'text');

              var spinControl = selection.selectAll('.spin-control')
                  .data([0]);

              var enter = spinControl.enter().append('div')
                  .attr('class', 'spin-control');

              enter.append('button')
                  .datum(1)
                  .attr('class', 'increment')
                  .attr('tabindex', -1);

              enter.append('button')
                  .datum(-1)
                  .attr('class', 'decrement')
                  .attr('tabindex', -1);

              spinControl.selectAll('button')
                  .on('click', function(d) {
                      d3.event.preventDefault();
                      var num = parseInt(input.node().value || 0, 10);
                      if (!isNaN(num)) input.node().value = num + d;
                      change()();
                  });
          }
      }

      function change(onInput) {
          return function() {
              var t = {};
              t[field.key] = input.value() || undefined;
              dispatch.change(t, onInput);
          };
      }

      i.entity = function(_) {
          if (!arguments.length) return entity;
          entity = _;
          return i;
      };

      i.tags = function(tags) {
          input.value(tags[field.key] || '');
      };

      i.focus = function() {
          var node = input.node();
          if (node) node.focus();
      };

      return d3.rebind(i, dispatch, 'on');
  }

  function localized(field, context) {
      var dispatch = d3.dispatch('change', 'input'),
          wikipedia = iD.services.wikipedia(),
          input, localizedInputs, wikiTitles,
          entity;

      function localized(selection) {
          input = selection.selectAll('.localized-main')
              .data([0]);

          input.enter().append('input')
              .attr('type', 'text')
              .attr('id', 'preset-input-' + field.id)
              .attr('class', 'localized-main')
              .attr('placeholder', field.placeholder());

          if (field.id === 'name') {
              var preset = context.presets().match(entity, context.graph());
              input.call(d3.combobox().fetcher(
                  iD.util.SuggestNames(preset, iD.data.suggestions)
              ));
          }

          input
              .on('input', change(true))
              .on('blur', change())
              .on('change', change());

          var translateButton = selection.selectAll('.localized-add')
              .data([0]);

          translateButton.enter()
              .append('button')
              .attr('class', 'button-input-action localized-add minor')
              .attr('tabindex', -1)
              .call(iD.svg.Icon('#icon-plus'))
              .call(bootstrap.tooltip()
                  .title(t('translate.translate'))
                  .placement('left'));

          translateButton
              .on('click', addNew);

          localizedInputs = selection.selectAll('.localized-wrap')
              .data([0]);

          localizedInputs.enter().append('div')
              .attr('class', 'localized-wrap');
      }

      function addNew() {
          d3.event.preventDefault();
          var data = localizedInputs.selectAll('div.entry').data();
          var defaultLang = iD.detect().locale.toLowerCase().split('-')[0];
          var langExists = _.find(data, function(datum) { return datum.lang === defaultLang;});
          var isLangEn = defaultLang.indexOf('en') > -1;
          if (isLangEn || langExists) {
            defaultLang = '';
          }
          data.push({ lang: defaultLang, value: '' });
          localizedInputs.call(render, data);
      }

      function change(onInput) {
          return function() {
              var t = {};
              t[field.key] = d3.select(this).value() || undefined;
              dispatch.change(t, onInput);
          };
      }

      function key(lang) { return field.key + ':' + lang; }

      function changeLang(d) {
          var lang = d3.select(this).value(),
              t = {},
              language = _.find(iD.data.wikipedia, function(d) {
                  return d[0].toLowerCase() === lang.toLowerCase() ||
                      d[1].toLowerCase() === lang.toLowerCase();
              });

          if (language) lang = language[2];

          if (d.lang && d.lang !== lang) {
              t[key(d.lang)] = undefined;
          }

          var value = d3.select(this.parentNode)
              .selectAll('.localized-value')
              .value();

          if (lang && value) {
              t[key(lang)] = value;
          } else if (lang && wikiTitles && wikiTitles[d.lang]) {
              t[key(lang)] = wikiTitles[d.lang];
          }

          d.lang = lang;
          dispatch.change(t);
      }

      function changeValue(d) {
          if (!d.lang) return;
          var t = {};
          t[key(d.lang)] = d3.select(this).value() || undefined;
          dispatch.change(t);
      }

      function fetcher(value, cb) {
          var v = value.toLowerCase();

          cb(iD.data.wikipedia.filter(function(d) {
              return d[0].toLowerCase().indexOf(v) >= 0 ||
              d[1].toLowerCase().indexOf(v) >= 0 ||
              d[2].toLowerCase().indexOf(v) >= 0;
          }).map(function(d) {
              return { value: d[1] };
          }));
      }

      function render(selection, data) {
          var wraps = selection.selectAll('div.entry').
              data(data, function(d) { return d.lang; });

          var innerWrap = wraps.enter()
              .insert('div', ':first-child');

          innerWrap.attr('class', 'entry')
              .each(function() {
                  var wrap = d3.select(this);
                  var langcombo = d3.combobox().fetcher(fetcher).minItems(0);

                  var label = wrap.append('label')
                      .attr('class','form-label')
                      .text(t('translate.localized_translation_label'))
                      .attr('for','localized-lang');

                  label.append('button')
                      .attr('class', 'minor remove')
                      .on('click', function(d){
                          d3.event.preventDefault();
                          var t = {};
                          t[key(d.lang)] = undefined;
                          dispatch.change(t);
                          d3.select(this.parentNode.parentNode)
                              .style('top','0')
                              .style('max-height','240px')
                              .transition()
                              .style('opacity', '0')
                              .style('max-height','0px')
                              .remove();
                      })
                      .call(iD.svg.Icon('#operation-delete'));

                  wrap.append('input')
                      .attr('class', 'localized-lang')
                      .attr('type', 'text')
                      .attr('placeholder',t('translate.localized_translation_language'))
                      .on('blur', changeLang)
                      .on('change', changeLang)
                      .call(langcombo);

                  wrap.append('input')
                      .on('blur', changeValue)
                      .on('change', changeValue)
                      .attr('type', 'text')
                      .attr('placeholder', t('translate.localized_translation_name'))
                      .attr('class', 'localized-value');
              });

          innerWrap
              .style('margin-top', '0px')
              .style('max-height', '0px')
              .style('opacity', '0')
              .transition()
              .duration(200)
              .style('margin-top', '10px')
              .style('max-height', '240px')
              .style('opacity', '1')
              .each('end', function() {
                  d3.select(this)
                      .style('max-height', '')
                      .style('overflow', 'visible');
              });

          wraps.exit()
              .transition()
              .duration(200)
              .style('max-height','0px')
              .style('opacity', '0')
              .style('top','-10px')
              .remove();

          var entry = selection.selectAll('.entry');

          entry.select('.localized-lang')
              .value(function(d) {
                  var lang = _.find(iD.data.wikipedia, function(lang) { return lang[2] === d.lang; });
                  return lang ? lang[1] : d.lang;
              });

          entry.select('.localized-value')
              .value(function(d) { return d.value; });
      }

      localized.tags = function(tags) {
          // Fetch translations from wikipedia
          if (tags.wikipedia && !wikiTitles) {
              wikiTitles = {};
              var wm = tags.wikipedia.match(/([^:]+):(.+)/);
              if (wm && wm[0] && wm[1]) {
                  wikipedia.translations(wm[1], wm[2], function(d) {
                      wikiTitles = d;
                  });
              }
          }

          input.value(tags[field.key] || '');

          var postfixed = [], k, m;
          for (k in tags) {
              m = k.match(/^(.*):([a-zA-Z_-]+)$/);
              if (m && m[1] === field.key && m[2]) {
                  postfixed.push({ lang: m[2], value: tags[k] });
              }
          }

          localizedInputs.call(render, postfixed.reverse());
      };

      localized.focus = function() {
          input.node().focus();
      };

      localized.entity = function(_) {
          if (!arguments.length) return entity;
          entity = _;
          return localized;
      };

      return d3.rebind(localized, dispatch, 'on');
  }

  function maxspeed(field, context) {
      var dispatch = d3.dispatch('change'),
          entity,
          imperial,
          unitInput,
          combobox,
          input;

      var metricValues = [20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120],
          imperialValues = [20, 25, 30, 35, 40, 45, 50, 55, 65, 70];

      function maxspeed(selection) {
          combobox = d3.combobox();
          var unitCombobox = d3.combobox().data(['km/h', 'mph'].map(comboValues));

          input = selection.selectAll('#preset-input-' + field.id)
              .data([0]);

          input.enter().append('input')
              .attr('type', 'text')
              .attr('id', 'preset-input-' + field.id)
              .attr('placeholder', field.placeholder());

          input
              .call(combobox)
              .on('change', change)
              .on('blur', change);

          var childNodes = context.graph().childNodes(context.entity(entity.id)),
              loc = childNodes[~~(childNodes.length/2)].loc;

          imperial = _.some(iD.data.imperial.features, function(f) {
              return _.some(f.geometry.coordinates, function(d) {
                  return iD.geo.pointInPolygon(loc, d);
              });
          });

          unitInput = selection.selectAll('input.maxspeed-unit')
              .data([0]);

          unitInput.enter().append('input')
              .attr('type', 'text')
              .attr('class', 'maxspeed-unit');

          unitInput
              .on('blur', changeUnits)
              .on('change', changeUnits)
              .call(unitCombobox);

          function changeUnits() {
              imperial = unitInput.value() === 'mph';
              unitInput.value(imperial ? 'mph' : 'km/h');
              setSuggestions();
              change();
          }

      }

      function setSuggestions() {
          combobox.data((imperial ? imperialValues : metricValues).map(comboValues));
          unitInput.value(imperial ? 'mph' : 'km/h');
      }

      function comboValues(d) {
          return {
              value: d.toString(),
              title: d.toString()
          };
      }

      function change() {
          var tag = {},
              value = input.value();

          if (!value) {
              tag[field.key] = undefined;
          } else if (isNaN(value) || !imperial) {
              tag[field.key] = value;
          } else {
              tag[field.key] = value + ' mph';
          }

          dispatch.change(tag);
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

          input.value(value || '');
      };

      maxspeed.focus = function() {
          input.node().focus();
      };

      maxspeed.entity = function(_) {
          entity = _;
      };

      return d3.rebind(maxspeed, dispatch, 'on');
  }

  function radio(field) {
      var dispatch = d3.dispatch('change'),
          labels, radios, placeholder;

      function radio(selection) {
          selection.classed('preset-radio', true);

          var wrap = selection.selectAll('.preset-input-wrap')
              .data([0]);

          var buttonWrap = wrap.enter().append('div')
              .attr('class', 'preset-input-wrap toggle-list');

          buttonWrap.append('span')
              .attr('class', 'placeholder');

          placeholder = selection.selectAll('.placeholder');

          labels = wrap.selectAll('label')
              .data(field.options || field.keys);

          var enter = labels.enter().append('label');

          enter.append('input')
              .attr('type', 'radio')
              .attr('name', field.id)
              .attr('value', function(d) { return field.t('options.' + d, { 'default': d }); })
              .attr('checked', false);

          enter.append('span')
              .text(function(d) { return field.t('options.' + d, { 'default': d }); });

          radios = labels.selectAll('input')
              .on('change', change);
      }

      function change() {
          var t = {};
          if (field.key) t[field.key] = undefined;
          radios.each(function(d) {
              var active = d3.select(this).property('checked');
              if (field.key) {
                  if (active) t[field.key] = d;
              } else {
                  t[d] = active ? 'yes' : undefined;
              }
          });
          dispatch.change(t);
      }

      radio.tags = function(tags) {
          function checked(d) {
              if (field.key) {
                  return tags[field.key] === d;
              } else {
                  return !!(tags[d] && tags[d] !== 'no');
              }
          }

          labels.classed('active', checked);
          radios.property('checked', checked);
          var selection = radios.filter(function() { return this.checked; });
          if (selection.empty()) {
              placeholder.text(t('inspector.none'));
          } else {
              placeholder.text(selection.attr('value'));
          }
      };

      radio.focus = function() {
          radios.node().focus();
      };

      return d3.rebind(radio, dispatch, 'on');
  }

  function restrictions(field, context) {
      var dispatch = d3.dispatch('change'),
          hover = iD.behavior.Hover(context),
          vertexID,
          fromNodeID;


      function restrictions(selection) {
          // if form field is hidden or has detached from dom, clean up.
          if (!d3.select('.inspector-wrap.inspector-hidden').empty() || !selection.node().parentNode) {
              selection.call(restrictions.off);
              return;
          }

          var wrap = selection.selectAll('.preset-input-wrap')
              .data([0]);

          var enter = wrap.enter()
              .append('div')
              .attr('class', 'preset-input-wrap');

          enter
              .append('div')
              .attr('class', 'restriction-help');


          var intersection = iD.geo.Intersection(context.graph(), vertexID),
              graph = intersection.graph,
              vertex = graph.entity(vertexID),
              filter = d3.functor(true),
              extent = iD.geo.Extent(),
              projection = iD.geo.RawMercator();

          var d = wrap.dimensions(),
              c = [d[0] / 2, d[1] / 2],
              z = 24;

          projection
              .scale(256 * Math.pow(2, z) / (2 * Math.PI));

          var s = projection(vertex.loc);

          projection
              .translate([c[0] - s[0], c[1] - s[1]])
              .clipExtent([[0, 0], d]);

          var drawLayers = iD.svg.Layers(projection, context).only('osm').dimensions(d),
              drawVertices = iD.svg.Vertices(projection, context),
              drawLines = iD.svg.Lines(projection, context),
              drawTurns = iD.svg.Turns(projection, context);

          enter
              .call(drawLayers)
              .selectAll('.surface')
              .call(hover);


          var surface = wrap.selectAll('.surface');

          surface
              .dimensions(d)
              .call(drawVertices, graph, [vertex], filter, extent, z)
              .call(drawLines, graph, intersection.ways, filter)
              .call(drawTurns, graph, intersection.turns(fromNodeID));

          surface
              .on('click.restrictions', click)
              .on('mouseover.restrictions', mouseover)
              .on('mouseout.restrictions', mouseout);

          surface
              .selectAll('.selected')
              .classed('selected', false);

          if (fromNodeID) {
              surface
                  .selectAll('.' + intersection.highways[fromNodeID].id)
                  .classed('selected', true);
          }

          mouseout();

          context.history()
              .on('change.restrictions', render);

          d3.select(window)
              .on('resize.restrictions', function() {
                  wrap.dimensions(null);
                  render();
              });

          function click() {
              var datum = d3.event.target.__data__;
              if (datum instanceof iD.Entity) {
                  fromNodeID = intersection.adjacentNodeId(datum.id);
                  render();
              } else if (datum instanceof iD.geo.Turn) {
                  if (datum.restriction) {
                      context.perform(
                          iD.actions.UnrestrictTurn(datum, projection),
                          t('operations.restriction.annotation.delete'));
                  } else {
                      context.perform(
                          iD.actions.RestrictTurn(datum, projection),
                          t('operations.restriction.annotation.create'));
                  }
              }
          }

          function mouseover() {
              var datum = d3.event.target.__data__;
              if (datum instanceof iD.geo.Turn) {
                  var graph = context.graph(),
                      presets = context.presets(),
                      preset;

                  if (datum.restriction) {
                      preset = presets.match(graph.entity(datum.restriction), graph);
                  } else {
                      preset = presets.item('type/restriction/' +
                          iD.geo.inferRestriction(
                              graph,
                              datum.from,
                              datum.via,
                              datum.to,
                              projection));
                  }

                  wrap.selectAll('.restriction-help')
                      .text(t('operations.restriction.help.' +
                          (datum.restriction ? 'toggle_off' : 'toggle_on'),
                          {restriction: preset.name()}));
              }
          }

          function mouseout() {
              wrap.selectAll('.restriction-help')
                  .text(t('operations.restriction.help.' +
                      (fromNodeID ? 'toggle' : 'select')));
          }

          function render() {
              if (context.hasEntity(vertexID)) {
                  restrictions(selection);
              }
          }
      }

      restrictions.entity = function(_) {
          if (!vertexID || vertexID !== _.id) {
              fromNodeID = null;
              vertexID = _.id;
          }
      };

      restrictions.tags = function() {};
      restrictions.focus = function() {};

      restrictions.off = function(selection) {
          selection.selectAll('.surface')
              .call(hover.off)
              .on('click.restrictions', null)
              .on('mouseover.restrictions', null)
              .on('mouseout.restrictions', null);

          context.history()
              .on('change.restrictions', null);

          d3.select(window)
              .on('resize.restrictions', null);
      };

      return d3.rebind(restrictions, dispatch, 'on');
  }

  function textarea(field) {
      var dispatch = d3.dispatch('change'),
          input;

      function textarea(selection) {
          input = selection.selectAll('textarea')
              .data([0]);

          input.enter().append('textarea')
              .attr('id', 'preset-input-' + field.id)
              .attr('placeholder', field.placeholder() || t('inspector.unknown'))
              .attr('maxlength', 255);

          input
              .on('input', change(true))
              .on('blur', change())
              .on('change', change());
      }

      function change(onInput) {
          return function() {
              var t = {};
              t[field.key] = input.value() || undefined;
              dispatch.change(t, onInput);
          };
      }

      textarea.tags = function(tags) {
          input.value(tags[field.key] || '');
      };

      textarea.focus = function() {
          input.node().focus();
      };

      return d3.rebind(textarea, dispatch, 'on');
  }

  function wikipedia(field, context) {
      var dispatch = d3.dispatch('change'),
          wikipedia = iD.services.wikipedia(),
          wikidata = iD.services.wikidata(),
          link, entity, lang, title;

      function wiki(selection) {
          var langcombo = d3.combobox()
              .fetcher(function(value, cb) {
                  var v = value.toLowerCase();

                  cb(iD.data.wikipedia.filter(function(d) {
                      return d[0].toLowerCase().indexOf(v) >= 0 ||
                          d[1].toLowerCase().indexOf(v) >= 0 ||
                          d[2].toLowerCase().indexOf(v) >= 0;
                  }).map(function(d) {
                      return { value: d[1] };
                  }));
              });

          var titlecombo = d3.combobox()
              .fetcher(function(value, cb) {

                  if (!value) value = context.entity(entity.id).tags.name || '';
                  var searchfn = value.length > 7 ? wikipedia.search : wikipedia.suggestions;

                  searchfn(language()[2], value, function(query, data) {
                      cb(data.map(function(d) {
                          return { value: d };
                      }));
                  });
              });

          lang = selection.selectAll('input.wiki-lang')
              .data([0]);

          lang.enter().append('input')
              .attr('type', 'text')
              .attr('class', 'wiki-lang')
              .attr('placeholder', t('translate.localized_translation_language'))
              .value('English');

          lang
              .call(langcombo)
              .on('blur', changeLang)
              .on('change', changeLang);

          title = selection.selectAll('input.wiki-title')
              .data([0]);

          title.enter().append('input')
              .attr('type', 'text')
              .attr('class', 'wiki-title')
              .attr('id', 'preset-input-' + field.id);

          title
              .call(titlecombo)
              .on('blur', blur)
              .on('change', change);

          link = selection.selectAll('a.wiki-link')
              .data([0]);

          link.enter().append('a')
              .attr('class', 'wiki-link button-input-action minor')
              .attr('tabindex', -1)
              .attr('target', '_blank')
              .call(iD.svg.Icon('#icon-out-link', 'inline'));
      }

      function language() {
          var value = lang.value().toLowerCase();
          var locale = iD.detect().locale.toLowerCase();
          var localeLanguage;
          return _.find(iD.data.wikipedia, function(d) {
              if (d[2] === locale) localeLanguage = d;
              return d[0].toLowerCase() === value ||
                  d[1].toLowerCase() === value ||
                  d[2] === value;
          }) || localeLanguage || ['English', 'English', 'en'];
      }

      function changeLang() {
          lang.value(language()[1]);
          change(true);
      }

      function blur() {
          change(true);
      }

      function change(skipWikidata) {
          var value = title.value(),
              m = value.match(/https?:\/\/([-a-z]+)\.wikipedia\.org\/(?:wiki|\1-[-a-z]+)\/([^#]+)(?:#(.+))?/),
              l = m && _.find(iD.data.wikipedia, function(d) { return m[1] === d[2]; }),
              anchor,
              syncTags = {};

          if (l) {
              // Normalize title http://www.mediawiki.org/wiki/API:Query#Title_normalization
              value = decodeURIComponent(m[2]).replace(/_/g, ' ');
              if (m[3]) {
                  try {
                      // Best-effort `anchordecode:` implementation
                      anchor = decodeURIComponent(m[3].replace(/\.([0-9A-F]{2})/g, '%$1'));
                  } catch (e) {
                      anchor = decodeURIComponent(m[3]);
                  }
                  value += '#' + anchor.replace(/_/g, ' ');
              }
              value = value.slice(0, 1).toUpperCase() + value.slice(1);
              lang.value(l[1]);
              title.value(value);
          }

          syncTags.wikipedia = value ? language()[2] + ':' + value : undefined;
          if (!skipWikidata) {
              syncTags.wikidata = undefined;
          }

          dispatch.change(syncTags);


          if (skipWikidata || !value || !language()[2]) return;

          // attempt asynchronous update of wikidata tag..
          var initEntityId = entity.id,
              initWikipedia = context.entity(initEntityId).tags.wikipedia;

          wikidata.itemsByTitle(language()[2], value, function (title, data) {
              // 1. most recent change was a tag change
              var annotation = t('operations.change_tags.annotation'),
                  currAnnotation = context.history().undoAnnotation();
              if (currAnnotation !== annotation) return;

              // 2. same entity exists and still selected
              var selectedIds = context.selectedIDs(),
                  currEntityId = selectedIds.length > 0 && selectedIds[0];
              if (currEntityId !== initEntityId) return;

              // 3. wikipedia value has not changed
              var currTags = _.clone(context.entity(currEntityId).tags),
                  qids = data && Object.keys(data);
              if (initWikipedia !== currTags.wikipedia) return;

              // ok to coalesce the update of wikidata tag into the previous tag change
              currTags.wikidata = qids && _.find(qids, function (id) {
                  return id.match(/^Q\d+$/);
              });

              context.overwrite(iD.actions.ChangeTags(currEntityId, currTags), annotation);
              dispatch.change(currTags);
          });
      }

      wiki.tags = function(tags) {
          var value = tags[field.key] || '',
              m = value.match(/([^:]+):([^#]+)(?:#(.+))?/),
              l = m && _.find(iD.data.wikipedia, function(d) { return m[1] === d[2]; }),
              anchor = m && m[3];

          // value in correct format
          if (l) {
              lang.value(l[1]);
              title.value(m[2] + (anchor ? ('#' + anchor) : ''));
              if (anchor) {
                  try {
                      // Best-effort `anchorencode:` implementation
                      anchor = encodeURIComponent(anchor.replace(/ /g, '_')).replace(/%/g, '.');
                  } catch (e) {
                      anchor = anchor.replace(/ /g, '_');
                  }
              }
              link.attr('href', 'https://' + m[1] + '.wikipedia.org/wiki/' +
                  m[2].replace(/ /g, '_') + (anchor ? ('#' + anchor) : ''));

          // unrecognized value format
          } else {
              title.value(value);
              if (value && value !== '') {
                  lang.value('');
              }
              link.attr('href', 'https://en.wikipedia.org/wiki/Special:Search?search=' + value);
          }
      };

      wiki.entity = function(_) {
          if (!arguments.length) return entity;
          entity = _;
          return wiki;
      };

      wiki.focus = function() {
          title.node().focus();
      };

      return d3.rebind(wiki, dispatch, 'on');
  }

  exports.access = access;
  exports.address = address;
  exports.check = check;
  exports.defaultcheck = check;
  exports.combo = combo;
  exports.typeCombo = combo;
  exports.multiCombo = combo;
  exports.cycleway = cycleway;
  exports.text = url;
  exports.url = url;
  exports.number = url;
  exports.email = url;
  exports.tel = url;
  exports.localized = localized;
  exports.maxspeed = maxspeed;
  exports.radio = radio;
  exports.restrictions = restrictions;
  exports.textarea = textarea;
  exports.wikipedia = wikipedia;

  Object.defineProperty(exports, '__esModule', { value: true });

}));