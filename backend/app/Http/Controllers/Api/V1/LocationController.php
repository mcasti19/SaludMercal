<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\LocationRequest;
use App\Http\Resources\CatalogResource;
use App\Models\Location;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class LocationController extends CatalogController
{
    protected function model(): string
    {
        return Location::class;
    }

    protected function isInUse(Model $model): bool
    {
        return $model->patients()->exists() || $model->doctors()->exists();
    }

    public function show(Location $location): CatalogResource
    {
        return $this->showModel($location);
    }

    public function store(LocationRequest $request): JsonResponse
    {
        return $this->storeModel($request->validated());
    }

    public function update(LocationRequest $request, Location $location): CatalogResource
    {
        return $this->updateModel($location, $request->validated());
    }

    public function destroy(Location $location): JsonResponse|Response
    {
        return $this->destroyModel($location);
    }
}
