<?php

namespace DataBundle;

/**
 * DatabaseDriver for MySQL connections using MySQLi.
 * @author liam
 */
class MySQLDriver extends DatabaseDriver {
	
	public function getId() {
		return 'mysql';
	}

	public function getName() {
		return 'MySQL';
	}

	/**
	 * @param Connection $connection
	 * @param string $db
	 * @return \mysqli
	 */
	private function establish($connection, $db)
	{
		return new \mysqli(
			$connection->getHostName(), 
			$connection->getUsername(), 
			$connection->getPassword(), 
			$db,
			$connection->getPort()? $connection->getPort() : 3306
		);
	}
	
	public function query(Connection $connection, $db, $query) {
		$conn = $this->establish($connection, $db);
		
		$result = $conn->query($query);
		
		if ($result === false) {
			throw new \Exception('MySQL Error: '.$conn->error);
		}
		
		if ($result === true) {
			return (object)array(
				'executed' => true,
				'rowsAffected' => $conn->affected_rows
			);
			return $result;
		}
		
		// Results
		
		$array = array();
		foreach ($result as $row) {
			$array[] = (object)$row;
		}
		
		return $array;
	}

	public function getSchema(Connection $connection, $db, $table) {
		$rows = $this->query($connection, $db, 'DESCRIBE `'.$table.'`');
		$columns = array();
		
		foreach ($rows as $row) {
			
			$row = (array)$row;
			
			$columns[] = (object)array(
				'name' => $row['Field'],
				'type' => $row['Type'],
				'nullable' => $row['Null'] == 'YES',
				'default' => $row['Default'],
				'auto' => strpos($row['Extra'], 'auto_increment')
			);
		}
		
		return $columns;
	}
	
	public function getDatabases(Connection $connection) {
		$rows = $this->query($connection, '', 'SHOW DATABASES');
		$dbs = array();
		
		foreach ($rows as $row) {
			$values = array_values((array)$row);
			$dbs[] = $values[0];
		}
		
		return $dbs;
	}
	
	public function quote($data)
	{
		return '\''.str_replace('\'', '\\\'', $data).'\'';
	}
	
	public function getTables(Connection $connection, $db) {
		$rows = $this->query($connection, 'information_schema', 
				'SELECT * FROM `tables` WHERE `table_schema` = '.$this->quote($db));
		$dbs = array();
		
		foreach ($rows as $row) {
			$dbs[] = $row->TABLE_NAME;
		}
		
		return $dbs;
	}
	
	public function testConnection(Connection $connection) {
		
		try {
			$conn = $this->establish($connection, '');
		} catch (\Exception $e) {
			return false;
		}
		
		if (!$conn) {
			return false;
		}
		
		$conn->close();
		return true;
	}

}
