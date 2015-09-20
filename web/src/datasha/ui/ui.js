
var module = angular.module(module.exports = 'datasha.ui', [
	require('./auth'),
	require('./connections'),
	require('./data'),
	require('./databases'),
	require('./query'),
	require('./tables'),
	require('./shell'),
	require('./filters'),
	require('./lazyLoad')
]);

module.run(function($timeout, $rootScope) {
	var promise = null;
	
	$rootScope.$watch('globalSpinner', function(nv, ov) {
		if (nv) {
			if (promise) {
				$timeout.cancel(promise);
				promise = null;
			}
			
			$('#global-progress').show();
		} else {
			promise = $timeout(function() {
				promise = null;
				$('#global-progress').hide();
			}, 5000);
		}
	});
});