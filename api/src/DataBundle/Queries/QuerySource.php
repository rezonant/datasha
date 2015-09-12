<?php

namespace DataBundle\Queries;

/**
 * @author liam
 */
class QuerySource {
	private $name;
	private $columns;
	
	function getName() {
		return $this->name;
	}

	function getColumns() {
		return $this->columns;
	}

	function setName($name) {
		$this->name = $name;
	}

	function setColumns($columns) {
		$this->columns = $columns;
	}
}
