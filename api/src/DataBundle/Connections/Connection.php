<?php

namespace DataBundle\Connections;

use JMS\Serializer\Annotation as JMS;
use phpseclib\Crypt\RSA;


/**
 * Represents a connection
 * 
 * @author liam
 * @JMS\ExclusionPolicy("all")
 */
class Connection {
	
	private function __construct($type, $host, $port, $username, $password) {
		$this->type = $type;
		$this->host = $host;
		$this->port = $port;
		$this->username = $username;
		$this->decryptedPassword = $password;
		
		$this->generateID();
	}
	
	/**
	 * The GUID identifier for this connection.
	 * 
	 * @var string
	 * @JMS\Expose
	 */
	private $id;
	
	/**
	 * @var string
	 * @JMS\Expose
	 */
	private $type;
	
	/**
	 * @var string
	 * @JMS\Expose
	 */
	private $host;
	
	/**
	 * @var int
	 * @JMS\Expose
	 */
	private $port;
	
	/**
	 * @var string
	 * @JMS\Expose
	 */
	private $username;
	
	/**
	 * @var string
	 */
	private $password;
	
	/**
	 * @var string
	 */
	private $publicKey;
	
	/**
	 * @var string
	 */
	private $decryptedPassword = NULL;

	private function generateID()
	{
		if (function_exists('com_create_guid') === true)
			return trim(com_create_guid(), '{}');

		$data = openssl_random_pseudo_bytes(16);
		$data[6] = chr(ord($data[6]) & 0x0f | 0x40); // set version to 0100
		$data[8] = chr(ord($data[8]) & 0x3f | 0x80); // set bits 6-7 to 10
		$this->id = vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
	}
	
	function getType() {
		return $this->type;
	}

	function getHostName() {
		return $this->host;
	}

	function getPort() {
		return $this->port;
	}

		
	function getId() {
		return $this->id;
	}

	function setId($id) {
		$this->id = $id;
	}

	public static function create($type, $host, $port, $username, $password, &$key)
	{
		$connection = new Connection($type, $host, $port, $username, $password);
		
		$rsa = new RSA();

		//$rsa->setPrivateKeyFormat(CRYPT_RSA_PRIVATE_FORMAT_PKCS1);
		//$rsa->setPublicKeyFormat(CRYPT_RSA_PUBLIC_FORMAT_PKCS1);

		//define('CRYPT_RSA_EXPONENT', 65537);
		//define('CRYPT_RSA_SMALLEST_PRIME', 64); // makes it so multi-prime RSA is used
		extract($rsa->createKey()); // == $rsa->createKey(1024) where 1024 is the key size
		$key = $privatekey;
		
		$connection->publicKey = $publickey;
		return $connection;
	}
	
	function getUsername() {
		return $this->username;
	}

	function getPassword() {
		if ($this->isLocked())
			throw new \Exception("This credential is locked.");
		
		return $this->decryptedPassword;
	}

	public function setPassword($password) {
		$this->decryptedPassword = $password;
	}
	
	public function lock() {
		$rsa = new RSA();
		$rsa->loadKey($this->publicKey);
		
		$this->password = $rsa->encrypt("valid:".$this->decryptedPassword);
		$this->decryptedPassword = null;
	}
	
	public function unlock($key) {
		$rsa = new RSA();
		$rsa->loadKey($key);
		
		$plaintext = $rsa->decrypt($this->password);
		$parts = explode(':', $plaintext, 2);
		
		if (count($parts) != 2) {
			return false;
		}
		
		if ($parts[0] !== 'valid') {
			return false;
		}
		
		$this->decryptedPassword = $parts[1];
		return true;
	}
	
	public function isLocked() {
		return $this->decryptedPassword === NULL;
	}
	
	public function __sleep() {
		$this->decryptedPassword = null;
		
		$data = get_object_vars($this);
		unset($data->decryptedPassword);
		
		return array_keys($data);
	}
}
