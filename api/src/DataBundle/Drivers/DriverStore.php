<?php

namespace DataBundle\Drivers;

/**
 * Responsible for resolving string type identifiers (ie 'mysql') into 
 * appropriate instances of DatabaseDriver.
 * 
 * @author liam
 */
class DriverStore {
	
	/**
	 * Retrieve a driver object for the given type
	 * 
	 * @param type $type
	 * @return \DataBundle\MySQLDriver
	 * @throws \Exception
	 */
	public function getDriver($type)
	{
		switch ($type) {
		case 'mysql':
			return new MySQLDriver();
		default:
			throw new \Exception('No driver available for type '.$type);
		}
	}
}
