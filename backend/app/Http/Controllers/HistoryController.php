<?php

namespace App\Http\Controllers;

use App\Models\SearchHistory;
use Illuminate\Http\Request;

class HistoryController extends Controller
{
    public function index(Request $request)
    {
        return $request->user()->searchHistories()
            ->orderByDesc('created_at')
            ->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address_text' => 'required|string|max:500',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'radius_meter' => 'required|integer|min:0',
        ]);

        $history = $request->user()->searchHistories()->create($validated);

        return response()->json($history, 201);
    }

    /**
     * 検索履歴を更新する
     * 
     * @param Request $request
     * @param SearchHistory $history
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, SearchHistory $history)
    {
        // ユーザーが所有している履歴か確認
        if ($request->user()->id !== $history->user_id) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address_text' => 'required|string|max:500',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'radius_meter' => 'required|integer|min:0',
        ]);

        $history->update($validated);

        return response()->json($history);
    }

    public function destroy(Request $request, SearchHistory $history)
    {
        if ($request->user()->id !== $history->user_id) {
            abort(403);
        }

        $history->delete();

        return response()->noContent();
    }
}
