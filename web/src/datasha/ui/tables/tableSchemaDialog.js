
var ngm = angular.module(module.exports = 'datasha.ui.tables.tableSchemaDialog', [
	'ngMaterial'
]);
ngm.constant('TABLE_SCHEMA_DIALOG_TEMPLATE', 'html/datasha/ui/tables/tableSchema.html');
ngm.factory('tableSchemaDialog', TableSchemaDialogService);

/**
 * Service to interact with the table schema dialog.
 */
function TableSchemaDialogService($mdDialog, TABLE_SCHEMA_DIALOG_TEMPLATE) {
	return {
		/**
		 * Show the table insert dialog.
		 * 
		 * @param {} connection The server connection
		 * @param {} database The subject database 
		 * @param {} table The subject table
		 * @param {} schema The schema of said table
		 * @param {} $event The Angular event used to hint the positioning of the dialog
		 * 
		 */
		show: function(connection, database, table, schema, $event) {
			$mdDialog.show({
				parent: angular.element(document.body),
				targetEvent: $event,
				templateUrl: TABLE_SCHEMA_DIALOG_TEMPLATE,
				locals: {
					connection: connection,
					table: table,
					schema: schema,
					database: database
				},
				controller: TableSchemaDialogController
			});
		}
	};
}

/**
 * Controller for the Table Schema dialog
 */
function TableSchemaDialogController($scope, $mdDialog, tableSchemaDialog, connection, table, schema, database) {
	$scope.db = database;
	$scope.table = table;
	$scope.schema = schema;
	
	$scope.drop = function(column) {
		var dialog = $mdDialog.confirm()
			.title('Drop column '+table.name+'.'+column.name+' (database '+database.name+')?')
			.content('Are you sure you wish to drop this column?')
			.ok('Remove')
			.cancel('Cancel')
		
		$mdDialog.show(dialog)
			.then(function() {
				alert('would drop '+column.name);
				tableSchemaDialog.show(connection, database, table, schema);
			})
			.catch(function(e) {
				tableSchemaDialog.show(connection, database, table, schema);
			})
		;
	};
	
	$scope.showEdit = function(column) {
		alert('edit '+column.name);
	};
	
	$scope.showAddIndex = function(column) {
		alert('index '+column.name);
	};
	
	$scope.cancel = function() {
		$mdDialog.hide();
	};
}
