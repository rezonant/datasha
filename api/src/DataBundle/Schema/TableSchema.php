<?php

namespace DataBundle\Schema;

/**
 * Description of TableSchema
 *
 * @author liam
 */
class TableSchema {
	private $name;
	private $columns = array();
	
	function getName() {
		return $this->name;
	}

	function getColumns() {
		return $this->columns;
	}

	function addColumn($column) {
		$this->columns[] = $column;
	}
	
	function setName($name) {
		$this->name = $name;
	}

	function setColumns($columns) {
		$this->columns = $columns;
	}
}
