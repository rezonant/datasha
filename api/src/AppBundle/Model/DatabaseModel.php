<?php

namespace AppBundle\Model;

/**
 * Description of DatabaseModel
 *
 * @author liam
 */
class DatabaseModel {
	public function __construct($name) {
		$this->name = $name;
	}
	
	private $name;
	private $tables = array();
	
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
