
var ngm = angular.module('datasha.ui.auth');

ngm.factory('passwordDialog', function($mdDialog) {
	return {
		request: function(authErrorMessage, options) {
			return new Promise(function(resolve, reject) {
				
				var testPassword = options.testPassword || function() { return true; };
				
				$mdDialog.show({
					parent: angular.element(document.body),
					templateUrl: '../src/app/ui/login.html',
					controller: function($scope) {

						$scope.errorMessage = authErrorMessage;

						$scope.reset = function() {
							delete window.localStorage.dfData;
							delete window.sessionStorage.dfPassword;
							window.location.reload();
						};

						$scope.go = function() {
							$scope.$root.globalSpinner = true;
							if (!testPassword($scope.password)) {
								$scope.errorMessage = 'Invalid password. Please try again.';
								return;
							}

							// Good password!
							//window.sessionStorage.dfPassword = $scope.password;
							$scope.$root.globalSpinner = false;
							$mdDialog.hide();
							resolve($scope.password);
						};
					}
				});
			});
		}
	};
});