
var ngm = angular.module(module.exports = 'datasha.ui.data.rowEditorDialog', ['ngMaterial']);

/**
 * Row Editor dialog service
 */
ngm.factory('rowEditorDialog', function($mdDialog) {
	return {
		show: function(connection, database, sourceQuery, rows, $event) {
			return new Promise(function(resolve, reject) {
				$mdDialog.show({
					parent: angular.element(document.body),
					targetEvent: $event,
					templateUrl: 'html/datasha/ui/data/rowEditorDialog.html', 

					locals: {
						database: database,
						connection: connection,
						rows: rows,
						query: sourceQuery,
						resolve: resolve,
						reject: reject
					},

					controller: RowEditorController
				});	
			});
		}
	};
});

/**
 * Row editor controller!
 */
function RowEditorController($scope, $mdDialog, api, database, connection, query, rows, resolve, reject) {

	$scope.db = database;
	$scope.originalQuery = query;
	
	query.getAnalysis().then(function(analysis) {
		if (analysis.from.length < 1)
			return;

		$scope.schema = analysis.from[0].columns;

		$scope.table = {
			name: analysis.from[0].name
		};
	}).then(function() {
		$scope.rows = [];
		var columnGroups = computeColumnGroups($scope.originalQuery);
		rows.forEach(function(dataItem) {
			var dataItem = angular.copy(dataItem);
			
			createRowsFromData($scope.originalQuery, columnGroups, dataItem).forEach(function(row) {
				$scope.rows.push(row);
			});
		});
	});

	$scope.removeRow = function(index) {
		$scope.rows.splice(index, 1);
	};
	
	/**
	 * User cancels the dialog
	 */
	$scope.cancel = function() {
		$mdDialog.hide();
	}

	/**
	 * User activates preview mode
	 */
	$scope.preview = function() {
		$scope.previewMode = true;
		$scope.previewQuery = generateQuery($scope.rows);
	}

	/**
	 * User hits OK 
	 */
	$scope.edit = function() {
		resolve(generateQuery($scope.rows));
	};
}

/**
 * Generate an update query for the given row
 */
function generateRowQuery(row, index) {
	var setClauses = [], whereClauses = [];
	var tableName = row.table;
	var hasPrimaryKey = false;
	
	row.columns.forEach(function(column) {
		if (!column.isPrimary)
			return;
		
		hasPrimaryKey = true;
		whereClauses.push(
				'`'+column.name+'` = '
			+		'\''+row.originalValues[column.field].replace(/'/g, '\\\'')+'\''
		);

	});

	if (!hasPrimaryKey) {
		row.columns.forEach(function(column) {
			if (!column.isPrimary)
				return;

			hasPrimaryKey = true;
			whereClauses.push(
					'`'+column.name+'` = '
				+		'\''+row.originalValues[column.field].replace(/'/g, '\\\'')+'\''
			);

		});
	}

	// Resolve the SET and WHERE clauses
	// needed for this UPDATE query

	var spec = resolveSpec(row);
	spec.forEach(function(column) {

		var clause = '`'+column.name+'` = ';

		if (/^\d+$/g.test( column.value ))
			clause += column.value;
		else
			clause += "'"+column.value.replace(/'/g, '\\\'')+"'";

		setClauses.push(clause);
	});

	if (setClauses.length == 0) {
		return "" // <-- because js
			+ "-- "+row.name+"\n"
			+ "--   (No changes)"
		;
	}
	
	return "" // <-- because js
		+ "-- "+row.name+"\n"
		+ "UPDATE `"+tableName+"` SET\n"
		+ "     "+setClauses.join(",\n     ")+"\n"
		+ "WHERE\n"
		+ "     "+whereClauses.join("\n AND ")
		+ (!hasPrimaryKey? ' LIMIT 1' : '')
	;		
};

/**
 * Create one or more row objects from the given data
 */
function createRowsFromData(originalQuery, columnGroups, item) {
	var rows = [];
	
	for (var key in columnGroups) {
		var parts = key.split(/ /g);
		var table = parts[0], alias = parts[1];
		var row = {
			columns: columnGroups[key],
			values: item,
			originalValues: angular.copy(item),
			table: table,
			tableAlias: alias,
			name: 'Row in '+table+(alias? ' ('+alias+')' : '')
		};
		
		row.columns.forEach(function(column) {
			if (!column.isPrimary)
				return;
			
			row.name = originalQuery.db.name+"."+row.table+" ["+column.name+" = "+item[column.field]+"]";
			return false;
		});
		
		rows.push(row);
	}

	return rows;
}

function computeColumnGroups(originalQuery) {
	var groups = {};
	for (var key in originalQuery.columns) {
		var meta = angular.copy(originalQuery.columns[key]);
		var name = meta.column.split(/\./g)[1];
		var tableName = meta.column.split(/\./g)[0];
		var aliasName = meta.short.split(/\./g)[0];
		var groupId = tableName+' '+aliasName;
		
		meta.field = key;
		meta.name = meta.column.split(/\./g)[1];
		meta.editable = !meta.isPrimary;
		
		// Push this column into the table group
		if (!groups[groupId])
			groups[groupId] = [];
		groups[groupId].push(meta);
	}
	
	return groups;
}

/**
 * Generate a compound query which will update all of the given rows within the database.
 */
function generateQuery(rows) {
	var queries = [];
	rows.forEach(function(row, index) {
		queries.push(generateRowQuery(row, index+1));
	});

	return queries.join(";\n\n");
}

/**
 * Resolve an update spec for the given set of columns
 */
function resolveSpec(row) {

	var searchSpec = [];
	row.columns.forEach(function(column) {
		if (!row.selectedColumns || !row.selectedColumns[column.field])
			return;
		
		searchSpec.push({
			name: column.name,
			value: row.values[column.field]
		});
	});

	return searchSpec;
};
