var module = angular.module('app.domain', []);

module.factory('domain', function($rootScope) {
	return {
		getConnection: function(id) {
			var cnx = null;
			var connections = $rootScope.activeConnections;
			for (var i = 0, max = connections.length; i < max; ++i) {
				var cnxCandidate = connections[i];

				if (cnxCandidate.id != id)
					continue;

				cnx = cnxCandidate;
				break;
			}
	
			return cnx;
		},
		
		
		getDatabase: function(cnx, id) {
			var db = null;
			var dbs = cnx.databases;
			for (var i = 0, max = dbs.length; i < max; ++i) {
				var dbCandidate = dbs[i];

				if (dbCandidate.name !== id)
					continue;

				db = dbCandidate;
				break;
			}
	
			return db;
		},
		
		getTable: function(db, id) {
			var table = null;
			var tables = db.tables;
			
			for (var i = 0, max = tables.length; i < max; ++i) {
				var tableCandidate = tables[i];

				if (tableCandidate.name != id)
					continue;

				table = tableCandidate;
				break;
			}
	
			return table;
		},
	}
});
