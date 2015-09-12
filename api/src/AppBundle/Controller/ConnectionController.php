<?php

namespace AppBundle\Controller;

use FOS\RestBundle\Controller\Annotations as REST;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use AppBundle\Model\ConnectionModel; 

/**
 * @author liam
 */
class ConnectionController extends BaseController {
	
	public function initializeServices() {
		$this->connections = $this->get('app.data.connections');
	}
	
	/**
	 * @var \DataBundle\Connections\ConnectionService
	 */
	private $connections;
	
	/**
	 * @REST\Put("/connections")
	 */
	public function putConnection(Request $request) {
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
	 * Most useful for checking if a connection is valid
	 * @REST\Post("/connections/{id}")
	 */
	public function getConnection($id, Request $request) {
		
		$details = json_decode($request->getContent());
		$key = $request->request->get('key');
		$connection = $this->connections->getConnection($id);
		
		if (!$connection)
			return new Response('{"message":"No such connection"}', 404);
		
		if (!$connection->unlock($key))
			return new Response('{"message":"Invalid key"}', 400);
		
		$model = new ConnectionModel($connection->getId(), $connection->getUsername().'@'.$connection->getHostName());
		$model->setType($connection->getType());
		$model->setUsername($connection->getUsername());
		$model->setHost($connection->getHostName());
		$model->setPort($connection->getPort());
		
		return $model;
	}
	
	/**
	 * @REST\Delete("/connections/{id}")
	 */
	public function deleteConnection($id) {
		
		$this->connections->deleteConnection($id);
		
		return new Response('{"message":"Success"}', 200);
	}
}
