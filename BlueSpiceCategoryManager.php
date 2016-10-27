<?php

if ( function_exists( 'wfLoadExtension' ) ) {
	wfLoadExtension( 'BlueSpiceCategoryManager' );
	// Keep i18n globals so mergeMessageFileList.php doesn't break
	$wgMessagesDirs[ 'BlueSpiceCategoryManager' ] = __DIR__ . '/i18n';
	$wgExtensionMessagesFiles[ 'BlueSpiceCategoryManagerAlias' ] = __DIR__ . '/BlueSpiceCategoryManager.alias.php';
	wfWarn(
	  'Deprecated PHP entry point used for BlueSpiceCategoryManager extension. ' .
	  'Please use wfLoadExtension instead, ' .
	  'see https://www.mediawiki.org/wiki/Extension_registration for more details.'
	);
	return;
} else {
	die( 'This version of the BlueSpiceCategoryManager extension requires MediaWiki 1.25+' );
}