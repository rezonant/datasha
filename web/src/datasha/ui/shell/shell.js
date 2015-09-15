
var ngm = angular.module(module.exports = 'datasha.ui.shell', [
	'ngMaterial',
	require('../../api'),
	require('../../domain')
]);

ngm.config(function($routeProvider) {
	$routeProvider
		.when('/', {
			templateUrl: 'html/datasha/ui/shell/home.html',
			controller: 'HomeController'
		})
		.otherwise('/')
	;
});

ngm.directive('appSpinner', function() {
	return {
		restrict: 'E',
		template: 
			'<div class="sk-folding-cube selected">'
				+ '<div class="sk-cube1 sk-cube"></div>'
				+ '<div class="sk-cube2 sk-cube"></div>'
				+ '<div class="sk-cube4 sk-cube"></div>'
				+ '<div class="sk-cube3 sk-cube"></div>'
		  + '</div>'
	};
});

ngm.controller('ShellController', function ($scope, $timeout, $mdSidenav, $mdUtil, $mdDialog, api, passwordDialog) {
	
	$scope.$root.brand = {
		name: 'dataforest.io',
		commercial: false
	};

	var readyToInitialize = Promise.resolve();
	var data = null;
	
	var initialize = function() {
		
		api.initialize();
		
		// Load the active connections from persistence
		 
		$scope.$root.activeConnections = [];
		var promises = [];
		(window.persistedData.connections || []).forEach(function(cnx) {
			
			cnx.ready = api.getConnection(cnx.id, cnx.key).then(function() {
				cnx.isReady = true;
				cnx.isAlive = true;
			}).catch(function() {
				cnx.isReady = false;
				cnx.isAlive = false;
			});
			cnx.isReady = false;
			$scope.$root.activeConnections.push(cnx);
		});

		// Build handler to open/close a SideNav

		function buildToggler(navID) {
		  var debounceFn =  $mdUtil.debounce(function(){
				$mdSidenav(navID).toggle();
			  },200);
		  return debounceFn;
		};

		$scope.toggleLeft = buildToggler('left');
		$scope.toggleRight = buildToggler('right');

		// OK we're loaded

		$scope.$root.loaded = true;
		
		$('#app-loaded').show();
		$('#app-loading').addClass('done');
		$timeout(function() {
			$('#app-loading').hide();
		}, 2000);
		
		api.setReady();
		$scope.$root.$apply();

	};
	
	var checkPassword = function(pw) {
		try {
			var data = JSON.parse(sjcl.decrypt(pw, window.localStorage.dfData));
			if (!data || !data.isValid)
				return false;
		} catch (e) {
			return false;
		}
		
		return true;
	};
	
	var persistData = function() {
		if (!window.sessionStorage.dfPassword) {
			throw "No available password!";
		}
		
		window.localStorage.dfData = sjcl.encrypt(
			window.sessionStorage.dfPassword,
			JSON.stringify(window.persistedData)
		);
	};
	
	$scope.$root.persistData = persistData;
	
	
	// Validate session-stored password
	
	var authErrorMessage = null;
	readyToInitialize = readyToInitialize.then(function() {
		
		if (!window.sessionStorage.dfPassword || !window.localStorage.dfData) {
			return;
		}
		
		if (!checkPassword(window.sessionStorage.dfPassword)) {
			// Bad password.
			authErrorMessage = 'Stored password was invalid. Please re-enter your password.';
			delete window.sessionStorage.dfPassword;
		}
	});
	
	// Show password dialog if necessary
			
	readyToInitialize = readyToInitialize.then(function() {
		
		if (window.sessionStorage.dfPassword || !window.localStorage.dfData) {
			return;
		}
		
		return passwordDialog
			.request(authErrorMessage, {
				testPassword: function(password) {
					return checkPassword(password);
				}
			})
			.then(function(password) {
				window.sessionStorage.dfPassword = password;
				return ;
			});
	});
	
	// Show setup dialog if necessary
	
	readyToInitialize = readyToInitialize.then(function() {
		if (window.localStorage.dfData) {
			return;
		}

		return new Promise(function(resolve, reject) {
			$mdDialog.show({
				parent: angular.element(document.body),
				//targetEvent: $event,
				templateUrl: 'html/datasha/ui/setup.html',
				controller: function($scope) {
					$scope.go = function() {
						if ($scope.password1 != $scope.password2) {
							$scope.errorMessage = 'Your passwords do not match.';
							return;
						}
						
						window.sessionStorage.dfPassword = $scope.password1;
						window.localStorage.dfData = sjcl.encrypt($scope.password1, JSON.stringify({
							isValid: true
						}));
						
						$mdDialog.hide();
						resolve();
						
					};
				}
			});
		});
	});
	
	readyToInitialize.then(function() {
		// Decrypt and store the data for things
		
		window.persistedData = 
			JSON.parse(sjcl.decrypt(window.sessionStorage.dfPassword, window.localStorage.dfData));
		
		initialize();
	});
});

ngm.controller('LeftSidebarController', function ($scope, $timeout, $location, $mdSidenav, $mdDialog, api, domain, connectDialog) {
	$scope.close = function () {
		$mdSidenav('left').close();
	};
	
	$scope.$root.$watch('sidebarHints', function() {
		if (!$scope.$root.sidebarHints)
			return;
		
		// Connection
		
		if ($scope.$root.sidebarHints.connectionId) {
			var cnx = domain.getConnection($scope.$root.sidebarHints.connectionId);
			if (cnx) {
				$scope.selectConnection(cnx).then(function() {
					// Database 

					if ($scope.$root.sidebarHints.database) {
						$scope.selectDb($scope.$root.sidebarHints.database);
					}
				});
			}
			
		}
		
	});
	
	$scope.deleteConnection = function(cnx, $event) {
		var alert = $mdDialog.confirm()
			.title('Remove connection '+cnx.label+'?')
			.content('Are you sure you wish to remove this connection?')
			.ok('Remove')
			.cancel('Cancel')
			

		$mdDialog.show(alert)
			.then(function() {
				api.deleteConnection(cnx.id)
					.then(function() {})
					.catch(function() {})
					.then(function() { 
						var cnxs = [];
						$scope.$root.activeConnections.forEach(function(cnx2) {
							if (cnx.id == cnx2.id)
								return;
							cnxs.push(cnx2);
						});

						$scope.$root.activeConnections = cnxs;
						window.persistedData.connections = $scope.$root.activeConnections.slice();
						$scope.$root.persistData();
					});
			});
	};
	
	$scope.goToConnectionPage = function(cnx) {
		$mdSidenav('left').close();
		$location.path('/connections/'+cnx.id);
	};
	
	$scope.goToDatabasePage = function(cnx, db) {
		$mdSidenav('left').close();
		$location.path('/connections/'+cnx.id+'/dbs/'+db.name);
	};
	
	$scope.selectConnection = function(cnx, $event) {
		
		$scope.selectedTab = 1;	
		$scope.activeConnection = null;
		$scope.$root.globalSpinner = true;
		
		return cnx.ready.then(function() {
			return $timeout(750);
		}).then(function() {
			if (cnx.isAlive)
				return;
			
			// Re-establish the connection

			return new Promise(function(resolve, reject) {
				$mdDialog.show({
					parent: angular.element(document.body),
					targetEvent: $event,
					templateUrl: '../src/app/ui/passwordDialog.html',
					controller: function($scope) {

						$scope.title = 'Reconnect to '+cnx.label;
						$scope.message =  
							'The selected connection has become inactive. You must provide '
							+ 'the password to reconnect.';

						$scope.go = function(password) {
							
							$scope.$root.globalSpinner = true;
							api.establishConnection(cnx.type, cnx.host, cnx.port, cnx.username, password)
								.then(function(newConnection) {

									cnx.id = newConnection.id;
									cnx.key = newConnection.key;
									cnx.isAlive = true;
									cnx.isReady = true;

									$mdDialog.hide();
									$scope.$root.persistData();
									$scope.$root.globalSpinner = false;

									resolve();
								})
								.catch(function() {
									$mdDialog.hide();
									var alert = $mdDialog.alert()
										.title('Failed to connect')
										.content('Could not re-establish connection.')
										.ok('Close');

									$mdDialog.show(alert)
										.finally(function() {
											alert = undefined;
											reject();
										});
									$scope.$root.globalSpinner = false;
								});
						};

						$scope.cancel = function() {
							$mdDialog.hide();
							reject();
						};
					}
				});
			});
			
		}).then(function() {
			
			if ($scope.activeConnection && $scope.activeConnection.id === cnx.id) {
				return Promise.resolve();
			}
			

			return api.getDatabases(cnx.id, cnx.key).then(function(dbs) {
				var connection = $.extend({}, cnx);

				connection.databases = dbs;
				connection.databaseNames = [];
				connection.databases.forEach(function(db) {
					connection.databaseNames.push(db.name);
				});


				$scope.$root.globalSpinner = false;
				$scope.activeConnection = connection;
			});
		});
	};
	
	$scope.selectDb = function(db) {
		var cnx = $scope.activeConnection;
		
		$scope.selectedTab = 2;	
		
		if ($scope.activeDb && $scope.activeDb.name === db) 
			return Promise.resolve();
		
		$scope.activeDb = null;
		$scope.$root.globalSpinner = true;
		
		return $timeout(750).then(function() {
			return api.getTables(cnx.id, db, cnx.key);			
		}).then(function(tables) {
			$scope.activeDb = {
				name: db,
				tables: tables
			};
			
			$scope.$root.globalSpinner = false;
		});
	};
	
	$scope.goHome = function() {
		$mdSidenav('left').close();
		$location.path('/');
	}
	
	$scope.goToTable = function(table) {
		$location.path(
			'/connections/'+$scope.activeConnection.id
			+'/dbs/'+$scope.activeDb.name
			+'/tables/'+table.name
		);

		$mdSidenav('left').close();

	};
	
	$scope.selectedTab = 0;
	
	$scope.showConnectDialog = function($event) {
		connectDialog.show($event);
	}
});

ngm.controller('RightSidebarController', function ($scope, $timeout, $mdSidenav) {
	$scope.close = function () {
		$mdSidenav('right').close();
	};
});

ngm.controller('HomeController', function ($scope) {
	$scope.$root.breadcrumbs = [];
	$scope.$root.pageTitle = 'Welcome!';	
});
