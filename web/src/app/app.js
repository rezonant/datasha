
var app = angular.module('app', [
	'ngMaterial'
]);

app.controller('ShellController', function ($scope, $timeout, $mdSidenav, $mdUtil) {
	
	$scope.toggleLeft = buildToggler('left');
    $scope.toggleRight = buildToggler('right');
    /**
     * Build handler to open/close a SideNav; when animation finishes
     * report completion in console
     */
    function buildToggler(navID) {
      var debounceFn =  $mdUtil.debounce(function(){
            $mdSidenav(navID).toggle();
          },200);
      return debounceFn;
    };
	
});
	
app.controller('LeftSidebarController', function ($scope, $timeout, $mdSidenav) {
	$scope.close = function () {
		$mdSidenav('left').close();
	};
});

app.controller('RightSidebarController', function ($scope, $timeout, $mdSidenav) {
	$scope.close = function () {
		$mdSidenav('right').close();
	};
});


module.exports = app;