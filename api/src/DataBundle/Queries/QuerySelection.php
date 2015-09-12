<?php

namespace DataBundle\Queries;

use JMS\Serializer\Annotation as JMS;

/**
 * @author liam
 * @JMS\ExclusionPolicy("none")
 */
class QuerySelection {
	
	public function __construct($column, $alias) {
		$this->column = $column;
		$this->alias = $alias;
	}
	
	private $column;
	private $alias;
	
	function getColumn() {
		return $this->column;
	}

	function getAlias() {
		return $this->alias;
	}

	function setColumn($column) {
		$this->column = $column;
	}

	function setAlias($alias) {
		$this->alias = $alias;
	}
}
