<?php

namespace BlueSpice\CategoryManager\Special;

use MediaWiki\Html\Html;
use MediaWiki\SpecialPage\SpecialPage;

class CategoryManager extends SpecialPage {

	public function __construct() {
		parent::__construct(
			'BlueSpiceCategoryManager',
			'wikiadmin'
		);
	}

	/**
	 * @inheritDoc
	 */
	public function execute( $param ) {
		parent::execute( $param );
		$this->getOutput()->addModules(
			'ext.bluespice.categorymanager'
		);

		$this->getOutput()->addHTML(
			Html::element( 'div', [
				'id' => 'bs-categorymanager-tree'
			] )
		);
	}

}
