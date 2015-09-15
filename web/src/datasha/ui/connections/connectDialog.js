
var ngm = angular.module(module.exports = 'datasha.ui.auth.connectDialog', [
	'ngMaterial'
]);

ngm.factory('connectDialog', function($mdDialog) {
	
	return {
		show: function($event) {
			$mdDialog.show({
				parent: angular.element(document.body),
				targetEvent: $event,
				templateUrl: '../src/datasha/ui/connections/connectDialog.html',
				controller: 'ConnectDialogController'
			});
		}
	}
});

ngm.controller('ConnectDialogController', function ($scope, $timeout, $mdSidenav, $mdDialog, api) {
	$scope.closeDialog = function() {
		$mdDialog.hide();
	}
	
	$scope.newConnection = {
		type: 'mysql',
		host: '',
		port: '',
		user: '',
		pass: ''
	};
	
	$scope.connect = function(details) {
		$scope.connecting = true;
		$scope.$root.globalSpinner = true;
		
		api.establishConnection(details.type, details.host, details.port, details.user, details.pass).then(function(cnx) {
			$mdDialog.hide();
			
			cnx.ready = Promise.resolve();
			cnx.isReady = true;
			cnx.isAlive = true;
			cnx.isActive = true;
			
			$scope.$root.activeConnections.push(cnx);
			//$scope.$root.activeConnection = cnx;
			//$scope.selectedTab = 1;
			
			if (!window.persistedData.connections)
				window.persistedData.connections = [];
			window.persistedData.connections.push(cnx);
			$scope.$root.persistData();
			$scope.$root.globalSpinner = false;
			
			//$scope.$root.$apply();
		}).catch(function(err) {
			$mdDialog.hide();
			var alert = $mdDialog.alert()
				.title('Failed to connect')
				.content('Could not connect to the requested database.')
				.ok('Close');
		
			$mdDialog.show(alert)
				.finally(function() {
					alert = undefined;
				});
			$scope.$root.globalSpinner = false;
		});
	};
});
	