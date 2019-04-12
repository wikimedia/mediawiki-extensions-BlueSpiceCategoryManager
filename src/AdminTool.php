<?php

namespace BlueSpice\CategoryManager;

use BlueSpice\IAdminTool;

class AdminTool implements IAdminTool {

	public function getURL() {
		$tool = \SpecialPage::getTitleFor( 'BlueSpiceCategoryManager' );
		return $tool->getLocalURL();
	}

	public function getDescription() {
		return wfMessage( 'bluespicecategorymanager-desc' );
	}

	public function getName() {
		return wfMessage( 'bs-categorymanager-label' );
	}

	public function getClasses() {
		$classes = [
			'bs-icon-tag'
		];

		return $classes;
	}

	public function getDataAttributes() {
		return [];
	}

	public function getPermissions() {
		$permissions = [
			'categorymanager-viewspecialpage'
		];
		return $permissions;
	}

}
