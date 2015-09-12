<?php

namespace DataBundle\Drivers;

use PHPSQLParser\PHPSQLParser;
use DataBundle\Connections\Connection;

/**
 * DatabaseDriver for MySQL connections using MySQLi.
 * @author liam
 */
class MySQLDriver extends DatabaseDriver {

	public function analyzeQuery($query) {
		// Use PHPSQLParser
		
		$parser = new PHPSQLParser();
		$creator = new \PHPSQLParser\PHPSQLCreator();
		
		try {
			$tree = $parser->parse($query);
		} catch (\Exception $e) {
			return (object)array(
				'valid' => false
			);
		}
		
		//return $tree;
		
		$result = (object)array(
			'valid' => true,
			'selection' => array(),
			'from' => array()
		);
		
		if (!isset($tree['SELECT']) || !$tree['SELECT'])
			return (object)array(
				'valid' => true
			);
		
		// Handle selects with love and care
		
		foreach ($tree['FROM'] as $table) {
			$result->from[] = (object)array(
				'name' => $table['table']
			);
		}
		
		foreach ($tree['SELECT'] as $item) {
			$item = (object)$item;
			$realColumn = $item->base_expr;
			$alias = $item->base_expr;
			if (isset($item->alias) && $item->alias) {
				$alias = $item->alias['name'];
			}
			
			$alias = str_replace('`', '', $alias);
			$realColumn = str_replace('`', '', $realColumn);
			
			if (strpos($realColumn, '.') === false) {
				// Append the table name into the column if there
				// is only one table. Otherwise determining table
				// would require schema information
				
				if (count($tree['FROM']) == 1) {
					$table = $tree['FROM'][0];
					$realColumn = str_replace('`', '', $table['table'].'.'.$realColumn);
				}
			}
			
			$result->selection[] = (object)array(
				'column' => $realColumn,
				'alias' => $alias
			);
		}
		
		return $result;
	}
	
	public function getId() {
		return 'mysql';
	}

	public function getName() {
		return 'MySQL';
	}
	
	public function getDatabaseStatus(Connection $connection, $db) {
		
		$sizeResults = $this->rawQuery($connection, 'information_schema', 
			'SELECT SUM(data_length + index_length) `size`'
			. 'FROM `TABLES` '
			. 'WHERE `table_schema` = '.$this->quote($db)
			. 'GROUP BY `table_schema` '
		);
		
		$size = 0;
		if (count($sizeResults) > 0) {
			$sizeRow = $sizeResults[0];
			$size = $sizeRow->size;
		}
		
		
		$tablesResults = $this->rawQuery($connection, 'information_schema', 
			'SELECT COUNT(*) `count`'
			. 'FROM `TABLES` '
			. 'WHERE `table_schema` = '.$this->quote($db)
		);
		
		$tableCount = 0;
		if (count($tablesResults) > 0) {
			$tablesRow = $tablesResults[0];
			$tableCount = $tablesRow->count;
		}
		
		return (object)array(
			'name' => $db,
			'size' => $size,
			'tableCount' => $tableCount
		);
	}

	public function getTableStatus(Connection $connection, $db, $table) {
		$statusResults = $this->rawQuery($connection, $db, 
				'SHOW TABLE STATUS WHERE `Name` = '.$this->quote($table));
		
		if (count($statusResults) == 0) {
			return null;
		}
		
		$status = $statusResults[0];
		
		return (object)array(
			'name' => $table,
			'rows' => $status->Rows,
			'version' => $status->Rows,
			'engine' => $status->Engine,
			'format' => $status->Row_format,
			'avgRowLength' => $status->Avg_row_length,
			'dataLength' => $status->Data_length,
			'indexLength' => $status->Index_length,
			'size' => $status->Data_length + $status->Index_length,
			'autoIncrement' => $status->Auto_increment,
			'created' => $status->Create_time,
			'updated' => $status->Update_time,
			'checked' => $status->Check_time,
			'checksum' => $status->Checksum,
			'createOptions' => $status->Create_options,
			'comment' => $status->Comment
		);
	}
	
	/**
	 * @param Connection $connection
	 * @param string $db
	 * @return \mysqli
	 */
	private function establish($connection, $db)
	{
		return new \mysqli(
			$connection->getHostName(), 
			$connection->getUsername(), 
			$connection->getPassword(), 
			$db,
			$connection->getPort()? $connection->getPort() : 3306
		);
	}
	
	/**
	 * Perform a paged query (must be a SELECT) with the given limit and offset.
	 * If the query already has a limit and offset, the $limit and $offset parameters
	 * are ignored.
	 * 
	 * Returns an object containing the query results and the total amount of rows when
	 * the query is unpaged.
	 * 
	 * @param Connection $connection
	 * @param type $db
	 * @param type $query
	 * @param type $limit
	 * @param type $offset
	 */
	public function pagedQuery(Connection $connection, $db, $query, $limit, $offset)
	{
		
		// Oh my, some magic bullshit happens here
		$countQuery = $this->getCountQuery($query);
		$pagedQuery = $this->getPagedQuery($query, $limit, $offset);
		
		$counts = $this->rawQuery($connection, $db, $countQuery);
		$countRow = $counts[0];
		$count = $countRow->ct;
		
		$results = $this->query($connection, $db, $pagedQuery);
		
		return (object)array(
			'total' => $count,
			'results' => $results->results,
			'columns' => $results->columns
		);
	}
	
	private function getCountQuery($sql)
	{
		$parser = new PHPSQLParser();
		$creator = new \PHPSQLParser\PHPSQLCreator();
		
		$tree = $parser->parse($sql);
		$tree['SELECT'] = array(
			array(
				'expr_type' => 'aggregate_function',
				'alias' => array(
					'as' => false,
					'name' => 'ct',
					'no_quotes' => array(
						'delim' => false,
						'parts' => array('ct')
					),
					'base_expr' => 'ct'
				),
				'base_expr' => 'COUNT',
				'sub_tree' => array(
					array(
						'expr_type' => 'colref',
						'base_expr' => '*',
						'sub_tree' => false
					)
				),
				
				'delim' => false
			)
		);
		
		return $creator->create($tree);
	}
	
	private function getPagedQuery($sql, $limit, $offset)
	{
		$parser = new PHPSQLParser();
		$creator = new \PHPSQLParser\PHPSQLCreator();
		
		$tree = $parser->parse($sql);
		
		if (!isset($tree['LIMIT'])) {
			$tree['LIMIT'] = array(
				'offset' => $offset,
				'rowcount' => $limit
			);
		}
		
		return $creator->create($tree);
	}
	
	private function rawQuery(Connection $connection, $db, $query)
	{
		$conn = $this->establish($connection, $db);
		$result = $conn->query($query);
		
		if ($result === false) {
			throw new \Exception('MySQL Error: '.$conn->error);
		}
		
		if ($result === true) {
			return (object)array(
				'executed' => true,
				'rowsAffected' => $conn->affected_rows
			);
		}
		
		$array = array();
		foreach ($result as $row) {
			$array[] = (object)$row;
		}

		return $array;
	}
	
	public function query(Connection $connection, $db, $query) {
		$conn = $this->establish($connection, $db);
		$result = $conn->query($query);
		
		if ($result === false) {
			throw new \Exception('MySQL Error: '.$conn->error);
		}
		
		if ($result === true) {
			return (object)array(
				'executed' => true,
				'rowsAffected' => $conn->affected_rows
			);
		}
		
		// Attempt to determine the list of selected columns.
		// We'll use this to intelligently build the result objects
		// if possible.
		
		$columnList = $this->getQueryColumns($query, $result);
		
		if (!$columnList) {
			
			// Some result-generating queries are not SELECTs and thus
			// will not have selection information avialable (ie DESCRIBE, 
			// EXPLAIN, and the various SHOW queries)
			
			$array = array();
			foreach ($result as $row) {
				$array[] = $row;
			}
			
			return (object)array(
				'total' => count($array),
				'columns' => null,
				'results' => $array
			);	
		}
		
		// For queries which we can generate selection column
		// information, we'll need to create a two-way column 
		// map. We'll provide one of the directions of the map 
		// along with the query results so that the client can 
		// translate between the virtual "columns" and the 
		// literal (logical) columns.
		// The other half will be used to handle choosing alternate
		// column names so that a row can contain the same column
		// name multiple times.

		if ($columnList) {
			
			$logicalToVirtual = array();
			$virtualToLogical = array();
			$virtualColumns = array();
			
			foreach ($columnList as $j => $details) {
				$column = $details->qualified;
				
				$i = 0;
				if (isset($logicalToVirtual[$column])) {
					$i = 2;
					while (isset($virtualToLogical[str_replace('.', '$', $column).'$'.$i]))
						++$i;
				}

				$virtualColumn = str_replace('.', '$', $column).($i? '$'.$i : '');
				$virtualColumns[] = $virtualColumn;
				$logicalToVirtual[$column] = $virtualColumn;
				$virtualToLogical[$virtualColumn] = (object)array(
					'column' => $column,
					'alias' => $details->alias
				);
			}
			
			// Fetch results as a numerically indexed array
			// so that column multiples are preserved.

			$array = array();
			while ($row = $result->fetch_array(MYSQLI_NUM)) {
				$obj = new \stdclass;

				foreach ($row as $i => $value) { 
					$logicalColumn = $columnList[$i];
					$virtualColumn = $virtualColumns[$i];
					$obj->{$virtualColumn} = $value;
				}

				$array[] = $obj;
			}

			return (object)array(
				'total' => count($array),
				'columns' => $virtualToLogical,
				'results' => $array
			);
		}
		
	}

	private function getQueryColumns($query, $result)
	{
		$parser = new PHPSQLParser();
		$tree = $parser->parse($query);
		
		// Build an alias map so that we can resolve semantic selections into
		// concrete table columns.
		// Build a table map so that we can lookup the columns of a table as 
		// necessary.
		
		$aliasMap = array();
		$tableMap = array();
		
		if (isset($tree['FROM'])) {
			foreach ($tree['FROM'] as $from) {
				$tableName = str_replace('`', '', $from['table']);
				if ($from['alias'])
					$aliasMap[$from['alias']['name']] = $tableName;

				//$tableMap[$tableName] = $this->getSchema($connection, $db, $tableName);
			}
		}
		
		$columns = array();
		
		foreach ($result->fetch_fields() as $field) {
			$table = $field->table;
			if (isset($aliasMap[$table]))
				$table = $aliasMap[$table];
			
			$columns[] = (object)array(
				'qualified' => $table.'.'.$field->orgname,
				'short' => $field->table.'.'.$field->orgname,
				'alias' => $field->name
			);
		}
		
		return $columns;
		
		$dataColumns = array();
		foreach ($tree['SELECT'] as $selected) {
			$table = null;
			$expr = str_replace('`', '', $selected['base_expr']);
			$column = $expr;
			
			if (strpos($expr, '.') !== false) {
				$parts = explode('.', $expr);
				$table = $parts[0];
				$column = $parts[1];
				
				if (isset($aliasMap[$table]))
					$table = $aliasMap[$table];
			}
			
			// For a wildcard, we'll add all the columns for
			// the relevant set of tables and then be done.
			
			if ($column == '*') {
				
				// Determine the set of tables 
				
				$tableSet = array($table);
				if (!$table) {
					$tableSet = array();
					foreach ($tree['FROM'] as $from)
						$tableSet[] = str_replace('`', '', $from['table']);
				}
				
				foreach ($tableSet as $tableName) {
					foreach ($tableMap[$tableName] as $tableColumn) {
						$dataColumns[] = $tableName.'.'.$tableColumn->name;
					}
				}
				
				continue;
			}
			
			// It references a single column.
			// If the table is already known, record the column and move on.
			
			if ($table) {
				$dataColumns[] = $table.'.'.$column;
				continue;
			}
			
			// The table is not specified.
			// Determine the table automatically if possible.
			
			$matchColumns = array();
			foreach ($tableMap as $table => $tableColumns) {
				foreach ($tableColumns as $tableColumn) {
					if ($tableColumn->name == $column) {
						$matchColumns[] = array($table, $column);
					}
				}
			}

			// We've found the columns on all tables which match the 
			// column we are looking at. 
			
			if (count($matchColumns) > 1) {
				// Technically this is a query error, so all this work 
				// will probably be for nothing. But we'll gracefully fall
				// back in case somehow the query doesn't fail.
				$dataColumns[] = $matchColumns[0][0].$matchColumns[0][1];
			} else if (count($matchColumns) > 0) {
				// Perfect.
				$dataColumns[] = $matchColumns[0][0].$matchColumns[0][1];
			} else {
				// No match column!
				// We'll just have to add the column as is
				$dataColumns = $column;
			}

			$dataColumns[] = $table.'.'.$column;
		}
		
		return $dataColumns;
	}
	
	public function quoteSchema($str) {
		return '`'.str_replace('\'', '', str_replace('`', '', $str)).'`';
	}
	
	public function getSchema(Connection $connection, $db, $table) {
		$rows = $this->rawQuery($connection, $db, 'SHOW FULL COLUMNS FROM '.$this->quoteSchema($table));
		$columns = array();
		
		foreach ($rows as $row) {
			
			$row = (array)$row;
			$description = (object)array(
				'name' => $row['Field'],
				'type' => $row['Type'],
				'nullable' => $row['Null'] == 'YES',
				'default' => $row['Default'],
				'encoding' => $row['Collation'],
				'comment' => $row['Comment'],
				'isPrimary' => $row['Key'] == 'PRI',
				'isIndexed' => $row['Key'] ? true : false,
				'auto' => strpos($row['Extra'], 'auto_increment')
			);
			
			$columns[] = $description;
		}
		
		return $columns;
	}
	
	public function getDatabases(Connection $connection) {
		$rows = $this->rawQuery($connection, '', 'SHOW DATABASES');
		$dbs = array();
		
		foreach ($rows as $row) {
			$values = array_values((array)$row);
			$dbs[] = $values[0];
		}
		
		return $dbs;
	}
	
	public function quote($data)
	{
		return '\''.str_replace('\'', '\\\'', $data).'\'';
	}
	
	public function getTables(Connection $connection, $db) {
		$rows = $this->rawQuery($connection, 'information_schema', 
				'SELECT * FROM `tables` WHERE `table_schema` = '.$this->quote($db));
		$dbs = array();
		
		foreach ($rows as $row) {
			$dbs[] = $row->TABLE_NAME;
		}
		
		return $dbs;
	}
	
	public function testConnection(Connection $connection) {
		
		try {
			$conn = $this->establish($connection, '');
		} catch (\Exception $e) {
			return false;
		}
		
		if (!$conn) {
			return false;
		}
		
		$conn->close();
		return true;
	}

}
