<?php

class SpecialBlueSpiceCategoryManager extends BsSpecialPage {

	public function __construct() {
		parent::__construct( 'BlueSpiceCategoryManager', 'categorymanager-viewspecialpage' );
	}

	public function execute( $sParameter ) {
		parent::execute( $sParameter );

		$this->getOutput()->addModules("ext.bluespice.categorymanager");
		$this->getOutput()->addHTML( '<div id="bs-categorymanager-grid"/></div>' );

		return true;
	}
}
