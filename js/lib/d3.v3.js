d3 = (function(){
  var d3 = {version: "3.2.7"}; // semver
d3.ascending = function(a, b) {
  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
};
d3.descending = function(a, b) {
  return b < a ? -1 : b > a ? 1 : b >= a ? 0 : NaN;
};
d3.min = function(array, f) {
  var i = -1,
      n = array.length,
      a,
      b;
  if (arguments.length === 1) {
    while (++i < n && !((a = array[i]) != null && a <= a)) a = undefined;
    while (++i < n) if ((b = array[i]) != null && a > b) a = b;
  } else {
    while (++i < n && !((a = f.call(array, array[i], i)) != null && a <= a)) a = undefined;
    while (++i < n) if ((b = f.call(array, array[i], i)) != null && a > b) a = b;
  }
  return a;
};
d3.max = function(array, f) {
  var i = -1,
      n = array.length,
      a,
      b;
  if (arguments.length === 1) {
    while (++i < n && !((a = array[i]) != null && a <= a)) a = undefined;
    while (++i < n) if ((b = array[i]) != null && b > a) a = b;
  } else {
    while (++i < n && !((a = f.call(array, array[i], i)) != null && a <= a)) a = undefined;
    while (++i < n) if ((b = f.call(array, array[i], i)) != null && b > a) a = b;
  }
  return a;
};
d3.extent = function(array, f) {
  var i = -1,
      n = array.length,
      a,
      b,
      c;
  if (arguments.length === 1) {
    while (++i < n && !((a = c = array[i]) != null && a <= a)) a = c = undefined;
    while (++i < n) if ((b = array[i]) != null) {
      if (a > b) a = b;
      if (c < b) c = b;
    }
  } else {
    while (++i < n && !((a = c = f.call(array, array[i], i)) != null && a <= a)) a = undefined;
    while (++i < n) if ((b = f.call(array, array[i], i)) != null) {
      if (a > b) a = b;
      if (c < b) c = b;
    }
  }
  return [a, c];
};
d3.sum = function(array, f) {
  var s = 0,
      n = array.length,
      a,
      i = -1;

  if (arguments.length === 1) {
    while (++i < n) if (!isNaN(a = +array[i])) s += a;
  } else {
    while (++i < n) if (!isNaN(a = +f.call(array, array[i], i))) s += a;
  }

  return s;
};
function d3_number(x) {
  return x != null && !isNaN(x);
}

d3.mean = function(array, f) {
  var n = array.length,
      a,
      m = 0,
      i = -1,
      j = 0;
  if (arguments.length === 1) {
    while (++i < n) if (d3_number(a = array[i])) m += (a - m) / ++j;
  } else {
    while (++i < n) if (d3_number(a = f.call(array, array[i], i))) m += (a - m) / ++j;
  }
  return j ? m : undefined;
};
// R-7 per <http://en.wikipedia.org/wiki/Quantile>
d3.quantile = function(values, p) {
  var H = (values.length - 1) * p + 1,
      h = Math.floor(H),
      v = +values[h - 1],
      e = H - h;
  return e ? v + e * (values[h] - v) : v;
};

d3.median = function(array, f) {
  if (arguments.length > 1) array = array.map(f);
  array = array.filter(d3_number);
  return array.length ? d3.quantile(array.sort(d3.ascending), .5) : undefined;
};
d3.bisector = function(f) {
  return {
    left: function(a, x, lo, hi) {
      if (arguments.length < 3) lo = 0;
      if (arguments.length < 4) hi = a.length;
      while (lo < hi) {
        var mid = lo + hi >>> 1;
        if (f.call(a, a[mid], mid) < x) lo = mid + 1;
        else hi = mid;
      }
      return lo;
    },
    right: function(a, x, lo, hi) {
      if (arguments.length < 3) lo = 0;
      if (arguments.length < 4) hi = a.length;
      while (lo < hi) {
        var mid = lo + hi >>> 1;
        if (x < f.call(a, a[mid], mid)) hi = mid;
        else lo = mid + 1;
      }
      return lo;
    }
  };
};

var d3_bisector = d3.bisector(function(d) { return d; });
d3.bisectLeft = d3_bisector.left;
d3.bisect = d3.bisectRight = d3_bisector.right;
d3.shuffle = function(array) {
  var m = array.length, t, i;
  while (m) {
    i = Math.random() * m-- | 0;
    t = array[m], array[m] = array[i], array[i] = t;
  }
  return array;
};
d3.permute = function(array, indexes) {
  var permutes = [],
      i = -1,
      n = indexes.length;
  while (++i < n) permutes[i] = array[indexes[i]];
  return permutes;
};

d3.zip = function() {
  if (!(n = arguments.length)) return [];
  for (var i = -1, m = d3.min(arguments, d3_zipLength), zips = new Array(m); ++i < m;) {
    for (var j = -1, n, zip = zips[i] = new Array(n); ++j < n;) {
      zip[j] = arguments[j][i];
    }
  }
  return zips;
};

function d3_zipLength(d) {
  return d.length;
}

d3.transpose = function(matrix) {
  return d3.zip.apply(d3, matrix);
};
d3.keys = function(map) {
  var keys = [];
  for (var key in map) keys.push(key);
  return keys;
};
d3.values = function(map) {
  var values = [];
  for (var key in map) values.push(map[key]);
  return values;
};
d3.entries = function(map) {
  var entries = [];
  for (var key in map) entries.push({key: key, value: map[key]});
  return entries;
};
d3.merge = function(arrays) {
  return Array.prototype.concat.apply([], arrays);
};
d3.range = function(start, stop, step) {
  if (arguments.length < 3) {
    step = 1;
    if (arguments.length < 2) {
      stop = start;
      start = 0;
    }
  }
  if ((stop - start) / step === Infinity) throw new Error("infinite range");
  var range = [],
       k = d3_range_integerScale(Math.abs(step)),
       i = -1,
       j;
  start *= k, stop *= k, step *= k;
  if (step < 0) while ((j = start + step * ++i) > stop) range.push(j / k);
  else while ((j = start + step * ++i) < stop) range.push(j / k);
  return range;
};

function d3_range_integerScale(x) {
  var k = 1;
  while (x * k % 1) k *= 10;
  return k;
}
function d3_class(ctor, properties) {
  try {
    for (var key in properties) {
      Object.defineProperty(ctor.prototype, key, {
        value: properties[key],
        enumerable: false
      });
    }
  } catch (e) {
    ctor.prototype = properties;
  }
}

d3.map = function(object) {
  var map = new d3_Map;
  for (var key in object) map.set(key, object[key]);
  return map;
};

function d3_Map() {}

d3_class(d3_Map, {
  has: function(key) {
    return d3_map_prefix + key in this;
  },
  get: function(key) {
    return this[d3_map_prefix + key];
  },
  set: function(key, value) {
    return this[d3_map_prefix + key] = value;
  },
  remove: function(key) {
    key = d3_map_prefix + key;
    return key in this && delete this[key];
  },
  keys: function() {
    var keys = [];
    this.forEach(function(key) { keys.push(key); });
    return keys;
  },
  values: function() {
    var values = [];
    this.forEach(function(key, value) { values.push(value); });
    return values;
  },
  entries: function() {
    var entries = [];
    this.forEach(function(key, value) { entries.push({key: key, value: value}); });
    return entries;
  },
  forEach: function(f) {
    for (var key in this) {
      if (key.charCodeAt(0) === d3_map_prefixCode) {
        f.call(this, key.substring(1), this[key]);
      }
    }
  }
});

var d3_map_prefix = "\0", // prevent collision with built-ins
    d3_map_prefixCode = d3_map_prefix.charCodeAt(0);

d3.nest = function() {
  var nest = {},
      keys = [],
      sortKeys = [],
      sortValues,
      rollup;

  function map(mapType, array, depth) {
    if (depth >= keys.length) return rollup
        ? rollup.call(nest, array) : (sortValues
        ? array.sort(sortValues)
        : array);

    var i = -1,
        n = array.length,
        key = keys[depth++],
        keyValue,
        object,
        setter,
        valuesByKey = new d3_Map,
        values;

    while (++i < n) {
      if (values = valuesByKey.get(keyValue = key(object = array[i]))) {
        values.push(object);
      } else {
        valuesByKey.set(keyValue, [object]);
      }
    }

    if (mapType) {
      object = mapType();
      setter = function(keyValue, values) {
        object.set(keyValue, map(mapType, values, depth));
      };
    } else {
      object = {};
      setter = function(keyValue, values) {
        object[keyValue] = map(mapType, values, depth);
      };
    }

    valuesByKey.forEach(setter);
    return object;
  }

  function entries(map, depth) {
    if (depth >= keys.length) return map;

    var array = [],
        sortKey = sortKeys[depth++];

    map.forEach(function(key, keyMap) {
      array.push({key: key, values: entries(keyMap, depth)});
    });

    return sortKey
        ? array.sort(function(a, b) { return sortKey(a.key, b.key); })
        : array;
  }

  nest.map = function(array, mapType) {
    return map(mapType, array, 0);
  };

  nest.entries = function(array) {
    return entries(map(d3.map, array, 0), 0);
  };

  nest.key = function(d) {
    keys.push(d);
    return nest;
  };

  // Specifies the order for the most-recently specified key.
  // Note: only applies to entries. Map keys are unordered!
  nest.sortKeys = function(order) {
    sortKeys[keys.length - 1] = order;
    return nest;
  };

  // Specifies the order for leaf values.
  // Applies to both maps and entries array.
  nest.sortValues = function(order) {
    sortValues = order;
    return nest;
  };

  nest.rollup = function(f) {
    rollup = f;
    return nest;
  };

  return nest;
};

d3.set = function(array) {
  var set = new d3_Set();
  if (array) for (var i = 0; i < array.length; i++) set.add(array[i]);
  return set;
};

function d3_Set() {}

d3_class(d3_Set, {
  has: function(value) {
    return d3_map_prefix + value in this;
  },
  add: function(value) {
    this[d3_map_prefix + value] = true;
    return value;
  },
  remove: function(value) {
    value = d3_map_prefix + value;
    return value in this && delete this[value];
  },
  values: function() {
    var values = [];
    this.forEach(function(value) {
      values.push(value);
    });
    return values;
  },
  forEach: function(f) {
    for (var value in this) {
      if (value.charCodeAt(0) === d3_map_prefixCode) {
        f.call(this, value.substring(1));
      }
    }
  }
});
d3.behavior = {};
var d3_document = document,
    d3_documentElement = d3_document.documentElement,
    d3_window = window;
// Copies a variable number of methods from source to target.
d3.rebind = function(target, source) {
  var i = 1, n = arguments.length, method;
  while (++i < n) target[method = arguments[i]] = d3_rebind(target, source, source[method]);
  return target;
};

// Method is assumed to be a standard D3 getter-setter:
// If passed with no arguments, gets the value.
// If passed with arguments, sets the value and returns the target.
function d3_rebind(target, source, method) {
  return function() {
    var value = method.apply(source, arguments);
    return value === source ? target : value;
  };
}

function d3_vendorSymbol(object, name) {
  if (name in object) return name;
  name = name.charAt(0).toUpperCase() + name.substring(1);
  for (var i = 0, n = d3_vendorPrefixes.length; i < n; ++i) {
    var prefixName = d3_vendorPrefixes[i] + name;
    if (prefixName in object) return prefixName;
  }
}

var d3_vendorPrefixes = ["webkit", "ms", "moz", "Moz", "o", "O"];

var d3_array = d3_arraySlice; // conversion for NodeLists

function d3_arrayCopy(pseudoarray) {
  var i = -1, n = pseudoarray.length, array = [];
  while (++i < n) array.push(pseudoarray[i]);
  return array;
}

function d3_arraySlice(pseudoarray) {
  return Array.prototype.slice.call(pseudoarray);
}

try {
  d3_array(d3_documentElement.childNodes)[0].nodeType;
} catch(e) {
  d3_array = d3_arrayCopy;
}
function d3_noop() {}

d3.dispatch = function() {
  var dispatch = new d3_dispatch,
      i = -1,
      n = arguments.length;
  while (++i < n) dispatch[arguments[i]] = d3_dispatch_event(dispatch);
  return dispatch;
};

function d3_dispatch() {}

d3_dispatch.prototype.on = function(type, listener) {
  var i = type.indexOf("."),
      name = "";

  // Extract optional namespace, e.g., "click.foo"
  if (i >= 0) {
    name = type.substring(i + 1);
    type = type.substring(0, i);
  }

  if (type) return arguments.length < 2
      ? this[type].on(name)
      : this[type].on(name, listener);

  if (arguments.length === 2) {
    if (listener == null) for (type in this) {
      if (this.hasOwnProperty(type)) this[type].on(name, null);
    }
    return this;
  }
};

function d3_dispatch_event(dispatch) {
  var listeners = [],
      listenerByName = new d3_Map;

  function event() {
    var z = listeners, // defensive reference
        i = -1,
        n = z.length,
        l;
    while (++i < n) if (l = z[i].on) l.apply(this, arguments);
    return dispatch;
  }

  event.on = function(name, listener) {
    var l = listenerByName.get(name),
        i;

    // return the current listener, if any
    if (arguments.length < 2) return l && l.on;

    // remove the old listener, if any (with copy-on-write)
    if (l) {
      l.on = null;
      listeners = listeners.slice(0, i = listeners.indexOf(l)).concat(listeners.slice(i + 1));
      listenerByName.remove(name);
    }

    // add the new listener, if any
    if (listener) listeners.push(listenerByName.set(name, {on: listener}));

    return dispatch;
  };

  return event;
}

d3.event = null;

function d3_eventPreventDefault() {
  d3.event.preventDefault();
}

function d3_eventSource() {
  var e = d3.event, s;
  while (s = e.sourceEvent) e = s;
  return e;
}

// Like d3.dispatch, but for custom events abstracting native UI events. These
// events have a target component (such as a brush), a target element (such as
// the svg:g element containing the brush) and the standard arguments `d` (the
// target element's data) and `i` (the selection index of the target element).
function d3_eventDispatch(target) {
  var dispatch = new d3_dispatch,
      i = 0,
      n = arguments.length;

  while (++i < n) dispatch[arguments[i]] = d3_dispatch_event(dispatch);

  // Creates a dispatch context for the specified `thiz` (typically, the target
  // DOM element that received the source event) and `argumentz` (typically, the
  // data `d` and index `i` of the target element). The returned function can be
  // used to dispatch an event to any registered listeners; the function takes a
  // single argument as input, being the event to dispatch. The event must have
  // a "type" attribute which corresponds to a type registered in the
  // constructor. This context will automatically populate the "sourceEvent" and
  // "target" attributes of the event, as well as setting the `d3.event` global
  // for the duration of the notification.
  dispatch.of = function(thiz, argumentz) {
    return function(e1) {
      try {
        var e0 =
        e1.sourceEvent = d3.event;
        e1.target = target;
        d3.event = e1;
        dispatch[e1.type].apply(thiz, argumentz);
      } finally {
        d3.event = e0;
      }
    };
  };

  return dispatch;
}
d3.requote = function(s) {
  return s.replace(d3_requote_re, "\\$&");
};

var d3_requote_re = /[\\\^\$\*\+\?\|\[\]\(\)\.\{\}]/g;
var d3_subclass = {}.__proto__?

// Until ECMAScript supports array subclassing, prototype injection works well.
function(object, prototype) {
  object.__proto__ = prototype;
}:

// And if your browser doesn't support __proto__, we'll use direct extension.
function(object, prototype) {
  for (var property in prototype) object[property] = prototype[property];
};

function d3_selection(groups) {
  d3_subclass(groups, d3_selectionPrototype);
  return groups;
}

var d3_select = function(s, n) { return n.querySelector(s); },
    d3_selectAll = function(s, n) { return n.querySelectorAll(s); },
    d3_selectMatcher = d3_documentElement[d3_vendorSymbol(d3_documentElement, "matchesSelector")],
    d3_selectMatches = function(n, s) { return d3_selectMatcher.call(n, s); };

// Prefer Sizzle, if available.
if (typeof Sizzle === "function") {
  d3_select = function(s, n) { return Sizzle(s, n)[0] || null; };
  d3_selectAll = function(s, n) { return Sizzle.uniqueSort(Sizzle(s, n)); };
  d3_selectMatches = Sizzle.matchesSelector;
}

d3.selection = function() {
  return d3_selectionRoot;
};

var d3_selectionPrototype = d3.selection.prototype = [];


d3_selectionPrototype.select = function(selector) {
  var subgroups = [],
      subgroup,
      subnode,
      group,
      node;

  selector = d3_selection_selector(selector);

  for (var j = -1, m = this.length; ++j < m;) {
    subgroups.push(subgroup = []);
    subgroup.parentNode = (group = this[j]).parentNode;
    for (var i = -1, n = group.length; ++i < n;) {
      if (node = group[i]) {
        subgroup.push(subnode = selector.call(node, node.__data__, i, j));
        if (subnode && "__data__" in node) subnode.__data__ = node.__data__;
      } else {
        subgroup.push(null);
      }
    }
  }

  return d3_selection(subgroups);
};

function d3_selection_selector(selector) {
  return typeof selector === "function" ? selector : function() {
    return d3_select(selector, this);
  };
}

d3_selectionPrototype.selectAll = function(selector) {
  var subgroups = [],
      subgroup,
      node;

  selector = d3_selection_selectorAll(selector);

  for (var j = -1, m = this.length; ++j < m;) {
    for (var group = this[j], i = -1, n = group.length; ++i < n;) {
      if (node = group[i]) {
        subgroups.push(subgroup = d3_array(selector.call(node, node.__data__, i, j)));
        subgroup.parentNode = node;
      }
    }
  }

  return d3_selection(subgroups);
};

function d3_selection_selectorAll(selector) {
  return typeof selector === "function" ? selector : function() {
    return d3_selectAll(selector, this);
  };
}
var d3_nsPrefix = {
  svg: "http://www.w3.org/2000/svg",
  xhtml: "http://www.w3.org/1999/xhtml",
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace",
  xmlns: "http://www.w3.org/2000/xmlns/"
};

d3.ns = {
  prefix: d3_nsPrefix,
  qualify: function(name) {
    var i = name.indexOf(":"),
        prefix = name;
    if (i >= 0) {
      prefix = name.substring(0, i);
      name = name.substring(i + 1);
    }
    return d3_nsPrefix.hasOwnProperty(prefix)
        ? {space: d3_nsPrefix[prefix], local: name}
        : name;
  }
};

d3_selectionPrototype.attr = function(name, value) {
  if (arguments.length < 2) {

    // For attr(string), return the attribute value for the first node.
    if (typeof name === "string") {
      var node = this.node();
      name = d3.ns.qualify(name);
      return name.local
          ? node.getAttributeNS(name.space, name.local)
          : node.getAttribute(name);
    }

    // For attr(object), the object specifies the names and values of the
    // attributes to set or remove. The values may be functions that are
    // evaluated for each element.
    for (value in name) this.each(d3_selection_attr(value, name[value]));
    return this;
  }

  return this.each(d3_selection_attr(name, value));
};

function d3_selection_attr(name, value) {
  name = d3.ns.qualify(name);

  // For attr(string, null), remove the attribute with the specified name.
  function attrNull() {
    this.removeAttribute(name);
  }
  function attrNullNS() {
    this.removeAttributeNS(name.space, name.local);
  }

  // For attr(string, string), set the attribute with the specified name.
  function attrConstant() {
    this.setAttribute(name, value);
  }
  function attrConstantNS() {
    this.setAttributeNS(name.space, name.local, value);
  }

  // For attr(string, function), evaluate the function for each element, and set
  // or remove the attribute as appropriate.
  function attrFunction() {
    var x = value.apply(this, arguments);
    if (x == null) this.removeAttribute(name);
    else this.setAttribute(name, x);
  }
  function attrFunctionNS() {
    var x = value.apply(this, arguments);
    if (x == null) this.removeAttributeNS(name.space, name.local);
    else this.setAttributeNS(name.space, name.local, x);
  }

  return value == null
      ? (name.local ? attrNullNS : attrNull) : (typeof value === "function"
      ? (name.local ? attrFunctionNS : attrFunction)
      : (name.local ? attrConstantNS : attrConstant));
}
function d3_collapse(s) {
  return s.trim().replace(/\s+/g, " ");
}

d3_selectionPrototype.classed = function(name, value) {
  if (arguments.length < 2) {

    // For classed(string), return true only if the first node has the specified
    // class or classes. Note that even if the browser supports DOMTokenList, it
    // probably doesn't support it on SVG elements (which can be animated).
    if (typeof name === "string") {
      var node = this.node(),
          n = (name = name.trim().split(/^|\s+/g)).length,
          i = -1;
      if (value = node.classList) {
        while (++i < n) if (!value.contains(name[i])) return false;
      } else {
        value = node.getAttribute("class");
        while (++i < n) if (!d3_selection_classedRe(name[i]).test(value)) return false;
      }
      return true;
    }

    // For classed(object), the object specifies the names of classes to add or
    // remove. The values may be functions that are evaluated for each element.
    for (value in name) this.each(d3_selection_classed(value, name[value]));
    return this;
  }

  // Otherwise, both a name and a value are specified, and are handled as below.
  return this.each(d3_selection_classed(name, value));
};

function d3_selection_classedRe(name) {
  return new RegExp("(?:^|\\s+)" + d3.requote(name) + "(?:\\s+|$)", "g");
}

// Multiple class names are allowed (e.g., "foo bar").
function d3_selection_classed(name, value) {
  name = name.trim().split(/\s+/).map(d3_selection_classedName);
  var n = name.length;

  function classedConstant() {
    var i = -1;
    while (++i < n) name[i](this, value);
  }

  // When the value is a function, the function is still evaluated only once per
  // element even if there are multiple class names.
  function classedFunction() {
    var i = -1, x = value.apply(this, arguments);
    while (++i < n) name[i](this, x);
  }

  return typeof value === "function"
      ? classedFunction
      : classedConstant;
}

function d3_selection_classedName(name) {
  var re = d3_selection_classedRe(name);
  return function(node, value) {
    if (c = node.classList) return value ? c.add(name) : c.remove(name);
    var c = node.getAttribute("class") || "";
    if (value) {
      re.lastIndex = 0;
      if (!re.test(c)) node.setAttribute("class", d3_collapse(c + " " + name));
    } else {
      node.setAttribute("class", d3_collapse(c.replace(re, " ")));
    }
  };
}

d3_selectionPrototype.style = function(name, value, priority) {
  var n = arguments.length;
  if (n < 3) {

    // For style(object) or style(object, string), the object specifies the
    // names and values of the attributes to set or remove. The values may be
    // functions that are evaluated for each element. The optional string
    // specifies the priority.
    if (typeof name !== "string") {
      if (n < 2) value = "";
      for (priority in name) this.each(d3_selection_style(priority, name[priority], value));
      return this;
    }

    // For style(string), return the computed style value for the first node.
    if (n < 2) return d3_window.getComputedStyle(this.node(), null).getPropertyValue(name);

    // For style(string, string) or style(string, function), use the default
    // priority. The priority is ignored for style(string, null).
    priority = "";
  }

  // Otherwise, a name, value and priority are specified, and handled as below.
  return this.each(d3_selection_style(name, value, priority));
};

function d3_selection_style(name, value, priority) {

  // For style(name, null) or style(name, null, priority), remove the style
  // property with the specified name. The priority is ignored.
  function styleNull() {
    this.style.removeProperty(name);
  }

  // For style(name, string) or style(name, string, priority), set the style
  // property with the specified name, using the specified priority.
  function styleConstant() {
    this.style.setProperty(name, value, priority);
  }

  // For style(name, function) or style(name, function, priority), evaluate the
  // function for each element, and set or remove the style property as
  // appropriate. When setting, use the specified priority.
  function styleFunction() {
    var x = value.apply(this, arguments);
    if (x == null) this.style.removeProperty(name);
    else this.style.setProperty(name, x, priority);
  }

  return value == null
      ? styleNull : (typeof value === "function"
      ? styleFunction : styleConstant);
}

d3_selectionPrototype.property = function(name, value) {
  if (arguments.length < 2) {

    // For property(string), return the property value for the first node.
    if (typeof name === "string") return this.node()[name];

    // For property(object), the object specifies the names and values of the
    // properties to set or remove. The values may be functions that are
    // evaluated for each element.
    for (value in name) this.each(d3_selection_property(value, name[value]));
    return this;
  }

  // Otherwise, both a name and a value are specified, and are handled as below.
  return this.each(d3_selection_property(name, value));
};

function d3_selection_property(name, value) {

  // For property(name, null), remove the property with the specified name.
  function propertyNull() {
    delete this[name];
  }

  // For property(name, string), set the property with the specified name.
  function propertyConstant() {
    this[name] = value;
  }

  // For property(name, function), evaluate the function for each element, and
  // set or remove the property as appropriate.
  function propertyFunction() {
    var x = value.apply(this, arguments);
    if (x == null) delete this[name];
    else this[name] = x;
  }

  return value == null
      ? propertyNull : (typeof value === "function"
      ? propertyFunction : propertyConstant);
}

d3_selectionPrototype.text = function(value) {
  return arguments.length
      ? this.each(typeof value === "function"
      ? function() { var v = value.apply(this, arguments); this.textContent = v == null ? "" : v; } : value == null
      ? function() { if (this.textContent !== "") this.textContent = ""; }
      : function() { if (this.textContent !== value) this.textContent = value; })
      : this.node().textContent;
};

d3_selectionPrototype.html = function(value) {
  return arguments.length
      ? this.each(typeof value === "function"
      ? function() { var v = value.apply(this, arguments); this.innerHTML = v == null ? "" : v; } : value == null
      ? function() { this.innerHTML = ""; }
      : function() { this.innerHTML = value; })
      : this.node().innerHTML;
};

d3_selectionPrototype.append = function(name) {
  name = d3_selection_creator(name);
  return this.select(function() {
    return this.appendChild(name.apply(this, arguments));
  });
};

function d3_selection_creator(name) {
  return typeof name === "function" ? name
      : (name = d3.ns.qualify(name)).local ? function() { return d3_document.createElementNS(name.space, name.local); }
      : function() { return d3_document.createElementNS(this.namespaceURI, name); };
}

d3_selectionPrototype.insert = function(name, before) {
  name = d3_selection_creator(name);
  before = d3_selection_selector(before);
  return this.select(function() {
    return this.insertBefore(name.apply(this, arguments), before.apply(this, arguments));
  });
};

// TODO remove(selector)?
// TODO remove(node)?
// TODO remove(function)?
d3_selectionPrototype.remove = function() {
  return this.each(function() {
    var parent = this.parentNode;
    if (parent) parent.removeChild(this);
  });
};

d3_selectionPrototype.data = function(value, key) {
  var i = -1,
      n = this.length,
      group,
      node;

  // If no value is specified, return the first value.
  if (!arguments.length) {
    value = new Array(n = (group = this[0]).length);
    while (++i < n) {
      if (node = group[i]) {
        value[i] = node.__data__;
      }
    }
    return value;
  }

  function bind(group, groupData) {
    var i,
        n = group.length,
        m = groupData.length,
        n0 = Math.min(n, m),
        updateNodes = new Array(m),
        enterNodes = new Array(m),
        exitNodes = new Array(n),
        node,
        nodeData;

    if (key) {
      var nodeByKeyValue = new d3_Map,
          dataByKeyValue = new d3_Map,
          keyValues = [],
          keyValue;

      for (i = -1; ++i < n;) {
        keyValue = key.call(node = group[i], node.__data__, i);
        if (nodeByKeyValue.has(keyValue)) {
          exitNodes[i] = node; // duplicate selection key
        } else {
          nodeByKeyValue.set(keyValue, node);
        }
        keyValues.push(keyValue);
      }

      for (i = -1; ++i < m;) {
        keyValue = key.call(groupData, nodeData = groupData[i], i);
        if (node = nodeByKeyValue.get(keyValue)) {
          updateNodes[i] = node;
          node.__data__ = nodeData;
        } else if (!dataByKeyValue.has(keyValue)) { // no duplicate data key
          enterNodes[i] = d3_selection_dataNode(nodeData);
        }
        dataByKeyValue.set(keyValue, nodeData);
        nodeByKeyValue.remove(keyValue);
      }

      for (i = -1; ++i < n;) {
        if (nodeByKeyValue.has(keyValues[i])) {
          exitNodes[i] = group[i];
        }
      }
    } else {
      for (i = -1; ++i < n0;) {
        node = group[i];
        nodeData = groupData[i];
        if (node) {
          node.__data__ = nodeData;
          updateNodes[i] = node;
        } else {
          enterNodes[i] = d3_selection_dataNode(nodeData);
        }
      }
      for (; i < m; ++i) {
        enterNodes[i] = d3_selection_dataNode(groupData[i]);
      }
      for (; i < n; ++i) {
        exitNodes[i] = group[i];
      }
    }

    enterNodes.update
        = updateNodes;

    enterNodes.parentNode
        = updateNodes.parentNode
        = exitNodes.parentNode
        = group.parentNode;

    enter.push(enterNodes);
    update.push(updateNodes);
    exit.push(exitNodes);
  }

  var enter = d3_selection_enter([]),
      update = d3_selection([]),
      exit = d3_selection([]);

  if (typeof value === "function") {
    while (++i < n) {
      bind(group = this[i], value.call(group, group.parentNode.__data__, i));
    }
  } else {
    while (++i < n) {
      bind(group = this[i], value);
    }
  }

  update.enter = function() { return enter; };
  update.exit = function() { return exit; };
  return update;
};

function d3_selection_dataNode(data) {
  return {__data__: data};
}

d3_selectionPrototype.datum = function(value) {
  return arguments.length
      ? this.property("__data__", value)
      : this.property("__data__");
};

d3_selectionPrototype.filter = function(filter) {
  var subgroups = [],
      subgroup,
      group,
      node;

  if (typeof filter !== "function") filter = d3_selection_filter(filter);

  for (var j = 0, m = this.length; j < m; j++) {
    subgroups.push(subgroup = []);
    subgroup.parentNode = (group = this[j]).parentNode;
    for (var i = 0, n = group.length; i < n; i++) {
      if ((node = group[i]) && filter.call(node, node.__data__, i)) {
        subgroup.push(node);
      }
    }
  }

  return d3_selection(subgroups);
};

function d3_selection_filter(selector) {
  return function() {
    return d3_selectMatches(this, selector);
  };
}

d3_selectionPrototype.order = function() {
  for (var j = -1, m = this.length; ++j < m;) {
    for (var group = this[j], i = group.length - 1, next = group[i], node; --i >= 0;) {
      if (node = group[i]) {
        if (next && next !== node.nextSibling) next.parentNode.insertBefore(node, next);
        next = node;
      }
    }
  }
  return this;
};

d3_selectionPrototype.sort = function(comparator) {
  comparator = d3_selection_sortComparator.apply(this, arguments);
  for (var j = -1, m = this.length; ++j < m;) this[j].sort(comparator);
  return this.order();
};

function d3_selection_sortComparator(comparator) {
  if (!arguments.length) comparator = d3.ascending;
  return function(a, b) {
    return (!a - !b) || comparator(a.__data__, b.__data__);
  };
}

d3_selectionPrototype.each = function(callback) {
  return d3_selection_each(this, function(node, i, j) {
    callback.call(node, node.__data__, i, j);
  });
};

function d3_selection_each(groups, callback) {
  for (var j = 0, m = groups.length; j < m; j++) {
    for (var group = groups[j], i = 0, n = group.length, node; i < n; i++) {
      if (node = group[i]) callback(node, i, j);
    }
  }
  return groups;
}

d3_selectionPrototype.call = function(callback) {
  var args = d3_array(arguments);
  callback.apply(args[0] = this, args);
  return this;
};

d3_selectionPrototype.empty = function() {
  return !this.node();
};

d3_selectionPrototype.node = function() {
  for (var j = 0, m = this.length; j < m; j++) {
    for (var group = this[j], i = 0, n = group.length; i < n; i++) {
      var node = group[i];
      if (node) return node;
    }
  }
  return null;
};

d3_selectionPrototype.size = function() {
  var n = 0;
  this.each(function() { ++n; });
  return n;
};

function d3_selection_enter(selection) {
  d3_subclass(selection, d3_selection_enterPrototype);
  return selection;
}

var d3_selection_enterPrototype = [];

d3.selection.enter = d3_selection_enter;
d3.selection.enter.prototype = d3_selection_enterPrototype;

d3_selection_enterPrototype.append = d3_selectionPrototype.append;
d3_selection_enterPrototype.empty = d3_selectionPrototype.empty;
d3_selection_enterPrototype.node = d3_selectionPrototype.node;
d3_selection_enterPrototype.call = d3_selectionPrototype.call;
d3_selection_enterPrototype.size = d3_selectionPrototype.size;


d3_selection_enterPrototype.select = function(selector) {
  var subgroups = [],
      subgroup,
      subnode,
      upgroup,
      group,
      node;

  for (var j = -1, m = this.length; ++j < m;) {
    upgroup = (group = this[j]).update;
    subgroups.push(subgroup = []);
    subgroup.parentNode = group.parentNode;
    for (var i = -1, n = group.length; ++i < n;) {
      if (node = group[i]) {
        subgroup.push(upgroup[i] = subnode = selector.call(group.parentNode, node.__data__, i, j));
        subnode.__data__ = node.__data__;
      } else {
        subgroup.push(null);
      }
    }
  }

  return d3_selection(subgroups);
};

d3_selection_enterPrototype.insert = function(name, before) {
  if (arguments.length < 2) before = d3_selection_enterInsertBefore(this);
  return d3_selectionPrototype.insert.call(this, name, before);
};

function d3_selection_enterInsertBefore(enter) {
  var i0, j0;
  return function(d, i, j) {
    var group = enter[j].update,
        n = group.length,
        node;
    if (j != j0) j0 = j, i0 = 0;
    if (i >= i0) i0 = i + 1;
    while (!(node = group[i0]) && ++i0 < n);
    return node;
  };
}

d3_selectionPrototype.transition = function() {
  var id = d3_transitionInheritId || ++d3_transitionId,
      subgroups = [],
      subgroup,
      node,
      transition = d3_transitionInherit || {time: Date.now(), ease: d3_ease_cubicInOut, delay: 0, duration: 250};

  for (var j = -1, m = this.length; ++j < m;) {
    subgroups.push(subgroup = []);
    for (var group = this[j], i = -1, n = group.length; ++i < n;) {
      if (node = group[i]) d3_transitionNode(node, i, id, transition);
      subgroup.push(node);
    }
  }

  return d3_transition(subgroups, id);
};

// TODO fast singleton implementation?
d3.select = function(node) {
  var group = [typeof node === "string" ? d3_select(node, d3_document) : node];
  group.parentNode = d3_documentElement;
  return d3_selection([group]);
};

d3.selectAll = function(nodes) {
  var group = d3_array(typeof nodes === "string" ? d3_selectAll(nodes, d3_document) : nodes);
  group.parentNode = d3_documentElement;
  return d3_selection([group]);
};

var d3_selectionRoot = d3.select(d3_documentElement);

d3_selectionPrototype.on = function(type, listener, capture) {
  var n = arguments.length;
  if (n < 3) {

    // For on(object) or on(object, boolean), the object specifies the event
    // types and listeners to add or remove. The optional boolean specifies
    // whether the listener captures events.
    if (typeof type !== "string") {
      if (n < 2) listener = false;
      for (capture in type) this.each(d3_selection_on(capture, type[capture], listener));
      return this;
    }

    // For on(string), return the listener for the first node.
    if (n < 2) return (n = this.node()["__on" + type]) && n._;

    // For on(string, function), use the default capture.
    capture = false;
  }

  // Otherwise, a type, listener and capture are specified, and handled as below.
  return this.each(d3_selection_on(type, listener, capture));
};

function d3_selection_on(type, listener, capture) {
  var name = "__on" + type,
      i = type.indexOf("."),
      wrap = d3_selection_onListener;

  if (i > 0) type = type.substring(0, i);
  var filter = d3_selection_onFilters.get(type);
  if (filter) type = filter, wrap = d3_selection_onFilter;

  function onRemove() {
    var l = this[name];
    if (l) {
      this.removeEventListener(type, l, l.$);
      delete this[name];
    }
  }

  function onAdd() {
    var l = wrap(listener, d3_array(arguments));
    if (typeof Raven !== 'undefined') l = Raven.wrap(l);
    onRemove.call(this);
    this.addEventListener(type, this[name] = l, l.$ = capture);
    l._ = listener;
  }

  function removeAll() {
    var re = new RegExp("^__on([^.]+)" + d3.requote(type) + "$"),
        match;
    for (var name in this) {
      if (match = name.match(re)) {
        var l = this[name];
        this.removeEventListener(match[1], l, l.$);
        delete this[name];
      }
    }
  }

  return i
      ? listener ? onAdd : onRemove
      : listener ? d3_noop : removeAll;
}

var d3_selection_onFilters = d3.map({
  mouseenter: "mouseover",
  mouseleave: "mouseout"
});

d3_selection_onFilters.forEach(function(k) {
  if ("on" + k in d3_document) d3_selection_onFilters.remove(k);
});

function d3_selection_onListener(listener, argumentz) {
  return function(e) {
    var o = d3.event; // Events can be reentrant (e.g., focus).
    d3.event = e;
    argumentz[0] = this.__data__;
    try {
      listener.apply(this, argumentz);
    } finally {
      d3.event = o;
    }
  };
}

function d3_selection_onFilter(listener, argumentz) {
  var l = d3_selection_onListener(listener, argumentz);
  return function(e) {
    var target = this, related = e.relatedTarget;
    if (!related || (related !== target && !(related.compareDocumentPosition(target) & 8))) {
      l.call(target, e);
    }
  };
}

var d3_event_dragSelect = d3_vendorSymbol(d3_documentElement.style, "userSelect"),
    d3_event_dragId = 0;

function d3_event_dragSuppress() {
  var name = ".dragsuppress-" + ++d3_event_dragId,
      touchmove = "touchmove" + name,
      selectstart = "selectstart" + name,
      dragstart = "dragstart" + name,
      click = "click" + name,
      w = d3.select(d3_window).on(touchmove, d3_eventPreventDefault).on(selectstart, d3_eventPreventDefault).on(dragstart, d3_eventPreventDefault),
      style = d3_documentElement.style,
      select = style[d3_event_dragSelect];
  style[d3_event_dragSelect] = "none";
  return function(suppressClick) {
    w.on(name, null);
    style[d3_event_dragSelect] = select;
    if (suppressClick) { // suppress the next click, but only if it’s immediate
      function off() { w.on(click, null); }
      w.on(click, function() { d3_eventPreventDefault(); off(); }, true);
      setTimeout(off, 0);
    }
  };
}

d3.mouse = function(container) {
  return d3_mousePoint(container, d3_eventSource());
};

// https://bugs.webkit.org/show_bug.cgi?id=44083
var d3_mouse_bug44083 = /WebKit/.test(d3_window.navigator.userAgent) ? -1 : 0;

function d3_mousePoint(container, e) {
  var svg = container.ownerSVGElement || container;
  if (svg.createSVGPoint) {
    var point = svg.createSVGPoint();
    if (d3_mouse_bug44083 < 0 && (d3_window.scrollX || d3_window.scrollY)) {
      svg = d3.select("body").append("svg").style({
        position: "absolute",
        top: 0,
        left: 0,
        margin: 0,
        padding: 0,
        border: "none"
      }, "important");
      var ctm = svg[0][0].getScreenCTM();
      d3_mouse_bug44083 = !(ctm.f || ctm.e);
      svg.remove();
    }
    if (d3_mouse_bug44083) {
      point.x = e.pageX;
      point.y = e.pageY;
    } else {
      point.x = e.clientX;
      point.y = e.clientY;
    }
    point = point.matrixTransform(container.getScreenCTM().inverse());
    return [point.x, point.y];
  }
  var rect = container.getBoundingClientRect();
  return [e.clientX - rect.left - container.clientLeft, e.clientY - rect.top - container.clientTop];
};

d3.touches = function(container, touches) {
  if (arguments.length < 2) touches = d3_eventSource().touches;
  return touches ? d3_array(touches).map(function(touch) {
    var point = d3_mousePoint(container, touch);
    point.identifier = touch.identifier;
    return point;
  }) : [];
};

d3.behavior.zoom = function() {
  var translate = [0, 0],
      translate0, // translate when we started zooming (to avoid drift)
      scale = 1,
      scaleExtent = d3_behavior_zoomInfinity,
      mousedown = "mousedown.zoom",
      mousemove = "mousemove.zoom",
      mouseup = "mouseup.zoom",
      event = d3_eventDispatch(zoom, "zoom"),
      x0,
      x1,
      y0,
      y1,
      touchtime; // time of last touchstart (to detect double-tap)

  function zoom() {
    this.on(mousedown, mousedowned)
        .on(d3_behavior_zoomWheel + ".zoom", mousewheeled)
        .on(mousemove, mousewheelreset)
        .on("dblclick.zoom", dblclicked)
        .on("touchstart.zoom", touchstarted);
  }

  zoom.translate = function(x) {
    if (!arguments.length) return translate;
    translate = x.map(Number);
    rescale();
    return zoom;
  };

  zoom.scale = function(x) {
    if (!arguments.length) return scale;
    scale = +x;
    rescale();
    return zoom;
  };

  zoom.scaleExtent = function(x) {
    if (!arguments.length) return scaleExtent;
    scaleExtent = x == null ? d3_behavior_zoomInfinity : x.map(Number);
    return zoom;
  };

  zoom.x = function(z) {
    if (!arguments.length) return x1;
    x1 = z;
    x0 = z.copy();
    translate = [0, 0];
    scale = 1;
    return zoom;
  };

  zoom.y = function(z) {
    if (!arguments.length) return y1;
    y1 = z;
    y0 = z.copy();
    translate = [0, 0];
    scale = 1;
    return zoom;
  };

  function location(p) {
    return [(p[0] - translate[0]) / scale, (p[1] - translate[1]) / scale];
  }

  function point(l) {
    return [l[0] * scale + translate[0], l[1] * scale + translate[1]];
  }

  function scaleTo(s) {
    scale = Math.max(scaleExtent[0], Math.min(scaleExtent[1], s));
  }

  function translateTo(p, l) {
    l = point(l);
    translate[0] += p[0] - l[0];
    translate[1] += p[1] - l[1];
  }

  function rescale() {
    if (x1) x1.domain(x0.range().map(function(x) { return (x - translate[0]) / scale; }).map(x0.invert));
    if (y1) y1.domain(y0.range().map(function(y) { return (y - translate[1]) / scale; }).map(y0.invert));
  }

  function dispatch(event) {
    rescale();
    event({type: "zoom", scale: scale, translate: translate});
  }

  function mousedowned() {
    var target = this,
        event_ = event.of(target, arguments),
        eventTarget = d3.event.target,
        dragged = 0,
        w = d3.select(d3_window).on(mousemove, moved).on(mouseup, ended),
        l = location(d3.mouse(target)),
        dragRestore = d3_event_dragSuppress();

    function moved() {
      dragged = 1;
      translateTo(d3.mouse(target), l);
      dispatch(event_);
    }

    function ended() {
      w.on(mousemove, d3_window === target ? mousewheelreset : null).on(mouseup, null);
      dragRestore(dragged && d3.event.target === eventTarget);
    }
  }

  function touchstarted() {
    var target = this,
        event_ = event.of(target, arguments),
        touches = d3.touches(target),
        locations = {},
        distance0 = 0, // distance² between initial touches
        scale0 = scale, // scale when we started touching
        now = Date.now(),
        name = "zoom-" + d3.event.changedTouches[0].identifier,
        touchmove = "touchmove." + name,
        touchend = "touchend." + name,
        w = d3.select(d3_window).on(touchmove, moved).on(touchend, ended),
        t = d3.select(target).on(mousedown, null), // prevent duplicate events
        dragRestore = d3_event_dragSuppress();

    touches.forEach(function(t) { locations[t.identifier] = location(t); });

    if (touches.length === 1) {
      if (now - touchtime < 500) { // dbltap
        var p = touches[0], l = location(touches[0]);
        scaleTo(scale * 2);
        translateTo(p, l);
        d3_eventPreventDefault();
        dispatch(event_);
      }
      touchtime = now;
    } else if (touches.length > 1) {
      var p = touches[0], q = touches[1],
          dx = p[0] - q[0], dy = p[1] - q[1];
      distance0 = dx * dx + dy * dy;
    }

    function moved() {
      var touches = d3.touches(target),
          p0 = touches[0],
          l0 = locations[p0.identifier];

      if (p1 = touches[1]) {
        var p1, l1 = locations[p1.identifier],
            scale1 = d3.event.scale;
        if (scale1 == null) {
          var distance1 = (distance1 = p1[0] - p0[0]) * distance1 + (distance1 = p1[1] - p0[1]) * distance1;
          scale1 = distance0 && Math.sqrt(distance1 / distance0);
        }
        p0 = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2];
        l0 = [(l0[0] + l1[0]) / 2, (l0[1] + l1[1]) / 2];
        scaleTo(scale1 * scale0);
      }

      touchtime = null;
      translateTo(p0, l0);
      dispatch(event_);
    }

    function ended() {
      w.on(touchmove, null).on(touchend, null);
      t.on(mousedown, mousedowned);
      dragRestore();
    }
  }

  function mousewheeled() {
    d3_eventPreventDefault();
    if (!translate0) translate0 = location(d3.mouse(this));
    scaleTo(Math.pow(2, d3_behavior_zoomDelta() * .002) * scale);
    translateTo(d3.mouse(this), translate0);
    dispatch(event.of(this, arguments));
  }

  function mousewheelreset() {
    translate0 = null;
  }

  function dblclicked() {
    var p = d3.mouse(this), l = location(p), k = Math.log(scale) / Math.LN2;
    scaleTo(Math.pow(2, d3.event.shiftKey ? Math.ceil(k) - 1 : Math.floor(k) + 1));
    translateTo(p, l);
    dispatch(event.of(this, arguments));
  }

  return d3.rebind(zoom, event, "on");
};

var d3_behavior_zoomInfinity = [0, Infinity]; // default scale extent

// https://developer.mozilla.org/en-US/docs/Mozilla_event_reference/wheel
var d3_behavior_zoomDelta, d3_behavior_zoomWheel
    = "onwheel" in d3_document ? (d3_behavior_zoomDelta = function() { return -d3.event.deltaY * (d3.event.deltaMode ? 120 : 1); }, "wheel")
    : "onmousewheel" in d3_document ? (d3_behavior_zoomDelta = function() { return d3.event.wheelDelta; }, "mousewheel")
    : (d3_behavior_zoomDelta = function() { return -d3.event.detail; }, "MozMousePixelScroll");
function d3_functor(v) {
  return typeof v === "function" ? v : function() { return v; };
}

d3.functor = d3_functor;

var d3_timer_queueHead,
    d3_timer_queueTail,
    d3_timer_interval, // is an interval (or frame) active?
    d3_timer_timeout, // is a timeout active?
    d3_timer_active, // active timer object
    d3_timer_frame = d3_window[d3_vendorSymbol(d3_window, "requestAnimationFrame")] || function(callback) { setTimeout(callback, 17); };

// The timer will continue to fire until callback returns true.
d3.timer = function(callback, delay, then) {
  var n = arguments.length;
  if (n < 2) delay = 0;
  if (n < 3) then = Date.now();

  // Add the callback to the tail of the queue.
  var time = then + delay, timer = {callback: callback, time: time, next: null};
  if (d3_timer_queueTail) d3_timer_queueTail.next = timer;
  else d3_timer_queueHead = timer;
  d3_timer_queueTail = timer;

  // Start animatin'!
  if (!d3_timer_interval) {
    d3_timer_timeout = clearTimeout(d3_timer_timeout);
    d3_timer_interval = 1;
    d3_timer_frame(d3_timer_step);
  }
};

function d3_timer_step() {
  var now = d3_timer_mark(),
      delay = d3_timer_sweep() - now;
  if (delay > 24) {
    if (isFinite(delay)) {
      clearTimeout(d3_timer_timeout);
      d3_timer_timeout = setTimeout(d3_timer_step, delay);
    }
    d3_timer_interval = 0;
  } else {
    d3_timer_interval = 1;
    d3_timer_frame(d3_timer_step);
  }
}

d3.timer.flush = function() {
  d3_timer_mark();
  d3_timer_sweep();
};

function d3_timer_replace(callback, delay, then) {
  var n = arguments.length;
  if (n < 2) delay = 0;
  if (n < 3) then = Date.now();
  d3_timer_active.callback = callback;
  d3_timer_active.time = then + delay;
}

function d3_timer_mark() {
  var now = Date.now();
  d3_timer_active = d3_timer_queueHead;
  while (d3_timer_active) {
    if (now >= d3_timer_active.time) d3_timer_active.flush = d3_timer_active.callback(now - d3_timer_active.time);
    d3_timer_active = d3_timer_active.next;
  }
  return now;
}

// Flush after callbacks to avoid concurrent queue modification.
// Returns the time of the earliest active timer, post-sweep.
function d3_timer_sweep() {
  var t0,
      t1 = d3_timer_queueHead,
      time = Infinity;
  while (t1) {
    if (t1.flush) {
      t1 = t0 ? t0.next = t1.next : d3_timer_queueHead = t1.next;
    } else {
      if (t1.time < time) time = t1.time;
      t1 = (t0 = t1).next;
    }
  }
  d3_timer_queueTail = t0;
  return time;
}
var π = Math.PI,
    ε = 1e-6,
    ε2 = ε * ε,
    d3_radians = π / 180,
    d3_degrees = 180 / π;

function d3_sgn(x) {
  return x > 0 ? 1 : x < 0 ? -1 : 0;
}

function d3_acos(x) {
  return x > 1 ? 0 : x < -1 ? π : Math.acos(x);
}

function d3_asin(x) {
  return x > 1 ? π / 2 : x < -1 ? -π / 2 : Math.asin(x);
}

function d3_sinh(x) {
  return (Math.exp(x) - Math.exp(-x)) / 2;
}

function d3_cosh(x) {
  return (Math.exp(x) + Math.exp(-x)) / 2;
}

function d3_haversin(x) {
  return (x = Math.sin(x / 2)) * x;
}
d3.geo = {};
function d3_identity(d) {
  return d;
}
function d3_true() {
  return true;
}

function d3_geo_spherical(cartesian) {
  return [
    Math.atan2(cartesian[1], cartesian[0]),
    d3_asin(cartesian[2])
  ];
}

function d3_geo_sphericalEqual(a, b) {
  return Math.abs(a[0] - b[0]) < ε && Math.abs(a[1] - b[1]) < ε;
}

// General spherical polygon clipping algorithm: takes a polygon, cuts it into
// visible line segments and rejoins the segments by interpolating along the
// clip edge.
function d3_geo_clipPolygon(segments, compare, inside, interpolate, listener) {
  var subject = [],
      clip = [];

  segments.forEach(function(segment) {
    if ((n = segment.length - 1) <= 0) return;
    var n, p0 = segment[0], p1 = segment[n];

    // If the first and last points of a segment are coincident, then treat as
    // a closed ring.
    // TODO if all rings are closed, then the winding order of the exterior
    // ring should be checked.
    if (d3_geo_sphericalEqual(p0, p1)) {
      listener.lineStart();
      for (var i = 0; i < n; ++i) listener.point((p0 = segment[i])[0], p0[1]);
      listener.lineEnd();
      return;
    }

    var a = {point: p0, points: segment, other: null, visited: false, entry: true, subject: true},
        b = {point: p0, points: [p0], other: a, visited: false, entry: false, subject: false};
    a.other = b;
    subject.push(a);
    clip.push(b);
    a = {point: p1, points: [p1], other: null, visited: false, entry: false, subject: true};
    b = {point: p1, points: [p1], other: a, visited: false, entry: true, subject: false};
    a.other = b;
    subject.push(a);
    clip.push(b);
  });
  clip.sort(compare);
  d3_geo_clipPolygonLinkCircular(subject);
  d3_geo_clipPolygonLinkCircular(clip);
  if (!subject.length) return;

  if (inside) for (var i = 1, e = !inside(clip[0].point), n = clip.length; i < n; ++i) {
    clip[i].entry = (e = !e);
  }

  var start = subject[0],
      current,
      points,
      point;
  while (1) {
    // Find first unvisited intersection.
    current = start;
    while (current.visited) if ((current = current.next) === start) return;
    points = current.points;
    listener.lineStart();
    do {
      current.visited = current.other.visited = true;
      if (current.entry) {
        if (current.subject) {
          for (var i = 0; i < points.length; i++) listener.point((point = points[i])[0], point[1]);
        } else {
          interpolate(current.point, current.next.point, 1, listener);
        }
        current = current.next;
      } else {
        if (current.subject) {
          points = current.prev.points;
          for (var i = points.length; --i >= 0;) listener.point((point = points[i])[0], point[1]);
        } else {
          interpolate(current.point, current.prev.point, -1, listener);
        }
        current = current.prev;
      }
      current = current.other;
      points = current.points;
    } while (!current.visited);
    listener.lineEnd();
  }
}

function d3_geo_clipPolygonLinkCircular(array) {
  if (!(n = array.length)) return;
  var n,
      i = 0,
      a = array[0],
      b;
  while (++i < n) {
    a.next = b = array[i];
    b.prev = a;
    a = b;
  }
  a.next = b = array[0];
  b.prev = a;
}

function d3_geo_clip(pointVisible, clipLine, interpolate, polygonContains) {
  return function(listener) {
    var line = clipLine(listener);

    var clip = {
      point: point,
      lineStart: lineStart,
      lineEnd: lineEnd,
      polygonStart: function() {
        clip.point = pointRing;
        clip.lineStart = ringStart;
        clip.lineEnd = ringEnd;
        segments = [];
        polygon = [];
        listener.polygonStart();
      },
      polygonEnd: function() {
        clip.point = point;
        clip.lineStart = lineStart;
        clip.lineEnd = lineEnd;

        segments = d3.merge(segments);
        if (segments.length) {
          d3_geo_clipPolygon(segments, d3_geo_clipSort, null, interpolate, listener);
        } else if (polygonContains(polygon)) {
          listener.lineStart();
          interpolate(null, null, 1, listener);
          listener.lineEnd();
        }
        listener.polygonEnd();
        segments = polygon = null;
      },
      sphere: function() {
        listener.polygonStart();
        listener.lineStart();
        interpolate(null, null, 1, listener);
        listener.lineEnd();
        listener.polygonEnd();
      }
    };

    function point(λ, φ) { if (pointVisible(λ, φ)) listener.point(λ, φ); }
    function pointLine(λ, φ) { line.point(λ, φ); }
    function lineStart() { clip.point = pointLine; line.lineStart(); }
    function lineEnd() { clip.point = point; line.lineEnd(); }

    var segments;

    var buffer = d3_geo_clipBufferListener(),
        ringListener = clipLine(buffer),
        polygon,
        ring;

    function pointRing(λ, φ) {
      ringListener.point(λ, φ);
      ring.push([λ, φ]);
    }

    function ringStart() {
      ringListener.lineStart();
      ring = [];
    }

    function ringEnd() {
      pointRing(ring[0][0], ring[0][1]);
      ringListener.lineEnd();

      var clean = ringListener.clean(),
          ringSegments = buffer.buffer(),
          segment,
          n = ringSegments.length;

      ring.pop();
      polygon.push(ring);
      ring = null;

      if (!n) return;

      // No intersections.
      if (clean & 1) {
        segment = ringSegments[0];
        var n = segment.length - 1,
            i = -1,
            point;
        listener.lineStart();
        while (++i < n) listener.point((point = segment[i])[0], point[1]);
        listener.lineEnd();
        return;
      }

      // Rejoin connected segments.
      // TODO reuse bufferListener.rejoin()?
      if (n > 1 && clean & 2) ringSegments.push(ringSegments.pop().concat(ringSegments.shift()));

      segments.push(ringSegments.filter(d3_geo_clipSegmentLength1));
    }

    return clip;
  };
}

function d3_geo_clipSegmentLength1(segment) {
  return segment.length > 1;
}

function d3_geo_clipBufferListener() {
  var lines = [],
      line;
  return {
    lineStart: function() { lines.push(line = []); },
    point: function(λ, φ) { line.push([λ, φ]); },
    lineEnd: d3_noop,
    buffer: function() {
      var buffer = lines;
      lines = [];
      line = null;
      return buffer;
    },
    rejoin: function() {
      if (lines.length > 1) lines.push(lines.pop().concat(lines.shift()));
    }
  };
}

// Intersection points are sorted along the clip edge. For both antimeridian
// cutting and circle clipping, the same comparison is used.
function d3_geo_clipSort(a, b) {
  return ((a = a.point)[0] < 0 ? a[1] - π / 2 - ε : π / 2 - a[1])
       - ((b = b.point)[0] < 0 ? b[1] - π / 2 - ε : π / 2 - b[1]);
}
// Adds floating point numbers with twice the normal precision.
// Reference: J. R. Shewchuk, Adaptive Precision Floating-Point Arithmetic and
// Fast Robust Geometric Predicates, Discrete & Computational Geometry 18(3)
// 305–363 (1997).
// Code adapted from GeographicLib by Charles F. F. Karney,
// http://geographiclib.sourceforge.net/
// See lib/geographiclib/LICENSE for details.

function d3_adder() {}

d3_adder.prototype = {
  s: 0, // rounded value
  t: 0, // exact error
  add: function(y) {
    d3_adderSum(y, this.t, d3_adderTemp);
    d3_adderSum(d3_adderTemp.s, this.s, this);
    if (this.s) this.t += d3_adderTemp.t;
    else this.s = d3_adderTemp.t;
  },
  reset: function() {
    this.s = this.t = 0;
  },
  valueOf: function() {
    return this.s;
  }
};

var d3_adderTemp = new d3_adder;

function d3_adderSum(a, b, o) {
  var x = o.s = a + b, // a + b
      bv = x - a, av = x - bv; // b_virtual & a_virtual
  o.t = (a - av) + (b - bv); // a_roundoff + b_roundoff
}

d3.geo.stream = function(object, listener) {
  if (object && d3_geo_streamObjectType.hasOwnProperty(object.type)) {
    d3_geo_streamObjectType[object.type](object, listener);
  } else {
    d3_geo_streamGeometry(object, listener);
  }
};

function d3_geo_streamGeometry(geometry, listener) {
  if (geometry && d3_geo_streamGeometryType.hasOwnProperty(geometry.type)) {
    d3_geo_streamGeometryType[geometry.type](geometry, listener);
  }
}

var d3_geo_streamObjectType = {
  Feature: function(feature, listener) {
    d3_geo_streamGeometry(feature.geometry, listener);
  },
  FeatureCollection: function(object, listener) {
    var features = object.features, i = -1, n = features.length;
    while (++i < n) d3_geo_streamGeometry(features[i].geometry, listener);
  }
};

var d3_geo_streamGeometryType = {
  Sphere: function(object, listener) {
    listener.sphere();
  },
  Point: function(object, listener) {
    var coordinate = object.coordinates;
    listener.point(coordinate[0], coordinate[1]);
  },
  MultiPoint: function(object, listener) {
    var coordinates = object.coordinates, i = -1, n = coordinates.length, coordinate;
    while (++i < n) coordinate = coordinates[i], listener.point(coordinate[0], coordinate[1]);
  },
  LineString: function(object, listener) {
    d3_geo_streamLine(object.coordinates, listener, 0);
  },
  MultiLineString: function(object, listener) {
    var coordinates = object.coordinates, i = -1, n = coordinates.length;
    while (++i < n) d3_geo_streamLine(coordinates[i], listener, 0);
  },
  Polygon: function(object, listener) {
    d3_geo_streamPolygon(object.coordinates, listener);
  },
  MultiPolygon: function(object, listener) {
    var coordinates = object.coordinates, i = -1, n = coordinates.length;
    while (++i < n) d3_geo_streamPolygon(coordinates[i], listener);
  },
  GeometryCollection: function(object, listener) {
    var geometries = object.geometries, i = -1, n = geometries.length;
    while (++i < n) d3_geo_streamGeometry(geometries[i], listener);
  }
};

function d3_geo_streamLine(coordinates, listener, closed) {
  var i = -1, n = coordinates.length - closed, coordinate;
  listener.lineStart();
  while (++i < n) coordinate = coordinates[i], listener.point(coordinate[0], coordinate[1]);
  listener.lineEnd();
}

function d3_geo_streamPolygon(coordinates, listener) {
  var i = -1, n = coordinates.length;
  listener.polygonStart();
  while (++i < n) d3_geo_streamLine(coordinates[i], listener, 1);
  listener.polygonEnd();
}

d3.geo.area = function(object) {
  d3_geo_areaSum = 0;
  d3.geo.stream(object, d3_geo_area);
  return d3_geo_areaSum;
};

var d3_geo_areaSum,
    d3_geo_areaRingSum = new d3_adder;

var d3_geo_area = {
  sphere: function() { d3_geo_areaSum += 4 * π; },
  point: d3_noop,
  lineStart: d3_noop,
  lineEnd: d3_noop,

  // Only count area for polygon rings.
  polygonStart: function() {
    d3_geo_areaRingSum.reset();
    d3_geo_area.lineStart = d3_geo_areaRingStart;
  },
  polygonEnd: function() {
    var area = 2 * d3_geo_areaRingSum;
    d3_geo_areaSum += area < 0 ? 4 * π + area : area;
    d3_geo_area.lineStart = d3_geo_area.lineEnd = d3_geo_area.point = d3_noop;
  }
};

function d3_geo_areaRingStart() {
  var λ00, φ00, λ0, cosφ0, sinφ0; // start point and previous point

  // For the first point, …
  d3_geo_area.point = function(λ, φ) {
    d3_geo_area.point = nextPoint;
    λ0 = (λ00 = λ) * d3_radians, cosφ0 = Math.cos(φ = (φ00 = φ) * d3_radians / 2 + π / 4), sinφ0 = Math.sin(φ);
  };

  // For subsequent points, …
  function nextPoint(λ, φ) {
    λ *= d3_radians;
    φ = φ * d3_radians / 2 + π / 4; // half the angular distance from south pole

    // Spherical excess E for a spherical triangle with vertices: south pole,
    // previous point, current point.  Uses a formula derived from Cagnoli’s
    // theorem.  See Todhunter, Spherical Trig. (1871), Sec. 103, Eq. (2).
    var dλ = λ - λ0,
        cosφ = Math.cos(φ),
        sinφ = Math.sin(φ),
        k = sinφ0 * sinφ,
        u = cosφ0 * cosφ + k * Math.cos(dλ),
        v = k * Math.sin(dλ);
    d3_geo_areaRingSum.add(Math.atan2(v, u));

    // Advance the previous points.
    λ0 = λ, cosφ0 = cosφ, sinφ0 = sinφ;
  }

  // For the last point, return to the start.
  d3_geo_area.lineEnd = function() {
    nextPoint(λ00, φ00);
  };
}
// TODO
// cross and scale return new vectors,
// whereas add and normalize operate in-place

function d3_geo_cartesian(spherical) {
  var λ = spherical[0],
      φ = spherical[1],
      cosφ = Math.cos(φ);
  return [
    cosφ * Math.cos(λ),
    cosφ * Math.sin(λ),
    Math.sin(φ)
  ];
}

function d3_geo_cartesianDot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function d3_geo_cartesianCross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ];
}

function d3_geo_cartesianAdd(a, b) {
  a[0] += b[0];
  a[1] += b[1];
  a[2] += b[2];
}

function d3_geo_cartesianScale(vector, k) {
  return [
    vector[0] * k,
    vector[1] * k,
    vector[2] * k
  ];
}

function d3_geo_cartesianNormalize(d) {
  var l = Math.sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]);
  d[0] /= l;
  d[1] /= l;
  d[2] /= l;
}

function d3_geo_pointInPolygon(point, polygon) {
  var meridian = point[0],
      parallel = point[1],
      meridianNormal = [Math.sin(meridian), -Math.cos(meridian), 0],
      polarAngle = 0,
      polar = false,
      southPole = false,
      winding = 0;
  d3_geo_areaRingSum.reset();

  for (var i = 0, n = polygon.length; i < n; ++i) {
    var ring = polygon[i],
        m = ring.length;
    if (!m) continue;
    var point0 = ring[0],
        λ0 = point0[0],
        φ0 = point0[1] / 2 + π / 4,
        sinφ0 = Math.sin(φ0),
        cosφ0 = Math.cos(φ0),
        j = 1;

    while (true) {
      if (j === m) j = 0;
      point = ring[j];
      var λ = point[0],
          φ = point[1] / 2 + π / 4,
          sinφ = Math.sin(φ),
          cosφ = Math.cos(φ),
          dλ = λ - λ0,
          antimeridian = Math.abs(dλ) > π,
          k = sinφ0 * sinφ;
      d3_geo_areaRingSum.add(Math.atan2(k * Math.sin(dλ), cosφ0 * cosφ + k * Math.cos(dλ)));

      if (Math.abs(φ) < ε) southPole = true;
      polarAngle += antimeridian ? dλ + (dλ >= 0 ? 2 : -2) * π : dλ;

      // Are the longitudes either side of the point's meridian, and are the
      // latitudes smaller than the parallel?
      if (antimeridian ^ λ0 >= meridian ^ λ >= meridian) {
        var arc = d3_geo_cartesianCross(d3_geo_cartesian(point0), d3_geo_cartesian(point));
        d3_geo_cartesianNormalize(arc);
        var intersection = d3_geo_cartesianCross(meridianNormal, arc);
        d3_geo_cartesianNormalize(intersection);
        var φarc = (antimeridian ^ dλ >= 0 ? -1 : 1) * d3_asin(intersection[2]);
        if (parallel > φarc) {
          winding += antimeridian ^ dλ >= 0 ? 1 : -1;
        }
      }
      if (!j++) break;
      λ0 = λ, sinφ0 = sinφ, cosφ0 = cosφ, point0 = point;
    }
    if (Math.abs(polarAngle) > ε) polar = true;
  }

  // First, determine whether the South pole is inside or outside:
  //
  // It is inside if:
  // * the polygon doesn't wind around it, and its area is negative (counter-clockwise).
  // * otherwise, if the polygon winds around it in a clockwise direction.
  //
  // Second, count the (signed) number of times a segment crosses a meridian
  // from the point to the South pole.  If it is zero, then the point is the
  // same side as the South pole.

  return (!southPole && !polar && d3_geo_areaRingSum < 0 || polarAngle < -ε) ^ (winding & 1);
}

var d3_geo_clipAntimeridian = d3_geo_clip(
    d3_true,
    d3_geo_clipAntimeridianLine,
    d3_geo_clipAntimeridianInterpolate,
    d3_geo_clipAntimeridianPolygonContains);

// Takes a line and cuts into visible segments. Return values:
//   0: there were intersections or the line was empty.
//   1: no intersections.
//   2: there were intersections, and the first and last segments should be
//      rejoined.
function d3_geo_clipAntimeridianLine(listener) {
  var λ0 = NaN,
      φ0 = NaN,
      sλ0 = NaN,
      clean; // no intersections

  return {
    lineStart: function() {
      listener.lineStart();
      clean = 1;
    },
    point: function(λ1, φ1) {
      var sλ1 = λ1 > 0 ? π : -π,
          dλ = Math.abs(λ1 - λ0);
      if (Math.abs(dλ - π) < ε) { // line crosses a pole
        listener.point(λ0, φ0 = (φ0 + φ1) / 2 > 0 ? π / 2 : -π / 2);
        listener.point(sλ0, φ0);
        listener.lineEnd();
        listener.lineStart();
        listener.point(sλ1, φ0);
        listener.point( λ1, φ0);
        clean = 0;
      } else if (sλ0 !== sλ1 && dλ >= π) { // line crosses antimeridian
        // handle degeneracies
        if (Math.abs(λ0 - sλ0) < ε) λ0 -= sλ0 * ε;
        if (Math.abs(λ1 - sλ1) < ε) λ1 -= sλ1 * ε;
        φ0 = d3_geo_clipAntimeridianIntersect(λ0, φ0, λ1, φ1);
        listener.point(sλ0, φ0);
        listener.lineEnd();
        listener.lineStart();
        listener.point(sλ1, φ0);
        clean = 0;
      }
      listener.point(λ0 = λ1, φ0 = φ1);
      sλ0 = sλ1;
    },
    lineEnd: function() {
      listener.lineEnd();
      λ0 = φ0 = NaN;
    },
    // if there are intersections, we always rejoin the first and last segments.
    clean: function() { return 2 - clean; }
  };
}

function d3_geo_clipAntimeridianIntersect(λ0, φ0, λ1, φ1) {
  var cosφ0,
      cosφ1,
      sinλ0_λ1 = Math.sin(λ0 - λ1);
  return Math.abs(sinλ0_λ1) > ε
      ? Math.atan((Math.sin(φ0) * (cosφ1 = Math.cos(φ1)) * Math.sin(λ1)
                 - Math.sin(φ1) * (cosφ0 = Math.cos(φ0)) * Math.sin(λ0))
                 / (cosφ0 * cosφ1 * sinλ0_λ1))
      : (φ0 + φ1) / 2;
}

function d3_geo_clipAntimeridianInterpolate(from, to, direction, listener) {
  var φ;
  if (from == null) {
    φ = direction * π / 2;
    listener.point(-π,  φ);
    listener.point( 0,  φ);
    listener.point( π,  φ);
    listener.point( π,  0);
    listener.point( π, -φ);
    listener.point( 0, -φ);
    listener.point(-π, -φ);
    listener.point(-π,  0);
    listener.point(-π,  φ);
  } else if (Math.abs(from[0] - to[0]) > ε) {
    var s = (from[0] < to[0] ? 1 : -1) * π;
    φ = direction * s / 2;
    listener.point(-s, φ);
    listener.point( 0, φ);
    listener.point( s, φ);
  } else {
    listener.point(to[0], to[1]);
  }
}

var d3_geo_clipAntimeridianPoint = [-π, 0];

function d3_geo_clipAntimeridianPolygonContains(polygon) {
  return d3_geo_pointInPolygon(d3_geo_clipAntimeridianPoint, polygon);
}

function d3_geo_equirectangular(λ, φ) {
  return [λ, φ];
}

(d3.geo.equirectangular = function() {
  return d3_geo_projection(d3_geo_equirectangular);
}).raw = d3_geo_equirectangular.invert = d3_geo_equirectangular;

d3.geo.rotation = function(rotate) {
  rotate = d3_geo_rotation(rotate[0] % 360 * d3_radians, rotate[1] * d3_radians, rotate.length > 2 ? rotate[2] * d3_radians : 0);

  function forward(coordinates) {
    coordinates = rotate(coordinates[0] * d3_radians, coordinates[1] * d3_radians);
    return coordinates[0] *= d3_degrees, coordinates[1] *= d3_degrees, coordinates;
  }

  forward.invert = function(coordinates) {
    coordinates = rotate.invert(coordinates[0] * d3_radians, coordinates[1] * d3_radians);
    return coordinates[0] *= d3_degrees, coordinates[1] *= d3_degrees, coordinates;
  };

  return forward;
};

// Note: |δλ| must be < 2π
function d3_geo_rotation(δλ, δφ, δγ) {
  return δλ ? (δφ || δγ ? d3_geo_compose(d3_geo_rotationλ(δλ), d3_geo_rotationφγ(δφ, δγ))
    : d3_geo_rotationλ(δλ))
    : (δφ || δγ ? d3_geo_rotationφγ(δφ, δγ)
    : d3_geo_equirectangular);
}

function d3_geo_forwardRotationλ(δλ) {
  return function(λ, φ) {
    return λ += δλ, [λ > π ? λ - 2 * π : λ < -π ? λ + 2 * π : λ, φ];
  };
}

function d3_geo_rotationλ(δλ) {
  var rotation = d3_geo_forwardRotationλ(δλ);
  rotation.invert = d3_geo_forwardRotationλ(-δλ);
  return rotation;
}

function d3_geo_rotationφγ(δφ, δγ) {
  var cosδφ = Math.cos(δφ),
      sinδφ = Math.sin(δφ),
      cosδγ = Math.cos(δγ),
      sinδγ = Math.sin(δγ);

  function rotation(λ, φ) {
    var cosφ = Math.cos(φ),
        x = Math.cos(λ) * cosφ,
        y = Math.sin(λ) * cosφ,
        z = Math.sin(φ),
        k = z * cosδφ + x * sinδφ;
    return [
      Math.atan2(y * cosδγ - k * sinδγ, x * cosδφ - z * sinδφ),
      d3_asin(k * cosδγ + y * sinδγ)
    ];
  }

  rotation.invert = function(λ, φ) {
    var cosφ = Math.cos(φ),
        x = Math.cos(λ) * cosφ,
        y = Math.sin(λ) * cosφ,
        z = Math.sin(φ),
        k = z * cosδγ - y * sinδγ;
    return [
      Math.atan2(y * cosδγ + z * sinδγ, x * cosδφ + k * sinδφ),
      d3_asin(k * cosδφ - x * sinδφ)
    ];
  };

  return rotation;
}

d3.geo.circle = function() {
  var origin = [0, 0],
      angle,
      precision = 6,
      interpolate;

  function circle() {
    var center = typeof origin === "function" ? origin.apply(this, arguments) : origin,
        rotate = d3_geo_rotation(-center[0] * d3_radians, -center[1] * d3_radians, 0).invert,
        ring = [];

    interpolate(null, null, 1, {
      point: function(x, y) {
        ring.push(x = rotate(x, y));
        x[0] *= d3_degrees, x[1] *= d3_degrees;
      }
    });

    return {type: "Polygon", coordinates: [ring]};
  }

  circle.origin = function(x) {
    if (!arguments.length) return origin;
    origin = x;
    return circle;
  };

  circle.angle = function(x) {
    if (!arguments.length) return angle;
    interpolate = d3_geo_circleInterpolate((angle = +x) * d3_radians, precision * d3_radians);
    return circle;
  };

  circle.precision = function(_) {
    if (!arguments.length) return precision;
    interpolate = d3_geo_circleInterpolate(angle * d3_radians, (precision = +_) * d3_radians);
    return circle;
  };

  return circle.angle(90);
};

// Interpolates along a circle centered at [0°, 0°], with a given radius and
// precision.
function d3_geo_circleInterpolate(radius, precision) {
  var cr = Math.cos(radius),
      sr = Math.sin(radius);
  return function(from, to, direction, listener) {
    if (from != null) {
      from = d3_geo_circleAngle(cr, from);
      to = d3_geo_circleAngle(cr, to);
      if (direction > 0 ? from < to: from > to) from += direction * 2 * π;
    } else {
      from = radius + direction * 2 * π;
      to = radius;
    }
    var point;
    for (var step = direction * precision, t = from; direction > 0 ? t > to : t < to; t -= step) {
      listener.point((point = d3_geo_spherical([
        cr,
        -sr * Math.cos(t),
        -sr * Math.sin(t)
      ]))[0], point[1]);
    }
  };
}

// Signed angle of a cartesian point relative to [cr, 0, 0].
function d3_geo_circleAngle(cr, point) {
  var a = d3_geo_cartesian(point);
  a[0] -= cr;
  d3_geo_cartesianNormalize(a);
  var angle = d3_acos(-a[1]);
  return ((-a[2] < 0 ? -angle : angle) + 2 * Math.PI - ε) % (2 * Math.PI);
}

// Clip features against a small circle centered at [0°, 0°].
function d3_geo_clipCircle(radius) {
  var cr = Math.cos(radius),
      smallRadius = cr > 0,
      point = [radius, 0],
      notHemisphere = Math.abs(cr) > ε, // TODO optimise for this common case
      interpolate = d3_geo_circleInterpolate(radius, 6 * d3_radians);

  return d3_geo_clip(visible, clipLine, interpolate, polygonContains);

  function visible(λ, φ) {
    return Math.cos(λ) * Math.cos(φ) > cr;
  }

  // Takes a line and cuts into visible segments. Return values used for
  // polygon clipping:
  //   0: there were intersections or the line was empty.
  //   1: no intersections.
  //   2: there were intersections, and the first and last segments should be
  //      rejoined.
  function clipLine(listener) {
    var point0, // previous point
        c0, // code for previous point
        v0, // visibility of previous point
        v00, // visibility of first point
        clean; // no intersections
    return {
      lineStart: function() {
        v00 = v0 = false;
        clean = 1;
      },
      point: function(λ, φ) {
        var point1 = [λ, φ],
            point2,
            v = visible(λ, φ),
            c = smallRadius
              ? v ? 0 : code(λ, φ)
              : v ? code(λ + (λ < 0 ? π : -π), φ) : 0;
        if (!point0 && (v00 = v0 = v)) listener.lineStart();
        // Handle degeneracies.
        // TODO ignore if not clipping polygons.
        if (v !== v0) {
          point2 = intersect(point0, point1);
          if (d3_geo_sphericalEqual(point0, point2) || d3_geo_sphericalEqual(point1, point2)) {
            point1[0] += ε;
            point1[1] += ε;
            v = visible(point1[0], point1[1]);
          }
        }
        if (v !== v0) {
          clean = 0;
          if (v) {
            // outside going in
            listener.lineStart();
            point2 = intersect(point1, point0);
            listener.point(point2[0], point2[1]);
          } else {
            // inside going out
            point2 = intersect(point0, point1);
            listener.point(point2[0], point2[1]);
            listener.lineEnd();
          }
          point0 = point2;
        } else if (notHemisphere && point0 && smallRadius ^ v) {
          var t;
          // If the codes for two points are different, or are both zero,
          // and there this segment intersects with the small circle.
          if (!(c & c0) && (t = intersect(point1, point0, true))) {
            clean = 0;
            if (smallRadius) {
              listener.lineStart();
              listener.point(t[0][0], t[0][1]);
              listener.point(t[1][0], t[1][1]);
              listener.lineEnd();
            } else {
              listener.point(t[1][0], t[1][1]);
              listener.lineEnd();
              listener.lineStart();
              listener.point(t[0][0], t[0][1]);
            }
          }
        }
        if (v && (!point0 || !d3_geo_sphericalEqual(point0, point1))) {
          listener.point(point1[0], point1[1]);
        }
        point0 = point1, v0 = v, c0 = c;
      },
      lineEnd: function() {
        if (v0) listener.lineEnd();
        point0 = null;
      },
      // Rejoin first and last segments if there were intersections and the first
      // and last points were visible.
      clean: function() { return clean | ((v00 && v0) << 1); }
    };
  }

  // Intersects the great circle between a and b with the clip circle.
  function intersect(a, b, two) {
    var pa = d3_geo_cartesian(a),
        pb = d3_geo_cartesian(b);

    // We have two planes, n1.p = d1 and n2.p = d2.
    // Find intersection line p(t) = c1 n1 + c2 n2 + t (n1 ⨯ n2).
    var n1 = [1, 0, 0], // normal
        n2 = d3_geo_cartesianCross(pa, pb),
        n2n2 = d3_geo_cartesianDot(n2, n2),
        n1n2 = n2[0], // d3_geo_cartesianDot(n1, n2),
        determinant = n2n2 - n1n2 * n1n2;

    // Two polar points.
    if (!determinant) return !two && a;

    var c1 =  cr * n2n2 / determinant,
        c2 = -cr * n1n2 / determinant,
        n1xn2 = d3_geo_cartesianCross(n1, n2),
        A = d3_geo_cartesianScale(n1, c1),
        B = d3_geo_cartesianScale(n2, c2);
    d3_geo_cartesianAdd(A, B);

    // Solve |p(t)|^2 = 1.
    var u = n1xn2,
        w = d3_geo_cartesianDot(A, u),
        uu = d3_geo_cartesianDot(u, u),
        t2 = w * w - uu * (d3_geo_cartesianDot(A, A) - 1);

    if (t2 < 0) return;

    var t = Math.sqrt(t2),
        q = d3_geo_cartesianScale(u, (-w - t) / uu);
    d3_geo_cartesianAdd(q, A);
    q = d3_geo_spherical(q);
    if (!two) return q;

    // Two intersection points.
    var λ0 = a[0],
        λ1 = b[0],
        φ0 = a[1],
        φ1 = b[1],
        z;
    if (λ1 < λ0) z = λ0, λ0 = λ1, λ1 = z;
    var δλ = λ1 - λ0,
        polar = Math.abs(δλ - π) < ε,
        meridian = polar || δλ < ε;

    if (!polar && φ1 < φ0) z = φ0, φ0 = φ1, φ1 = z;

    // Check that the first point is between a and b.
    if (meridian
        ? polar
          ? φ0 + φ1 > 0 ^ q[1] < (Math.abs(q[0] - λ0) < ε ? φ0 : φ1)
          : φ0 <= q[1] && q[1] <= φ1
        : δλ > π ^ (λ0 <= q[0] && q[0] <= λ1)) {
      var q1 = d3_geo_cartesianScale(u, (-w + t) / uu);
      d3_geo_cartesianAdd(q1, A);
      return [q, d3_geo_spherical(q1)];
    }
  }

  // Generates a 4-bit vector representing the location of a point relative to
  // the small circle's bounding box.
  function code(λ, φ) {
    var r = smallRadius ? radius : π - radius,
        code = 0;
    if (λ < -r) code |= 1; // left
    else if (λ > r) code |= 2; // right
    if (φ < -r) code |= 4; // below
    else if (φ > r) code |= 8; // above
    return code;
  }

  function polygonContains(polygon) {
    return d3_geo_pointInPolygon(point, polygon);
  }
}

var d3_geo_clipViewMAX = 1e9;

function d3_geo_clipView(x0, y0, x1, y1) {
  return function(listener) {
    var listener_ = listener,
        bufferListener = d3_geo_clipBufferListener(),
        segments,
        polygon,
        ring;

    var clip = {
      point: point,
      lineStart: lineStart,
      lineEnd: lineEnd,
      polygonStart: function() {
        listener = bufferListener;
        segments = [];
        polygon = [];
      },
      polygonEnd: function() {
        listener = listener_;
        if ((segments = d3.merge(segments)).length) {
          listener.polygonStart();
          d3_geo_clipPolygon(segments, compare, inside, interpolate, listener);
          listener.polygonEnd();
        } else if (insidePolygon([x0, y0])) {
          listener.polygonStart(), listener.lineStart();
          interpolate(null, null, 1, listener);
          listener.lineEnd(), listener.polygonEnd();
        }
        segments = polygon = ring = null;
      }
    };

    function inside(point) {
      var a = corner(point, -1),
          i = insidePolygon([a === 0 || a === 3 ? x0 : x1, a > 1 ? y1 : y0]);
      return i;
    }

    function insidePolygon(p) {
      var wn = 0, // the winding number counter
          n = polygon.length,
          y = p[1];

      for (var i = 0; i < n; ++i) {
        for (var j = 1, v = polygon[i], m = v.length, a = v[0], b; j < m; ++j) {
          b = v[j];
          if (a[1] <= y) {
            if (b[1] >  y && isLeft(a, b, p) > 0) ++wn;
          } else {
            if (b[1] <= y && isLeft(a, b, p) < 0) --wn;
          }
          a = b;
        }
      }
      return wn !== 0;
    }

    function isLeft(a, b, c) {
      return (b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1]);
    }

    function interpolate(from, to, direction, listener) {
      var a = 0, a1 = 0;
      if (from == null ||
          (a = corner(from, direction)) !== (a1 = corner(to, direction)) ||
          comparePoints(from, to) < 0 ^ direction > 0) {
        do {
          listener.point(a === 0 || a === 3 ? x0 : x1, a > 1 ? y1 : y0);
        } while ((a = (a + direction + 4) % 4) !== a1);
      } else {
        listener.point(to[0], to[1]);
      }
    }

    function visible(x, y) {
      return x0 <= x && x <= x1 && y0 <= y && y <= y1;
    }

    function point(x, y) {
      if (visible(x, y)) listener.point(x, y);
    }

    var x__, y__, v__, // first point
        x_, y_, v_, // previous point
        first;

    function lineStart() {
      clip.point = linePoint;
      if (polygon) polygon.push(ring = []);
      first = true;
      v_ = false;
      x_ = y_ = NaN;
    }

    function lineEnd() {
      // TODO rather than special-case polygons, simply handle them separately.
      // Ideally, coincident intersection points should be jittered to avoid
      // clipping issues.
      if (segments) {
        linePoint(x__, y__);
        if (v__ && v_) bufferListener.rejoin();
        segments.push(bufferListener.buffer());
      }
      clip.point = point;
      if (v_) listener.lineEnd();
    }

    function linePoint(x, y) {
      x = Math.max(-d3_geo_clipViewMAX, Math.min(d3_geo_clipViewMAX, x));
      y = Math.max(-d3_geo_clipViewMAX, Math.min(d3_geo_clipViewMAX, y));
      var v = visible(x, y);
      if (polygon) ring.push([x, y]);
      if (first) {
        x__ = x, y__ = y, v__ = v;
        first = false;
        if (v) {
          listener.lineStart();
          listener.point(x, y);
        }
      } else {
        if (v && v_) listener.point(x, y);
        else {
          var a = [x_, y_],
              b = [x, y];
          if (clipLine(a, b)) {
            if (!v_) {
              listener.lineStart();
              listener.point(a[0], a[1]);
            }
            listener.point(b[0], b[1]);
            if (!v) listener.lineEnd();
          } else if (v) {
            listener.lineStart();
            listener.point(x, y);
          }
        }
      }
      x_ = x, y_ = y, v_ = v;
    }

    return clip;
  };

  function corner(p, direction) {
    return Math.abs(p[0] - x0) < ε ? direction > 0 ? 0 : 3
        : Math.abs(p[0] - x1) < ε ? direction > 0 ? 2 : 1
        : Math.abs(p[1] - y0) < ε ? direction > 0 ? 1 : 0
        : direction > 0 ? 3 : 2; // Math.abs(p[1] - y1) < ε
  }

  function compare(a, b) {
    return comparePoints(a.point, b.point);
  }

  function comparePoints(a, b) {
    var ca = corner(a, 1),
        cb = corner(b, 1);
    return ca !== cb ? ca - cb
        : ca === 0 ? b[1] - a[1]
        : ca === 1 ? a[0] - b[0]
        : ca === 2 ? a[1] - b[1]
        : b[0] - a[0];
  }

  // Liang–Barsky line clipping.
  function clipLine(a, b) {
    var dx = b[0] - a[0],
        dy = b[1] - a[1],
        t = [0, 1];

    if (Math.abs(dx) < ε && Math.abs(dy) < ε) return x0 <= a[0] && a[0] <= x1 && y0 <= a[1] && a[1] <= y1;

    if (d3_geo_clipViewT(x0 - a[0],  dx, t) &&
        d3_geo_clipViewT(a[0] - x1, -dx, t) &&
        d3_geo_clipViewT(y0 - a[1],  dy, t) &&
        d3_geo_clipViewT(a[1] - y1, -dy, t)) {
      if (t[1] < 1) {
        b[0] = a[0] + t[1] * dx;
        b[1] = a[1] + t[1] * dy;
      }
      if (t[0] > 0) {
        a[0] += t[0] * dx;
        a[1] += t[0] * dy;
      }
      return true;
    }

    return false;
  }
}

function d3_geo_clipViewT(num, denominator, t) {
  if (Math.abs(denominator) < ε) return num <= 0;

  var u = num / denominator;

  if (denominator > 0) {
    if (u > t[1]) return false;
    if (u > t[0]) t[0] = u;
  } else {
    if (u < t[0]) return false;
    if (u < t[1]) t[1] = u;
  }
  return true;
}
function d3_geo_compose(a, b) {

  function compose(x, y) {
    return x = a(x, y), b(x[0], x[1]);
  }

  if (a.invert && b.invert) compose.invert = function(x, y) {
    return x = b.invert(x, y), x && a.invert(x[0], x[1]);
  };

  return compose;
}

function d3_geo_conic(projectAt) {
  var φ0 = 0,
      φ1 = π / 3,
      m = d3_geo_projectionMutator(projectAt),
      p = m(φ0, φ1);

  p.parallels = function(_) {
    if (!arguments.length) return [φ0 / π * 180, φ1 / π * 180];
    return m(φ0 = _[0] * π / 180, φ1 = _[1] * π / 180);
  };

  return p;
}

function d3_geo_conicEqualArea(φ0, φ1) {
  var sinφ0 = Math.sin(φ0),
      n = (sinφ0 + Math.sin(φ1)) / 2,
      C = 1 + sinφ0 * (2 * n - sinφ0),
      ρ0 = Math.sqrt(C) / n;

  function forward(λ, φ) {
    var ρ = Math.sqrt(C - 2 * n * Math.sin(φ)) / n;
    return [
      ρ * Math.sin(λ *= n),
      ρ0 - ρ * Math.cos(λ)
    ];
  }

  forward.invert = function(x, y) {
    var ρ0_y = ρ0 - y;
    return [
      Math.atan2(x, ρ0_y) / n,
      d3_asin((C - (x * x + ρ0_y * ρ0_y) * n * n) / (2 * n))
    ];
  };

  return forward;
}

(d3.geo.conicEqualArea = function() {
  return d3_geo_conic(d3_geo_conicEqualArea);
}).raw = d3_geo_conicEqualArea;

// ESRI:102003
d3.geo.albers = function() {
  return d3.geo.conicEqualArea()
      .rotate([96, 0])
      .center([-.6, 38.7])
      .parallels([29.5, 45.5])
      .scale(1070);
};

// A composite projection for the United States, configured by default for
// 960×500. Also works quite well at 960×600 with scale 1285. The set of
// standard parallels for each region comes from USGS, which is published here:
// http://egsc.usgs.gov/isb/pubs/MapProjections/projections.html#albers
d3.geo.albersUsa = function() {
  var lower48 = d3.geo.albers();

  // EPSG:3338
  var alaska = d3.geo.conicEqualArea()
      .rotate([154, 0])
      .center([-2, 58.5])
      .parallels([55, 65]);

  // ESRI:102007
  var hawaii = d3.geo.conicEqualArea()
      .rotate([157, 0])
      .center([-3, 19.9])
      .parallels([8, 18]);

  var point,
      pointStream = {point: function(x, y) { point = [x, y]; }},
      lower48Point,
      alaskaPoint,
      hawaiiPoint;

  function albersUsa(coordinates) {
    var x = coordinates[0], y = coordinates[1];
    point = null;
    (lower48Point(x, y), point)
        || (alaskaPoint(x, y), point)
        || hawaiiPoint(x, y);
    return point;
  }

  albersUsa.invert = function(coordinates) {
    var k = lower48.scale(),
        t = lower48.translate(),
        x = (coordinates[0] - t[0]) / k,
        y = (coordinates[1] - t[1]) / k;
    return (y >= .120 && y < .234 && x >= -.425 && x < -.214 ? alaska
        : y >= .166 && y < .234 && x >= -.214 && x < -.115 ? hawaii
        : lower48).invert(coordinates);
  };

  // A naïve multi-projection stream.
  // The projections must have mutually exclusive clip regions on the sphere,
  // as this will avoid emitting interleaving lines and polygons.
  albersUsa.stream = function(stream) {
    var lower48Stream = lower48.stream(stream),
        alaskaStream = alaska.stream(stream),
        hawaiiStream = hawaii.stream(stream);
    return {
      point: function(x, y) {
        lower48Stream.point(x, y);
        alaskaStream.point(x, y);
        hawaiiStream.point(x, y);
      },
      sphere: function() {
        lower48Stream.sphere();
        alaskaStream.sphere();
        hawaiiStream.sphere();
      },
      lineStart: function() {
        lower48Stream.lineStart();
        alaskaStream.lineStart();
        hawaiiStream.lineStart();
      },
      lineEnd: function() {
        lower48Stream.lineEnd();
        alaskaStream.lineEnd();
        hawaiiStream.lineEnd();
      },
      polygonStart: function() {
        lower48Stream.polygonStart();
        alaskaStream.polygonStart();
        hawaiiStream.polygonStart();
      },
      polygonEnd: function() {
        lower48Stream.polygonEnd();
        alaskaStream.polygonEnd();
        hawaiiStream.polygonEnd();
      }
    };
  };

  albersUsa.precision = function(_) {
    if (!arguments.length) return lower48.precision();
    lower48.precision(_);
    alaska.precision(_);
    hawaii.precision(_);
    return albersUsa;
  };

  albersUsa.scale = function(_) {
    if (!arguments.length) return lower48.scale();
    lower48.scale(_);
    alaska.scale(_ * .35);
    hawaii.scale(_);
    return albersUsa.translate(lower48.translate());
  };

  albersUsa.translate = function(_) {
    if (!arguments.length) return lower48.translate();
    var k = lower48.scale(), x = +_[0], y = +_[1];

    lower48Point = lower48
        .translate(_)
        .clipExtent([[x - .455 * k, y - .238 * k], [x + .455 * k, y + .238 * k]])
        .stream(pointStream).point;

    alaskaPoint = alaska
        .translate([x - .307 * k, y + .201 * k])
        .clipExtent([[x - .425 * k + ε, y + .120 * k + ε], [x - .214 * k - ε, y + .234 * k - ε]])
        .stream(pointStream).point;

    hawaiiPoint = hawaii
        .translate([x - .205 * k, y + .212 * k])
        .clipExtent([[x - .214 * k + ε, y + .166 * k + ε], [x - .115 * k - ε, y + .234 * k - ε]])
        .stream(pointStream).point;

    return albersUsa;
  };

  return albersUsa.scale(1070);
};

d3.geo.bounds = (function() {
  var λ0, φ0, λ1, φ1, // bounds
      λ_, // previous λ-coordinate
      λ__, φ__, // first point
      p0, // previous 3D point
      dλSum,
      ranges,
      range;

  var bound = {
    point: point,
    lineStart: lineStart,
    lineEnd: lineEnd,

    polygonStart: function() {
      bound.point = ringPoint;
      bound.lineStart = ringStart;
      bound.lineEnd = ringEnd;
      dλSum = 0;
      d3_geo_area.polygonStart();
    },
    polygonEnd: function() {
      d3_geo_area.polygonEnd();
      bound.point = point;
      bound.lineStart = lineStart;
      bound.lineEnd = lineEnd;
      if (d3_geo_areaRingSum < 0) λ0 = -(λ1 = 180), φ0 = -(φ1 = 90);
      else if (dλSum > ε) φ1 = 90;
      else if (dλSum < -ε) φ0 = -90;
      range[0] = λ0, range[1] = λ1;
    }
  };

  function point(λ, φ) {
    ranges.push(range = [λ0 = λ, λ1 = λ]);
    if (φ < φ0) φ0 = φ;
    if (φ > φ1) φ1 = φ;
  }

  function linePoint(λ, φ) {
    var p = d3_geo_cartesian([λ * d3_radians, φ * d3_radians]);
    if (p0) {
      var normal = d3_geo_cartesianCross(p0, p),
          equatorial = [normal[1], -normal[0], 0],
          inflection = d3_geo_cartesianCross(equatorial, normal);
      d3_geo_cartesianNormalize(inflection);
      inflection = d3_geo_spherical(inflection);
      var dλ = λ - λ_,
          s = dλ > 0 ? 1 : -1,
          λi = inflection[0] * d3_degrees * s,
          antimeridian = Math.abs(dλ) > 180;
      if (antimeridian ^ (s * λ_ < λi && λi < s * λ)) {
        var φi = inflection[1] * d3_degrees;
        if (φi > φ1) φ1 = φi;
      } else if (λi = (λi + 360) % 360 - 180, antimeridian ^ (s * λ_ < λi && λi < s * λ)) {
        var φi = -inflection[1] * d3_degrees;
        if (φi < φ0) φ0 = φi;
      } else {
        if (φ < φ0) φ0 = φ;
        if (φ > φ1) φ1 = φ;
      }
      if (antimeridian) {
        if (λ < λ_) {
          if (angle(λ0, λ) > angle(λ0, λ1)) λ1 = λ;
        } else {
          if (angle(λ, λ1) > angle(λ0, λ1)) λ0 = λ;
        }
      } else {
        if (λ1 >= λ0) {
          if (λ < λ0) λ0 = λ;
          if (λ > λ1) λ1 = λ;
        } else {
          if (λ > λ_) {
            if (angle(λ0, λ) > angle(λ0, λ1)) λ1 = λ;
          } else {
            if (angle(λ, λ1) > angle(λ0, λ1)) λ0 = λ;
          }
        }
      }
    } else {
      point(λ, φ);
    }
    p0 = p, λ_ = λ;
  }

  function lineStart() { bound.point = linePoint; }
  function lineEnd() {
    range[0] = λ0, range[1] = λ1;
    bound.point = point;
    p0 = null;
  }

  function ringPoint(λ, φ) {
    if (p0) {
      var dλ = λ - λ_;
      dλSum += Math.abs(dλ) > 180 ? dλ + (dλ > 0 ? 360 : -360) : dλ;
    } else λ__ = λ, φ__ = φ;
    d3_geo_area.point(λ, φ);
    linePoint(λ, φ);
  }

  function ringStart() {
    d3_geo_area.lineStart();
  }

  function ringEnd() {
    ringPoint(λ__, φ__);
    d3_geo_area.lineEnd();
    if (Math.abs(dλSum) > ε) λ0 = -(λ1 = 180);
    range[0] = λ0, range[1] = λ1;
    p0 = null;
  }

  // Finds the left-right distance between two longitudes.
  // This is almost the same as (λ1 - λ0 + 360°) % 360°, except that we want
  // the distance between ±180° to be 360°.
  function angle(λ0, λ1) { return (λ1 -= λ0) < 0 ? λ1 + 360 : λ1; }

  function compareRanges(a, b) { return a[0] - b[0]; }

  function withinRange(x, range) {
    return range[0] <= range[1] ? range[0] <= x && x <= range[1] : x < range[0] || range[1] < x;
  }

  return function(feature) {
    φ1 = λ1 = -(λ0 = φ0 = Infinity);
    ranges = [];

    d3.geo.stream(feature, bound);

    var n = ranges.length;
    if (n) {
      // First, sort ranges by their minimum longitudes.
      ranges.sort(compareRanges);

      // Then, merge any ranges that overlap.
      for (var i = 1, a = ranges[0], b, merged = [a]; i < n; ++i) {
        b = ranges[i];
        if (withinRange(b[0], a) || withinRange(b[1], a)) {
          if (angle(a[0], b[1]) > angle(a[0], a[1])) a[1] = b[1];
          if (angle(b[0], a[1]) > angle(a[0], a[1])) a[0] = b[0];
        } else {
          merged.push(a = b);
        }
      }

      // Finally, find the largest gap between the merged ranges.
      // The final bounding box will be the inverse of this gap.
      var best = -Infinity, dλ;
      for (var n = merged.length - 1, i = 0, a = merged[n], b; i <= n; a = b, ++i) {
        b = merged[i];
        if ((dλ = angle(a[1], b[0])) > best) best = dλ, λ0 = b[0], λ1 = a[1];
      }
    }
    ranges = range = null;

    return λ0 === Infinity || φ0 === Infinity
        ? [[NaN, NaN], [NaN, NaN]]
        : [[λ0, φ0], [λ1, φ1]];
  };
})();

d3.geo.centroid = function(object) {
  d3_geo_centroidW0 = d3_geo_centroidW1 =
  d3_geo_centroidX0 = d3_geo_centroidY0 = d3_geo_centroidZ0 =
  d3_geo_centroidX1 = d3_geo_centroidY1 = d3_geo_centroidZ1 =
  d3_geo_centroidX2 = d3_geo_centroidY2 = d3_geo_centroidZ2 = 0;
  d3.geo.stream(object, d3_geo_centroid);

  var x = d3_geo_centroidX2,
      y = d3_geo_centroidY2,
      z = d3_geo_centroidZ2,
      m = x * x + y * y + z * z;

  // If the area-weighted centroid is undefined, fall back to length-weighted centroid.
  if (m < ε2) {
    x = d3_geo_centroidX1, y = d3_geo_centroidY1, z = d3_geo_centroidZ1;
    // If the feature has zero length, fall back to arithmetic mean of point vectors.
    if (d3_geo_centroidW1 < ε) x = d3_geo_centroidX0, y = d3_geo_centroidY0, z = d3_geo_centroidZ0;
    m = x * x + y * y + z * z;
    // If the feature still has an undefined centroid, then return.
    if (m < ε2) return [NaN, NaN];
  }

  return [Math.atan2(y, x) * d3_degrees, d3_asin(z / Math.sqrt(m)) * d3_degrees];
};

var d3_geo_centroidW0,
    d3_geo_centroidW1,
    d3_geo_centroidX0,
    d3_geo_centroidY0,
    d3_geo_centroidZ0,
    d3_geo_centroidX1,
    d3_geo_centroidY1,
    d3_geo_centroidZ1,
    d3_geo_centroidX2,
    d3_geo_centroidY2,
    d3_geo_centroidZ2;

var d3_geo_centroid = {
  sphere: d3_noop,
  point: d3_geo_centroidPoint,
  lineStart: d3_geo_centroidLineStart,
  lineEnd: d3_geo_centroidLineEnd,
  polygonStart: function() {
    d3_geo_centroid.lineStart = d3_geo_centroidRingStart;
  },
  polygonEnd: function() {
    d3_geo_centroid.lineStart = d3_geo_centroidLineStart;
  }
};

// Arithmetic mean of Cartesian vectors.
function d3_geo_centroidPoint(λ, φ) {
  λ *= d3_radians;
  var cosφ = Math.cos(φ *= d3_radians);
  d3_geo_centroidPointXYZ(cosφ * Math.cos(λ), cosφ * Math.sin(λ), Math.sin(φ));
}

function d3_geo_centroidPointXYZ(x, y, z) {
  ++d3_geo_centroidW0;
  d3_geo_centroidX0 += (x - d3_geo_centroidX0) / d3_geo_centroidW0;
  d3_geo_centroidY0 += (y - d3_geo_centroidY0) / d3_geo_centroidW0;
  d3_geo_centroidZ0 += (z - d3_geo_centroidZ0) / d3_geo_centroidW0;
}

function d3_geo_centroidLineStart() {
  var x0, y0, z0; // previous point

  d3_geo_centroid.point = function(λ, φ) {
    λ *= d3_radians;
    var cosφ = Math.cos(φ *= d3_radians);
    x0 = cosφ * Math.cos(λ);
    y0 = cosφ * Math.sin(λ);
    z0 = Math.sin(φ);
    d3_geo_centroid.point = nextPoint;
    d3_geo_centroidPointXYZ(x0, y0, z0);
  };

  function nextPoint(λ, φ) {
    λ *= d3_radians;
    var cosφ = Math.cos(φ *= d3_radians),
        x = cosφ * Math.cos(λ),
        y = cosφ * Math.sin(λ),
        z = Math.sin(φ),
        w = Math.atan2(
          Math.sqrt((w = y0 * z - z0 * y) * w + (w = z0 * x - x0 * z) * w + (w = x0 * y - y0 * x) * w),
          x0 * x + y0 * y + z0 * z);
    d3_geo_centroidW1 += w;
    d3_geo_centroidX1 += w * (x0 + (x0 = x));
    d3_geo_centroidY1 += w * (y0 + (y0 = y));
    d3_geo_centroidZ1 += w * (z0 + (z0 = z));
    d3_geo_centroidPointXYZ(x0, y0, z0);
  }
}

function d3_geo_centroidLineEnd() {
  d3_geo_centroid.point = d3_geo_centroidPoint;
}

// See J. E. Brock, The Inertia Tensor for a Spherical Triangle,
// J. Applied Mechanics 42, 239 (1975).
function d3_geo_centroidRingStart() {
  var λ00, φ00, // first point
      x0, y0, z0; // previous point

  d3_geo_centroid.point = function(λ, φ) {
    λ00 = λ, φ00 = φ;
    d3_geo_centroid.point = nextPoint;
    λ *= d3_radians;
    var cosφ = Math.cos(φ *= d3_radians);
    x0 = cosφ * Math.cos(λ);
    y0 = cosφ * Math.sin(λ);
    z0 = Math.sin(φ);
    d3_geo_centroidPointXYZ(x0, y0, z0);
  };

  d3_geo_centroid.lineEnd = function() {
    nextPoint(λ00, φ00);
    d3_geo_centroid.lineEnd = d3_geo_centroidLineEnd;
    d3_geo_centroid.point = d3_geo_centroidPoint;
  };

  function nextPoint(λ, φ) {
    λ *= d3_radians;
    var cosφ = Math.cos(φ *= d3_radians),
        x = cosφ * Math.cos(λ),
        y = cosφ * Math.sin(λ),
        z = Math.sin(φ),
        cx = y0 * z - z0 * y,
        cy = z0 * x - x0 * z,
        cz = x0 * y - y0 * x,
        m = Math.sqrt(cx * cx + cy * cy + cz * cz),
        u = x0 * x + y0 * y + z0 * z,
        v = m && -d3_acos(u) / m, // area weight
        w = Math.atan2(m, u); // line weight
    d3_geo_centroidX2 += v * cx;
    d3_geo_centroidY2 += v * cy;
    d3_geo_centroidZ2 += v * cz;
    d3_geo_centroidW1 += w;
    d3_geo_centroidX1 += w * (x0 + (x0 = x));
    d3_geo_centroidY1 += w * (y0 + (y0 = y));
    d3_geo_centroidZ1 += w * (z0 + (z0 = z));
    d3_geo_centroidPointXYZ(x0, y0, z0);
  }
}

// TODO Unify this code with d3.geom.polygon area?

var d3_geo_pathAreaSum, d3_geo_pathAreaPolygon, d3_geo_pathArea = {
  point: d3_noop,
  lineStart: d3_noop,
  lineEnd: d3_noop,

  // Only count area for polygon rings.
  polygonStart: function() {
    d3_geo_pathAreaPolygon = 0;
    d3_geo_pathArea.lineStart = d3_geo_pathAreaRingStart;
  },
  polygonEnd: function() {
    d3_geo_pathArea.lineStart = d3_geo_pathArea.lineEnd = d3_geo_pathArea.point = d3_noop;
    d3_geo_pathAreaSum += Math.abs(d3_geo_pathAreaPolygon / 2);
  }
};

function d3_geo_pathAreaRingStart() {
  var x00, y00, x0, y0;

  // For the first point, …
  d3_geo_pathArea.point = function(x, y) {
    d3_geo_pathArea.point = nextPoint;
    x00 = x0 = x, y00 = y0 = y;
  };

  // For subsequent points, …
  function nextPoint(x, y) {
    d3_geo_pathAreaPolygon += y0 * x - x0 * y;
    x0 = x, y0 = y;
  }

  // For the last point, return to the start.
  d3_geo_pathArea.lineEnd = function() {
    nextPoint(x00, y00);
  };
}

var d3_geo_pathBoundsX0,
    d3_geo_pathBoundsY0,
    d3_geo_pathBoundsX1,
    d3_geo_pathBoundsY1;

var d3_geo_pathBounds = {
  point: d3_geo_pathBoundsPoint,
  lineStart: d3_noop,
  lineEnd: d3_noop,
  polygonStart: d3_noop,
  polygonEnd: d3_noop
};

function d3_geo_pathBoundsPoint(x, y) {
  if (x < d3_geo_pathBoundsX0) d3_geo_pathBoundsX0 = x;
  if (x > d3_geo_pathBoundsX1) d3_geo_pathBoundsX1 = x;
  if (y < d3_geo_pathBoundsY0) d3_geo_pathBoundsY0 = y;
  if (y > d3_geo_pathBoundsY1) d3_geo_pathBoundsY1 = y;
}
function d3_geo_pathBuffer() {
  var pointCircle = d3_geo_pathBufferCircle(4.5),
      buffer = [];

  var stream = {
    point: point,

    // While inside a line, override point to moveTo then lineTo.
    lineStart: function() { stream.point = pointLineStart; },
    lineEnd: lineEnd,

    // While inside a polygon, override lineEnd to closePath.
    polygonStart: function() { stream.lineEnd = lineEndPolygon; },
    polygonEnd: function() { stream.lineEnd = lineEnd; stream.point = point; },

    pointRadius: function(_) {
      pointCircle = d3_geo_pathBufferCircle(_);
      return stream;
    },

    result: function() {
      if (buffer.length) {
        var result = buffer.join("");
        buffer = [];
        return result;
      }
    }
  };

  function point(x, y) {
    buffer.push("M", x, ",", y, pointCircle);
  }

  function pointLineStart(x, y) {
    buffer.push("M", x, ",", y);
    stream.point = pointLine;
  }

  function pointLine(x, y) {
    buffer.push("L", x, ",", y);
  }

  function lineEnd() {
    stream.point = point;
  }

  function lineEndPolygon() {
    buffer.push("Z");
  }

  return stream;
}

function d3_geo_pathBufferCircle(radius) {
  return "m0," + radius
      + "a" + radius + "," + radius + " 0 1,1 0," + -2 * radius
      + "a" + radius + "," + radius + " 0 1,1 0," + 2 * radius
      + "z";
}

// TODO Unify this code with d3.geom.polygon centroid?
// TODO Enforce positive area for exterior, negative area for interior?

var d3_geo_pathCentroid = {
  point: d3_geo_pathCentroidPoint,

  // For lines, weight by length.
  lineStart: d3_geo_pathCentroidLineStart,
  lineEnd: d3_geo_pathCentroidLineEnd,

  // For polygons, weight by area.
  polygonStart: function() {
    d3_geo_pathCentroid.lineStart = d3_geo_pathCentroidRingStart;
  },
  polygonEnd: function() {
    d3_geo_pathCentroid.point = d3_geo_pathCentroidPoint;
    d3_geo_pathCentroid.lineStart = d3_geo_pathCentroidLineStart;
    d3_geo_pathCentroid.lineEnd = d3_geo_pathCentroidLineEnd;
  }
};

function d3_geo_pathCentroidPoint(x, y) {
  d3_geo_centroidX0 += x;
  d3_geo_centroidY0 += y;
  ++d3_geo_centroidZ0;
}

function d3_geo_pathCentroidLineStart() {
  var x0, y0;

  d3_geo_pathCentroid.point = function(x, y) {
    d3_geo_pathCentroid.point = nextPoint;
    d3_geo_pathCentroidPoint(x0 = x, y0 = y);
  };

  function nextPoint(x, y) {
    var dx = x - x0, dy = y - y0, z = Math.sqrt(dx * dx + dy * dy);
    d3_geo_centroidX1 += z * (x0 + x) / 2;
    d3_geo_centroidY1 += z * (y0 + y) / 2;
    d3_geo_centroidZ1 += z;
    d3_geo_pathCentroidPoint(x0 = x, y0 = y);
  }
}

function d3_geo_pathCentroidLineEnd() {
  d3_geo_pathCentroid.point = d3_geo_pathCentroidPoint;
}

function d3_geo_pathCentroidRingStart() {
  var x00, y00, x0, y0;

  // For the first point, …
  d3_geo_pathCentroid.point = function(x, y) {
    d3_geo_pathCentroid.point = nextPoint;
    d3_geo_pathCentroidPoint(x00 = x0 = x, y00 = y0 = y);
  };

  // For subsequent points, …
  function nextPoint(x, y) {
    var dx = x - x0, dy = y - y0, z = Math.sqrt(dx * dx + dy * dy);
    d3_geo_centroidX1 += z * (x0 + x) / 2;
    d3_geo_centroidY1 += z * (y0 + y) / 2;
    d3_geo_centroidZ1 += z;

    z = y0 * x - x0 * y;
    d3_geo_centroidX2 += z * (x0 + x);
    d3_geo_centroidY2 += z * (y0 + y);
    d3_geo_centroidZ2 += z * 3;
    d3_geo_pathCentroidPoint(x0 = x, y0 = y);
  }

  // For the last point, return to the start.
  d3_geo_pathCentroid.lineEnd = function() {
    nextPoint(x00, y00);
  };
}

function d3_geo_pathContext(context) {
  var pointRadius = 4.5;

  var stream = {
    point: point,

    // While inside a line, override point to moveTo then lineTo.
    lineStart: function() { stream.point = pointLineStart; },
    lineEnd: lineEnd,

    // While inside a polygon, override lineEnd to closePath.
    polygonStart: function() { stream.lineEnd = lineEndPolygon; },
    polygonEnd: function() { stream.lineEnd = lineEnd; stream.point = point; },

    pointRadius: function(_) {
      pointRadius = _;
      return stream;
    },

    result: d3_noop
  };

  function point(x, y) {
    context.moveTo(x, y);
    context.arc(x, y, pointRadius, 0, 2 * π);
  }

  function pointLineStart(x, y) {
    context.moveTo(x, y);
    stream.point = pointLine;
  }

  function pointLine(x, y) {
    context.lineTo(x, y);
  }

  function lineEnd() {
    stream.point = point;
  }

  function lineEndPolygon() {
    context.closePath();
  }

  return stream;
}

function d3_geo_resample(project) {
  var δ2 = .5, // precision, px²
      cosMinDistance = Math.cos(30 * d3_radians), // cos(minimum angular distance)
      maxDepth = 16;

  function resample(stream) {
    var λ00, φ00, x00, y00, a00, b00, c00, // first point
        λ0, x0, y0, a0, b0, c0; // previous point

    var resample = {
      point: point,
      lineStart: lineStart,
      lineEnd: lineEnd,
      polygonStart: function() { stream.polygonStart(); resample.lineStart = ringStart; },
      polygonEnd: function() { stream.polygonEnd(); resample.lineStart = lineStart; }
    };

    function point(x, y) {
      x = project(x, y);
      stream.point(x[0], x[1]);
    }

    function lineStart() {
      x0 = NaN;
      resample.point = linePoint;
      stream.lineStart();
    }

    function linePoint(λ, φ) {
      var c = d3_geo_cartesian([λ, φ]), p = project(λ, φ);
      resampleLineTo(x0, y0, λ0, a0, b0, c0, x0 = p[0], y0 = p[1], λ0 = λ, a0 = c[0], b0 = c[1], c0 = c[2], maxDepth, stream);
      stream.point(x0, y0);
    }

    function lineEnd() {
      resample.point = point;
      stream.lineEnd();
    }

    function ringStart() {
      lineStart();
      resample.point = ringPoint;
      resample.lineEnd = ringEnd;
    }

    function ringPoint(λ, φ) {
      linePoint(λ00 = λ, φ00 = φ), x00 = x0, y00 = y0, a00 = a0, b00 = b0, c00 = c0;
      resample.point = linePoint;
    }

    function ringEnd() {
      resampleLineTo(x0, y0, λ0, a0, b0, c0, x00, y00, λ00, a00, b00, c00, maxDepth, stream);
      resample.lineEnd = lineEnd;
      lineEnd();
    }

    return resample;
  }

  function resampleLineTo(x0, y0, λ0, a0, b0, c0, x1, y1, λ1, a1, b1, c1, depth, stream) {
    var dx = x1 - x0,
        dy = y1 - y0,
        d2 = dx * dx + dy * dy;
    if (d2 > 4 * δ2 && depth--) {
      var a = a0 + a1,
          b = b0 + b1,
          c = c0 + c1,
          m = Math.sqrt(a * a + b * b + c * c),
          φ2 = Math.asin(c /= m),
          λ2 = Math.abs(Math.abs(c) - 1) < ε ? (λ0 + λ1) / 2 : Math.atan2(b, a),
          p = project(λ2, φ2),
          x2 = p[0],
          y2 = p[1],
          dx2 = x2 - x0,
          dy2 = y2 - y0,
          dz = dy * dx2 - dx * dy2;
      if (dz * dz / d2 > δ2 // perpendicular projected distance
          || Math.abs((dx * dx2 + dy * dy2) / d2 - .5) > .3 // midpoint close to an end
          || a0 * a1 + b0 * b1 + c0 * c1 < cosMinDistance) { // angular distance
        resampleLineTo(x0, y0, λ0, a0, b0, c0, x2, y2, λ2, a /= m, b /= m, c, depth, stream);
        stream.point(x2, y2);
        resampleLineTo(x2, y2, λ2, a, b, c, x1, y1, λ1, a1, b1, c1, depth, stream);
      }
    }
  }

  resample.precision = function(_) {
    if (!arguments.length) return Math.sqrt(δ2);
    maxDepth = (δ2 = _ * _) > 0 && 16;
    return resample;
  };

  return resample;
}

d3.geo.path = function() {
  var pointRadius = 4.5,
      projection,
      context,
      projectStream,
      contextStream,
      cacheStream;

  function path(object) {
    if (object) {
      if (typeof pointRadius === "function") contextStream.pointRadius(+pointRadius.apply(this, arguments));
      if (!cacheStream || !cacheStream.valid) cacheStream = projectStream(contextStream);
      d3.geo.stream(object, cacheStream);
    }
    return contextStream.result();
  }

  path.area = function(object) {
    d3_geo_pathAreaSum = 0;
    d3.geo.stream(object, projectStream(d3_geo_pathArea));
    return d3_geo_pathAreaSum;
  };

  path.centroid = function(object) {
    d3_geo_centroidX0 = d3_geo_centroidY0 = d3_geo_centroidZ0 =
    d3_geo_centroidX1 = d3_geo_centroidY1 = d3_geo_centroidZ1 =
    d3_geo_centroidX2 = d3_geo_centroidY2 = d3_geo_centroidZ2 = 0;
    d3.geo.stream(object, projectStream(d3_geo_pathCentroid));
    return d3_geo_centroidZ2 ? [d3_geo_centroidX2 / d3_geo_centroidZ2, d3_geo_centroidY2 / d3_geo_centroidZ2]
        : d3_geo_centroidZ1 ? [d3_geo_centroidX1 / d3_geo_centroidZ1, d3_geo_centroidY1 / d3_geo_centroidZ1]
        : d3_geo_centroidZ0 ? [d3_geo_centroidX0 / d3_geo_centroidZ0, d3_geo_centroidY0 / d3_geo_centroidZ0]
        : [NaN, NaN];
  };

  path.bounds = function(object) {
    d3_geo_pathBoundsX1 = d3_geo_pathBoundsY1 = -(d3_geo_pathBoundsX0 = d3_geo_pathBoundsY0 = Infinity);
    d3.geo.stream(object, projectStream(d3_geo_pathBounds));
    return [[d3_geo_pathBoundsX0, d3_geo_pathBoundsY0], [d3_geo_pathBoundsX1, d3_geo_pathBoundsY1]];
  };

  path.projection = function(_) {
    if (!arguments.length) return projection;
    projectStream = (projection = _) ? _.stream || d3_geo_pathProjectStream(_) : d3_identity;
    return reset();
  };

  path.context = function(_) {
    if (!arguments.length) return context;
    contextStream = (context = _) == null ? new d3_geo_pathBuffer : new d3_geo_pathContext(_);
    if (typeof pointRadius !== "function") contextStream.pointRadius(pointRadius);
    return reset();
  };

  path.pointRadius = function(_) {
    if (!arguments.length) return pointRadius;
    pointRadius = typeof _ === "function" ? _ : (contextStream.pointRadius(+_), +_);
    return path;
  };

  function reset() {
    cacheStream = null;
    return path;
  }

  return path.projection(d3.geo.albersUsa()).context(null);
};

function d3_geo_pathProjectStream(project) {
  var resample = d3_geo_resample(function(λ, φ) { return project([λ * d3_degrees, φ * d3_degrees]); });
  return function(stream) {
    stream = resample(stream);
    return {
      point: function(λ, φ) { stream.point(λ * d3_radians, φ * d3_radians); },
      sphere: function() { stream.sphere(); },
      lineStart: function() { stream.lineStart(); },
      lineEnd: function() { stream.lineEnd(); },
      polygonStart: function() { stream.polygonStart(); },
      polygonEnd: function() { stream.polygonEnd(); }
    };
  };
}

d3.geo.projection = d3_geo_projection;
d3.geo.projectionMutator = d3_geo_projectionMutator;

function d3_geo_projection(project) {
  return d3_geo_projectionMutator(function() { return project; })();
}

function d3_geo_projectionMutator(projectAt) {
  var project,
      rotate,
      projectRotate,
      projectResample = d3_geo_resample(function(x, y) { x = project(x, y); return [x[0] * k + δx, δy - x[1] * k]; }),
      k = 150, // scale
      x = 480, y = 250, // translate
      λ = 0, φ = 0, // center
      δλ = 0, δφ = 0, δγ = 0, // rotate
      δx, δy, // center
      preclip = d3_geo_clipAntimeridian,
      postclip = d3_identity,
      clipAngle = null,
      clipExtent = null,
      stream;

  function projection(point) {
    point = projectRotate(point[0] * d3_radians, point[1] * d3_radians);
    return [point[0] * k + δx, δy - point[1] * k];
  }

  function invert(point) {
    point = projectRotate.invert((point[0] - δx) / k, (δy - point[1]) / k);
    return point && [point[0] * d3_degrees, point[1] * d3_degrees];
  }

  projection.stream = function(output) {
    if (stream) stream.valid = false;
    stream = d3_geo_projectionRadiansRotate(rotate, preclip(projectResample(postclip(output))));
    stream.valid = true; // allow caching by d3.geo.path
    return stream;
  };

  projection.clipAngle = function(_) {
    if (!arguments.length) return clipAngle;
    preclip = _ == null ? (clipAngle = _, d3_geo_clipAntimeridian) : d3_geo_clipCircle((clipAngle = +_) * d3_radians);
    return invalidate();
  };

  projection.clipExtent = function(_) {
    if (!arguments.length) return clipExtent;
    clipExtent = _;
    postclip = _ == null ? d3_identity : d3_geo_clipView(_[0][0], _[0][1], _[1][0], _[1][1]);
    return invalidate();
  };

  projection.scale = function(_) {
    if (!arguments.length) return k;
    k = +_;
    return reset();
  };

  projection.translate = function(_) {
    if (!arguments.length) return [x, y];
    x = +_[0];
    y = +_[1];
    return reset();
  };

  projection.center = function(_) {
    if (!arguments.length) return [λ * d3_degrees, φ * d3_degrees];
    λ = _[0] % 360 * d3_radians;
    φ = _[1] % 360 * d3_radians;
    return reset();
  };

  projection.rotate = function(_) {
    if (!arguments.length) return [δλ * d3_degrees, δφ * d3_degrees, δγ * d3_degrees];
    δλ = _[0] % 360 * d3_radians;
    δφ = _[1] % 360 * d3_radians;
    δγ = _.length > 2 ? _[2] % 360 * d3_radians : 0;
    return reset();
  };

  d3.rebind(projection, projectResample, "precision");

  function reset() {
    projectRotate = d3_geo_compose(rotate = d3_geo_rotation(δλ, δφ, δγ), project);
    var center = project(λ, φ);
    δx = x - center[0] * k;
    δy = y + center[1] * k;
    return invalidate();
  }

  function invalidate() {
    if (stream) {
      stream.valid = false;
      stream = null;
    }
    return projection;
  }

  return function() {
    project = projectAt.apply(this, arguments);
    projection.invert = project.invert && invert;
    return reset();
  };
}

function d3_geo_projectionRadiansRotate(rotate, stream) {
  return {
    point: function(x, y) {
      y = rotate(x * d3_radians, y * d3_radians), x = y[0];
      stream.point(x > π ? x - 2 * π : x < -π ? x + 2 * π : x, y[1]);
    },
    sphere: function() { stream.sphere(); },
    lineStart: function() { stream.lineStart(); },
    lineEnd: function() { stream.lineEnd(); },
    polygonStart: function() { stream.polygonStart(); },
    polygonEnd: function() { stream.polygonEnd(); }
  };
}

function d3_geo_mercator(λ, φ) {
  return [λ, Math.log(Math.tan(π / 4 + φ / 2))];
}

d3_geo_mercator.invert = function(x, y) {
  return [x, 2 * Math.atan(Math.exp(y)) - π / 2];
};

function d3_geo_mercatorProjection(project) {
  var m = d3_geo_projection(project),
      scale = m.scale,
      translate = m.translate,
      clipExtent = m.clipExtent,
      clipAuto;

  m.scale = function() {
    var v = scale.apply(m, arguments);
    return v === m ? (clipAuto ? m.clipExtent(null) : m) : v;
  };

  m.translate = function() {
    var v = translate.apply(m, arguments);
    return v === m ? (clipAuto ? m.clipExtent(null) : m) : v;
  };

  m.clipExtent = function(_) {
    var v = clipExtent.apply(m, arguments);
    if (v === m) {
      if (clipAuto = _ == null) {
        var k = π * scale(), t = translate();
        clipExtent([[t[0] - k, t[1] - k], [t[0] + k, t[1] + k]]);
      }
    } else if (clipAuto) {
      v = null;
    }
    return v;
  };

  return m.clipExtent(null);
}

(d3.geo.mercator = function() {
  return d3_geo_mercatorProjection(d3_geo_mercator);
}).raw = d3_geo_mercator;
d3.geom = {};

d3.geom.polygon = function(coordinates) {
  d3_subclass(coordinates, d3_geom_polygonPrototype);
  return coordinates;
};

var d3_geom_polygonPrototype = d3.geom.polygon.prototype = [];

d3_geom_polygonPrototype.area = function() {
  var i = -1,
      n = this.length,
      a,
      b = this[n - 1],
      area = 0;

  while (++i < n) {
    a = b;
    b = this[i];
    area += a[1] * b[0] - a[0] * b[1];
  }

  return area * .5;
};

d3_geom_polygonPrototype.centroid = function(k) {
  var i = -1,
      n = this.length,
      x = 0,
      y = 0,
      a,
      b = this[n - 1],
      c;

  if (!arguments.length) k = -1 / (6 * this.area());

  while (++i < n) {
    a = b;
    b = this[i];
    c = a[0] * b[1] - b[0] * a[1];
    x += (a[0] + b[0]) * c;
    y += (a[1] + b[1]) * c;
  }

  return [x * k, y * k];
};

// The Sutherland-Hodgman clipping algorithm.
// Note: requires the clip polygon to be counterclockwise and convex.
d3_geom_polygonPrototype.clip = function(subject) {
  var input,
      closed = d3_geom_polygonClosed(subject),
      i = -1,
      n = this.length - d3_geom_polygonClosed(this),
      j,
      m,
      a = this[n - 1],
      b,
      c,
      d;

  while (++i < n) {
    input = subject.slice();
    subject.length = 0;
    b = this[i];
    c = input[(m = input.length - closed) - 1];
    j = -1;
    while (++j < m) {
      d = input[j];
      if (d3_geom_polygonInside(d, a, b)) {
        if (!d3_geom_polygonInside(c, a, b)) {
          subject.push(d3_geom_polygonIntersect(c, d, a, b));
        }
        subject.push(d);
      } else if (d3_geom_polygonInside(c, a, b)) {
        subject.push(d3_geom_polygonIntersect(c, d, a, b));
      }
      c = d;
    }
    if (closed) subject.push(subject[0]);
    a = b;
  }

  return subject;
};

function d3_geom_polygonInside(p, a, b) {
  return (b[0] - a[0]) * (p[1] - a[1]) < (b[1] - a[1]) * (p[0] - a[0]);
}

// Intersect two infinite lines cd and ab.
function d3_geom_polygonIntersect(c, d, a, b) {
  var x1 = c[0], x3 = a[0], x21 = d[0] - x1, x43 = b[0] - x3,
      y1 = c[1], y3 = a[1], y21 = d[1] - y1, y43 = b[1] - y3,
      ua = (x43 * (y1 - y3) - y43 * (x1 - x3)) / (y43 * x21 - x43 * y21);
  return [x1 + ua * x21, y1 + ua * y21];
}

// Returns true if the polygon is closed.
function d3_geom_polygonClosed(coordinates) {
  var a = coordinates[0],
      b = coordinates[coordinates.length - 1];
  return !(a[0] - b[0] || a[1] - b[1]);
}

var d3_ease_default = function() { return d3_identity; };

var d3_ease = d3.map({
  linear: d3_ease_default,
  poly: d3_ease_poly,
  quad: function() { return d3_ease_quad; },
  cubic: function() { return d3_ease_cubic; },
  sin: function() { return d3_ease_sin; },
  exp: function() { return d3_ease_exp; },
  circle: function() { return d3_ease_circle; },
  elastic: d3_ease_elastic,
  back: d3_ease_back,
  bounce: function() { return d3_ease_bounce; }
});

var d3_ease_mode = d3.map({
  "in": d3_identity,
  "out": d3_ease_reverse,
  "in-out": d3_ease_reflect,
  "out-in": function(f) { return d3_ease_reflect(d3_ease_reverse(f)); }
});

d3.ease = function(name) {
  var i = name.indexOf("-"),
      t = i >= 0 ? name.substring(0, i) : name,
      m = i >= 0 ? name.substring(i + 1) : "in";
  t = d3_ease.get(t) || d3_ease_default;
  m = d3_ease_mode.get(m) || d3_identity;
  return d3_ease_clamp(m(t.apply(null, Array.prototype.slice.call(arguments, 1))));
};

function d3_ease_clamp(f) {
  return function(t) {
    return t <= 0 ? 0 : t >= 1 ? 1 : f(t);
  };
}

function d3_ease_reverse(f) {
  return function(t) {
    return 1 - f(1 - t);
  };
}

function d3_ease_reflect(f) {
  return function(t) {
    return .5 * (t < .5 ? f(2 * t) : (2 - f(2 - 2 * t)));
  };
}

function d3_ease_quad(t) {
  return t * t;
}

function d3_ease_cubic(t) {
  return t * t * t;
}

// Optimized clamp(reflect(poly(3))).
function d3_ease_cubicInOut(t) {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  var t2 = t * t, t3 = t2 * t;
  return 4 * (t < .5 ? t3 : 3 * (t - t2) + t3 - .75);
}

function d3_ease_poly(e) {
  return function(t) {
    return Math.pow(t, e);
  };
}

function d3_ease_sin(t) {
  return 1 - Math.cos(t * π / 2);
}

function d3_ease_exp(t) {
  return Math.pow(2, 10 * (t - 1));
}

function d3_ease_circle(t) {
  return 1 - Math.sqrt(1 - t * t);
}

function d3_ease_elastic(a, p) {
  var s;
  if (arguments.length < 2) p = 0.45;
  if (arguments.length) s = p / (2 * π) * Math.asin(1 / a);
  else a = 1, s = p / 4;
  return function(t) {
    return 1 + a * Math.pow(2, 10 * -t) * Math.sin((t - s) * 2 * π / p);
  };
}

function d3_ease_back(s) {
  if (!s) s = 1.70158;
  return function(t) {
    return t * t * ((s + 1) * t - s);
  };
}

function d3_ease_bounce(t) {
  return t < 1 / 2.75 ? 7.5625 * t * t
      : t < 2 / 2.75 ? 7.5625 * (t -= 1.5 / 2.75) * t + .75
      : t < 2.5 / 2.75 ? 7.5625 * (t -= 2.25 / 2.75) * t + .9375
      : 7.5625 * (t -= 2.625 / 2.75) * t + .984375;
}

function d3_transition(groups, id) {
  d3_subclass(groups, d3_transitionPrototype);

  groups.id = id; // Note: read-only!

  return groups;
}

var d3_transitionPrototype = [],
    d3_transitionId = 0,
    d3_transitionInheritId,
    d3_transitionInherit;

d3_transitionPrototype.call = d3_selectionPrototype.call;
d3_transitionPrototype.empty = d3_selectionPrototype.empty;
d3_transitionPrototype.node = d3_selectionPrototype.node;
d3_transitionPrototype.size = d3_selectionPrototype.size;

d3.transition = function(selection) {
  return arguments.length
      ? (d3_transitionInheritId ? selection.transition() : selection)
      : d3_selectionRoot.transition();
};

d3.transition.prototype = d3_transitionPrototype;


d3_transitionPrototype.select = function(selector) {
  var id = this.id,
      subgroups = [],
      subgroup,
      subnode,
      node;

  selector = d3_selection_selector(selector);

  for (var j = -1, m = this.length; ++j < m;) {
    subgroups.push(subgroup = []);
    for (var group = this[j], i = -1, n = group.length; ++i < n;) {
      if ((node = group[i]) && (subnode = selector.call(node, node.__data__, i, j))) {
        if ("__data__" in node) subnode.__data__ = node.__data__;
        d3_transitionNode(subnode, i, id, node.__transition__[id]);
        subgroup.push(subnode);
      } else {
        subgroup.push(null);
      }
    }
  }

  return d3_transition(subgroups, id);
};

d3_transitionPrototype.selectAll = function(selector) {
  var id = this.id,
      subgroups = [],
      subgroup,
      subnodes,
      node,
      subnode,
      transition;

  selector = d3_selection_selectorAll(selector);

  for (var j = -1, m = this.length; ++j < m;) {
    for (var group = this[j], i = -1, n = group.length; ++i < n;) {
      if (node = group[i]) {
        transition = node.__transition__[id];
        subnodes = selector.call(node, node.__data__, i, j);
        subgroups.push(subgroup = []);
        for (var k = -1, o = subnodes.length; ++k < o;) {
          if (subnode = subnodes[k]) d3_transitionNode(subnode, k, id, transition);
          subgroup.push(subnode);
        }
      }
    }
  }

  return d3_transition(subgroups, id);
};

d3_transitionPrototype.filter = function(filter) {
  var subgroups = [],
      subgroup,
      group,
      node;

  if (typeof filter !== "function") filter = d3_selection_filter(filter);

  for (var j = 0, m = this.length; j < m; j++) {
    subgroups.push(subgroup = []);
    for (var group = this[j], i = 0, n = group.length; i < n; i++) {
      if ((node = group[i]) && filter.call(node, node.__data__, i)) {
        subgroup.push(node);
      }
    }
  }

  return d3_transition(subgroups, this.id);
};
function d3_Color() {}

d3_Color.prototype.toString = function() {
  return this.rgb() + "";
};

d3.hsl = function(h, s, l) {
  return arguments.length === 1
      ? (h instanceof d3_Hsl ? d3_hsl(h.h, h.s, h.l)
      : d3_rgb_parse("" + h, d3_rgb_hsl, d3_hsl))
      : d3_hsl(+h, +s, +l);
};

function d3_hsl(h, s, l) {
  return new d3_Hsl(h, s, l);
}

function d3_Hsl(h, s, l) {
  this.h = h;
  this.s = s;
  this.l = l;
}

var d3_hslPrototype = d3_Hsl.prototype = new d3_Color;

d3_hslPrototype.brighter = function(k) {
  k = Math.pow(0.7, arguments.length ? k : 1);
  return d3_hsl(this.h, this.s, this.l / k);
};

d3_hslPrototype.darker = function(k) {
  k = Math.pow(0.7, arguments.length ? k : 1);
  return d3_hsl(this.h, this.s, k * this.l);
};

d3_hslPrototype.rgb = function() {
  return d3_hsl_rgb(this.h, this.s, this.l);
};

function d3_hsl_rgb(h, s, l) {
  var m1,
      m2;

  /* Some simple corrections for h, s and l. */
  h = isNaN(h) ? 0 : (h %= 360) < 0 ? h + 360 : h;
  s = isNaN(s) ? 0 : s < 0 ? 0 : s > 1 ? 1 : s;
  l = l < 0 ? 0 : l > 1 ? 1 : l;

  /* From FvD 13.37, CSS Color Module Level 3 */
  m2 = l <= .5 ? l * (1 + s) : l + s - l * s;
  m1 = 2 * l - m2;

  function v(h) {
    if (h > 360) h -= 360;
    else if (h < 0) h += 360;
    if (h < 60) return m1 + (m2 - m1) * h / 60;
    if (h < 180) return m2;
    if (h < 240) return m1 + (m2 - m1) * (240 - h) / 60;
    return m1;
  }

  function vv(h) {
    return Math.round(v(h) * 255);
  }

  return d3_rgb(vv(h + 120), vv(h), vv(h - 120));
}

d3.hcl = function(h, c, l) {
  return arguments.length === 1
      ? (h instanceof d3_Hcl ? d3_hcl(h.h, h.c, h.l)
      : (h instanceof d3_Lab ? d3_lab_hcl(h.l, h.a, h.b)
      : d3_lab_hcl((h = d3_rgb_lab((h = d3.rgb(h)).r, h.g, h.b)).l, h.a, h.b)))
      : d3_hcl(+h, +c, +l);
};

function d3_hcl(h, c, l) {
  return new d3_Hcl(h, c, l);
}

function d3_Hcl(h, c, l) {
  this.h = h;
  this.c = c;
  this.l = l;
}

var d3_hclPrototype = d3_Hcl.prototype = new d3_Color;

d3_hclPrototype.brighter = function(k) {
  return d3_hcl(this.h, this.c, Math.min(100, this.l + d3_lab_K * (arguments.length ? k : 1)));
};

d3_hclPrototype.darker = function(k) {
  return d3_hcl(this.h, this.c, Math.max(0, this.l - d3_lab_K * (arguments.length ? k : 1)));
};

d3_hclPrototype.rgb = function() {
  return d3_hcl_lab(this.h, this.c, this.l).rgb();
};

function d3_hcl_lab(h, c, l) {
  if (isNaN(h)) h = 0;
  if (isNaN(c)) c = 0;
  return d3_lab(l, Math.cos(h *= d3_radians) * c, Math.sin(h) * c);
}

d3.lab = function(l, a, b) {
  return arguments.length === 1
      ? (l instanceof d3_Lab ? d3_lab(l.l, l.a, l.b)
      : (l instanceof d3_Hcl ? d3_hcl_lab(l.l, l.c, l.h)
      : d3_rgb_lab((l = d3.rgb(l)).r, l.g, l.b)))
      : d3_lab(+l, +a, +b);
};

function d3_lab(l, a, b) {
  return new d3_Lab(l, a, b);
}

function d3_Lab(l, a, b) {
  this.l = l;
  this.a = a;
  this.b = b;
}

// Corresponds roughly to RGB brighter/darker
var d3_lab_K = 18;

// D65 standard referent
var d3_lab_X = 0.950470,
    d3_lab_Y = 1,
    d3_lab_Z = 1.088830;

var d3_labPrototype = d3_Lab.prototype = new d3_Color;

d3_labPrototype.brighter = function(k) {
  return d3_lab(Math.min(100, this.l + d3_lab_K * (arguments.length ? k : 1)), this.a, this.b);
};

d3_labPrototype.darker = function(k) {
  return d3_lab(Math.max(0, this.l - d3_lab_K * (arguments.length ? k : 1)), this.a, this.b);
};

d3_labPrototype.rgb = function() {
  return d3_lab_rgb(this.l, this.a, this.b);
};

function d3_lab_rgb(l, a, b) {
  var y = (l + 16) / 116,
      x = y + a / 500,
      z = y - b / 200;
  x = d3_lab_xyz(x) * d3_lab_X;
  y = d3_lab_xyz(y) * d3_lab_Y;
  z = d3_lab_xyz(z) * d3_lab_Z;
  return d3_rgb(
    d3_xyz_rgb( 3.2404542 * x - 1.5371385 * y - 0.4985314 * z),
    d3_xyz_rgb(-0.9692660 * x + 1.8760108 * y + 0.0415560 * z),
    d3_xyz_rgb( 0.0556434 * x - 0.2040259 * y + 1.0572252 * z)
  );
}

function d3_lab_hcl(l, a, b) {
  return l > 0
      ? d3_hcl(Math.atan2(b, a) * d3_degrees, Math.sqrt(a * a + b * b), l)
      : d3_hcl(NaN, NaN, l);
}

function d3_lab_xyz(x) {
  return x > 0.206893034 ? x * x * x : (x - 4 / 29) / 7.787037;
}
function d3_xyz_lab(x) {
  return x > 0.008856 ? Math.pow(x, 1 / 3) : 7.787037 * x + 4 / 29;
}

function d3_xyz_rgb(r) {
  return Math.round(255 * (r <= 0.00304 ? 12.92 * r : 1.055 * Math.pow(r, 1 / 2.4) - 0.055));
}

d3.rgb = function(r, g, b) {
  return arguments.length === 1
      ? (r instanceof d3_Rgb ? d3_rgb(r.r, r.g, r.b)
      : d3_rgb_parse("" + r, d3_rgb, d3_hsl_rgb))
      : d3_rgb(~~r, ~~g, ~~b);
};

function d3_rgbNumber(value) {
  return d3_rgb(value >> 16, value >> 8 & 0xff, value & 0xff);
}

function d3_rgbString(value) {
  return d3_rgbNumber(value) + "";
}

function d3_rgb(r, g, b) {
  return new d3_Rgb(r, g, b);
}

function d3_Rgb(r, g, b) {
  this.r = r;
  this.g = g;
  this.b = b;
}

var d3_rgbPrototype = d3_Rgb.prototype = new d3_Color;

d3_rgbPrototype.brighter = function(k) {
  k = Math.pow(0.7, arguments.length ? k : 1);
  var r = this.r,
      g = this.g,
      b = this.b,
      i = 30;
  if (!r && !g && !b) return d3_rgb(i, i, i);
  if (r && r < i) r = i;
  if (g && g < i) g = i;
  if (b && b < i) b = i;
  return d3_rgb(Math.min(255, ~~(r / k)), Math.min(255, ~~(g / k)), Math.min(255, ~~(b / k)));
};

d3_rgbPrototype.darker = function(k) {
  k = Math.pow(0.7, arguments.length ? k : 1);
  return d3_rgb(~~(k * this.r), ~~(k * this.g), ~~(k * this.b));
};

d3_rgbPrototype.hsl = function() {
  return d3_rgb_hsl(this.r, this.g, this.b);
};

d3_rgbPrototype.toString = function() {
  return "#" + d3_rgb_hex(this.r) + d3_rgb_hex(this.g) + d3_rgb_hex(this.b);
};

function d3_rgb_hex(v) {
  return v < 0x10
      ? "0" + Math.max(0, v).toString(16)
      : Math.min(255, v).toString(16);
}

function d3_rgb_parse(format, rgb, hsl) {
  var r = 0, // red channel; int in [0, 255]
      g = 0, // green channel; int in [0, 255]
      b = 0, // blue channel; int in [0, 255]
      m1, // CSS color specification match
      m2, // CSS color specification type (e.g., rgb)
      name;

  /* Handle hsl, rgb. */
  m1 = /([a-z]+)\((.*)\)/i.exec(format);
  if (m1) {
    m2 = m1[2].split(",");
    switch (m1[1]) {
      case "hsl": {
        return hsl(
          parseFloat(m2[0]), // degrees
          parseFloat(m2[1]) / 100, // percentage
          parseFloat(m2[2]) / 100 // percentage
        );
      }
      case "rgb": {
        return rgb(
          d3_rgb_parseNumber(m2[0]),
          d3_rgb_parseNumber(m2[1]),
          d3_rgb_parseNumber(m2[2])
        );
      }
    }
  }

  /* Named colors. */
  if (name = d3_rgb_names.get(format)) return rgb(name.r, name.g, name.b);

  /* Hexadecimal colors: #rgb and #rrggbb. */
  if (format != null && format.charAt(0) === "#") {
    if (format.length === 4) {
      r = format.charAt(1); r += r;
      g = format.charAt(2); g += g;
      b = format.charAt(3); b += b;
    } else if (format.length === 7) {
      r = format.substring(1, 3);
      g = format.substring(3, 5);
      b = format.substring(5, 7);
    }
    r = parseInt(r, 16);
    g = parseInt(g, 16);
    b = parseInt(b, 16);
  }

  return rgb(r, g, b);
}

function d3_rgb_hsl(r, g, b) {
  var min = Math.min(r /= 255, g /= 255, b /= 255),
      max = Math.max(r, g, b),
      d = max - min,
      h,
      s,
      l = (max + min) / 2;
  if (d) {
    s = l < .5 ? d / (max + min) : d / (2 - max - min);
    if (r == max) h = (g - b) / d + (g < b ? 6 : 0);
    else if (g == max) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  } else {
    h = NaN;
    s = l > 0 && l < 1 ? 0 : h;
  }
  return d3_hsl(h, s, l);
}

function d3_rgb_lab(r, g, b) {
  r = d3_rgb_xyz(r);
  g = d3_rgb_xyz(g);
  b = d3_rgb_xyz(b);
  var x = d3_xyz_lab((0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / d3_lab_X),
      y = d3_xyz_lab((0.2126729 * r + 0.7151522 * g + 0.0721750 * b) / d3_lab_Y),
      z = d3_xyz_lab((0.0193339 * r + 0.1191920 * g + 0.9503041 * b) / d3_lab_Z);
  return d3_lab(116 * y - 16, 500 * (x - y), 200 * (y - z));
}

function d3_rgb_xyz(r) {
  return (r /= 255) <= 0.04045 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
}

function d3_rgb_parseNumber(c) { // either integer or percentage
  var f = parseFloat(c);
  return c.charAt(c.length - 1) === "%" ? Math.round(f * 2.55) : f;
}

var d3_rgb_names = d3.map({
  aliceblue: 0xf0f8ff,
  antiquewhite: 0xfaebd7,
  aqua: 0x00ffff,
  aquamarine: 0x7fffd4,
  azure: 0xf0ffff,
  beige: 0xf5f5dc,
  bisque: 0xffe4c4,
  black: 0x000000,
  blanchedalmond: 0xffebcd,
  blue: 0x0000ff,
  blueviolet: 0x8a2be2,
  brown: 0xa52a2a,
  burlywood: 0xdeb887,
  cadetblue: 0x5f9ea0,
  chartreuse: 0x7fff00,
  chocolate: 0xd2691e,
  coral: 0xff7f50,
  cornflowerblue: 0x6495ed,
  cornsilk: 0xfff8dc,
  crimson: 0xdc143c,
  cyan: 0x00ffff,
  darkblue: 0x00008b,
  darkcyan: 0x008b8b,
  darkgoldenrod: 0xb8860b,
  darkgray: 0xa9a9a9,
  darkgreen: 0x006400,
  darkgrey: 0xa9a9a9,
  darkkhaki: 0xbdb76b,
  darkmagenta: 0x8b008b,
  darkolivegreen: 0x556b2f,
  darkorange: 0xff8c00,
  darkorchid: 0x9932cc,
  darkred: 0x8b0000,
  darksalmon: 0xe9967a,
  darkseagreen: 0x8fbc8f,
  darkslateblue: 0x483d8b,
  darkslategray: 0x2f4f4f,
  darkslategrey: 0x2f4f4f,
  darkturquoise: 0x00ced1,
  darkviolet: 0x9400d3,
  deeppink: 0xff1493,
  deepskyblue: 0x00bfff,
  dimgray: 0x696969,
  dimgrey: 0x696969,
  dodgerblue: 0x1e90ff,
  firebrick: 0xb22222,
  floralwhite: 0xfffaf0,
  forestgreen: 0x228b22,
  fuchsia: 0xff00ff,
  gainsboro: 0xdcdcdc,
  ghostwhite: 0xf8f8ff,
  gold: 0xffd700,
  goldenrod: 0xdaa520,
  gray: 0x808080,
  green: 0x008000,
  greenyellow: 0xadff2f,
  grey: 0x808080,
  honeydew: 0xf0fff0,
  hotpink: 0xff69b4,
  indianred: 0xcd5c5c,
  indigo: 0x4b0082,
  ivory: 0xfffff0,
  khaki: 0xf0e68c,
  lavender: 0xe6e6fa,
  lavenderblush: 0xfff0f5,
  lawngreen: 0x7cfc00,
  lemonchiffon: 0xfffacd,
  lightblue: 0xadd8e6,
  lightcoral: 0xf08080,
  lightcyan: 0xe0ffff,
  lightgoldenrodyellow: 0xfafad2,
  lightgray: 0xd3d3d3,
  lightgreen: 0x90ee90,
  lightgrey: 0xd3d3d3,
  lightpink: 0xffb6c1,
  lightsalmon: 0xffa07a,
  lightseagreen: 0x20b2aa,
  lightskyblue: 0x87cefa,
  lightslategray: 0x778899,
  lightslategrey: 0x778899,
  lightsteelblue: 0xb0c4de,
  lightyellow: 0xffffe0,
  lime: 0x00ff00,
  limegreen: 0x32cd32,
  linen: 0xfaf0e6,
  magenta: 0xff00ff,
  maroon: 0x800000,
  mediumaquamarine: 0x66cdaa,
  mediumblue: 0x0000cd,
  mediumorchid: 0xba55d3,
  mediumpurple: 0x9370db,
  mediumseagreen: 0x3cb371,
  mediumslateblue: 0x7b68ee,
  mediumspringgreen: 0x00fa9a,
  mediumturquoise: 0x48d1cc,
  mediumvioletred: 0xc71585,
  midnightblue: 0x191970,
  mintcream: 0xf5fffa,
  mistyrose: 0xffe4e1,
  moccasin: 0xffe4b5,
  navajowhite: 0xffdead,
  navy: 0x000080,
  oldlace: 0xfdf5e6,
  olive: 0x808000,
  olivedrab: 0x6b8e23,
  orange: 0xffa500,
  orangered: 0xff4500,
  orchid: 0xda70d6,
  palegoldenrod: 0xeee8aa,
  palegreen: 0x98fb98,
  paleturquoise: 0xafeeee,
  palevioletred: 0xdb7093,
  papayawhip: 0xffefd5,
  peachpuff: 0xffdab9,
  peru: 0xcd853f,
  pink: 0xffc0cb,
  plum: 0xdda0dd,
  powderblue: 0xb0e0e6,
  purple: 0x800080,
  red: 0xff0000,
  rosybrown: 0xbc8f8f,
  royalblue: 0x4169e1,
  saddlebrown: 0x8b4513,
  salmon: 0xfa8072,
  sandybrown: 0xf4a460,
  seagreen: 0x2e8b57,
  seashell: 0xfff5ee,
  sienna: 0xa0522d,
  silver: 0xc0c0c0,
  skyblue: 0x87ceeb,
  slateblue: 0x6a5acd,
  slategray: 0x708090,
  slategrey: 0x708090,
  snow: 0xfffafa,
  springgreen: 0x00ff7f,
  steelblue: 0x4682b4,
  tan: 0xd2b48c,
  teal: 0x008080,
  thistle: 0xd8bfd8,
  tomato: 0xff6347,
  turquoise: 0x40e0d0,
  violet: 0xee82ee,
  wheat: 0xf5deb3,
  white: 0xffffff,
  whitesmoke: 0xf5f5f5,
  yellow: 0xffff00,
  yellowgreen: 0x9acd32
});

d3_rgb_names.forEach(function(key, value) {
  d3_rgb_names.set(key, d3_rgbNumber(value));
});

d3.interpolateRgb = d3_interpolateRgb;

function d3_interpolateRgb(a, b) {
  a = d3.rgb(a);
  b = d3.rgb(b);
  var ar = a.r,
      ag = a.g,
      ab = a.b,
      br = b.r - ar,
      bg = b.g - ag,
      bb = b.b - ab;
  return function(t) {
    return "#"
        + d3_rgb_hex(Math.round(ar + br * t))
        + d3_rgb_hex(Math.round(ag + bg * t))
        + d3_rgb_hex(Math.round(ab + bb * t));
  };
}

d3.interpolateObject = d3_interpolateObject;

function d3_interpolateObject(a, b) {
  var i = {},
      c = {},
      k;
  for (k in a) {
    if (k in b) {
      i[k] = d3_interpolate(a[k], b[k]);
    } else {
      c[k] = a[k];
    }
  }
  for (k in b) {
    if (!(k in a)) {
      c[k] = b[k];
    }
  }
  return function(t) {
    for (k in i) c[k] = i[k](t);
    return c;
  };
}

d3.interpolateArray = d3_interpolateArray;

function d3_interpolateArray(a, b) {
  var x = [],
      c = [],
      na = a.length,
      nb = b.length,
      n0 = Math.min(a.length, b.length),
      i;
  for (i = 0; i < n0; ++i) x.push(d3_interpolate(a[i], b[i]));
  for (; i < na; ++i) c[i] = a[i];
  for (; i < nb; ++i) c[i] = b[i];
  return function(t) {
    for (i = 0; i < n0; ++i) c[i] = x[i](t);
    return c;
  };
}
d3.interpolateNumber = d3_interpolateNumber;

function d3_interpolateNumber(a, b) {
  b -= a = +a;
  return function(t) { return a + b * t; };
}

d3.interpolateString = d3_interpolateString;

function d3_interpolateString(a, b) {
  var m, // current match
      i, // current index
      j, // current index (for coalescing)
      s0 = 0, // start index of current string prefix
      s1 = 0, // end index of current string prefix
      s = [], // string constants and placeholders
      q = [], // number interpolators
      n, // q.length
      o;

  // Coerce inputs to strings.
  a = a + "", b = b + "";

  // Reset our regular expression!
  d3_interpolate_number.lastIndex = 0;

  // Find all numbers in b.
  for (i = 0; m = d3_interpolate_number.exec(b); ++i) {
    if (m.index) s.push(b.substring(s0, s1 = m.index));
    q.push({i: s.length, x: m[0]});
    s.push(null);
    s0 = d3_interpolate_number.lastIndex;
  }
  if (s0 < b.length) s.push(b.substring(s0));

  // Find all numbers in a.
  for (i = 0, n = q.length; (m = d3_interpolate_number.exec(a)) && i < n; ++i) {
    o = q[i];
    if (o.x == m[0]) { // The numbers match, so coalesce.
      if (o.i) {
        if (s[o.i + 1] == null) { // This match is followed by another number.
          s[o.i - 1] += o.x;
          s.splice(o.i, 1);
          for (j = i + 1; j < n; ++j) q[j].i--;
        } else { // This match is followed by a string, so coalesce twice.
          s[o.i - 1] += o.x + s[o.i + 1];
          s.splice(o.i, 2);
          for (j = i + 1; j < n; ++j) q[j].i -= 2;
        }
      } else {
          if (s[o.i + 1] == null) { // This match is followed by another number.
          s[o.i] = o.x;
        } else { // This match is followed by a string, so coalesce twice.
          s[o.i] = o.x + s[o.i + 1];
          s.splice(o.i + 1, 1);
          for (j = i + 1; j < n; ++j) q[j].i--;
        }
      }
      q.splice(i, 1);
      n--;
      i--;
    } else {
      o.x = d3_interpolateNumber(parseFloat(m[0]), parseFloat(o.x));
    }
  }

  // Remove any numbers in b not found in a.
  while (i < n) {
    o = q.pop();
    if (s[o.i + 1] == null) { // This match is followed by another number.
      s[o.i] = o.x;
    } else { // This match is followed by a string, so coalesce twice.
      s[o.i] = o.x + s[o.i + 1];
      s.splice(o.i + 1, 1);
    }
    n--;
  }

  // Special optimization for only a single match.
  if (s.length === 1) {
    return s[0] == null
        ? (o = q[0].x, function(t) { return o(t) + ""; })
        : function() { return b; };
  }

  // Otherwise, interpolate each of the numbers and rejoin the string.
  return function(t) {
    for (i = 0; i < n; ++i) s[(o = q[i]).i] = o.x(t);
    return s.join("");
  };
}

var d3_interpolate_number = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g;

d3.interpolate = d3_interpolate;

function d3_interpolate(a, b) {
  var i = d3.interpolators.length, f;
  while (--i >= 0 && !(f = d3.interpolators[i](a, b)));
  return f;
}

d3.interpolators = [
  function(a, b) {
    var t = typeof b;
    return (t === "string" ? (d3_rgb_names.has(b) || /^(#|rgb\(|hsl\()/.test(b) ? d3_interpolateRgb : d3_interpolateString)
        : b instanceof d3_Color ? d3_interpolateRgb
        : t === "object" ? (Array.isArray(b) ? d3_interpolateArray : d3_interpolateObject)
        : d3_interpolateNumber)(a, b);
  }
];

d3.transform = function(string) {
  var g = d3_document.createElementNS(d3.ns.prefix.svg, "g");
  return (d3.transform = function(string) {
    if (string != null) {
      g.setAttribute("transform", string);
      var t = g.transform.baseVal.consolidate();
    }
    return new d3_transform(t ? t.matrix : d3_transformIdentity);
  })(string);
};

// Compute x-scale and normalize the first row.
// Compute shear and make second row orthogonal to first.
// Compute y-scale and normalize the second row.
// Finally, compute the rotation.
function d3_transform(m) {
  var r0 = [m.a, m.b],
      r1 = [m.c, m.d],
      kx = d3_transformNormalize(r0),
      kz = d3_transformDot(r0, r1),
      ky = d3_transformNormalize(d3_transformCombine(r1, r0, -kz)) || 0;
  if (r0[0] * r1[1] < r1[0] * r0[1]) {
    r0[0] *= -1;
    r0[1] *= -1;
    kx *= -1;
    kz *= -1;
  }
  this.rotate = (kx ? Math.atan2(r0[1], r0[0]) : Math.atan2(-r1[0], r1[1])) * d3_degrees;
  this.translate = [m.e, m.f];
  this.scale = [kx, ky];
  this.skew = ky ? Math.atan2(kz, ky) * d3_degrees : 0;
};

d3_transform.prototype.toString = function() {
  return "translate(" + this.translate
      + ")rotate(" + this.rotate
      + ")skewX(" + this.skew
      + ")scale(" + this.scale
      + ")";
};

function d3_transformDot(a, b) {
  return a[0] * b[0] + a[1] * b[1];
}

function d3_transformNormalize(a) {
  var k = Math.sqrt(d3_transformDot(a, a));
  if (k) {
    a[0] /= k;
    a[1] /= k;
  }
  return k;
}

function d3_transformCombine(a, b, k) {
  a[0] += k * b[0];
  a[1] += k * b[1];
  return a;
}

var d3_transformIdentity = {a: 1, b: 0, c: 0, d: 1, e: 0, f: 0};

d3.interpolateTransform = d3_interpolateTransform;

function d3_interpolateTransform(a, b) {
  var s = [], // string constants and placeholders
      q = [], // number interpolators
      n,
      A = d3.transform(a),
      B = d3.transform(b),
      ta = A.translate,
      tb = B.translate,
      ra = A.rotate,
      rb = B.rotate,
      wa = A.skew,
      wb = B.skew,
      ka = A.scale,
      kb = B.scale;

  if (ta[0] != tb[0] || ta[1] != tb[1]) {
    s.push("translate(", null, ",", null, ")");
    q.push({i: 1, x: d3_interpolateNumber(ta[0], tb[0])}, {i: 3, x: d3_interpolateNumber(ta[1], tb[1])});
  } else if (tb[0] || tb[1]) {
    s.push("translate(" + tb + ")");
  } else {
    s.push("");
  }

  if (ra != rb) {
    if (ra - rb > 180) rb += 360; else if (rb - ra > 180) ra += 360; // shortest path
    q.push({i: s.push(s.pop() + "rotate(", null, ")") - 2, x: d3_interpolateNumber(ra, rb)});
  } else if (rb) {
    s.push(s.pop() + "rotate(" + rb + ")");
  }

  if (wa != wb) {
    q.push({i: s.push(s.pop() + "skewX(", null, ")") - 2, x: d3_interpolateNumber(wa, wb)});
  } else if (wb) {
    s.push(s.pop() + "skewX(" + wb + ")");
  }

  if (ka[0] != kb[0] || ka[1] != kb[1]) {
    n = s.push(s.pop() + "scale(", null, ",", null, ")");
    q.push({i: n - 4, x: d3_interpolateNumber(ka[0], kb[0])}, {i: n - 2, x: d3_interpolateNumber(ka[1], kb[1])});
  } else if (kb[0] != 1 || kb[1] != 1) {
    s.push(s.pop() + "scale(" + kb + ")");
  }

  n = q.length;
  return function(t) {
    var i = -1, o;
    while (++i < n) s[(o = q[i]).i] = o.x(t);
    return s.join("");
  };
}

d3_transitionPrototype.tween = function(name, tween) {
  var id = this.id;
  if (arguments.length < 2) return this.node().__transition__[id].tween.get(name);
  return d3_selection_each(this, tween == null
        ? function(node) { node.__transition__[id].tween.remove(name); }
        : function(node) { node.__transition__[id].tween.set(name, tween); });
};

function d3_transition_tween(groups, name, value, tween) {
  var id = groups.id;
  return d3_selection_each(groups, typeof value === "function"
      ? function(node, i, j) { node.__transition__[id].tween.set(name, tween(value.call(node, node.__data__, i, j))); }
      : (value = tween(value), function(node) { node.__transition__[id].tween.set(name, value); }));
}

d3_transitionPrototype.attr = function(nameNS, value) {
  if (arguments.length < 2) {

    // For attr(object), the object specifies the names and values of the
    // attributes to transition. The values may be functions that are
    // evaluated for each element.
    for (value in nameNS) this.attr(value, nameNS[value]);
    return this;
  }

  var interpolate = nameNS == "transform" ? d3_interpolateTransform : d3_interpolate,
      name = d3.ns.qualify(nameNS);

  // For attr(string, null), remove the attribute with the specified name.
  function attrNull() {
    this.removeAttribute(name);
  }
  function attrNullNS() {
    this.removeAttributeNS(name.space, name.local);
  }

  // For attr(string, string), set the attribute with the specified name.
  function attrTween(b) {
    return b == null ? attrNull : (b += "", function() {
      var a = this.getAttribute(name), i;
      return a !== b && (i = interpolate(a, b), function(t) { this.setAttribute(name, i(t)); });
    });
  }
  function attrTweenNS(b) {
    return b == null ? attrNullNS : (b += "", function() {
      var a = this.getAttributeNS(name.space, name.local), i;
      return a !== b && (i = interpolate(a, b), function(t) { this.setAttributeNS(name.space, name.local, i(t)); });
    });
  }

  return d3_transition_tween(this, "attr." + nameNS, value, name.local ? attrTweenNS : attrTween);
};

d3_transitionPrototype.attrTween = function(nameNS, tween) {
  var name = d3.ns.qualify(nameNS);

  function attrTween(d, i) {
    var f = tween.call(this, d, i, this.getAttribute(name));
    return f && function(t) { this.setAttribute(name, f(t)); };
  }
  function attrTweenNS(d, i) {
    var f = tween.call(this, d, i, this.getAttributeNS(name.space, name.local));
    return f && function(t) { this.setAttributeNS(name.space, name.local, f(t)); };
  }

  return this.tween("attr." + nameNS, name.local ? attrTweenNS : attrTween);
};

d3_transitionPrototype.style = function(name, value, priority) {
  var n = arguments.length;
  if (n < 3) {

    // For style(object) or style(object, string), the object specifies the
    // names and values of the attributes to set or remove. The values may be
    // functions that are evaluated for each element. The optional string
    // specifies the priority.
    if (typeof name !== "string") {
      if (n < 2) value = "";
      for (priority in name) this.style(priority, name[priority], value);
      return this;
    }

    // For style(string, string) or style(string, function), use the default
    // priority. The priority is ignored for style(string, null).
    priority = "";
  }

  // For style(name, null) or style(name, null, priority), remove the style
  // property with the specified name. The priority is ignored.
  function styleNull() {
    this.style.removeProperty(name);
  }

  // For style(name, string) or style(name, string, priority), set the style
  // property with the specified name, using the specified priority.
  // Otherwise, a name, value and priority are specified, and handled as below.
  function styleString(b) {
    return b == null ? styleNull : (b += "", function() {
      var a = d3_window.getComputedStyle(this, null).getPropertyValue(name), i;
      return a !== b && (i = d3_interpolate(a, b), function(t) { this.style.setProperty(name, i(t), priority); });
    });
  }

  return d3_transition_tween(this, "style." + name, value, styleString);
};

d3_transitionPrototype.styleTween = function(name, tween, priority) {
  if (arguments.length < 3) priority = "";

  function styleTween(d, i) {
    var f = tween.call(this, d, i, d3_window.getComputedStyle(this, null).getPropertyValue(name));
    return f && function(t) { this.style.setProperty(name, f(t), priority); };
  }

  return this.tween("style." + name, styleTween);
};

d3_transitionPrototype.text = function(value) {
  return d3_transition_tween(this, "text", value, d3_transition_text);
};

function d3_transition_text(b) {
  if (b == null) b = "";
  return function() { this.textContent = b; };
}

d3_transitionPrototype.remove = function() {
  return this.each("end.transition", function() {
    var p;
    if (!this.__transition__ && (p = this.parentNode)) p.removeChild(this);
  });
};

d3_transitionPrototype.ease = function(value) {
  var id = this.id;
  if (arguments.length < 1) return this.node().__transition__[id].ease;
  if (typeof value !== "function") value = d3.ease.apply(d3, arguments);
  return d3_selection_each(this, function(node) { node.__transition__[id].ease = value; });
};

d3_transitionPrototype.delay = function(value) {
  var id = this.id;
  return d3_selection_each(this, typeof value === "function"
      ? function(node, i, j) { node.__transition__[id].delay = value.call(node, node.__data__, i, j) | 0; }
      : (value |= 0, function(node) { node.__transition__[id].delay = value; }));
};

d3_transitionPrototype.duration = function(value) {
  var id = this.id;
  return d3_selection_each(this, typeof value === "function"
      ? function(node, i, j) { node.__transition__[id].duration = Math.max(1, value.call(node, node.__data__, i, j) | 0); }
      : (value = Math.max(1, value | 0), function(node) { node.__transition__[id].duration = value; }));
};

d3_transitionPrototype.each = function(type, listener) {
  var id = this.id;
  if (arguments.length < 2) {
    var inherit = d3_transitionInherit,
        inheritId = d3_transitionInheritId;
    d3_transitionInheritId = id;
    d3_selection_each(this, function(node, i, j) {
      d3_transitionInherit = node.__transition__[id];
      type.call(node, node.__data__, i, j);
    });
    d3_transitionInherit = inherit;
    d3_transitionInheritId = inheritId;
  } else {
    d3_selection_each(this, function(node) {
      var transition = node.__transition__[id];
      (transition.event || (transition.event = d3.dispatch("start", "end"))).on(type, listener);
    });
  }
  return this;
};

d3_transitionPrototype.transition = function() {
  var id0 = this.id,
      id1 = ++d3_transitionId,
      subgroups = [],
      subgroup,
      group,
      node,
      transition;

  for (var j = 0, m = this.length; j < m; j++) {
    subgroups.push(subgroup = []);
    for (var group = this[j], i = 0, n = group.length; i < n; i++) {
      if (node = group[i]) {
        transition = Object.create(node.__transition__[id0]);
        transition.delay += transition.duration;
        d3_transitionNode(node, i, id1, transition);
      }
      subgroup.push(node);
    }
  }

  return d3_transition(subgroups, id1);
};

function d3_transitionNode(node, i, id, inherit) {
  var lock = node.__transition__ || (node.__transition__ = {active: 0, count: 0}),
      transition = lock[id];

  if (!transition) {
    var time = inherit.time;

    transition = lock[id] = {
      tween: new d3_Map,
      time: time,
      ease: inherit.ease,
      delay: inherit.delay,
      duration: inherit.duration
    };

    ++lock.count;

    d3.timer(function(elapsed) {
      var d = node.__data__,
          ease = transition.ease,
          delay = transition.delay,
          duration = transition.duration,
          tweened = [];

      if (delay <= elapsed) return start(elapsed);
      d3_timer_replace(start, delay, time);

      function start(elapsed) {
        if (lock.active > id) return stop();
        lock.active = id;
        transition.event && transition.event.start.call(node, d, i);

        transition.tween.forEach(function(key, value) {
          if (value = value.call(node, d, i)) {
            tweened.push(value);
          }
        });

        if (tick(elapsed)) return 1;
        d3_timer_replace(tick, 0, time);
      }

      function tick(elapsed) {
        if (lock.active !== id) return stop();

        var t = (elapsed - delay) / duration,
            e = ease(t),
            n = tweened.length;

        while (n > 0) {
          tweened[--n].call(node, e);
        }

        if (t >= 1) {
          stop();
          transition.event && transition.event.end.call(node, d, i);
          return 1;
        }
      }

      function stop() {
        if (--lock.count) delete lock[id];
        else delete node.__transition__;
        return 1;
      }
    }, 0, time);
  }
}

d3.xhr = d3_xhrType(d3_identity);

function d3_xhrType(response) {
  return function(url, mimeType, callback) {
    if (arguments.length === 2 && typeof mimeType === "function") callback = mimeType, mimeType = null;
    return d3_xhr(url, mimeType, response, callback);
  };
}

function d3_xhr(url, mimeType, response, callback) {
  var xhr = {},
      dispatch = d3.dispatch("progress", "load", "error"),
      headers = {},
      request = new XMLHttpRequest,
      responseType = null;

  // If IE does not support CORS, use XDomainRequest.
  if (d3_window.XDomainRequest
      && !("withCredentials" in request)
      && /^(http(s)?:)?\/\//.test(url)) request = new XDomainRequest;

  "onload" in request
      ? request.onload = request.onerror = respond
      : request.onreadystatechange = function() { request.readyState > 3 && respond(); };

  function respond() {
    var status = request.status, result;
    if (!status && request.responseText || status >= 200 && status < 300 || status === 304) {
      try {
        result = response.call(xhr, request);
      } catch (e) {
        dispatch.error.call(xhr, e);
        return;
      }
      dispatch.load.call(xhr, result);
    } else {
      dispatch.error.call(xhr, request);
    }
  }

  request.onprogress = function(event) {
    var o = d3.event;
    d3.event = event;
    try { dispatch.progress.call(xhr, request); }
    finally { d3.event = o; }
  };

  xhr.header = function(name, value) {
    name = (name + "").toLowerCase();
    if (arguments.length < 2) return headers[name];
    if (value == null) delete headers[name];
    else headers[name] = value + "";
    return xhr;
  };

  // If mimeType is non-null and no Accept header is set, a default is used.
  xhr.mimeType = function(value) {
    if (!arguments.length) return mimeType;
    mimeType = value == null ? null : value + "";
    return xhr;
  };

  // Specifies what type the response value should take;
  // for instance, arraybuffer, blob, document, or text.
  xhr.responseType = function(value) {
    if (!arguments.length) return responseType;
    responseType = value;
    return xhr;
  };

  // Specify how to convert the response content to a specific type;
  // changes the callback value on "load" events.
  xhr.response = function(value) {
    response = value;
    return xhr;
  };

  // Convenience methods.
  ["get", "post"].forEach(function(method) {
    xhr[method] = function() {
      return xhr.send.apply(xhr, [method].concat(d3_array(arguments)));
    };
  });

  // If callback is non-null, it will be used for error and load events.
  xhr.send = function(method, data, callback) {
    if (arguments.length === 2 && typeof data === "function") callback = data, data = null;
    request.open(method, url, true);
    if (mimeType != null && !("accept" in headers)) headers["accept"] = mimeType + ",*/*";
    if (request.setRequestHeader) for (var name in headers) request.setRequestHeader(name, headers[name]);
    if (mimeType != null && request.overrideMimeType) request.overrideMimeType(mimeType);
    if (responseType != null) request.responseType = responseType;
    if (callback != null) xhr.on("error", callback).on("load", function(request) { callback(null, request); });
    request.send(data == null ? null : data);
    return xhr;
  };

  xhr.abort = function() {
    request.abort();
    return xhr;
  };

  d3.rebind(xhr, dispatch, "on");

  return callback == null ? xhr : xhr.get(d3_xhr_fixCallback(callback));
};

function d3_xhr_fixCallback(callback) {
  return callback.length === 1
      ? function(error, request) { callback(error == null ? request : null); }
      : callback;
}

d3.text = d3_xhrType(function(request) {
  return request.responseText;
});

d3.json = function(url, callback) {
  return d3_xhr(url, "application/json", d3_json, callback);
};

function d3_json(request) {
  return JSON.parse(request.responseText);
}

d3.html = function(url, callback) {
  return d3_xhr(url, "text/html", d3_html, callback);
};

function d3_html(request) {
  var range = d3_document.createRange();
  range.selectNode(d3_document.body);
  return range.createContextualFragment(request.responseText);
}

d3.xml = d3_xhrType(function(request) {
  return request.responseXML;
});
  return d3;
})();
