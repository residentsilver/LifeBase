<?php

use App\Http\Controllers\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    Route::apiResource('genres', \App\Http\Controllers\GenreController::class);
    Route::apiResource('favorite-items', \App\Http\Controllers\FavoriteItemController::class);

    Route::post('/search/nearby', [\App\Http\Controllers\SearchController::class, 'search']);
    Route::apiResource('histories', \App\Http\Controllers\HistoryController::class)->only(['index', 'store', 'update', 'destroy']);
});
