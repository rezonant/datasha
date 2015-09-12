<?php

namespace AppBundle\Controller;

use FOS\RestBundle\Controller\Annotations as REST;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * @author liam
 */
class SchemaController extends BaseController {
	
	public function initializeServices() {
		$this->connections = $this->get('app.data.connections');
		$this->schema = $this->get('app.data.schema');
	}
	
	/**
	 * @var \DataBundle\ConnectionService
	 */
	private $connections;
	
	/**
	 * @var \DataBundle\Schema\SchemaService
	 */
	private $schema;
	
	/**
	 * Retrieve the databases associated with the given connection.
	 * 
	 * @REST\Post("/connections/{id}/schema/dbs")
	 */
	public function getDatabases($id, Request $request) {
		
		$details = json_decode($request->getContent());
		$key = $request->request->get('key');
		$connection = $this->connections->getConnection($id);
		
		if (!$connection)
			return new Response('{"message":"No such connection"}', 404);
		
		if (!$connection->unlock($key))
			return new Response('{"message":"Invalid key"}', 400);
		
		return $this->schema->getDatabases($connection);
	}
	
	/**
	 * Get detailed information about the given table.
	 * @REST\Post("/connections/{id}/schema/dbs/{db}/tables/{tableName}")
	 */
	public function getTable($id, $db, $tableName, Request $request) {
		$details = json_decode($request->getContent());
		$key = $request->request->get('key');
		$connection = $this->connections->getConnection($id);
		
		if (!$connection)
			return new Response('{"message":"No such connection"}', 404);
		
		if (!$connection->unlock($key))
			return new Response('{"message":"Invalid key"}', 400);
		
		return $this->schema->getTableDetails($connection, $db, $tableName);
	}
	
	/**
	 * Get detailed information about the given table.
	 * @REST\Post("/connections/{id}/schema/dbs/{db}/tables/{tableName}/columns")
	 */
	public function getTableColumns($id, $db, $tableName, Request $request) {
		$details = json_decode($request->getContent());
		$key = $request->request->get('key');
		$connection = $this->connections->getConnection($id);
		
		if (!$connection)
			return new Response('{"message":"No such connection"}', 404);
		
		if (!$connection->unlock($key))
			return new Response('{"message":"Invalid key"}', 400);
		
		return $this->schema->getTableSchema($connection, $db, $tableName);
	}
	
	/**
	 * @REST\Post("/connections/{id}/schema/dbs/{db}/tables")
	 */
	public function getSchemaTables($id, $db, Request $request) {
		$details = json_decode($request->getContent());
		$key = $request->request->get('key');
		$connection = $this->connections->getConnection($id);
		
		if (!$connection)
			return new Response('{"message":"No such connection"}', 404);
		
		if (!$connection->unlock($key))
			return new Response('{"message":"Invalid key"}', 400);
		
		return $this->schema->getTablesWithDetails($connection, $db);
	}
}
