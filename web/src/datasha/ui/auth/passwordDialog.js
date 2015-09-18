
var ngm = angular.module('datasha.ui.auth');

ngm.factory('passwordDialog', function($mdDialog) {
	return {
		request: function(options) {
				return showDialog($mdDialog, options);
		}
	};
});

function showDialog($mdDialog, options) {
	return new Promise(function(resolve, reject) {			
		var testPassword = options.testPassword || function() { return true; };
		var title = options.title || 'Authentication Required';
		var errorMessage = options.errorMessage;
		var message = options.message || 'Please enter your password.';

		$mdDialog.show({
			parent: angular.element(document.body),
			templateUrl: 'html/datasha/ui/auth/passwordDialog.html',
			locals: {
				testPassword: testPassword,
				title: title,
				errorMessage: errorMessage,
				message: message,
				resolve: resolve,
				reject: reject
			},
			controller: PasswordDialogController
		});	
	});
}

function PasswordDialogController($scope, $mdDialog, testPassword, title, errorMessage, message, resolve, reject) {
	$scope.errorMessage = errorMessage;
	$scope.title = title;
	$scope.message = message;

	$scope.reset = function() {
		delete window.localStorage.dfData;
		delete window.sessionStorage.dfPassword;
		window.location.reload();
	};

	$scope.go = function() {
		$scope.$root.globalSpinner = true;

		Promise.resolve(testPassword($scope.password)).then(function(ret) {
			if (!ret) {
				$scope.errorMessage = 'Invalid password. Please try again.';
				$scope.going = false;
				return;
			}

			// Good password!
			$scope.$root.globalSpinner = false;
			$mdDialog.hide();
			resolve($scope.password);
			
		}).catch(function(err) {
			$scope.errorMessage = err.message || "Invalid password. Please try again.";
			$scope.going = false;
			$scope.$digest();
		});
	};
}
