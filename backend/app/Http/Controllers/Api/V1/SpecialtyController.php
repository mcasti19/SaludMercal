<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\SpecialtyRequest;
use App\Http\Resources\CatalogResource;
use App\Models\Specialty;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class SpecialtyController extends CatalogController
{
    protected function model(): string
    {
        return Specialty::class;
    }

    protected function isInUse(Model $model): bool
    {
        return $model->doctors()->exists();
    }

    public function show(Specialty $specialty): CatalogResource
    {
        return $this->showModel($specialty);
    }

    public function store(SpecialtyRequest $request): JsonResponse
    {
        return $this->storeModel($request->validated());
    }

    public function update(SpecialtyRequest $request, Specialty $specialty): CatalogResource
    {
        return $this->updateModel($specialty, $request->validated());
    }

    public function destroy(Specialty $specialty): JsonResponse|Response
    {
        return $this->destroyModel($specialty);
    }
}
