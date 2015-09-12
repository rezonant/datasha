<?php

namespace DataBundle\Queries;
use DataBundle\Connections\Connection;
use DataBundle\Queries\QueryAnalysis;
use DataBundle\Queries\QuerySource;

/**
 * Provides services related to query execution and analysis.
 *
 * @author liam
 */
class QueryService {
	
	public function __construct($drivers, $connections, $schema) {
		$this->drivers = $drivers;
		$this->connections = $connections;
		$this->schema = $schema;
	}
	
	/**       
	 * @var \DataBundle\Drivers\DriverStore
	 */
	private $drivers;
	
	/**
	 * @var \DataBundle\Connections\ConnectionService
	 */
	private $connections;
	
	/**
	 * @var \DataBundle\Schema\SchemaService
	 */
	private $schema;
	
	/**
	 * Perform a query
	 * 
	 * @param Connection $connection
	 * @param type $query
	 */
	public function query($connection, $db, $query)
	{
		$driver = $this->drivers->getDriver($connection->getType());
		return $driver->query($connection, $db, $query);
	}
	
	/**
	 * Perform a paged query
	 * 
	 * @param Connection $connection
	 * @param type $query
	 */
	public function pagedQuery($connection, $db, $query, $limit, $offset)
	{
		$driver = $this->drivers->getDriver($connection->getType());
		return $driver->pagedQuery($connection, $db, $query, $limit, $offset);
	}
	
	/**
	 * Analyze the given query, producing a semantic representation of the most important elements
	 * as well as related schema information.
	 * 
	 * @param \DataBundle\Connection $connection
	 * @param type $db
	 * @param type $query
	 * @return QueryAnalysis
	 */
	public function analyzeQuery(Connection $connection, $db, $query) {
	
		$driver = $this->drivers->getDriver($connection->getType());
		$analysis = $driver->analyzeQuery($query);
		$model = new QueryAnalysis();
		$model->setValid($analysis->valid);
		
		if (!$analysis->valid)
			return $model;
		
		$selection = array();
		if (isset($analysis->selection)) {
			foreach ($analysis->selection as $select) {
				$selection[] = new QuerySelection($select->column, $select->alias);
			}
		}
		$model->setSelection($selection);
		
		// Fetch the schemas
		
		$froms = array();
		if (isset($analysis->from)) {
			foreach ($analysis->from as $source) {
				$from = new QuerySource;
				$from->setName($source->name);
				$from->setColumns($this->schema->getTableSchema($connection, $db, $source->name));
				$froms[] = $from;
			}
		}
		
		$model->setFrom($froms);
		
		return $model;
	}
	
}
