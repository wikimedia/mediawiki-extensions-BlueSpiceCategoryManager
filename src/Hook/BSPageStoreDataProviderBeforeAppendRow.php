<?php

namespace BlueSpice\CategoryManager\Hook;

use BlueSpice\CategoryManager\Data\Page\PrimaryDataProvider;
use BlueSpice\CategoryManager\Data\Page\Record;
use BlueSpice\Hook;
use MediaWiki\Config\Config;
use MediaWiki\Context\IContextSource;
use MediaWiki\Title\Title;

abstract class BSPageStoreDataProviderBeforeAppendRow extends Hook {

	/**
	 * @var PrimaryDataProvider
	 */
	protected $dataProvider = null;

	/**
	 * @var Record
	 */
	protected $record = null;

	/**
	 * @var Title
	 */
	protected $title = null;

	/**
	 * @param PrimaryDataProvider $dataProvider
	 * @param Record $record
	 * @param Title $title
	 * @return bool
	 */
	public static function callback( $dataProvider, $record, $title ) {
		$className = static::class;
		$hookHandler = new $className(
			null,
			null,
			$dataProvider,
			$record,
			$title
		);
		return $hookHandler->process();
	}

	/**
	 * @param IContextSource $context
	 * @param Config $config
	 * @param PrimaryDataProvider $dataProvider
	 * @param Record $record
	 * @param Title $title
	 * @return bool
	 */
	public function __construct( $context, $config, $dataProvider, $record, $title ) {
		parent::__construct( $context, $config );

		$this->dataProvider = $dataProvider;
		$this->record = $record;
		$this->title = $title;
	}
}
