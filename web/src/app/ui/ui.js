
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

module.directive('appSpinner', function() {
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

module.filter('fileSize', function() {
    return function(input) {
        var value = 0.0 + parseInt(input);
        var label = " bytes";

        if (value > 1024) {
            value = value / 1024.0;
            label = " KB";
        }

        if (value > 1024) {
            value = value / 1024.0;
            label = " MB";
        }

        if (value > 1024) {
            value = value / 1024.0;
            label = " GB";
        }

        if (value > 1024) {
            value = value / 1024.0;
            label = " TB";
        }

        return Math.round(value*100)/100.0+label;
    };
});

module.filter('rowCount', function() {
    return function(input) {
		var label = '';
		if (input > 1000000) {
			input = Math.floor(input / 1000000.0);
			label = "M";
		} else if (input > 1000) {
			input = Math.floor(input / 1000.0);
			label = "K";
		}
		
		return input+label;
    };
});
module.filter('shortGuid', function() {
    return function(input) {
		if (!input)
			return '';
		return input.slice(0, 9)+'...';
    };
});

module.filter('dateTime', function($sce) {
    return function(input) {
		
		if (!input)
			return 'Never'; 
		
		var date = new Date(input);
		var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct',
					  'Nov', 'Dec'];
		var month = months[date.getMonth() - 1];
		var hour = date.getHours();
		var ampm = 'AM';
		
		if (hour == 0) {
			hour = 12;
			ampm = 'AM';
		} else if (hour > 12) {
			hour -= 12;
			ampm = 'PM';
		} 
		
		var year = date.getYear() + 1900;
		var timeDetails = '';
		
		if (minutes > 0) {
			var minutes = (date.getMinutes() < 10 ? '0':'')+date.getMinutes();
			timeDetails += ':'+minutes;
		}
		
		if (seconds > 0) {
			var seconds = (date.getSeconds() < 10 ? '0':'')+date.getSeconds();
			timeDetails += ':'+seconds;
		}
		
		if (timeDetails !== '')
			timeDetails += ' ';
		
		return hour+timeDetails+ampm+' • '+month+' '+date.getDate()+' '+year;
    };
});

module.filter('trueFalse', function() {
    return function(input) {
		return input ? 'true' : 'false';
    };
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

module.directive('dbQueryResults', function($templateCache, $mdDialog) {
	return {
		restrict: 'E',
		templateUrl: '../src/app/ui/dbQueryResults.html',
		scope: {
			query: '=',
			api: '=',
			schemaContext: '=',
			message: '='
		},
		controller: function($scope) {
			$scope.page = {
				current: 1,
				size: 30,
				total: 1
			};
			
			$scope.loading = true;
			
			$scope.gridOptions = {
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
				
				
				$scope.$root.globalSpinner = true;
				$scope.query.fetch($scope.page).then(function(items) {
					
					if (items.executed) {
						$scope.execution = items;
						$scope.gridOptions.data = [];
						$scope.loading = false;
						$scope.$root.globalSpinner = false;
						return; 
					}
					
					$scope.execution = null;
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
						enableColumnMenu: false,
						cellTemplate: '../src/app/ui/data/rowActions.html'
					});
					
					$scope.rowMoreClicked = function(row, $event) {
						
						$mdDialog.show({
							parent: angular.element(document.body),
							targetEvent: $event,
							templateUrl: '../src/app/ui/data/rowActionsPopout.html',
							
							locals: {
								schema: $scope.schemaContext,
								table: $scope.table
							},
							
							controller: function($scope, schema) {
								
								$scope.available = {
									delete: false
								};
								
								// Determine if delete is available
								// (we will 
								
								$scope.delete = function() {
									alert('We would delete teh row');
									
									var pkey = null;
									
									// todo get the pkey!
									
									schema.forEach(function(column) {
										if (column.isPrimary)
											pkey = column.name;
									});
									
									var query;
									
									if (pkey) {
										query = 'DELETE FROM `';
									} else {
										
									}
									
								};
								
								$scope.cancel = function() {
									$mdDialog.hide();
								}
							}
						});
					}
					
					
					for (var key in firstItem) {
						var def = {
							displayName: key,
							field: key,
							width: 210,
							cellClass: ''
						};
					
						var column = null;
						
						if ($scope.schemaContext) {
							$scope.schemaContext.forEach(function(col) {
								if (col.name == key) {
									column = col;
									return false;
								}
							});
						}
						
						if (column) {
							
							if (column.type) {
								if (/^(tiny|small|big)int/i.test(column.type)) {
									def.type = 'number';
								}

								if (/^datetime$/i.test(column.type)) {
									def.cellFilter = 'dateTime';
									def.cellClass = 'datetime';
								}

								if (/^tinyint/i.test(column.type)) {
									def.cellFilter = 'trueFalse';
									def.cellClass = 'bool';
									def.width = '90';
								}
							}
							
							if (column.comment) {
								if (/^\(DC2Type:guid\)$/i.test(column.comment)) {
									// Doctrine2 guid
									def.cellFilter = 'shortGuid';
									def.width = 80;
									def.cellClass += 'id ';
								}
							}
						}
						
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
					$scope.$root.globalSpinner = false;
				}).catch(function() {
					$scope.loading = false;	
					$scope.$root.globalSpinner = false;
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
			
			$scope.$watch('currentQuery', function() {
				if (/\w*select /i.test($scope.currentQuery)) {
					$scope.isQuery = true;
				} else {
					$scope.isQuery = false;
				}
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
		$location.path('/');
		return;
	}
	
	$scope.connection = cnx;
	
	$scope.$root.breadcrumbs = [
		{url: '#/connections', text: 'Connections'}
	];
	
	$scope.$root.pageTitle = cnx.label;
	$scope.gridOptions = {
	
		enableGridMenu: true,
		columnDefs: [
			{
				field: 'name',
				displayName: 'Name',
				minWidth: 100,
				cellTemplate: '../src/app/ui/data/dbListName.html'
			},
			{
				field: 'tableCount',
				displayName: 'Tables',
				cellFilter: 'rowCount',
				type: 'number',
				width: '100'
			},
			{
				field: 'size',
				displayName: 'Size',
				cellFilter: 'fileSize',
				type: 'number',
				width: '100'
			}
			
		]	
	};
	
	api.getDatabases(cnx.id, cnx.key).then(function(dbs) {
		$scope.databases = dbs;
		$scope.gridOptions.data = dbs;
	});
	
});
	
module.controller('DatabaseDetailsController', function ($scope, $routeParams, $location, $templateCache, domain, api) {
	
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
	
	$scope.gridOptions = {
		enableGridMenu: true,
		columnDefs: [
			{
				field: 'name',
				displayName: 'Name',
				minWidth: 100,
				cellTemplate: '../src/app/ui/data/tableListName.html'
			},
			{
				field: 'rows',
				displayName: 'Rows',
				cellFilter: 'rowCount',
				type: 'number',
				width: '100'
			},
			{
				field: 'size',
				displayName: 'Size',
				cellFilter: 'fileSize',
				type: 'number',
				width: '100'
			},
			{
				field: 'engine',
				displayName: 'Engine',
				width: '100'
			},
			{
				field: 'format',
				displayName: 'Format',
				width: '100'
			},
			{
				field: 'version',
				displayName: 'Version',
				width: '100'
			},
			
		]
	};
	
	$scope.gridLoading = true;
	api.getTables(cnx.id, dbName, cnx.key).then(function(tables) {
		$scope.gridOptions.data = tables;
		$scope.gridLoading = false;
		$scope.tables = tables;
	});
	
});

module.controller('TableDetailsController', function ($scope, $routeParams, $location, $mdDialog, domain, api) { 
	
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
			
		$scope.showSchema = function($event) {
			$mdDialog.show({
				parent: angular.element(document.body),
				targetEvent: $event,
				templateUrl: '../src/app/ui/tableSchema.html',
				locals: {
					table: $scope.table,
					schema: $scope.schema,
					database: { name: dbName }
				},
				controller: function($scope, $mdDialog, table, schema, database) {
					$scope.db = database;
					$scope.table = table;
					$scope.schema = schema;
					$scope.cancel = function() {
						$mdDialog.hide();
					};
				}
			});
		};
		
		$scope.showInsert = function($event) {
				$mdDialog.show({
				parent: angular.element(document.body),
				targetEvent: $event,
				templateUrl: '../src/app/ui/insertRows.html',
				locals: {
					table: $scope.table,
					schema: $scope.schema,
					database: { name: dbName },
					runQuery: function(query) {
						$scope.query.text = query;
						$mdDialog.hide();
					}
				},
				controller: function($scope, $mdDialog, table, schema, database, runQuery) {
					
					schema = angular.copy(schema);
					schema.forEach(function(column) {
						column.operator = 'LIKE';
						column.logicalType = column.type;
						
						if (/^varchar/.test(column.type)) {
							column.logicalType = 'string';
						} else if (/^tinyint/.test(column.type)) {
							column.logicalType = 'bool';
						} else if (column.comment = '(DC2Type:guid)') {
							column.logicalType = 'guid';
						}
					});
					
					var makeRowPrototype = function() {
						return {
							columns: angular.copy($scope.schema)
						};
					};
					
					$scope.schema = schema;
					$scope.rows = [makeRowPrototype()];
					$scope.db = database;
					$scope.table = table;
					$scope.cancel = function() {
						$mdDialog.hide();
					};
					
					$scope.removeRow = function(index) {
						$scope.rows.splice(index, 1);
					};
					
					$scope.addRow = function() {
						$scope.rows.push(makeRowPrototype());
					};
					
					$scope.addRowToFront = function() {
						$scope.rows.unshift(makeRowPrototype());
					};
					
					var resolveSpec = function(columns) {
						
						var searchSpec = [];
						columns.forEach(function(column) {
							if (!column.checked)
								return;
							searchSpec.push({
								name: column.name,
								value: column.value
							});
						});
					
						return searchSpec;
					};
					
					var generateRowQuery = function(row, index) {
						
						var spec = resolveSpec(row.columns);
						var query;
						query = "-- Row "+index+"\nINSERT INTO `"+$scope.table.name+"` ";
						
						var columnNames = [];
						var clauses = [];
						
						spec.forEach(function(column) {
							
							columnNames.push('`'+column.name+'`');
							
							var clause = "";
							
							if (/^\d+$/g.test( column.value ))
								clause += column.value;
							else
								clause += "'"+column.value.replace(/'/g, '\\\'')+"'";
							
							clauses.push(clause);
						});
						
						query += "(\n  "+columnNames.join(",\n  ")+"\n) VALUES (\n  "+clauses.join(",\n  ")+"\n)";
						return query;
					};
					
					var generateQuery = function() {
						var queries = [];
						$scope.rows.forEach(function(row, index) {
							queries.push(generateRowQuery(row, index+1));
						});
						
						return queries.join(";\n\n");
					};
					
					$scope.preview = function() {
						$scope.previewMode = !$scope.previewMode;
						$scope.previewQuery = generateQuery();
					};
					
					$scope.insert = function() {
						var query = generateQuery();
						runQuery(query);
					};
				}
			});
		}
		
		$scope.showSearch = function($event) {
			$mdDialog.show({
				parent: angular.element(document.body),
				targetEvent: $event,
				templateUrl: '../src/app/ui/tableSearch.html',
				locals: {
					table: $scope.table,
					schema: $scope.schema,
					database: { name: dbName },
					runQuery: function(query) {
						$scope.query.text = query;
						$mdDialog.hide();
					}
				},
				controller: function($scope, $mdDialog, table, schema, database, runQuery) {
					
					schema = angular.copy(schema);
					schema.forEach(function(column) {
						column.operator = 'LIKE';
						column.logicalType = column.type;
						
						if (/^varchar/.test(column.type)) {
							column.logicalType = 'string';
						} else if (/^tinyint/.test(column.type)) {
							column.logicalType = 'bool';
						} else if (column.comment = '(DC2Type:guid)') {
							column.logicalType = 'guid';
						}
					});
					
					$scope.db = database;
					$scope.table = table;
					$scope.schema = schema;
					$scope.cancel = function() {
						$mdDialog.hide();
					};
					
					var resolveSpec = function() {
						
						var searchSpec = [];
						$scope.schema.forEach(function(column) {
							if (!column.checked)
								return;
							searchSpec.push({
								name: column.name,
								operator: column.operator,
								value: column.value,
								logicalType: column.logicalType
							});
						});
					
						return searchSpec;
					};
					
					var generateQuery = function() {
						
						var spec = resolveSpec();
						var query;
						query = "SELECT * FROM `"+$scope.table.name+"`";
						
						if (spec.length > 0)
							query += " WHERE\n     ";
						
						var clauses = [];
						spec.forEach(function(column) {
							var clause = column.name + " " + column.operator;
							
							if (/^\d+$/g.test( column.value ))
								clause += " "+column.value;
							else
								clause += " '"+column.value.replace(/'/g, '\\\'')+"'";
							
							clauses.push(clause);
						});
						
						query += clauses.join("\n AND ");
						return query;
					}
					
					$scope.preview = function() {
						$scope.previewMode = !$scope.previewMode;
						$scope.previewQuery = generateQuery();
					};
					
					$scope.search = function() {
						var query = generateQuery();
						runQuery(query);
					};
				}
			});
		};
		
		api.getTableSchema(cnx.id, dbName, tableName, cnx.key).then(function(columns) {
			$scope.table = {
				name: tableName,
				columns: columns
			};
			
			$scope.schema = columns;
			
			$scope.query = api.createQuery(cnx, dbName, 'SELECT * FROM '+tableName, function(e) {
				var message = 'An unknown error has occurred.';
				
				if (e.message)
					message = e.message;
				
				// Error
				var alert = $mdDialog.alert()
					.title('Error while fetching results!')
					.content(message)
					.ok('Close');

				$mdDialog.show(alert)
					.finally(function() {
						alert = undefined;
					});
				

				$scope.message = message;
				$scope.$root.globalSpinner = false;
				$scope.$digest();
			});
			
		}).catch(function(err) {
			alert('Error getting table '+tableName+' from db '+dbName+' on connection '+cnxId);
			$location.path('/');
		});

	});
});

module.controller('ShellController', function ($scope, $timeout, $mdSidenav, $mdUtil, $mdDialog, api) {
	
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
						$scope.$root.globalSpinner = true;
						if (!checkPassword($scope.password)) {
							$scope.errorMessage = 'Invalid password. Please try again.';
							return;
						}
						
						// Good password!
						window.sessionStorage.dfPassword = $scope.password;
						$scope.$root.globalSpinner = false;
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

