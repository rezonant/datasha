<?php

namespace DataBundle\Connections;
use Symfony\Component\HttpFoundation\Session\Session;

/**
 * Handles dealing with Connections.
 * 
 * @author liam
 */
class ConnectionService {
	public function __construct(Session $session, $drivers) {
		$this->session = $session;
		$this->drivers = $drivers;
	}
	
	/**
	 * @var Session
	 */
	private $session;
	
	/**
	 * @var DriverStore
	 */
	private $drivers;
	
	/**
	 * Represents the name of the session variable which will hold
	 * the connection store.
	 */
	const CONNECTION_STORE_SESSION_INDEX = 'connections';
	
	/**
	 * @return ConnectionStore
	 */
	private function getStore()
	{
		$store = $this->session->get(self::CONNECTION_STORE_SESSION_INDEX, null);
		if (!$store) {
			$store = new ConnectionStore();
			$this->session->set(self::CONNECTION_STORE_SESSION_INDEX, $store);
		}
		
		return $store;
	}
	
	/**
	 * @param Connection $connection
	 * @param string $username
	 * @return Connection
	 */
	public function getConnection($id)
	{
		return $this->getStore()->get($id);
	}
	
	/**
	 * Delete the given connection by ID from the underlying 
	 * ConnectionStore.
	 * 
	 * @param string $id
	 */
	public function deleteConnection($id)
	{
		$conn = $this->getConnection($id);
		
		if (!$conn)
			return;
		
		$this->getStore()->remove($conn);
	}
	
	/**
	 * Establish a new database connection
	 * 
	 * @param string $type
	 * @param string $hostname
	 * @param int $port
	 * @param string $username
	 * @param string $password
	 * @param string $key
	 * 
	 * @return Connection
	 */
	public function establishConnection($type, $hostname, $port, $username, $password, &$key)
	{
		$key = NULL;
		$connection = Connection::create($type, $hostname, $port, $username, $password, $key);
		$driver = $this->drivers->getDriver($type);
		
		// Test the connection
		if (!$driver->testConnection($connection))
			return null;
		
		// Success, build and store the connection
		$store = $this->getStore();
		$store->add($connection);
		
		// Lock (encrypt) the credentials and return the private key
		$connection->lock();
		return $connection;
	}
}
