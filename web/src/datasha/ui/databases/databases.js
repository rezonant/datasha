
var ngm = angular.module(module.exports = 'auth.ui.databases', [
	'ngRoute', 
	'ngMaterial', 
	'ui.grid',
	'ui.grid.pinning',
	'ui.grid.selection',
	
	require('../../api'),
	require('../../domain')
]);

ngm.config(function($routeProvider) {
	$routeProvider
		.when('/connections/:cnx/dbs/:db', {
			templateUrl: '../src/datasha/ui/databases/db.html',
			controller: 'DatabaseDetailsController'
		})
	;
});

ngm.controller('DatabaseDetailsController', function ($scope, $routeParams, $location, $templateCache, domain, api) {
	
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
				cellTemplate: '../src/datasha/ui/tables/tableListName.html'
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
