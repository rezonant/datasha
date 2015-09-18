
var ngm = angular.module(module.exports = 'datasha.ui.data', [
	'ngRoute', 
	'ngMaterial', 
	require('../../api'),
	require('../../domain'),
	
	require('./rowEditorDialog')
]);

ngm.directive('dbPager', function() {
	return {
		restrict: 'E',
		templateUrl: 'html/datasha/ui/data/pager.html',
		scope: {
			paging: '='
		},
		controller: function($scope) {
			$scope.$watch('paging.total', function() {
				if (!$scope.paging)
					return;
				
				$scope.pages = [];
				var count = $scope.paging.total / $scope.paging.size;
				
				for (var i = 0; i < count; ++i) {
					$scope.pages.push(i+1);
				}
			});
		}
	};
});
