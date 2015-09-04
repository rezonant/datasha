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
		$model->setType($connection->getType());
		$model->setHost($connection->getHostName());
		$model->setPort($connection->getPort());
		$model->setUsername($connection->getUsername());
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
		$dbs = array();
		
		foreach ($driver->getDatabases($connection) as $dbName) {
			$status = $driver->getDatabaseStatus($connection, $dbName);
			$model = new DatabaseModel($dbName);
			$model->setSize($status->size);
			$model->setTableCount($status->tableCount);
			$dbs[] = $model;
		}
		
		return $dbs;
	}
	
	/**
	 * Most useful for checking if a connection is valid
	 * @REST\Post("/connections/{id}")
	 */
	public function getConnectionStatus($id, Request $request) {
		
		$details = json_decode($request->getContent());
		$key = $request->request->get('key');
		$connection = $this->connections->getConnection($id);
		
		if (!$connection)
			return new Response('{"message":"No such connection"}', 404);
		
		if (!$connection->unlock($key))
			return new Response('{"message":"Invalid key"}', 400);
		
		$model = new ConnectionModel($connection->getId(), $connection->getUsername().'@'.$connection->getPassword());
		$model->setType($connection->getType());
		$model->setUsername($connection->getUsername());
		$model->setHost($connection->getHostName());
		$model->setPort($connection->getPort());
		
		return $model;
	}
	
	private function modelForColumn($column)
	{
		$columnModel = new \AppBundle\Model\ColumnModel($column->name, $column->type);
		$columnModel->setComment($column->comment);
		$columnModel->setEncoding($column->encoding);
		$columnModel->setAutoIncrement($column->auto);
		$columnModel->setDefault($column->default);
		$columnModel->setNullable($column->nullable);

		return $columnModel;
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
			$columnModel = $this->modelForColumn($column);
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

			$status = $driver->getTableStatus($connection, $db, $tableName);
			
			$tableModel->setRows($status->rows);
			$tableModel->setSize($status->size);
			$tableModel->setIndexSize($status->indexLength);
			$tableModel->setDataSize($status->dataLength);
			$tableModel->setEngine($status->engine);
			$tableModel->setVersion($status->version);
			$tableModel->setFormat($status->format);
			$tableModel->setAverageRowSize($status->avgRowLength);
			$tableModel->setAutoIncrement($status->autoIncrement);
			$tableModel->setCreated($status->created);
			$tableModel->setUpdated($status->updated);
			$tableModel->setChecked($status->checked);
			$tableModel->setChecksum($status->checksum);
			$tableModel->setComment($status->comment);
			
			foreach ($driver->getSchema($connection, $db, $tableName) as $column) {
				$columnModel = $this->modelForColumn($column);
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
		
		$this->connections->deleteConnection($id);
		
		return new Response('{"message":"Success"}', 200);
	}
}
