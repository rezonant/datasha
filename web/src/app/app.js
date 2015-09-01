
var app = angular.module('app', [
	'ngMaterial',
	'app.ui'
]);

module.exports = app;

require('./domain/domain.js');
require('./api/api.js');
require('./ui/ui.js');
