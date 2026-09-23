<?php

namespace App\Traits;

use App\Services\AuditService;

trait Auditable
{
    public static function bootAuditable(): void
    {
        static::created(function ($model) {
            AuditService::log(
                action: 'created',
                model: $model,
                oldValues: null,
                newValues: $model->getAttributes(),
                description: class_basename($model) . ' #' . $model->getKey() . ' created'
            );
        });

        static::updated(function ($model) {
            $changes = $model->getChanges();
            unset($changes['updated_at']);

            if (! empty($changes)) {
                $oldValues = array_intersect_key($model->getOriginal(), $changes);
                AuditService::log(
                    action: 'updated',
                    model: $model,
                    oldValues: $oldValues,
                    newValues: $changes,
                    description: class_basename($model) . ' #' . $model->getKey() . ' updated'
                );
            }
        });

        static::deleted(function ($model) {
            AuditService::log(
                action: 'deleted',
                model: $model,
                oldValues: $model->getOriginal(),
                newValues: null,
                description: class_basename($model) . ' #' . $model->getKey() . ' deleted'
            );
        });
    }
}
