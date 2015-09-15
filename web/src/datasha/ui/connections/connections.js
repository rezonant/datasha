var ngm = angular.module(module.exports = 'datasha.ui.connections', [
	'ngRoute', 
	'ngMaterial',
	require('../../api'),
	require('../../domain'),
	require('./connectDialog.js')
]);

ngm.config(function($routeProvider) {
	$routeProvider
		.when('/connections', {
			templateUrl: 'html/datasha/ui/connections/connections.html',
			controller: 'ConnectionsListController'
		})
		.when('/connections/:id', {
			templateUrl: 'html/datasha/ui/connections/connection.html',
			controller: 'ConnectionDetailsController'
		})
	;
});
ngm.controller('ConnectionsListController', function ($scope, $timeout, $mdSidenav, $mdUtil) {
	
	$scope.$root.breadcrumbs = [];
	$scope.$root.pageTitle = 'Connections';
});

ngm.controller('ConnectionDetailsController', function ($scope, $location, $routeParams, domain, api) {
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
				cellTemplate: 'html/datasha/ui/databases/dbListName.html'
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
