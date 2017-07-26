const workboxBuild = require('workbox-build');

workboxBuild
    .generateSW({
        maximumFileSizeToCacheInBytes: 2097152 * 3,
        clientsClaim: true,
        skipWaiting: true,
        swDest: 'dist/service-worker.js',
        globDirectory: 'dist',
        staticFileGlobs: ['**/*.{js,css,png,jpg,gif,svg,eot,ttf,woff}'],
        globIgnores: ['**/service-worker.js']
    })
    .then(() => {
        console.log('The production service worker has been generated.');
    });
