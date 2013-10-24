// A per-domain session mutex backed by a cookie and dead man's
// switch. If the session crashes, the mutex will auto-release
// after 5 seconds.

iD.util.SessionMutex = function(name) {
    var mutex = {},
        intervalID;

    function renew() {
        var expires = new Date();
        expires.setSeconds(expires.getSeconds() + 5);
        document.cookie = name + '=1; expires=' + expires.toUTCString();
    }

    mutex.lock = function() {
        if (intervalID) return true;
        var cookie = document.cookie.replace(new RegExp('(?:(?:^|.*;)\\s*' + name + '\\s*\\=\\s*([^;]*).*$)|^.*$'), '$1');
        if (cookie) return false;
        renew();
        intervalID = window.setInterval(renew, 4000);
        return true;
    };

    mutex.unlock = function() {
        if (!intervalID) return;
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        clearInterval(intervalID);
        intervalID = null;
    };

    mutex.locked = function() {
        return !!intervalID;
    };

    return mutex;
};
