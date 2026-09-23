<?php

namespace App\Observers;

use App\Services\AuditService;
use Illuminate\Database\Eloquent\Model;

class AuditObserver
{
    public function created(Model $model): void
    {
        AuditService::log(
            action: 'created',
            model: $model,
            oldValues: null,
            newValues: $model->getAttributes(),
            description: class_basename($model) . ' #' . $model->getKey() . ' created'
        );
    }

    public function updated(Model $model): void
    {
        $changes = $model->getChanges();
        unset($changes['updated_at']);

        if (empty($changes)) {
            return;
        }

        $oldValues = array_intersect_key($model->getOriginal(), $changes);

        AuditService::log(
            action: 'updated',
            model: $model,
            oldValues: $oldValues,
            newValues: $changes,
            description: class_basename($model) . ' #' . $model->getKey() . ' updated'
        );
    }

    public function deleted(Model $model): void
    {
        AuditService::log(
            action: 'deleted',
            model: $model,
            oldValues: $model->getOriginal(),
            newValues: null,
            description: class_basename($model) . ' #' . $model->getKey() . ' deleted'
        );
    }
}
