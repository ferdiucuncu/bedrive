<?php

namespace Common\Channels;

use App\Models\Channel;
use Common\Core\BaseController;
use Illuminate\Support\Arr;
use Symfony\Component\HttpFoundation\Response;

class ChannelController extends BaseController
{
    public function index(): Response
    {
        $this->authorize('index', [
            Channel::class,
            request('userId'),
            request('type'),
        ]);

        $pagination = app(PaginateChannels::class)->execute(request()->all());

        return $this->success(['pagination' => $pagination]);
    }

    public function show(Channel $channel)
    {
        $this->authorize('show', $channel);

        $loader = request('loader', 'channelPage');

        $params = request()->all();
        if ($loader === 'editUserListPage') {
            $params['normalizeContent'] = true;
        } elseif ($loader === 'editChannelPage') {
            $params['normalizeContent'] = true;
            $params['perPage'] = 200;
        } elseif ($loader === 'channelPage') {
            // used as default value during SSR in layout selector button
            $channel->config = array_merge($channel->config, [
                'selectedLayout' => Arr::get(
                    $_COOKIE,
                    "channel-layout-{$channel->config['contentModel']}",
                    false,
                ),
                'seoTitle' => isset($channel->config['seoTitle'])
                    ? str_replace(
                        '{{site_name}}',
                        config('app.name'),
                        $channel->config['seoTitle'],
                    )
                    : $channel->name,
                'seoDescription' => isset($channel->config['seoDescription'])
                    ? str_replace(
                        '{{site_name}}',
                        config('app.name'),
                        $channel->config['seoDescription'],
                    )
                    : $channel->description ?? $channel->name,
            ]);
        }

        $channel->loadContent($params);

        // return only content for pagination
        if (request()->get('returnContentOnly')) {
            return [
                'pagination' => $channel->content,
            ];
        }

        return $this->renderClientOrApi([
            'pageName' => 'channel-page',
            'data' => [
                'channel' => $channel,
                'loader' => $loader,
            ],
        ]);
    }

    public function store(CrupdateChannelRequest $request): Response
    {
        $this->authorize('store', [Channel::class, request('type', 'channel')]);

        $channel = app(CrupdateChannel::class)->execute(
            $request->validationData(),
        );

        return $this->success(['channel' => $channel]);
    }

    public function update(
        Channel $channel,
        CrupdateChannelRequest $request,
    ): Response {
        $this->authorize('store', $channel);

        $channel = app(CrupdateChannel::class)->execute(
            $request->validationData(),
            $channel,
        );

        return $this->success(['channel' => $channel]);
    }

    public function destroy(string $ids): Response
    {
        $ids = explode(',', $ids);
        $channels = Channel::whereIn('id', $ids)->get();

        $this->authorize('destroy', [Channel::class, $channels]);

        app(DeleteChannels::class)->execute($channels);

        return $this->success();
    }

    public function updateContent(Channel $channel): Response
    {
        $this->authorize('update', $channel);

        if ($newConfig = request('channelConfig')) {
            $config = $channel->config;
            foreach ($newConfig as $key => $value) {
                $config[$key] = $value;
            }
            $channel->fill(['config' => $config])->save();
        }

        $channel->updateContentFromExternal();
        $channel->loadContent(request()->all());

        return $this->success([
            'channel' => $channel,
        ]);
    }

    public function searchForAddableContent(): Response
    {
        $this->authorize('index', Channel::class);

        $namespace = modelTypeToNamespace(request('modelType'));

        $builder = app($namespace);

        if (request('query')) {
            $builder = $builder->mysqlSearch(request('query'));
        }

        $results = $builder
            ->take(20)
            ->get()
            ->filter(function ($result) {
                if (request('modelType') === 'channel') {
                    // exclude user lists
                    return $result->type === 'channel';
                }
                return true;
            })
            ->map(fn($result) => $result->toNormalizedArray())
            ->slice(0, request('limit', 5))
            ->values();

        return $this->success(['results' => $results]);
    }

    public function resetToDefault()
    {
        $this->authorize('destroy', Channel::class);

        (new GenerateChannelsFromConfig())->execute([
            resource_path('defaults/channels/shared-channels.json'),
            resource_path('defaults/channels/default-channels.json'),
        ]);

        return $this->success();
    }
}
