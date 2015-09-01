<?php

namespace DataBundle;
use Symfony\Component\HttpFoundation\Session\Session;

use AppBundle\Model\ConnectionModel;
use AppBundle\Model\DatabaseModel;
use AppBundle\Model\TableModel;
use AppBundle\Model\ColumnModel;

/**
 * @author liam
 */
class ConnectionService {
	public function __construct(Session $session) {
		$this->session = $session;
	}
	
	/**
	 * @var Session
	 */
	private $session;
	
	/**
	 * Represents the name of the session variable which will hold
	 * the connection store.
	 */
	const CONNECTION_STORE_SESSION_INDEX = 'connections';
	
	/**
	 * @return ConnectionStore
	 */
	private function getStore()
	{
		$store = $this->session->get(self::CONNECTION_STORE_SESSION_INDEX, null);
		if (!$store) {
			$store = new ConnectionStore();
			$this->session->set(self::CONNECTION_STORE_SESSION_INDEX, $store);
		}
		
		return $store;
	}
	
	public function prepareModel(Connection $connection, $key) {
	
		$model = new ConnectionModel($connection->getId(), "{$connection->getUsername()}@{$connection->getHostName()}");
		$model->setKey($key);
		
		$driver = $this->getDriver($connection->getType());
		
		foreach ($driver->getDatabases($connection) as $dbName) {
			$dbModel = new \AppBundle\Model\DatabaseModel($dbName);
			
			foreach ($driver->getTables($connection, $dbName) as $tableName) {
				$tableModel = new \AppBundle\Model\TableModel($tableName);
				
				foreach ($driver->getSchema($connection, $dbName, $tableName) as $column) {
					$columnModel = new \AppBundle\Model\ColumnModel($column->name, $column->type);
					
					$tableModel->addColumn($columnModel);
				}
				
				$dbModel->addTable($tableModel);
			}
			
			$model->addDatabase($dbModel);
		}
		
		// Retrieve list of databases
		
		return $model;	
	}
	
	/**
	 * @param Connection $connection
	 * @param string $username
	 * @return Connection
	 */
	public function getConnection($id)
	{
		return $this->getStore()->get($id);
	}
	
	/**
	 * Retrieve a driver object for the given type
	 * 
	 * @param type $type
	 * @return \DataBundle\MySQLDriver
	 * @throws \Exception
	 */
	public function getDriver($type)
	{
		switch ($type) {
		case 'mysql':
			return new MySQLDriver();
		default:
			throw new \Exception('No driver available for type '.$type);
		}
	}
	
	/**
	 * @param Connection $connection
	 * @param type $query
	 */
	public function query($connection, $db, $query)
	{
		$driver = $this->getDriver($connection->getType());
		return $driver->query($connection, $db, $query);
	}
	
	/**
	 * Establish a new database connection
	 * 
	 * @param string $type
	 * @param string $hostname
	 * @param int $port
	 * @param string $username
	 * @param string $password
	 * @param string $key
	 * @return Connection
	 */
	public function establishConnection($type, $hostname, $port, $username, $password, &$key)
	{
		$key = NULL;
		$connection = Connection::create($type, $hostname, $port, $username, $password, $key);
		$driver = $this->getDriver($type);
		
		// Test the connection
		if (!$driver->testConnection($connection))
			return null;
		
		// Success, build and store the connection
		$store = $this->getStore();
		$store->add($connection);
		
		// Lock (encrypt) the credentials and return the private key
		$connection->lock();
		return $connection;
	}
}
