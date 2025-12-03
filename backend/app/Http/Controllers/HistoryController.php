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

    /**
     * 複数の検索履歴を一括削除する
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'required|integer|exists:search_histories,id',
        ]);

        $user = $request->user();
        $ids = $validated['ids'];

        // ユーザーが所有している履歴のみを取得
        $histories = $user->searchHistories()->whereIn('id', $ids)->get();

        // 所有権を確認（念のため）
        if ($histories->count() !== count($ids)) {
            abort(403, 'Some histories do not belong to the user');
        }

        // 削除前の件数を保存
        $deletedCount = $histories->count();

        // 一括削除
        $histories->each(function ($history) {
            $history->delete();
        });

        return response()->json([
            'message' => 'Histories deleted successfully',
            'deleted_count' => $deletedCount,
        ]);
    }
}
