
var ngm = angular.module(module.exports = 'datasha.api', []);
var Database = require('./types/Database.js');

ngm.factory('api', function($rootScope, $http) {
	var endpoint = appConfig.apiEndpoint;
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
			return $http.post(endpoint+'/connections/'+cnxId+'/schema/dbs/'+db+'/tables/'+table+'/columns', {
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
		
		analyzeQuery: function(cnx, dbName, query) {
			return this.post('/connections/'+cnx.id+'/dbs/'+dbName+'/query/analyze', {
				query: query,
				key: cnx.key
			}).then(function(result) {
				return result.data;
			});
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
				analysis: null,
				
				getAnalysis: function() {
					if (this.analysis)
						return Promise.resolve(this.analysis);
					var self = this;
					return api.analyzeQuery(this.connection, dbName, this.text).then(function(analysis) {
						self.analysis = analysis;
						return analysis;
					});
				},
				
				analyze: function() {
					this.analysis = null;
					return this.getAnalysis();
				},
				
				count: function() {
					if (!/^select /i.test(this.text))
						return Promise.resolve(0);
					var countQuery = db.getCountQuery(this.text);
					var self = this;
					
					return api
						.executeQuery(this.connection, this.db, countQuery)
						.then(function(data) {
							var items = data.results;
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
					
					if (!this.text) {
						this.columns = [];
						page.total = 0;
						return array();
					}
					
					var self = this;
					var query = db.getPagedQuery(this.text, page);
					var offset = (page.current - 1)*page.size;
					var limit = page.size;
					
					var result = 
						api.executePagedQuery(this.connection, this.db, this.text, limit, offset)
							.then(function(r) {
								
								if (r.executed) {
									self.executionStatus = r;
									return;
								}
								
								page.total = r.total;
								self.columns = r.columns;
								return r.results;
							})
							.catch(function(e) {
								self.onError(e);
								throw e;
							});
							
					return result;
				}
			}
		},

		orderQuery: function(cnx, db, query, column, dir) {
			return $http.post(endpoint+'/connections/'+cnx.id+'/dbs/'+db.name+'/query/order', {
				query: query,
				column: column,
				direction: dir,
				key: cnx.key
			}).then(function(results) {
				return results.data;
			});
		},

		executePagedQuery: function(cnx, db, queryText, limit, offset) {
			var url = endpoint
				+'/connections/'+cnx.id
				+'/dbs/'+db.name
				+'/query/paged';
			
			return $http.post(url, {
				query: queryText,
				key: cnx.key,
				limit: limit,
				offset: offset
			}).then(function(result) {
				return result.data;
			}).catch(function(result) {
				throw result.data;
			});
			
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
			}).catch(function(err) {
				throw { message: err.data.message };
			}); 
		},

		closeConnection: function(cnx) {
			var url = endpoint+'/connections/'+cnx.id;
			return $http.delete(url);
		}
	}
	
});
