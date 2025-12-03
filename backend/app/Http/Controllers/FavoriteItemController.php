<?php

namespace App\Http\Controllers;

use App\Models\FavoriteItem;
use Illuminate\Http\Request;

class FavoriteItemController extends Controller
{
    public function index(Request $request)
    {
        return $request->user()->favoriteItems()
            ->with('genre')
            ->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'genre_id' => 'required|exists:genres,id',
            'keyword' => 'required|string|max:255',
        ]);

        // Ensure genre belongs to user
        $genre = $request->user()->genres()->findOrFail($validated['genre_id']);

        $item = $request->user()->favoriteItems()->create($validated);

        return response()->json($item, 201);
    }

    public function update(Request $request, FavoriteItem $favoriteItem)
    {
        if ($request->user()->id !== $favoriteItem->user_id) {
            abort(403);
        }

        $validated = $request->validate([
            'genre_id' => 'sometimes|exists:genres,id',
            'keyword' => 'sometimes|string|max:255',
        ]);

        if (isset($validated['genre_id'])) {
            $request->user()->genres()->findOrFail($validated['genre_id']);
        }

        $favoriteItem->update($validated);

        return response()->json($favoriteItem);
    }

    public function destroy(Request $request, FavoriteItem $favoriteItem)
    {
        if ($request->user()->id !== $favoriteItem->user_id) {
            abort(403);
        }

        $favoriteItem->delete();

        return response()->noContent();
    }
}
