<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * 新規登録処理
     * ユーザー名とメールアドレスの重複をチェックする
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function register(Request $request)
    {
        $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                'unique:users,name',
            ],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                'unique:users,email',
            ],
            'password' => 'required|string|min:8',
        ], [
            'name.unique' => 'こちらのユーザー名はすでに利用されています',
            'email.unique' => 'こちらのメールアドレスはすでに利用されています',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user,
        ], 201);
    }

    /**
     * ログイン処理
     * メールアドレスまたはユーザー名とパスワードで認証を行う
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     * @throws ValidationException
     */
    public function login(Request $request)
    {
        $request->validate([
            'login' => 'required|string',
            'password' => 'required',
        ]);

        // メールアドレス形式かどうかを判定
        $isEmail = filter_var($request->login, FILTER_VALIDATE_EMAIL) !== false;

        // メールアドレスの場合はemailで検索、そうでない場合はnameで検索
        $user = $isEmail
            ? User::where('email', $request->login)->first()
            : User::where('name', $request->login)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'login' => ['ログインに失敗しました。'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function user(Request $request)
    {
        return $request->user();
    }
}
