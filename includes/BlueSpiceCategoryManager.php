<?php
class BlueSpiceCategoryManager extends BsExtensionMW {
	protected function initExt() {
		BsCore::getInstance()->registerPermission( 'categorymanager-viewspecialpage', array( 'sysop' ), array( 'type' => 'global' ) );
	}
}
