<?php
class BlueSpiceCategoryManager extends BsExtensionMW {

	public function __construct() {
		wfProfileIn( 'BS::'.__METHOD__ );
		WikiAdmin::registerModuleClass( 'BlueSpiceCategoryManager', array(
			'image' => '/extensions/BlueSpiceCategoryManager/resources/images/bs-btn_categorymanager.png',
			'level' => 'wikiadmin',
			'message' => 'bs-categorymanager-label',
			'iconCls' => 'bs-icon-tag'
		) );
		wfProfileOut( 'BS::'.__METHOD__ );
	}

	protected function initExt() {
		BsCore::getInstance()->registerPermission( 'categorymanager-viewspecialpage', array( 'sysop' ), array( 'type' => 'global' ) );
	}
}
