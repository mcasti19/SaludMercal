<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\AuditLogResource;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AuditLogController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', AuditLog::class);

        $logs = AuditLog::query()
            ->with('user')
            ->when($request->filled('user_id'), fn ($q) => $q->where('user_id', $request->integer('user_id')))
            ->when($request->filled('event'), fn ($q) => $q->where('event', $request->string('event')))
            ->when($request->filled('auditable_type'), fn ($q) => $q->where('auditable_type', 'like', '%\\'.$request->string('auditable_type')))
            ->when($request->filled('auditable_id'), fn ($q) => $q->where('auditable_id', $request->integer('auditable_id')))
            ->latest('id')
            ->paginate($this->perPage($request));

        return AuditLogResource::collection($logs);
    }
}
