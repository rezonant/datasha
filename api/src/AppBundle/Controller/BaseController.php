<?php

namespace AppBundle\Controller;
use FOS\RestBundle\Controller\FOSRestController;

class BaseController extends FOSRestController {
	public function setContainer(\Symfony\Component\DependencyInjection\ContainerInterface $container = null) {
		parent::setContainer($container);
		$this->initializeServices();
	}
	
	public function initializeServices() {
		
	}
}