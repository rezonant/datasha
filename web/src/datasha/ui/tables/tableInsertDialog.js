
var ngm = angular.module(module.exports = 'datasha.ui.tables.tableInsertDialog', [
	'ngMaterial'
]);
ngm.factory('tableInsertDialog', TableInsertDialogService);
ngm.constant('TABLE_INSERT_DIALOG_TEMPLATE', 'html/datasha/ui/data/insertRows.html');

/**
 * A service to show and interact with the table insert dialog
 */
function TableInsertDialogService($mdDialog, TABLE_INSERT_DIALOG_TEMPLATE) {
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
		 * @returns {Promise} A promise to resolve with the chosen insert query, 
		 *					  or reject if the action is canceled.
		 */
		show: function(connection, database, table, schema, $event) {
			return new Promise(function(resolve, reject) {
				$mdDialog.show({
					parent: angular.element(document.body),
					targetEvent: $event,
					templateUrl: TABLE_INSERT_DIALOG_TEMPLATE,
					locals: {
						table: table,
						schema: schema,
						database: database,
						runQuery: function(query) {
							$mdDialog.hide();
							resolve(query);
						}
					},
					controller: TableInsertDialogController
				}).catch(function(e) {
					reject();
				});
			});
		}
	}
}

/**
 * Controller for the table insert dialog
 */
function TableInsertDialogController($scope, $mdDialog, table, schema, database, runQuery) {
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
				clause += column.value || "";
			else
				clause += "'"+(column.value || "").replace(/'/g, '\\\'')+"'";

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