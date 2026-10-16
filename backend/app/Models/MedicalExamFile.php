<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MedicalExamFile extends Model
{
    protected $fillable = ['medical_exam_id', 'path', 'original_name', 'mime_type', 'size'];

    protected function casts(): array
    {
        return ['size' => 'integer'];
    }

    public function exam(): BelongsTo
    {
        return $this->belongsTo(MedicalExam::class, 'medical_exam_id');
    }
}

