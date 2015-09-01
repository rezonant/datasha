<?php

namespace DataBundle;

class ConnectionStore {
	public function __construct() {
		
	}
	
	private $connections = array();
	
	public function add(Connection $connection) {
		$this->connections[$connection->getId()] = $connection;
	}
	
	public function remove(Connection $connection) {
		unset($this->connections[$connection->getId()]);
	}
	
	/**
	 * @param string $id
	 * @return Connection
	 */
	public function get($id)
	{
		if (!isset($this->connections[$id]))
			return null;
		
		return $this->connections[$id];
	}
}