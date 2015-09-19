#!/bin/bash
#
#  (C) 2015 William Lahti

pre=""

if [ "$1" != "" ]; then
	pre="-$1"
fi

function pushdd() {
	pushd "$@" &>/dev/null
}

function popdd() {
	popd "$@" &>/dev/null
}

dir="`dirname "$0"`"
cd "$dir"

if ! which jq &>/dev/null; then
	echo "Error: 'jq' command is missing (apt-get install jq ?)"
	exit 1
fi

name="`jq .name web/package.json -r`"
version="`jq .version web/package.json -r`"

echo 
echo "  $name [$version] distribution build"
echo "  ==================================="
echo "   [ `date` ]"
echo

echo
echo "--------------------------------------------------"
echo "Configuring for production..."
echo

cp web/config.js web/config.js.orig
cp web/config.js.dist web/config.js 


echo
echo "--------------------------------------------------"
echo "Pulling PHP dependencies..."
echo

pushdd api 
	composer install
popdd

echo
echo "--------------------------------------------------"
echo "Building web app..."
echo

pushdd web
	npm install
	bower install
	grunt
popdd

echo
echo "--------------------------------------------------"

echo "Restoring original build configuration..."
cp web/config.js.orig web/config.js

packageId="$name-$version$pre"

echo "Populating packages/$packageId..."
mkdir -p packages &>/dev/null
rm -Rf "packages/$packageId" &>/dev/null
cp "web/build" "packages/$packageId" -Rf
cp "api" "packages/$packageId/" -Rf
cp "README.md" "LICENSE" "packages/$packageId/"

echo -n "API: "
pushdd "packages/$packageId/api"
	php app/console cache:clear --env=prod	
popdd

echo "API: Deleting unnecessary files..."

rm "packages/$packageId/api/dev.php"
rm "packages/$packageId/api/nbproject" -Rf
rm "packages/$packageId/api"/UPGRADE*
rm "packages/$packageId/api"/composer*

rm "packages/$packageId/api/app/console"
rm "packages/$packageId/api/app/check.php"
rm "packages/$packageId/api/app/SymfonyRequirements.php"
rm "packages/$packageId/api/app"/phpunit.xml* -Rf
rm "packages/$packageId/api/app"/logs/* -Rf
rm "packages/$packageId/api/app"/config/*_dev.yml -Rf
rm "packages/$packageId/api/app"/config/*_test.yml -Rf
rm "packages/$packageId/api/app"/config/*.dist -Rf

echo "Frontend: Deleting unnecessary files..."
rm "packages/$packageId/js/app.js"
rm "packages/$packageId/html/datasha" -Rf

echo "Setting permissions..."
chmod go-w,a+rX "packages/$packageId" -Rf

echo
echo "--------------------------------------------------"
echo "Creating tarball..."
echo

rm "packages/$packageId.tar.bz2" -f
pushdd packages
tar -jcf "$packageId.tar.bz2" "$packageId"


echo
echo "--------------------------------------------------"
echo
echo "Build complete! "
echo " - Unpacked:  packages/$packageId"
echo " - Tarball:   packages/$packageId.tar.bz2"
echo
