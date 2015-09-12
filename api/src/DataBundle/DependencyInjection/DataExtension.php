<?php

namespace DataBundle\DependencyInjection;

use Symfony\Component\DependencyInjection\Extension\Extension;
use Symfony\Component\DependencyInjection\Loader\YamlFileLoader;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\Config\FileLocator;

/**
 * Description of DataExtension
 *
 * @author liam
 */
class DataExtension extends Extension {
	public function load(array $config, ContainerBuilder $container) {
		$loader = new YamlFileLoader(
			$container,
			new FileLocator(__DIR__.'/../Resources/config')
		);
		$loader->load('services.yml');
	}
}
