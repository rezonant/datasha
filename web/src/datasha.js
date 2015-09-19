
if (!window.appConfig) {
	window.appConfig = require('../config.js');
}

var ngm = angular.module(module.exports = 'datasha', [
	require('./datasha/ui'),
	require('./datasha/api'),
	require('./datasha/domain')
]);
