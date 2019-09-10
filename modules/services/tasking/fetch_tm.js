//var _token = 'SWpFMk5qUXdNVE1pLkVEVTA4Zy5OakdsdGRzUW9RVWdhNmRnZjVzLUxUM1BVaHc=';

var getOptions = {
    // Default options are marked with *
    method: 'GET', // *GET, POST, PUT, DELETE, etc.
    mode: 'cors', // no-cors, cors, *same-origin
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    credentials: 'same-origin', // include, *same-origin, omit
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/html',
        'Accept-Language': 'en',
        //'Authorization': 'Token ' + _token,
    },
    redirect: 'follow', // manual, *follow, error
    referrer: 'no-referrer', // no-referrer, *client
};

var postOptions = {
        // Default options are marked with *
    method: 'POST', // *GET, POST, PUT, DELETE, etc.
    mode: 'cors', // no-cors, cors, *same-origin
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    credentials: 'same-origin', // include, *same-origin, omit
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/html',
        'Accept-Language': 'en',
    //    'Authorization': 'Token ' + _token,
    },
    redirect: 'follow', // manual, *follow, error
    referrer: 'no-referrer', // no-referrer, *client
    body: '', // body data type must match "Content-Type" header
};


function handleJSONResponse (response) {
    return response.json()
      .then(function(json) {
        if (response.ok) {
          return json;
        } else {
          return Promise.reject(
                Object.assign({},
                json,
                {
                    status: response.status,
                    statusText: response.statusText
                }
          ));
        }
    });
}


function handleTextResponse (response) {
    return response.text()
      .then(function(text) {
        if (response.ok) {
            return text;
        } else {
            return Promise.reject({
                status: response.status,
                statusText: response.statusText,
                err: text
            });
        }
    });
}


function handleResponse (response) {
    let contentType = response.headers.get('content-type');
    if (contentType.includes('application/json')) {
        return handleJSONResponse(response);
    } else if (contentType.includes('text/html')) {
        return handleTextResponse(response);
    } else {
        // Other response types as necessary. I haven't found a need for them yet though.
        throw new Error(`Sorry, content-type ${contentType} not supported`);
    }
}

export function getData(url = '', options = getOptions) {

    return fetch(url, options)
        .then(function(response) {
            return handleResponse(response);
        });
}

export function postData(url = '', action, data = {}, options = postOptions) {
    options.body = JSON.stringify(data);

    return fetch(url + action, options)
        .then(function(response) {
            return handleResponse(response);
        });
}
