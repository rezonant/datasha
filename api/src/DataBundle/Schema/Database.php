<?php

namespace DataBundle\Schema;

/**
 * Description of Database
 *
 * @author liam
 */
class Database {
	public function __construct($name) {
		$this->name = $name;
	}
	
	private $name;
	private $tables = array();
	private $size = 0;
	private $tableCount = 0;
	
	function getTableCount() {
		return $this->tableCount;
	}

	function setTableCount($tableCount) {
		$this->tableCount = $tableCount;
	}

		
	function getSize() {
		return $this->size;
	}

	function setSize($size) {
		$this->size = $size;
	}

		
	function addTable($table) {
		return $this->tables[] = $table;
	}
	
	function getTables() {
		return $this->tables;
	}

	function setTables($tables) {
		$this->tables = $tables;
	}
	
	function getName() {
		return $this->name;
	}

	function setName($name) {
		$this->name = $name;
	}
}
