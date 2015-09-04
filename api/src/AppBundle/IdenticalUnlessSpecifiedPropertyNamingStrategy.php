<?php

namespace AppBundle;

use JMS\Serializer\Naming\PropertyNamingStrategyInterface;
use JMS\Serializer\Metadata\PropertyMetadata;

class IdenticalUnlessSpecifiedPropertyNamingStrategy implements PropertyNamingStrategyInterface
{
    public function translateName(PropertyMetadata $property)
    {
        $name = $property->serializedName;

        if (null !== $name) {
            return $name;
        }

        return $property->name;
    }
}
