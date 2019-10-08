<?php

namespace BlueSpice\CategoryManager\EntityConfig\Collection;

use BlueSpice\ExtendedStatistics\Data\Entity\Collection\Schema;
use BlueSpice\Data\FieldType;
use BlueSpice\ExtendedStatistics\EntityConfig\Collection;
use BlueSpice\CategoryManager\Entity\Collection\CategorizedPages as Entity;

class CategorizedPages extends Collection {

	/**
	 *
	 * @return string
	 */
	protected function get_TypeMessageKey() {
		return 'bs-categorymanager-collection-type-categorizedpages';
	}

	/**
	 *
	 * @return array
	 */
	protected function get_VarMessageKeys() {
		return array_merge( parent::get_VarMessageKeys(), [
			Entity::ATTR_NAMESPACE_NAME => 'bs-categorymanager-collection-var-namespacename',
			Entity::ATTR_CATEGORIZED_PAGES => 'bs-categorymanager-collection-var-categorizedpages',
			Entity::ATTR_UNCATEGORIZED_PAGES => 'bs-categorymanager-collection-var-uncategorizedpages',
		] );
	}

	/**
	 *
	 * @return string[]
	 */
	protected function get_Modules() {
		return array_merge( parent::get_Modules(), [
			'ext.bluespice.categorymanager.collection.categorizedpages',
		] );
	}

	/**
	 *
	 * @return string
	 */
	protected function get_EntityClass() {
		return "\\BlueSpice\\CategoryManager\\Entity\\Collection\\CategorizedPages";
	}

	/**
	 *
	 * @return array
	 */
	protected function get_AttributeDefinitions() {
		$attributes = array_merge( parent::get_AttributeDefinitions(), [
			Entity::ATTR_NAMESPACE_NAME => [
				Schema::FILTERABLE => true,
				Schema::SORTABLE => true,
				Schema::TYPE => FieldType::STRING,
				Schema::INDEXABLE => true,
				Schema::STORABLE => true,
			],
			Entity::ATTR_CATEGORIZED_PAGES => [
				Schema::FILTERABLE => true,
				Schema::SORTABLE => true,
				Schema::TYPE => FieldType::INT,
				Schema::INDEXABLE => true,
				Schema::STORABLE => true,
				Schema::PRIMARY => true,
			],
			Entity::ATTR_CATEGORIZED_PAGES_AGGREGATED => [
				Schema::FILTERABLE => true,
				Schema::SORTABLE => true,
				Schema::TYPE => FieldType::INT,
				Schema::INDEXABLE => true,
				Schema::STORABLE => true,
			],
			Entity::ATTR_UNCATEGORIZED_PAGES => [
				Schema::FILTERABLE => true,
				Schema::SORTABLE => true,
				Schema::TYPE => FieldType::INT,
				Schema::INDEXABLE => true,
				Schema::STORABLE => true,
				Schema::PRIMARY => true,
			],
			Entity::ATTR_UNCATEGORIZED_PAGES_AGGREGATED => [
				Schema::FILTERABLE => true,
				Schema::SORTABLE => true,
				Schema::TYPE => FieldType::INT,
				Schema::INDEXABLE => true,
				Schema::STORABLE => true,
			],
		] );
		return $attributes;
	}

}
