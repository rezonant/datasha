
var module = angular.module('app.api', []);
var Database = require('./types/Database.js');

module.factory('api', function($rootScope, $http) {
	var endpoint = "../../api/dev.php"; // appConfig.apiEndpoint;
	var resolveReady, rejectReady;
	
	return {
		ready: new Promise(function(resolve, reject) {
			resolveReady = resolve;
			rejectReady = reject;
		}),
		
		getTables: function(cnxId, db, key) {
			
			var self = this;
			return $http.post(endpoint+'/connections/'+cnxId+'/schema/dbs/'+db+'/tables', {
				key: key
			}).then(function(result) {
				return result.data;
			});
		},
		
		getDatabases: function(id, key) {
			
			var self = this;
			return $http.post(endpoint+'/connections/'+id+'/schema/dbs', {
				key: key
			}).then(function(result) {
				return result.data;
			});
		},
		
		getTableSchema: function(cnxId, db, table, key) {
			
			var self = this;
			return $http.post(endpoint+'/connections/'+cnxId+'/schema/dbs/'+db+'/tables/'+table, {
				key: key
			}).then(function(result) {
				return result.data;
			});
		},
		
		setReady: function() {
			resolveReady();
		},
		
		initialize: function() {
			// TODO
		},
		
		getConnection: function(id, key) {
			var self = this;
			return $http.post(endpoint+'/connections/'+id, {
				key: key
			}).then(function(result) {
				var connection = result.data;
				self.initializeConnection(connection);
				
				return connection;
			});
		},
		
		deleteConnection: function(id) {
			return this.delete('/connections/'+id);
		},
		
		get: function(url) {
			return $http.get(endpoint+url);
		},
		
		post: function(url, data) {
			return $http.post(endpoint+url, data);
		},
		
		delete: function(url, data) {
			return $http.delete(endpoint+url, data);
		},
		
		put: function(url, data) {
			return $http.put(endpoint+url, data);
		},
		
		createQuery: function(cnx, dbName, queryText, errorFunc) {
			var api = this;
			var db = new Database(dbName);
			
			return {
				text: queryText,
				connection: cnx,
				db: db,
				api: api,
				onError: errorFunc,
				
				count: function() {
					if (!/^select /i.test(this.text))
						return Promise.resolve(0);
					var countQuery = db.getCountQuery(this.text);
					var self = this;
					
					return api
						.executeQuery(this.connection, this.db, countQuery)
						.then(function(items) {
							if (items.length == 0) {
								return;
							}
							
							var counter = items[0];
							return counter.count;
						})
						.catch(function(e) {
							return 0;
						});
				},
				
				fetch: function(page) {
					var self = this;
					var query = db.getPagedQuery(this.text, page);
					var result = 
						api.executeQuery(this.connection, this.db, query)
							.then(function(r) {
								return r;
							})
							.catch(function(e) {
								self.onError(e);
								throw e;
							});
							
					return result;
				}
			}
		},

		executeQuery: function(cnx, db, queryText) {
			var url = endpoint
				+'/connections/'+cnx.id
				+'/dbs/'+db.name
				+'/query';
		
			return $http.post(url, {
				query: queryText,
				key: cnx.key
			}).then(function(result) {
				return result.data;
			}).catch(function(result) {
				throw result.data;
			});
		},

		initializeConnection: function(connection) {
			return connection;
		},

		establishConnection: function(type, host, port, user, pass) {
			var url = endpoint+'/connections';
			var self = this;
			
			return $http.put(url, {
				type: type,
				host: host,
				port: port,
				username: user,
				password: pass
			}).then(function(result) {
			
				var connection = result.data;
				return self.initializeConnection(connection);
			});
		},

		closeConnection: function(cnx) {
			var url = endpoint+'/connections/'+cnx.id;
			return $http.delete(url);
		}
	}
	
});
