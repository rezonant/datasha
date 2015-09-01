<?php

namespace AppBundle\Controller;
use FOS\RestBundle\Controller\Annotations as REST;
use JMS\Serializer\Annotation as JMS;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use AppBundle\Model\ConnectionModel;
use AppBundle\Model\DatabaseModel;
use AppBundle\Model\TableModel;
use AppBundle\Model\ColumnModel;

/**
 * @author liam
 */
class ConnectionController extends BaseController {
	
	public function initializeServices() {
		$this->connections = $this->get('app.connections');
	}
	
	/**
	 * @var \DataBundle\ConnectionService
	 */
	private $connections;
	
	/**
	 * @REST\Put("/connections")
	 */
	public function establishConnection(Request $request) {
		$details = json_decode($request->getContent());
		
		if (!isset($details->host) || !$details->host) {
			return new Response('{"message":"Invalid request"}', 400);
		}
		
		$key = NULL;
		$connection = $this->connections->establishConnection(
			$details->type, 
			$details->host, 
			$details->port, 
			$details->username, 
			$details->password, 
			$key);
		
		if (!$connection) {
			return new Response('{"message":"Failed to connect"}', 400);
		}
		
		$connection->unlock($key);
		
		$model = new ConnectionModel($connection->getId(), "{$connection->getUsername()}@{$connection->getHostName()}");
		$model->setKey($key);
		
		return $model;
	}
	
	/**
	 * @REST\Post("/connections/{id}/schema/dbs")
	 */
	public function getSchemaDatabases($id, Request $request) {
		
		$details = json_decode($request->getContent());
		$key = $request->request->get('key');
		$connection = $this->connections->getConnection($id);
		
		if (!$connection)
			return new Response('{"message":"No such connection"}', 404);
		
		if (!$connection->unlock($key))
			return new Response('{"message":"Invalid key"}', 400);
		
		$driver = $this->connections->getDriver($connection->getType());
		return $driver->getDatabases($connection);
	}
	
	/**
	 * @REST\Post("/connections/{id}/schema/dbs/{db}/tables/{tableName}")
	 */
	public function getSchemaTable($id, $db, $tableName, Request $request) {
		$details = json_decode($request->getContent());
		$key = $request->request->get('key');
		$connection = $this->connections->getConnection($id);
		
		if (!$connection)
			return new Response('{"message":"No such connection"}', 404);
		
		if (!$connection->unlock($key))
			return new Response('{"message":"Invalid key"}', 400);
		
		$driver = $this->connections->getDriver($connection->getType());
		$columns = array();
		
		foreach ($driver->getSchema($connection, $db, $tableName) as $column) {
			$columnModel = new \AppBundle\Model\ColumnModel($column->name, $column->type);
			$columns[] = $columnModel;
		}
		
		return $columns;
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
		
		$driver = $this->connections->getDriver($connection->getType());
		$dbModel = new \AppBundle\Model\DatabaseModel($db);
		foreach ($driver->getTables($connection, $db) as $tableName) {
			$tableModel = new \AppBundle\Model\TableModel($tableName);

			foreach ($driver->getSchema($connection, $db, $tableName) as $column) {
				$columnModel = new \AppBundle\Model\ColumnModel($column->name, $column->type);

				$tableModel->addColumn($columnModel);
			}

			$dbModel->addTable($tableModel);
		}

		return $dbModel->getTables();
	}
	
	/**
	 * @REST\Delete("/connections/{id}")
	 */
	public function deleteConnection($id) {
		return new Response('{"message":"Success"}', 200);
	}
}