<?php

namespace DataBundle\Schema;

/**
 * @author liam
 */
class TableDetails extends TableSchema {
	public function __construct($name) {
		$this->setName($name);
	}
	
	private $rows;
	private $size;
	private $indexSize;
	private $dataSize;
	private $engine;
	private $version;
	private $format;
	private $averageRowSize;
	private $autoIncrement;
	private $created;
	private $updated;
	private $checked;
	private $checksum;
	private $comment;

	function getRows() {
		return $this->rows;
	}

	function getSize() {
		return $this->size;
	}

	function getIndexSize() {
		return $this->indexSize;
	}

	function getDataSize() {
		return $this->dataSize;
	}

	function getEngine() {
		return $this->engine;
	}

	function getVersion() {
		return $this->version;
	}

	function getFormat() {
		return $this->format;
	}

	function getAverageRowSize() {
		return $this->averageRowSize;
	}

	function getAutoIncrement() {
		return $this->autoIncrement;
	}

	function getCreated() {
		return $this->created;
	}

	function getUpdated() {
		return $this->updated;
	}

	function getChecked() {
		return $this->checked;
	}

	function getChecksum() {
		return $this->checksum;
	}

	function getComment() {
		return $this->comment;
	}

	function setRows($rows) {
		$this->rows = $rows;
	}

	function setSize($size) {
		$this->size = $size;
	}

	function setIndexSize($indexSize) {
		$this->indexSize = $indexSize;
	}

	function setDataSize($dataSize) {
		$this->dataSize = $dataSize;
	}

	function setEngine($engine) {
		$this->engine = $engine;
	}

	function setVersion($version) {
		$this->version = $version;
	}

	function setFormat($format) {
		$this->format = $format;
	}

	function setAverageRowSize($averageRowSize) {
		$this->averageRowSize = $averageRowSize;
	}

	function setAutoIncrement($autoIncrement) {
		$this->autoIncrement = $autoIncrement;
	}

	function setCreated($created) {
		$this->created = $created;
	}

	function setUpdated($updated) {
		$this->updated = $updated;
	}

	function setChecked($checked) {
		$this->checked = $checked;
	}

	function setChecksum($checksum) {
		$this->checksum = $checksum;
	}

	function setComment($comment) {
		$this->comment = $comment;
	}
}
