iD.Util = {};

iD.Util._counters = {};

iD.Util.id = function(counter) {
    counter = counter || 'default';
    if (!iD.Util._counters[counter]) iD.Util._counters[counter] = 0;
    return iD.Util._counters[counter]--;
};

iD.Util.friendlyName = function(entity) {
    // summary:		Rough-and-ready function to return a human-friendly name
    //				for the object. Really just a placeholder for something better.
    // returns:		A string such as 'river' or 'Fred's House'.
    if (!Object.keys(entity.tags).length) { return ''; }

    var mainkeys = ['highway','amenity','railway','waterway'];
    var n = [];

    if (entity.tags.name) n.push(entity.tags.name);
    if (entity.tags.ref) n.push(entity.tags.ref);

    if (!n.length) {
        for (var k in entity.tags) {
            if (mainkeys[k]) {
                n.push(entity.tags[k]);
                break;
            }
        }
    }

    return n.length === 0 ? 'unknown' : n.join('; ');
};

iD.Util.codeWindow = function(content) {
    top.win = window.open('','contentWindow',
        'width=350,height=350,menubar=0' +
        ',toolbar=1,status=0,scrollbars=1,resizable=1');
    top.win.document.writeln('<pre>' + content + '</pre>');
    top.win.document.close();
};
