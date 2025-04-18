<?php
/**
 * Hook handler base class for BlueSpice hook BSPageStoreDataProviderBeforeAppendRow
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.
 *
 * This file is part of BlueSpice MediaWiki
 * For further information visit https://bluespice.com
 *
 * @author     Patric Wirth
 * @package    BlueSpiceCategoryManager
 * @copyright  Copyright (C) 2020 Hallo Welt! GmbH, All rights reserved.
 * @license    http://www.gnu.org/copyleft/gpl.html GPL-3.0-only
 * @filesource
 */
namespace BlueSpice\CategoryManager\Hook;

use BlueSpice\CategoryManager\Data\Page\PrimaryDataProvider;
use BlueSpice\CategoryManager\Data\Page\Record;
use BlueSpice\Hook;
use MediaWiki\Config\Config;
use MediaWiki\Context\IContextSource;
use MediaWiki\Title\Title;

abstract class BSPageStoreDataProviderBeforeAppendRow extends Hook {

	/**
	 *
	 * @var PrimaryDataProvider
	 */
	protected $dataProvider = null;

	/**
	 *
	 * @var Record
	 */
	protected $record = null;

	/**
	 *
	 * @var Title
	 */
	protected $title = null;

	/**
	 *
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
	 *
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
