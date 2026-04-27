<?php

namespace App\Http\Requests\Classes;

use Illuminate\Foundation\Http\FormRequest;

class StoreFitnessClassRequest extends FormRequest
{

    protected function prepareForValidation()
    {
        $this->merge([
            'description' => strip_tags($this->description),
        ]);
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string|max:100', 
            'description' => 'nullable|string|max:1000',
            'duration_minutes' => 'sometimes|integer|min:15|max:480',
            'status' => 'required|in:active,inactive',
            'user_id' => 'nullable|integer',
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'Please provide a class name.',
            'duration_minutes.min' => 'The course duration must be at least 15 minutes.',
            'status.required' => 'Please select a status.',
        ];
    }
}
