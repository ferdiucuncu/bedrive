<?php

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Str;
use Symfony\Component\Console\Output\ConsoleOutput;

return new class extends Migration {
    public function up()
    {
        $appModels = collect(File::allFiles(app_path()))
            ->filter(function (SplFileInfo $item) {
                $path = $item->getRelativePathName();
                if (Str::startsWith(strtolower($path), ['http', 'database'])) {
                    return false;
                }
                return $item->getExtension() === 'php';
            })
            ->map(function ($item) {
                $path = $item->getRelativePathName();
                $class = sprintf(
                    '\%s%s',
                    'App\\',
                    strtr(substr($path, 0, strrpos($path, '.')), '/', '\\'),
                );

                return $class;
            });

        $commonModels = collect(File::allFiles(base_path('common')))
            ->filter(function (SplFileInfo $item) {
                $path = strtolower($item->getPathname());
                return $item->getExtension() === 'php' &&
                    (!str_contains($path, 'resources') &&
                        !str_contains($path, 'controllers'));
            })
            ->map(function ($item) {
                $path = $item->getRelativePathName();
                $class = sprintf(
                    '\%s%s',
                    'Common\\',
                    strtr(substr($path, 0, strrpos($path, '.')), '/', '\\'),
                );

                return $class;
            });

        $models = $appModels->merge($commonModels)->filter(function ($class) {
            $valid = false;

            if (
                str_contains(strtolower($class), 'workspace') &&
                !config('common.site.workspaces_integrated')
            ) {
                return false;
            }

            try {
                if (class_exists($class)) {
                    $reflection = new ReflectionClass($class);
                    $valid =
                        $reflection->isSubclassOf(Model::class) &&
                        !$reflection->isAbstract();
                }
            } catch (Error $error) {
                // ignore
            }

            return $valid;
        });

        $tables = [
            'permissionables' => 'permissionable_type',
            'comments' => 'commentable_type',
            'custom_domains' => 'resource_type',
            'file_entry_models' => 'model_type',
            'taggables' => 'taggable_type',
            'link_clicks' => 'linkeable_type',
            'linkeable_rules' => 'linkeable_type',
            'channelables' => 'channelable_type',
            'creditables' => 'creditable_type',
            'listables' => 'listable_type',
            'genreables' => 'genreable_type',
            'activity' => 'subject_type',
            'bans' => ['bannable_type', 'created_by_type'],
            'images' => 'model_type',
            'news_article_models' => 'model_type',
            'notifications' => 'notifiable_type',
            'personal_access_tokens' => 'tokenable_type',
            'profile_links' => 'linkeable_type',
            'reviews' => 'reviewable_type',
        ];

        $output = new ConsoleOutput();

        foreach ($tables as $table => $_column) {
            if (Schema::hasTable($table)) {
                $columns = is_array($_column) ? $_column : [$_column];
                foreach ($columns as $column) {
                    foreach ($models as $model) {
                        $output->write(
                            "Updating $table.$column to $model",
                            true,
                        );
                        try {
                            $constant_reflex = new ReflectionClassConstant(
                                $model,
                                'MODEL_TYPE',
                            );
                            $modelType = $constant_reflex->getValue();
                        } catch (ReflectionException $e) {
                            $modelType = null;
                        }

                        $model = trim($model, '\\');

                        if ($modelType) {
                            $base = DB::table($table)->where(function (
                                $builder,
                            ) use ($column, $model) {
                                $builder
                                    ->where($column, $model)
                                    ->orWhere(
                                        $column,
                                        str_replace(
                                            'App\Models',
                                            'App',
                                            $model,
                                        ),
                                    );
                            });

                            $lastId = $base->clone()->max('id');

                            if (ctype_digit($lastId)) {
                                $lastId = (int) $lastId;
                            } else {
                                $lastId = 10000;
                            }

                            // update 10000 rows at a time
                            for ($i = 0; $i < $lastId; $i += 10000) {
                                $base
                                    ->clone()
                                    ->where('id', '>', $i)
                                    ->where('id', '<=', $i + 10000)
                                    ->update([$column => $modelType]);
                            }
                        }
                    }
                }
            }
        }
    }

    public function down()
    {
    }
};
