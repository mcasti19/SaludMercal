<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** Generic resource for Department, Location and Specialty. */
class CatalogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return $this->resource->only(array_merge(
            ['id'],
            array_diff(array_keys($this->resource->getAttributes()), ['id', 'created_at', 'updated_at']),
        )) + ['created_at' => $this->created_at?->toIso8601String()];
    }
}
