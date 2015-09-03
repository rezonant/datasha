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
class QueryController extends BaseController {
	
	public function initializeServices() {
		$this->connections = $this->get('app.connections');
	}
	
	/**
	 * @var \DataBundle\ConnectionService
	 */
	private $connections;
	
	/**
	 * @REST\Post("/connections/{cnxId}/dbs/{dbName}/query")
	 */
	public function performQuery($cnxId, $dbName, Request $request) {
		$details = json_decode($request->getContent());
		
		if (!isset($details->query) || !isset($details->key)) {
			return new Response('{"message":"Invalid request"}', 400);
		}
		
		$query = $details->query;
		$key = $details->key;
		
		$cnx = $this->connections->getConnection($cnxId);
		if (!$cnx)
			return new Response('{"message":"No such connection"}', 404);
		
		if (!$cnx->unlock($key))
			return new Response('{"message":"Invalid access key"}', 400);
		
		try {
			$results = $this->connections->query($cnx, $dbName, $query);
		} catch (\Exception $e) {
			return new Response(json_encode(array(
				'message' => $e->getMessage()
			)), 500);
		}
		
		return new Response(json_encode(
			$results
		), 200);
	}
	
	/**
	 * @REST\Delete("/connections/{id}")
	 */
	public function deleteConnection($id) {
		return new Response('{"message":"Success"}', 200);
	}
}
