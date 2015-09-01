<?php

namespace AppBundle\Controller;

use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;

use FOS\RestBundle\Controller\Annotations as REST;
use JMS\Serializer\Annotation as JMS;

class DefaultController extends BaseController
{
    /**
     * @REST\Get("/")
     */
    public function indexAction(Request $request)
    {
		return 'DataForest API v.0.0.1';
    }
}
