<?php

namespace DataBundle\Queries;
use JMS\Serializer\Annotation as JMS;

/**
 * Description of QueryAnalysis
 *
 * @author liam
 * @JMS\ExclusionPolicy("none")
 */
class QueryAnalysis {
	private $selection;
	private $from;
	private $valid;
	
	function getSelection() {
		return $this->selection;
	}

	function getFrom() {
		return $this->from;
	}

	function getValid() {
		return $this->valid;
	}

	function setSelection($selection) {
		$this->selection = $selection;
	}

	function setFrom($from) {
		$this->from = $from;
	}

	function setValid($valid) {
		$this->valid = $valid;
	}


}
