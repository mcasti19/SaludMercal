<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\DepartmentRequest;
use App\Http\Resources\CatalogResource;
use App\Models\Department;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class DepartmentController extends CatalogController
{
    protected function model(): string
    {
        return Department::class;
    }

    protected function isInUse(Model $model): bool
    {
        return $model->patients()->exists();
    }

    public function show(Department $department): CatalogResource
    {
        return $this->showModel($department);
    }

    public function store(DepartmentRequest $request): JsonResponse
    {
        return $this->storeModel($request->validated());
    }

    public function update(DepartmentRequest $request, Department $department): CatalogResource
    {
        return $this->updateModel($department, $request->validated());
    }

    public function destroy(Department $department): JsonResponse|Response
    {
        return $this->destroyModel($department);
    }
}
