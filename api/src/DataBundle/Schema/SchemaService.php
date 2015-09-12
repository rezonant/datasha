<?php

namespace DataBundle\Schema;

use DataBundle\Connections\Connection;
use DataBundle\Schema\Database;
use DataBundle\Schema\Column;
use DataBundle\Schema\TableDetails;

/**
 * Handles operations related to the schemas within a Connection
 * 
 * @author liam
 */
class SchemaService {
	
	public function __construct($drivers, $connections) {
		$this->drivers = $drivers;
		$this->connections = $connections;
	}
	
	/**
	 * @var DriverStore
	 */
	private $drivers;
	
	/**
	 * @var ConnectionService
	 */
	private $connections;
	
	/**
	 * Produce a Column for the given DatabaseDriver-layer model representation.
	 * @param type $column
	 * @return Column
	 */
	private function modelForColumn($column)
	{
		$columnModel = new Column($column->name, $column->type);
		$columnModel->setComment($column->comment);
		$columnModel->setEncoding($column->encoding);
		$columnModel->setAutoIncrement($column->auto);
		$columnModel->setDefault($column->default);
		$columnModel->setNullable($column->nullable);
		$columnModel->setIsPrimary($column->isPrimary);
		$columnModel->setIsIndexed($column->isIndexed);

		return $columnModel;
	}
	
	public function getDatabases(Connection $connection)
	{
		$driver = $this->drivers->getDriver($connection->getType());
		$dbs = array();
		
		foreach ($driver->getDatabases($connection) as $dbName) {
			$status = $driver->getDatabaseStatus($connection, $dbName);
			$model = new Database($dbName);
			$model->setSize($status->size);
			$model->setTableCount($status->tableCount);
			$dbs[] = $model;
		}
		
		return $dbs;
	}
	
	/**
	 * Retrieve a detailed model of the given table within the given database,
	 * including size and status information along with the table schema.
	 * 
	 * @param \DataBundle\Connection $connection
	 * @param string $db
	 * @param string $tableName
	 * @return TableDetails The resulting table model
	 */
	public function getTableDetails(Connection $connection, $db, $tableName) {
		
		$driver = $this->drivers->getDriver($connection->getType());
		$status = $driver->getTableStatus($connection, $db, $tableName);
		
		$tableModel = new TableDetails($tableName);
		$tableModel->setRows($status->rows);
		$tableModel->setSize($status->size);
		$tableModel->setIndexSize($status->indexLength);
		$tableModel->setDataSize($status->dataLength);
		$tableModel->setEngine($status->engine);
		$tableModel->setVersion($status->version);
		$tableModel->setFormat($status->format);
		$tableModel->setAverageRowSize($status->avgRowLength);
		$tableModel->setAutoIncrement($status->autoIncrement);
		$tableModel->setCreated($status->created);
		$tableModel->setUpdated($status->updated);
		$tableModel->setChecked($status->checked);
		$tableModel->setChecksum($status->checksum);
		$tableModel->setComment($status->comment);
		$tableModel->setColumns($this->getTableSchema($connection, $db, $tableName));

		return $tableModel;
	}
	
	/**
	 * Retrieve an array of TableDetails objects which contain both schema and status/details
	 * info about each table.
	 * 
	 * @param \DataBundle\Connection $connection
	 * @param string $db
	 * @return TableDetails[]
	 */
	public function getTablesWithDetails(Connection $connection, $db) {
	
		$driver = $this->drivers->getDriver($connection->getType());
		$dbModel = new Database($db);
		foreach ($driver->getTables($connection, $db) as $tableName)
			$dbModel->addTable($this->getTableDetails($connection, $db, $tableName));

		return $dbModel->getTables();	
	}
	
	/**
	 * Retrieve a set of Columns representing the schema of the given table.
	 * 
	 * @param \DataBundle\Connection $connection
	 * @param string $db
	 * @param string $tableName
	 * @return Column[]
	 */
	public function getTableSchema(Connection $connection, $db, $tableName) {
	
		$driver = $this->drivers->getDriver($connection->getType());
		$columns = array();
		
		foreach ($driver->getSchema($connection, $db, $tableName) as $column) {
			$columnModel = $this->modelForColumn($column);
			$columns[] = $columnModel;
		}
		
		return $columns;	
	}
	
	
}
