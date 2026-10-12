<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\CatalogResource;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

/**
 * Shared CRUD behaviour for lookup tables (departments, locations, specialties).
 */
abstract class CatalogController extends Controller
{
    /** @return class-string<Model> */
    abstract protected function model(): string;

    /** Whether other records still reference the given row. */
    abstract protected function isInUse(Model $model): bool;

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', $this->model());

        $query = $this->model()::query()
            ->when($request->filled('search'), fn ($q) => $q->whereRaw('LOWER(name) LIKE ?', ['%'.mb_strtolower($request->string('search')->toString()).'%']))
            ->when($request->has('is_active'), fn ($q) => $q->where('is_active', $request->boolean('is_active')))
            ->orderBy('name');

        return CatalogResource::collection($query->paginate($this->perPage($request)));
    }

    protected function showModel(Model $model): CatalogResource
    {
        $this->authorize('view', $model);

        return new CatalogResource($model);
    }

    /** @param array<string, mixed> $data */
    protected function storeModel(array $data): JsonResponse
    {
        $this->authorize('create', $this->model());

        return (new CatalogResource($this->model()::create($data)))
            ->response()->setStatusCode(201);
    }

    /** @param array<string, mixed> $data */
    protected function updateModel(Model $model, array $data): CatalogResource
    {
        $this->authorize('update', $model);
        $model->update($data);

        return new CatalogResource($model->refresh());
    }

    protected function destroyModel(Model $model): JsonResponse|Response
    {
        $this->authorize('delete', $model);

        if ($this->isInUse($model)) {
            return response()->json(['message' => 'This record is in use and cannot be deleted. Deactivate it instead.'], 409);
        }

        $model->delete();

        return response()->noContent();
    }
}
