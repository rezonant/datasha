<?php

namespace AppBundle\Controller;

use FOS\RestBundle\Controller\Annotations as REST;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * @author liam
 */
class QueryController extends BaseController {
	
	public function initializeServices() {
		$this->connections = $this->get('app.data.connections');
		$this->schema = $this->get('app.data.schema');
		$this->queries = $this->get('app.data.queries');
	}
	
	/**
	 * @var \DataBundle\ConnectionService
	 */
	private $connections;
	
	/**
	 * @var \DataBundle\SchemaService
	 */
	private $schema;
	
	/**
	 * @var \DataBundle\Queries\QueryService
	 */
	private $queries;
	
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
			$results = $this->queries->query($cnx, $dbName, $query);
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
	 * @REST\Post("/connections/{cnxId}/dbs/{dbName}/query/paged")
	 */
	public function performPagedQuery($cnxId, $dbName, Request $request) {
		$details = json_decode($request->getContent());
		
		if (!isset($details->query) || !isset($details->key)) {
			return new Response('{"message":"Invalid request"}', 400);
		}
		
		$query = $details->query;
		$key = $details->key;
		$limit = $details->limit;
		$offset = $details->offset;
		
		$cnx = $this->connections->getConnection($cnxId);
		if (!$cnx)
			return new Response('{"message":"No such connection"}', 404);
		
		if (!$cnx->unlock($key))
			return new Response('{"message":"Invalid access key"}', 400);
		
		try {
			$results = $this->queries->pagedQuery($cnx, $dbName, $query, $limit, $offset);
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
	 * @REST\Post("/connections/{connectionID}/dbs/{db}/query/order")
	 */
	public function orderQuery($connectionID, $db, Request $request) {
		$rq = json_decode($request->getContent());
		$query = $rq->query;
		$key = $rq->key;
		$column = $rq->column;
		$direction = $rq->direction;
		
		$cnx = $this->connections->getConnection($connectionID);
		if (!$cnx) 
			return new Response('{"message":"Not Found"}', 404);

		if (!$cnx->unlock($key))
			return new Response('{"message":"Invalid access key"}', 400);
		
		$parser = new \PHPSQLParser\PHPSQLParser();
		$creator = new \PHPSQLParser\PHPSQLCreator();
		$tree = $parser->parse($query);
		
		$tree['ORDER'] = array(
			array(
				'expr_type' => 'colref',
				'base_expr' => $column,
				'no_quotes' => array(
					'delim' => false,
					'parts' => array($column)
				),
				'sub_tree' => false,
				'direction' => strtoupper($direction)
			)
		);
		
		return array(
			'query' => $creator->create($tree)
		);
	}
	
	/**
	 * @REST\Post("/connections/{connectionID}/dbs/{db}/query/analyze")
	 */
	public function analyzeQuery($connectionID, $db, Request $request) {
		$rq = json_decode($request->getContent());
		$query = $rq->query;
		$key = $rq->key;
		
		$cnx = $this->connections->getConnection($connectionID);
		if (!$cnx) 
			return new Response('{"message":"Not Found"}', 404);

		if (!$cnx->unlock($key))
			return new Response('{"message":"Invalid access key"}', 400);
		
		return $this->queries->analyzeQuery($cnx, $db, $query);
	}
	
	/**
	 * @REST\Get("/query/analyze")
	 */
	public function analyzeQueryTest(Request $request) {
		$query = $request->query->get('query');
		$parser = new \PHPSQLParser\PHPSQLParser();
		$result = $parser->parse($query);
		
		if (false) {
			return new Response(print_r($result, true), 200);
		
			ob_start();
			var_dump($result);
			$dump = ob_get_clean();
			return new Response($dump, 200);
		} else {
			$parser = new \PHPSQLParser\PHPSQLParser();
			$creator = new \PHPSQLParser\PHPSQLCreator();
			$tree = $parser->parse($query);
			$column = 'foo';
			$direction = 'asc';
			
			$tree['ORDER'] = array(
				array(
					'expr_type' => 'colref',
					'base_expr' => $column,
					'no_quotes' => array(
						'delim' => false,
						'parts' => array($column)
					),
					'sub_tree' => false,
					'direction' => strtoupper($direction)
				)
			);

			return array(
				'query' => $creator->create($tree)
			);	
		}
	}
}
