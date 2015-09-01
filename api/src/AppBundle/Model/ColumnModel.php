<?php

namespace AppBundle\Model;

/**
 * Description of TableModel
 *
 * @author liam
 */
class ColumnModel {
	public function __construct($name, $type) {
		$this->name = $name;
		$this->type = $type;
	}
	
	private $name;
	private $type;
	
	function getName() {
		return $this->name;
	}

	function getType() {
		return $this->type;
	}

	function setName($name) {
		$this->name = $name;
	}

	function setType($type) {
		$this->type = $type;
	}


}
