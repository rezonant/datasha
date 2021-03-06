<?php

namespace AppBundle\Model;

/**
 * @author liam
 */
class ConnectionModel {

	public function __construct($id, $label) {
		$this->id = $id;
		$this->label = $label;
	}
	
	private $id;
	private $label;
	private $key;
	private $databases = array();
	private $username;
	private $host; 
	private $port;
	private $type;
	
	function getType() {
		return $this->type;
	}

	function setType($type) {
		$this->type = $type;
	}
	
	function getPort() {
		return $this->port;
	}

	function setPort($port) {
		$this->port = $port;
	}
	
	function getUsername() {
		return $this->username;
	}

	function getHost() {
		return $this->host;
	}

	function setUsername($username) {
		$this->username = $username;
	}

	function setHost($hostName) {
		$this->host = $hostName;
	}

		
	function getId() {
		return $this->id;
	}

	function getLabel() {
		return $this->label;
	}

	function getKey() {
		return $this->key;
	}

	function getDatabases() {
		return $this->databases;
	}

	function setId($id) {
		$this->id = $id;
	}

	function setLabel($label) {
		$this->label = $label;
	}

	function setKey($key) {
		$this->key = $key;
	}

	function addDatabase($database) {
		$this->databases[] = $database;
	}
	
	function setDatabases($databases) {
		$this->databases = $databases;
	}
}
