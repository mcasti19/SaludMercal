<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Builder;

/**
 * Case-insensitive LIKE search that works on PostgreSQL and SQLite.
 */
trait SearchesColumns
{
    /**
     * @param  list<string>  $columns
     */
    public function scopeSearchColumns(Builder $query, ?string $term, array $columns): Builder
    {
        $term = trim((string) $term);

        if ($term === '') {
            return $query;
        }

        $like = '%'.str_replace(['%', '_'], ['\%', '\_'], mb_strtolower($term)).'%';

        return $query->where(function (Builder $q) use ($columns, $like) {
            foreach ($columns as $column) {
                $q->orWhereRaw("LOWER({$column}) LIKE ? ESCAPE '\\'", [$like]);
            }
        });
    }
}
