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
	private $comment;
	private $encoding;
	private $autoIncrement;
	private $default;
	private $nullable;
	
	function getEncoding() {
		return $this->encoding;
	}

	function getAutoIncrement() {
		return $this->autoIncrement;
	}

	function getDefault() {
		return $this->default;
	}

	function getNullable() {
		return $this->nullable;
	}

	function setEncoding($encoding) {
		$this->encoding = $encoding;
	}

	function setAutoIncrement($autoIncrement) {
		$this->autoIncrement = $autoIncrement;
	}

	function setDefault($default) {
		$this->default = $default;
	}

	function setNullable($nullable) {
		$this->nullable = $nullable;
	}
	
	function getComment() {
		return $this->comment;
	}

	function setComment($comment) {
		$this->comment = $comment;
	}

		
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
