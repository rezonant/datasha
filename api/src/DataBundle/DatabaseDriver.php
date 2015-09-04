<?php

namespace DataBundle;

/**
 * @author liam
 */
abstract class DatabaseDriver {
	
	public abstract function getId();
	public abstract function getName();
	public abstract function testConnection(Connection $connection);
	public abstract function query(Connection $connection, $db, $query);
	
	public abstract function getDatabases(Connection $connection);
	public abstract function getTables(Connection $connection, $db);
	public abstract function getSchema(Connection $connection, $db, $table);
	
	public abstract function getTableStatus(Connection $connection, $db, $table);
	public abstract function getDatabaseStatus(Connection $connection, $db);
}
