
export function registerServiceWorker() {
  if (location.hostname !== 'localhost' && 'serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      var swUrl = 'service-worker.js';
      navigator.serviceWorker
        .register(swUrl)
        .then(function(registration) {
          registration.onupdatefound = function() {
            var installingWorker = registration.installing;
            installingWorker.onstatechange = function() {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // At this point, the old content will have been purged and
                  // the fresh content will have been added to the cache.
                  // It's the perfect time to display a "New content is
                  // available; please refresh" message in your web app.
                  var r = window.confirm(
                    'New version of iD editor is available. Would you like to reload?'
                  );
                  if (r) {
                    window.location.reload();
                  }
                } else {
                  // At this point, everything has been precached.
                  // It's the perfect time to display a
                  // "Content is cached for offline use." message.
                  console.log('Content is cached for offline use.');
                }
              }
            };
          };
        })
        .catch(function(error) {
          console.error('Error during service worker registration:', error);
        });
    });
  }
}

export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(function (registration) {
      registration.unregister();
    });
  }
}
