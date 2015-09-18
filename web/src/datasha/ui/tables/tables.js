
var ngm = angular.module(module.exports = 'auth.ui.tables', [
	'ngRoute', 
	'ngMaterial', 
	require('../../api'),
	require('../../domain')
]);

ngm.config(function($routeProvider) {
	$routeProvider
		.when('/connections/:cnx/dbs/:db/tables/:table', {
			templateUrl: 'html/datasha/ui/tables/table.html',
			controller: 'TableDetailsController'
		})
	;
});

ngm.controller('TableDetailsController', function ($scope, $routeParams, $location, $mdDialog, quickQueryDialog, domain, api) { 
	
	api.ready.then(function() {

		var cnx = domain.getConnection($routeParams.cnx);
		if (!cnx) {
			alert('Connection '+$routeParams.cnx+' is not active');
			$location.path('/');
			return;
		}
		
		// Pull the components
		var dbName = $routeParams.db;
		var tableName = $routeParams.table;

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
		$scope.$root.pageTitle = tableName;
			
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
				//$scope.$digest();
			});
			
		}).catch(function(err) {
			alert('Error getting table '+tableName+' from db '+dbName+' on connection '+cnx.id);
			$location.path('/');
		});

		$scope.quickQuery = function($event) {
		
			quickQueryDialog.show($event, $scope.connection, $scope.database, 
								  "SELECT 'enjoy' as 'hello', 'your' as 'world', 'stay' as 'please'", 
								  false);
		}

		$scope.showSchema = function($event) {
			$mdDialog.show({
				parent: angular.element(document.body),
				targetEvent: $event,
				templateUrl: 'html/datasha/ui/tables/tableSchema.html',
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
				templateUrl: 'html/datasha/ui/data/insertRows.html',
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
				templateUrl: 'html/datasha/ui/tables/tableSearch.html',
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
	});
});
