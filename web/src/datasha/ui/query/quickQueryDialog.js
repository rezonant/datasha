
var ngm = angular.module(module.exports = 'datasha.ui.query.quickQueryDialog', ['ngMaterial']);

ngm.factory('quickQueryDialog', function($mdDialog) {
	return {
		show: function($event, cnx, database, initialQuery, runOnLoad) {
			$mdDialog.show({
				parent: angular.element(document.body),
				targetEvent: $event,
				templateUrl: 'html/datasha/ui/query/quickQueryDialog.html',
				

				locals: {
					connection: cnx,
					database: database,
					initialQuery: initialQuery,
					runOnLoad: runOnLoad
				},

				controller: QuickQueryDialogController
			});	
		}
	};
});

function QuickQueryDialogController($scope, $mdDialog, api, connection, database, initialQuery, runOnLoad) {
	$scope.cancel = function() {
		$mdDialog.hide();
	}

	$scope.proposedQuery = initialQuery;
	$scope.runQuery = function(queryText) {
		$scope.query = api.createQuery(connection, database.name, queryText, function(e) {
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
	
	if (runOnLoad) {
		$scope.runQuery(initialQuery);
	}
	
}

