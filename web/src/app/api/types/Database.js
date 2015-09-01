
function Database(name) {
	this.name = name;
}

module.exports = Database;

Database.prototype.getPagedQuery = function(queryText, page) {
	
	if (!page)
		return queryText;
	
	if (!/^select /i.test(queryText))
		return queryText;
	
	var offset = (page.current - 1)*page.size;
	var limit = page.size;
	
	return 'SELECT * FROM ('+queryText+') x LIMIT '+limit+' OFFSET '+offset;
};

Database.prototype.getCountQuery = function(queryText) {
	return 'SELECT COUNT(*) `count` FROM ('+queryText+') x';
};

Database.prototype.getQueryForAll = function() {
	return 'SELECT * FROM `'+this.name+'`';
}

Database.prototype.getQueryForAll = function() {
	return 'SELECT * FROM `'+this.name+'`';
}

Database.prototype.quote = function(value) {
	return "'"+value.replace(/'/g, '\\\'')+"'";
}

Database.prototype.getQueryForCriteria = function(criteria) {
	var parts = [];
	
	for (var fieldName in criteria) {
		parts.push('`'+fieldName+'` = '+this.quote(criteria[fieldName]));
	}
	
	return "SELECT * FROM `"+this.name+"` WHERE "+parts.join(" AND ");
}