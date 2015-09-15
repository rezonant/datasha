
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
	require('../../domain')
]);

ngm.directive('dbQueryResults', function($templateCache, $mdDialog) {
	return {
		restrict: 'E',
		templateUrl: '../src/datasha/ui/query/dbQueryResults.html',
		scope: {
			query: '=',
			api: '=',
			schemaContext: '=',
			message: '=',
			connection: '=',
			database: '='
		},
		controller: function($scope, api, uiGridConstants) {
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
					$scope.query.text = text;
					//$scope.refresh();
				}
				
				$scope.loading = true;
				
				$scope.query.analyze().then(function(analysis) {
					$scope.analysis = analysis;
				});
				
				$scope.$root.globalSpinner = true;
				$scope.query.fetch($scope.page).then(function(items) {
					
					var columns = $scope.query.columns;
					
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
						cellTemplate: '../src/datasha/ui/query/datagrid/rowActions/rowActions.html',
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
					$scope.loading = false;
					$scope.$root.globalSpinner = false;
					
					
					$scope.rowMoreClicked = function(row, $event) {
						
						var $gridScope = $scope;
						
						$mdDialog.show({
							parent: angular.element(document.body),
							targetEvent: $event,
							templateUrl: '../src/datasha/ui/query/datagrid/rowActions/rowActionsPopout.html',
							
							locals: {
								schema: $scope.schemaContext,
								query: $scope.query
							},
							
							controller: function($scope, schema, api, query) {
								
								$scope.query = query;
								$scope.available = {
									delete: false
								};
								
								// Analyze the query to determine available operations
								
								$scope.query.getAnalysis().then(function(analysis) {
									
									// Take that, PMA [we support deletes on multi-table rows]
									$scope.available.delete = analysis.from && analysis.from.length > 0;
									
								});
								
								$scope.edit = function() {
									$mdDialog.hide();
									$mdDialog.show({
										parent: angular.element(document.body),
										targetEvent: $event,
										templateUrl: '../src/datasha/ui/data/editRows.html', 

										locals: {
											table: $scope.table,
											schema: $scope.schema,
											database: $gridScope.database,
											connection: $gridScope.connection,
											query: $scope.query,
											row: row
										},

										controller: function($scope, api, database, connection, row, query) {
											$scope.cancel = function() {
												$mdDialog.hide();
											}

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

											var generateRowQuery = function() {
												var setClauses = [], whereClauses = [];
												
												// Resolve the SET and WHERE clauses
												// needed for this UPDATE query
												
												var spec = resolveSpec(row.columns);
												spec.forEach(function(column) {
													
													var clause = '`'+column.name+'` = ';

													if (/^\d+$/g.test( column.value ))
														clause += column.value;
													else
														clause += "'"+column.value.replace(/'/g, '\\\'')+"'";

													setClauses.push(clause);
												});

												return "" // <-- because js
													+ "-- Row "+index+"\n"
													+ "UPDATE `"+$scope.table.name+"` SET\n"
													+ "  "+setClauses.join(",\n  ")+"\n"
													+ "WHERE\n"
													+ "  "+whereClauses.join(",\n  ")
												;		
											};
											
											var generateQuery = function() {
												var queries = [];
												$scope.rows.forEach(function(row, index) {
													queries.push(generateRowQuery(row, index+1));
												});

												return queries.join(";\n\n");
											};

											$scope.preview = function() {
												$scope.previewMode = true;
												$scope.previewQuery = generateQuery();
											}
											
											$scope.db = database;
											$scope.originalQuery = query;
											
											var makeRowPrototype = function(item) {
												var row = {
													columns: angular.copy($scope.schema)
												};
											
												for (var key in $scope.originalQuery.columns) {
													var meta = $scope.originalQuery.columns[key];
													var name = meta.column.split(/\./g)[1];
													
													if (meta.isPrimary) {
														row.name = "Row ["+name+" = "+item[key]+"]";
													}
													
													row.columns.forEach(function(col) {
														if (col.name != name)
															return;
														
														col.editable = !meta.isPrimary;
														col.value = item[key];
														return false;
													});
												}
												
												return row;
											};
											
											query.getAnalysis().then(function(analysis) {
												if (analysis.from.length < 1)
													return;
												
												$scope.schema = analysis.from[0].columns;
												
												$scope.table = {
													name: analysis.from[0].name
												};
											}).then(function() {
												$scope.rows = [makeRowPrototype(row)];	
											});
											
											$scope.edit = function() {
												alert('Not yet implemented');
											};

										}
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
										$mdDialog.show({
											parent: angular.element(document.body),
											targetEvent: $event,
											templateUrl: '../src/datasha/ui/query/quickQueryDialog.html',

											locals: {
												table: $scope.table,
												schema: $scope.schema,
												database: $gridScope.database,
												connection: $gridScope.connection
											},

											controller: function($scope, api, database, connection) {
												$scope.cancel = function() {
													$mdDialog.hide();
												}

												$scope.database = database;
												$scope.proposedQuery = query; 

												$scope.message = 'Are you sure you wish to delete the following row(s)?';
												$scope.query = api.createQuery(connection, database.name, '', function(e) {
													var message = 'An unknown error has occurred.';
													if (e.message)
														message = e.message;

													$scope.message = message;
													$scope.$root.globalSpinner = false;
													//$scope.$digest();
												});

											}
										});
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
	};
});

ngm.directive('dbQueryBox', function() {
	return {
		restrict: 'E',
		templateUrl: '../src/datasha/ui/query/dbQueryBox.html',
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
