<?php

namespace Common\Channels;

use App\Models\Channel;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class GenerateChannelsFromConfig
{
    public function execute(array $configPaths): Channel|null
    {
        $ids = Channel::where('type', 'channel')->pluck('id');
        DB::table('channelables')
            ->whereIn('channel_id', $ids)
            ->delete();
        Channel::whereIn('id', $ids)->delete();

        foreach ($configPaths as $configPath) {
            $configs = json_decode(file_get_contents($configPath), true);

            $createdChannels = [];

            foreach ($configs as $config) {
                $nestedChannelSlugs = Arr::pull($config, 'nestedChannels');
                $channel = Channel::create(
                    array_merge($config, [
                        'type' => 'channel',
                        'public' => true,
                        'internal' => false,
                    ]),
                );
                $createdChannels[] = [
                    'parent' => $channel,
                    'nestedChannelSlugs' => $nestedChannelSlugs,
                ];
            }

            foreach ($createdChannels as $createdChannel) {
                if (isset($createdChannel['nestedChannelSlugs'])) {
                    foreach ($createdChannel['nestedChannelSlugs'] as $slug) {
                        $nestedChannel = Channel::where('slug', $slug)->first();
                        $createdChannel['parent']
                            ->channels()
                            ->attach($nestedChannel->id);
                    }
                }
            }

            $homeChannel = Arr::first(
                $createdChannels,
                fn($c) => $c['parent']->slug === 'homepage',
            );

            if (isset($homeChannel)) {
                return $homeChannel['parent'];
            }
        }
    }
}
