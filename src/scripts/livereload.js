'use strict';

// import ext from "./utils/ext";

// var LIVERELOAD_HOST = 'localhost:';
// var LIVERELOAD_PORT = 35729;
// var connection = new WebSocket('ws+unix:///tmp/civet-ipc.socket');
// var connection = new WebSocket('wss://' + LIVERELOAD_HOST + LIVERELOAD_PORT + '/livereload');

// connection.onerror = function (error) {
//   console.log('reload connection got error:', error);
// };

// connection.onmessage = function (e) {
//   if (e.data) {
//     var data = JSON.parse(e.data);
//     if (data && data.command === 'reload') {
//       ext.runtime.reload();
//     }
//   }
// };