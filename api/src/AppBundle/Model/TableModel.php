<?php

namespace AppBundle\Model;

/**
 * Description of TableModel
 *
 * @author liam
 */
class TableModel {
	public function __construct($name) {
		$this->name = $name;
	}
	
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
