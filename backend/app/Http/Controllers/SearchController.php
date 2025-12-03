<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SearchController extends Controller
{
    public function search(Request $request)
    {
        $validated = $request->validate([
            'address' => 'required|string',
            'radius_m' => 'required|integer|min:0|max:10000',
        ]);

        $apiKey = config('services.google_maps.key');
        if (!$apiKey) {
            return response()->json(['message' => 'API Key not configured'], 500);
        }

        // 1. Geocoding
        $geoResponse = Http::get('https://maps.googleapis.com/maps/api/geocode/json', [
            'address' => $validated['address'],
            'key' => $apiKey,
            'language' => 'ja',
        ]);

        if (!$geoResponse->successful() || empty($geoResponse->json('results'))) {
            return response()->json(['message' => 'Address not found'], 404);
        }

        $location = $geoResponse->json('results.0.geometry.location');
        $lat = $location['lat'];
        $lng = $location['lng'];
        $formattedAddress = $geoResponse->json('results.0.formatted_address');

        // 2. Get User Favorites
        $favorites = $request->user()->favoriteItems()->with('genre')->get();

        $results = [];

        // お気に入りアイテムが0件の場合は空の結果を返す
        if ($favorites->isEmpty()) {
            return response()->json([
                'status' => 'success',
                'search_point' => [
                    'lat' => $lat,
                    'lng' => $lng,
                    'address_resolved' => $formattedAddress,
                ],
                'results' => [],
            ]);
        }

        // 3. Search Places for each keyword
        foreach ($favorites as $item) {
            // ジャンルが削除されている場合はスキップ
            if (!$item->genre) {
                Log::warning("FavoriteItem {$item->id} has no genre, skipping");
                continue;
            }

            $response = Http::get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', [
                'location' => "{$lat},{$lng}",
                'radius' => $validated['radius_m'],
                'keyword' => $item->keyword,
                'key' => $apiKey,
                'language' => 'ja',
            ]);

            $stores = [];
            if ($response->successful()) {
                $places = $response->json('results', []);
                foreach ($places as $place) {
                    // 必要なデータが存在するかチェック
                    if (!isset($place['geometry']['location']['lat']) || !isset($place['geometry']['location']['lng'])) {
                        continue;
                    }

                    // Calculate distance (simple haversine or use geometry lib, but for now just raw data)
                    // Actually, we can calculate distance here or let frontend do it.
                    // Let's calculate simple distance.
                    $distance = $this->calculateDistance($lat, $lng, $place['geometry']['location']['lat'], $place['geometry']['location']['lng']);

                    if ($distance <= $validated['radius_m']) {
                        $stores[] = [
                            'name' => $place['name'] ?? '',
                            'latitude' => $place['geometry']['location']['lat'],
                            'longitude' => $place['geometry']['location']['lng'],
                            'distance_m' => round($distance),
                            'place_id' => $place['place_id'] ?? '',
                            'vicinity' => $place['vicinity'] ?? '',
                        ];
                    }
                }
            }

            // Sort stores by distance
            usort($stores, fn($a, $b) => $a['distance_m'] <=> $b['distance_m']);

            $results[] = [
                'favorite_keyword' => $item->keyword,
                'genre' => $item->genre->name,
                'stores' => $stores,
            ];
        }

        return response()->json([
            'status' => 'success',
            'search_point' => [
                'lat' => $lat,
                'lng' => $lng,
                'address_resolved' => $formattedAddress,
            ],
            'results' => $results,
        ]);
    }

    private function calculateDistance($lat1, $lon1, $lat2, $lon2)
    {
        $earthRadius = 6371000; // meters

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
            sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }
}
