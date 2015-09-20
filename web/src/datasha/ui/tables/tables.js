
var ngm = angular.module(module.exports = 'auth.ui.tables', [
	'ngRoute', 
	'ngMaterial',  
	require('../../api'),
	require('../../domain'),
	
	require('../query/quickQueryDialog'),
	
	require('./tableSchemaDialog'),
	require('./tableSearchDialog'),
	require('./tableInsertDialog'),
]);

ngm.config(Router);
ngm.controller('TableDetailsController', TableDetailsController);

function Router($routeProvider) {
	$routeProvider
		.when('/connections/:cnx/dbs/:db/tables/:table', {
			templateUrl: 'html/datasha/ui/tables/table.html',
			controller: 'TableDetailsController'
		})
	;
}

function TableDetailsController($scope, $routeParams, $location, 
								domain, api, $mdDialog, 
								quickQueryDialog, tableSchemaDialog, 
								tableSearchDialog, tableInsertDialog) 
{
	
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
			var sampleQuery = "SELECT 'enjoy' as 'hello', 'your' as 'world', 'stay' as 'please'";
			quickQueryDialog
				.show($event, $scope.connection, 
					  $scope.database, sampleQuery, false);
		}

		$scope.showSchema = function($event) {
			tableSchemaDialog
				.show($scope.connection, { name: dbName }, 
					  $scope.table, $scope.schema);
		};
		
		$scope.showInsert = function($event) {
			tableInsertDialog
				.show($scope.connection, { name: dbName }, 
					  $scope.table, $scope.schema, $event)
				.then(function(query) { 
					$scope.query.text = query;
				})
		}
		
		$scope.showSearch = function($event) {
			tableSearchDialog
				.show($scope.connection, {name: dbName}, 
					  $scope.table, $scope.schema, $event)
				.then(function(query) { 
					$scope.query.text = query;
				});
		};
	});
}
