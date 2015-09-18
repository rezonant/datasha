
var ngm = angular.module(module.exports = 'datasha.ui.query', [
	'ngRoute', 
	'ngMaterial', 
	'ui.grid',
	'ui.grid.pinning',
	'ui.grid.edit',
	'ui.grid.expandable',
	'ui.grid.selection',
	'ui.grid.exporter',
	
	require('../../api'),
	require('../../domain'),
	require('../data/rowEditorDialog'),
	require('./quickQueryDialog')
]);

ngm.config(function($routeProvider) { 
	$routeProvider.when('/connections/:cnx/dbs/:db/query', {
		templateUrl: 'html/datasha/ui/query/queryDatabase.html',
		controller: function($scope, $routeParams, api, domain) {
			api.ready.then(function() {

				var cnx = domain.getConnection($routeParams.cnx);
				if (!cnx) {
					alert('Connection '+$routeParams.cnx+' is not active');
					$location.path('/');
					return;
				}

				// Pull the components
				var dbName = $routeParams.db;

				// Set up UI hints for this page

				$scope.$root.breadcrumbs = [
					{url: '#/connections/'+cnx.id, text: cnx.label},
					{url: '#/connections/'+cnx.id+'/dbs/'+dbName, text: dbName}
				];
				$scope.$root.sidebarHints = {
					connectionId: cnx.id,
					database: dbName
				};

				$scope.database = {
					name: dbName
				};

				$scope.connection = cnx;
				$scope.$root.pageTitle = 'Query';
				
				$scope.message = 'Enter a query above.';
				$scope.runQuery = function(queryText) {
					$scope.query = api.createQuery($scope.connection, $scope.database.name, queryText, function(e) {
						$timeout(function() {
							var message = 'An unknown error has occurred.';
							if (e.message)
								message = e.message;

							$scope.message = message;
							$scope.$root.globalSpinner = false;
						});
					});
				}

				$scope.query = {
					run: function(text) {
						$scope.runQuery(text);
					}
				};
			});
		}
	});
});

ngm.directive('dbQueryResults', function($templateCache, $mdDialog, rowEditorDialog) {
	return {
		restrict: 'E',
		templateUrl: 'html/datasha/ui/query/dbQueryResults.html',
		scope: {
			query: '=',
			api: '=',
			schemaContext: '=',
			message: '=',
			connection: '=',
			database: '='
		},
		controller: QueryResultsController
	};
});

function QueryResultsController($scope, $timeout, $mdDialog, api, uiGridConstants, quickQueryDialog) {
	$scope.page = {
		current: 1,
		size: 30,
		total: 1
	};

	$scope.loading = true;

	var sortIdentifiers = {};

	$scope.sortChanged = function(grid, sortColumns) {
		var identifier = sortColumns[0].name;

		if (sortIdentifiers[identifier]) {
			identifier = sortIdentifiers[identifier];
		}
		api.orderQuery(
			$scope.query.connection, 
			$scope.query.db, 
			$scope.query.text, 
			identifier, 
			sortColumns[0].sort.direction == uiGridConstants.ASC ? 'ASC' : 'DESC'
		).then(function(result) {
			$scope.query.text = result.query;
			//$scope.refresh();
		});
	};

	$scope.gridOptions = {
		enableGridMenu: true,
		exporterMenuCsv: true,
		useExternalSorting: true,
		onRegisterApi: function(gridApi) {
			$scope.gridApi = gridApi;
			$scope.gridApi.core.on.sortChanged($scope, $scope.sortChanged);
		}
	};

	$scope.refresh = function() {
		if (!$scope.query || !$scope.query.text) {
			$scope.gridOptions.data = [];
			$scope.page.current = 1;
			$scope.loading = false;
			$scope.$root.globalSpinner = false;
			return;
		}

		$scope.query.run = function(text) {

			$scope.page.current = 1;

			var originalQuery = $scope.query.text;
			$scope.query.text = text;

			if (originalQuery == text)
				$scope.refresh();
		}

		$scope.loading = true;

		$scope.query.analyze().then(function(analysis) {
			$scope.analysis = analysis;
		});

		$scope.$root.globalSpinner = true;

		// Sometimes the loading state flips back so fast that 
		// Angular fails to pick it up. Wait until the next available
		// millisecond to continue, allowing the digest cycle to finish
		// before marking loading as finished.
		// This issue was hit with ng-class="{'grid-loading': loading}"
		// causing grids to remain faded out after loading completed.

		$timeout(1).then(function() {
			return $scope.query.fetch($scope.page);
		}).then(function(items) {

			if (!items) {
				$scope.execution = $scope.query.executionStatus;
				$scope.gridOptions.data = [];
				$scope.$root.globalSpinner = false;
				$scope.gridOptions.data = [];
				$scope.message = 'Query executed in 0.0ms. '
						+$scope.execution.rowsAffected+' rows affected';
				return;
			}

			var columns = $scope.query.columns;
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
				cellTemplate: 'html/datasha/ui/query/datagrid/rowActions/rowActions.html',
			});

			sortIdentifiers = {};

			for (var key in $scope.query.columns) {
				var details = $scope.query.columns[key];
				var def = {
					displayName: details.alias? details.alias : key,
					identifier: details.short,
					field: key,
					width: 210,
					cellClass: ''
				};

				sortIdentifiers[key] = details.short;

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
			$scope.$root.globalSpinner = false;


			$scope.rowMoreClicked = function(row, $event) {

				var $gridScope = $scope;

				$mdDialog.show({
					parent: angular.element(document.body),
					targetEvent: $event,
					templateUrl: 'html/datasha/ui/query/datagrid/rowActions/rowActionsPopout.html',

					locals: {
						schema: $scope.schemaContext,
						query: $scope.query
					},

					controller: function($scope, rowEditorDialog, schema, api, query) {

						$scope.query = query;
						$scope.available = {
							delete: false
						};

						// Analyze the query to determine available operations

						$scope.query.getAnalysis().then(function(analysis) {

							// Take that, PMA [we support deletes on multi-table rows]
							$scope.available.delete = analysis.from && analysis.from.length > 0;

						});

						$scope.edit = function($event) {
							return rowEditorDialog.show(
								$gridScope.connection, 
								$gridScope.database, 
								$scope.query, 
								[row], $event 
							).then(function(updateQuery) {
								return api.executeQuery($gridScope.connection, $gridScope.database, updateQuery);
							}).then(function(queryResult) {
								var alert = $mdDialog.alert()
									.title('Updates executed in (0.0ms)')
									.content('Updates executed, '+queryResult.rowsAffected+' rows affected.')
									.ok('OK')

								$gridScope.refresh();

								return $mdDialog.show(alert);
							});
						}

						$scope.delete = function() {
							var pkeys = [];
							var queries = [];

							// todo get the pkey!

							for (var key in $scope.query.columns) {
								var column = $scope.query.columns[key];
								var table = column.column.split(/\./)[0];

								if (!column.isPrimary)
									continue;

								queries.push(
									'DELETE FROM '+table
										+' WHERE '+column.column+' = \''+row[key]+'\''
								);
							}

							var queryPromise = null;

							if (queries.length === 0) {
								// Query contained no primary keys. 
								// If delete was offered to user, 
								// this means we have a single source table

								queryPromise = Promise.resolve().then(function() {
									return $scope.query.getAnalysis();
								}).then(function(analysis) {
									if (analysis.from.length !== 1) {
										alert('Cannot create delete query from multi-table row without primary keys');
										return;
									}

									// Add all column values to the WHERE conditions
									// of our new DELETE query

									var conditions = [];
									for (var key in $scope.query.columns) {
										var column = $scope.query.columns[key];
										var name = column.column.split(/\./g)[1]; 

										conditions.push(
											name +' = \''+row[key].replace(/'/g, '\\\'')+'\''
										);
									}

									return ''+ // <-- because js
										'DELETE FROM '+analysis.from[0].name+' '+"WHERE\n"
										 + '      '+conditions.join("\n  AND ")+"\n"
										 + 'LIMIT 1';
								});

							} else {

								queryPromise = Promise.resolve(queries.join(";\n"));
							}

							// Wait for the query to become available, then show
							// the quick query box for our final SQL.

							queryPromise.then(function(query) {
								quickQueryDialog.show(
									$event,
									$gridScope.connection, 
									$gridScope.database, 
									query, false);
							});
						};

						$scope.cancel = function() {
							$mdDialog.hide();
						}
					}
				});
			};

		}).catch(function() {
			$scope.loading = false;	
			$scope.$root.globalSpinner = false;
		}).then(function() {
			$timeout(function() {
				$scope.loading = false;
			});
		});
	}

	$scope.$watch('query.text', function(nv, ov) {
		if (nv === ov)
			return;

		$scope.refresh();
	});

	$scope.$watch('page.current', function(nv, ov) {
		if (nv === ov)
			return;
		$scope.refresh();
	});

	$scope.refresh();
	$scope.api = {
		refresh: $scope.refresh
	};
}

ngm.directive('dbQueryBox', function() {
	return {
		restrict: 'E',
		templateUrl: 'html/datasha/ui/query/dbQueryBox.html',
		scope: {
			query: '=',
			currentQuery: '=proposedQuery',
			
			run: '&'
		},
		controller: function($scope) {
			
			if ($scope.currentQuery && $scope.query && !$scope.query.text) {
				$scope.editing = true;
			}
			
			$scope.$watch('query.text', function() {
				if (!$scope.query || !$scope.query.text)
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
