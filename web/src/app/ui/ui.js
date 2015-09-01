
var module = angular.module('app.ui', [
	'ngRoute', 
	'ui.grid', 
	'ngMaterial',
	'ui.grid.pinning',
	'ui.grid.edit',
	'ui.grid.expandable',
	'ui.grid.selection',
	'ui.grid.exporter',
	'app.api', 
	'app.domain'
]);

module.config(function($routeProvider) {
	$routeProvider
		.when('/', {
			templateUrl: '../src/app/ui/home.html',
			controller: 'HomeController'
		})
		.when('/connections', {
			templateUrl: '../src/app/ui/connections.html',
			controller: 'ConnectionsListController'
		})
		.when('/connections/:id', {
			templateUrl: '../src/app/ui/connection.html',
			controller: 'ConnectionDetailsController'
		})
		.when('/connections/:cnx/dbs/:db', {
			templateUrl: '../src/app/ui/db.html',
			controller: 'DatabaseDetailsController'
		})
		.when('/connections/:cnx/dbs/:db/tables/:table', {
			templateUrl: '../src/app/ui/table.html',
			controller: 'TableDetailsController'
		})
		.otherwise('/');
});

module.directive('dbPager', function() {
	return {
		restrict: 'E',
		templateUrl: '../src/app/ui/pager.html',
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

module.directive('dbQueryResults', function($templateCache) {
	return {
		restrict: 'E',
		templateUrl: '../src/app/ui/dbQueryResults.html',
		scope: {
			query: '=',
			api: '=',
			schemaContext: '='
		},
		controller: function($scope) {
			$scope.page = {
				current: 1,
				size: 30,
				total: 1
			};
			
			$scope.loading = true;
			
			$scope.gridOptions = {
				//expandableRowTemplate: '../src/app/ui/data/rowActions.html',
				//expandableRowHeight: 150,
				//expandableRowScope: {
				//	
				//},
				
				//rowTemplate: function() { return $templateCache.get('../src/app/ui/data/row.html'); },
				
				enableGridMenu: true,
				exporterMenuCsv: true
			};
			
			$scope.refresh = function() {
				if (!$scope.query) {
					$scope.gridOptions.data = [];
					return;
				}
				
				$scope.query.run = function(text) {
					$scope.page.current = 1;
					$scope.query.text = text;
					//$scope.refresh();
				}
				
				$scope.loading = true;
				
				$scope.query.count().then(function(count) {
					$scope.page.total = count;
				});
				
				$scope.query.fetch($scope.page).then(function(items) {
					
					var firstItem = {};
					
					if (items.length > 0)
						firstItem = items[0];
					
					$scope.gridOptions.columnDefs = [];
					
					$scope.gridOptions.columnDefs.push({ 
						field: '__actions__',
						displayName: '',
						enableSorting: false,
						enableHiding: true,
						width: 40,
						cellTemplate: '../src/app/ui/data/rowActions.html'
					});
					
					for (var key in firstItem) {
						var def = {
							displayName: key,
							field: key,
							width: 210
						};
						
						if (false && /^id$/i.test(key)) {
							// lazy, make this obey schemaHints
							def.pinnedLeft = true;
							def.width = 140;
						}
						
						$scope.gridOptions.columnDefs.push(def);
					}
					
					$scope.page.count = items.length;
					$scope.gridOptions.data = items;
					$scope.loading = false;
				});
			}
	
			$scope.$watch('query.text', function() {
				$scope.refresh();
			});
			
			$scope.$watch('page.current', function() {
				$scope.refresh();
			});
			
			$scope.api = {
				refresh: $scope.refresh
			};
		}
	};
});

module.directive('dbQueryBox', function() {
	return {
		restrict: 'E',
		templateUrl: '../src/app/ui/dbQueryBox.html',
		scope: {
			query: '=',
			run: '&'
		},
		controller: function($scope) {
			
			$scope.$watch('query.text', function() {
				if (!$scope.query)
					return;
				$scope.currentQuery = $scope.query.text;
			});
			
		}
	};
});

module.controller('HomeController', function ($scope) {
	$scope.$root.breadcrumbs = [];
	$scope.$root.pageTitle = 'Welcome!';
	
});

module.controller('ConnectionsListController', function ($scope, $timeout, $mdSidenav, $mdUtil) {
	
	$scope.$root.breadcrumbs = [];
	$scope.$root.pageTitle = 'Connections';
});

module.controller('ConnectionDetailsController', function ($scope, $location, $routeParams, domain, api) {
	var id = $routeParams.id;
	var cnx = domain.getConnection(id);
	
	if (!cnx) {
		alert('Connection '+id+' is not active');
		$location.path('/');
		return;
	}
	
	$scope.connection = cnx;
	
	$scope.$root.breadcrumbs = [
		{url: '#/connections', text: 'Connections'}
	];
	
	$scope.$root.pageTitle = cnx.label;
	
	api.getDatabases(cnx.id, cnx.key).then(function(dbs) {
		$scope.databases = dbs;
	});
	
});
	
module.controller('DatabaseDetailsController', function ($scope, $routeParams, $location, domain, api) {
	
	var cnxId = $routeParams.cnx;
	var dbName = $routeParams.db;
	
	var cnx = domain.getConnection(cnxId);
	
	if (!cnx) { 
		alert('Connection '+cnxId+' is not active');
		$location.path('/');
		return;
	}
	
	$scope.$root.breadcrumbs = [
		{url: '#/connections/'+cnx.id, text: cnx.label}
	];
	
	$scope.$root.pageTitle = dbName;
	
	$scope.connection = cnx;
	$scope.database = {
		name: dbName
	};
	
	api.getTables(cnx.id, dbName, cnx.key).then(function(tables) {
		$scope.tables = tables;
	});
	
});

module.controller('TableDetailsController', function ($scope, $routeParams, $location, domain, api) {
	
	api.ready.then(function() {

		var cnxId = $routeParams.cnx;
		var dbName = $routeParams.db;
		var tableName = $routeParams.table;

		var cnx = domain.getConnection(cnxId);

		if (!cnx) {
			alert('Connection '+cnxId+' is not active');
			$location.path('/');
			return;
		}
		
		$scope.$root.sidebarHints = {
			connectionId: cnxId,
			database: dbName
		};
		
		$scope.$root.breadcrumbs = [
			{url: '#/connections/'+cnx.id, text: cnx.label},
			{url: '#/connections/'+cnx.id+'/dbs/'+dbName, text: dbName}
		];
		$scope.connection = cnx;
		$scope.$root.pageTitle = tableName;
			
		api.getTableSchema(cnx.id, dbName, tableName, cnx.key).then(function(columns) {
			$scope.table = {
				name: tableName,
				columns: columns
			};
			$scope.query = api.createQuery(cnx, dbName, 'SELECT * FROM '+tableName);
			
		}).catch(function(err) {
			alert('Error getting table '+tableName+' from db '+dbName+' on connection '+cnxId);
			$location.path('/');
		});

	});
});

module.controller('ShellController', function ($scope, $timeout, $mdSidenav, $mdUtil, $mdDialog, api) {
	
	$scope.$root.brand = {
		name: 'DataForest.io'
	};

	var readyToInitialize = Promise.resolve();
	var data = null;
	
	var initialize = function() {
		
		api.initialize();
		
		// Load the active connections from persistence
		
		$scope.$root.activeConnections = [];
		var promises = [];
		(window.persistedData.connections || []).forEach(function(cnx) {
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
		
		return new Promise(function(resolve, reject) {
			$mdDialog.show({
				parent: angular.element(document.body),
				templateUrl: '../src/app/ui/login.html',
				
				locals: {

				},

				controller: function($scope) {
					
					$scope.errorMessage = authErrorMessage;
					
					$scope.reset = function() {
						delete window.localStorage.dfData;
						delete window.sessionStorage.dfPassword;
						window.location.reload();
					};
					
					$scope.go = function() {
						if (!checkPassword($scope.password)) {
							$scope.errorMessage = 'Invalid password. Please try again.';
							return;
						}
						
						// Good password!
						window.sessionStorage.dfPassword = $scope.password;
						$mdDialog.hide();
						resolve();
					};
				}
			});
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
				templateUrl: '../src/app/ui/setup.html',
				locals: {

				},

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

module.controller('ConnectDialogController', function ($scope, $timeout, $mdSidenav, $mdDialog, api) {
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
		
		api.establishConnection(details.type, details.host, details.port, details.user, details.pass).then(function(cnx) {
			$mdDialog.hide();
			
			$scope.$root.activeConnections.push(cnx);
			//$scope.$root.activeConnection = cnx;
			//$scope.selectedTab = 1;
			
			if (!window.persistedData.connections)
				window.persistedData.connections = [];
			window.persistedData.connections.push(cnx);
			$scope.$root.persistData();
			
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
		});
	};
});
	
module.controller('LeftSidebarController', function ($scope, $timeout, $location, $mdSidenav, $mdDialog, api, domain) {
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
	
	$scope.selectConnection = function(cnx) {
		
		if ($scope.activeConnection && $scope.activeConnection.id === cnx.id) {
			return Promise.resolve();
		}
		
		return api.getDatabases(cnx.id, cnx.key).then(function(dbs) {
			var connection = $.extend({}, cnx);
			
			connection.databaseNames = dbs;
			connection.databases = [];
			connection.databaseNames.forEach(function(db) {
				connection.databases.push({
					name: db
				});
			});
			
			$scope.activeConnection = connection;
			$scope.selectedTab = 1;	
		});
		
	};
	
	$scope.selectDb = function(db) {
		var cnx = $scope.activeConnection;
		
		if ($scope.activeDb && $scope.activeDb.name === db) 
			return Promise.resolve();
		
		return api.getTables(cnx.id, db, cnx.key).then(function(tables) {
			$scope.$root.activeDb = {
				name: db,
				tables: tables
			};
			$scope.selectedTab = 2;
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
		$mdDialog.show({
			parent: angular.element(document.body),
			targetEvent: $event,
			templateUrl: '../src/app/ui/connectDialog.html',
			locals: {
				
			},
			
			controller: 'ConnectDialogController'
		});
	}
});

module.controller('RightSidebarController', function ($scope, $timeout, $mdSidenav) {
	$scope.close = function () {
		$mdSidenav('right').close();
	};
});
