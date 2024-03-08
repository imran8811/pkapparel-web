<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get('/', function () {
    return view('home');
});
Route::get('/about', function () {
    return view('about');
});
Route::get('/factory', function () {
    return view('factory');
});
Route::get('/contact', function () {
    return view('contact');
});
Route::get('/certifications', function () {
    return view('certifications');
});
Route::get('/blog', function () {
    return view('blog');
});
Route::get('/bulk-jeans', function () {
    return view('posts/bulk-jeans');
});
Route::get('/jean-manufacturers', function () {
    return view('posts/jean-manufacturers');
});
Route::get('/jeans-manufacturers', function () {
    return view('posts/jeans-manufacturers');
});
Route::get('/jeans-manufacturing-cost', function () {
    return view('posts/jeans-manufacturing-cost');
});
Route::get('/jeans-pants-manufacturers', function () {
    return view('posts/jeans-pants-manufacturers');
});
Route::get('/jeans-wholesale', function () {
    return view('posts/jeans-wholesale');
});
Route::get('/kevlar-jeans-manufacturers', function () {
    return view('posts/kevlar-jeans-manufacturers');
});
Route::get('/wholesale-denim-jeans-suppliers', function () {
    return view('posts/wholesale-denim-jeans-suppliers');
});
Route::get('/wholesale-jeans-bulk', function () {
    return view('posts/wholesale-jeans-bulk');
});
Route::get('/wholesale-jeans-manufacturers', function () {
    return view('posts/wholesale-jeans-manufacturers');
});
Route::get('/wholesale-women-jeans', function () {
    return view('posts/wholesale-women-jeans');
});
Route::get('/men/jeans-pants', function () {
    return view('components/men/jeans-pants');
});
Route::get('/men/jeans-pants/{id}', function () {
    return view('components/product-details');
});

Route::get('/dashboard', function () {
    return view('dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
