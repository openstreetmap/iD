export function parseError(group, idType) {

    function fillPlaceholder(d) { return '<span><a class="kr_error_description-id">' + d + '</a></span>'; }

    // arbitrary node list of form: #ID, #ID, #ID...
    function parseError211(list) {
        var newList = [];
        var items = list.split(', ');

        items.forEach(function(item) {
            // ID has # at the front
            var id = fillPlaceholder('n' + item.slice(1));
            newList.push(id);
        });

        return newList.join(', ');
    }

    // arbitrary way list of form: #ID(layer),#ID(layer),#ID(layer)...
    function parseError231(list) {
        var newList = [];
        var items = list.split(',');

        items.forEach(function(item) {
            var id;
            var layer;

            // item of form "#ID(layer)"
            item = item.split('(');

            // ID has # at the front
            id = item[0].slice(1);
            id = fillPlaceholder('w' + id);

            // layer has trailing )
            layer = item[1].slice(0,-1);

            // TODO: translation
            newList.push(id + ' (layer: ' + layer + ')');
        });

        return newList.join(', ');
    }

    // arbitrary node/relation list of form: from node #ID,to relation #ID,to node #ID...
    function parseError294(list) {
        var newList = [];
        var items = list.split(',');

        items.forEach(function(item) {
            var role;
            var idType;
            var id;

            // item of form "from/to node/relation #ID"
            item = item.split(' ');

            // to/from role is more clear in quotes
            role = '"' + item[0] + '"';

            // first letter of node/relation provides the type
            idType = item[1].slice(0,1);

            // ID has # at the front
            id = item[2].slice(1);
            id = fillPlaceholder(idType + id);

            item = [role, item[1], id].join(' ');
            newList.push(item);
        });

        return newList.join(', ');
    }

    // TODO: Handle error 401 template addition

    // arbitrary node list of form: #ID,#ID,#ID...
    function parseWarning20(list) {
        var newList = [];
        var items = list.split(',');

        items.forEach(function(item) {
            // ID has # at the front
            var id = fillPlaceholder('n' + item.slice(1));
            newList.push(id);
        });

        return newList.join(', ');
    }

    switch (idType) {
        // simple case just needs a linking span
        case 'n':
        case 'w':
        case 'r':
            group = fillPlaceholder(idType + group);
            break;
        // some errors have more complex ID lists/variance
        case '211':
            group = parseError211(group);
            break;
        case '231':
            group = parseError231(group);
            break;
        case '294':
            group = parseError294(group);
            break;
        case '20':
            group = parseWarning20(group);
    }

    return group;
}