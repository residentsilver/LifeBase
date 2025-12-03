<?php

namespace App\Http\Controllers;

use App\Models\Genre;
use Illuminate\Http\Request;

class GenreController extends Controller
{
    public function index(Request $request)
    {
        return $request->user()->genres()
            ->orderByDesc('last_used_at')
            ->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $genre = $request->user()->genres()->create($validated);

        return response()->json($genre, 201);
    }

    public function update(Request $request, Genre $genre)
    {
        if ($request->user()->id !== $genre->user_id) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $genre->update($validated);

        return response()->json($genre);
    }

    public function destroy(Request $request, Genre $genre)
    {
        if ($request->user()->id !== $genre->user_id) {
            abort(403);
        }

        $genre->delete();

        return response()->noContent();
    }
}
