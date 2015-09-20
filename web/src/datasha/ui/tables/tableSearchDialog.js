
var ngm = angular.module(module.exports = 'datasha.ui.tables.tableSearchDialog', ['ngMaterial']);

ngm.factory('tableSearchDialog', TableSearchDialogService);
ngm.constant('TABLE_SEARCH_DIALOG_TEMPLATE', 'html/datasha/ui/tables/tableSearch.html');

/**
 * Service to interact with the table search dialog.
 */
function TableSearchDialogService($mdDialog, TABLE_SEARCH_DIALOG_TEMPLATE) {
	return {
		/**
		 * Show the table search dialog.
		 * 
		 * @param {} connection The server connection
		 * @param {} database The subject database 
		 * @param {} table The subject table
		 * @param {} schema The schema of said table
		 * @param {} $event The Angular event used to hint the positioning of the dialog
		 * 
		 * @returns {Promise} A promise to resolve with the chosen search query, 
		 *					  or reject if the action is canceled.
		 */
		show: function(connection, database, table, schema, $event) {
			return new Promise(function(resolve, reject) {
				$mdDialog.show({
					parent: angular.element(document.body),
					targetEvent: $event,
					templateUrl: TABLE_SEARCH_DIALOG_TEMPLATE,
					locals: {
						table: table,
						schema: schema,
						database: database,
						runQuery: function(query) {
							$mdDialog.hide();
							resolve(query);
						}
					},
					controller: TableSearchDialogController
				}).catch(function(e) {
					reject();
				});
			});
		}
	}
}

/**
 * Controller for the table search dialog
 */
function TableSearchDialogController($scope, $mdDialog, table, schema, database, runQuery) {

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