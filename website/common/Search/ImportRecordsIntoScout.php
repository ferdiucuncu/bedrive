<?php

namespace Common\Search;

use Algolia\AlgoliaSearch\Config\SearchConfig;
use Algolia\AlgoliaSearch\SearchClient as Algolia;
use App\Models\User;
use Common\Search\Drivers\Mysql\MysqlFullTextIndexer;
use Exception;
use Illuminate\Support\Facades\Artisan;
use Laravel\Scout\Console\ImportCommand;
use MeiliSearch\Client;

class ImportRecordsIntoScout
{
    public function execute(
        string $modelToImport = '*',
        string $driver = null,
    ): void {
        @set_time_limit(0);
        @ini_set('memory_limit', '200M');

        if ($selectedDriver = $driver) {
            config()->set('scout.driver', $selectedDriver);
        }
        $driver = config('scout.driver');

        $models =
            $modelToImport === '*'
                ? self::getSearchableModels()
                : [$modelToImport];

        if ($driver === 'mysql') {
            foreach ($models as $model) {
                app(MysqlFullTextIndexer::class)->createOrUpdateIndex($model);
            }
        } elseif ($driver === 'meilisearch') {
            $this->configureMeilisearchIndices($models);
        } elseif ($driver === 'algolia') {
            $this->configureAlgoliaIndices($models);
        }

        $this->importUsingDefaultScoutCommand($models);
    }

    public static function getSearchableModels(): array
    {
        $appSearchableModels = config('searchable_models');
        $commonSearchableModels = [User::class];

        return array_merge($appSearchableModels ?? [], $commonSearchableModels);
    }

    private function importUsingDefaultScoutCommand(array $models): void
    {
        Artisan::registerCommand(app(ImportCommand::class));
        foreach ($models as $model) {
            $model = addslashes($model);
            Artisan::call("scout:import \"$model\"");
        }
    }

    private function configureAlgoliaIndices(array $models): void
    {
        $config = SearchConfig::create(
            config('scout.algolia.id'),
            config('scout.algolia.secret'),
        );

        $algolia = Algolia::createWithConfig($config);
        foreach ($models as $model) {
            $filterableFields = $model::filterableFields();

            // keep ID searchable as there are issues with scout otherwise
            if (($key = array_search('id', $filterableFields)) !== false) {
                unset($filterableFields[$key]);
            }

            $model = new $model();
            $indexName = $model->searchableAs();
            $algolia->initIndex($indexName)->setSettings([
                'attributesForFaceting' => array_values(
                    array_map(
                        fn($field) => "filterOnly($field)",
                        $filterableFields,
                    ),
                ),
            ]);
        }
    }

    private function configureMeilisearchIndices(array $models): void
    {
        foreach ($models as $modelName) {
            $model = new $modelName();
            $indexName = $model->searchableAs();
            $index = app(Client::class)->index($indexName);

            if ($modelConfig = config("search.meilisearch.$modelName")) {
                $index->updateSettings($modelConfig);
            }

            $searchableFields = array_merge(
                ['id'],
                $model->getSearchableKeys(),
            );
            $displayedFields = $searchableFields;
            try {
                app(Client::class)
                    ->index($indexName)
                    ->delete();
            } catch (Exception $e) {
                //
            }
            app(Client::class)
                ->index($indexName)
                ->updateSearchableAttributes($searchableFields);
            app(Client::class)
                ->index($indexName)
                ->updateFilterableAttributes($model::filterableFields());
            app(Client::class)
                ->index($indexName)
                ->updateDisplayedAttributes($displayedFields);
        }
    }
}
