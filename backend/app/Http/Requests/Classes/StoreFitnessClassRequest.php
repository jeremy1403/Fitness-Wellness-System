<?php

namespace App\Http\Requests\Classes;

use Illuminate\Foundation\Http\FormRequest;

class StoreFitnessClassRequest extends FormRequest
{
    // // 权限验证：确定当前用户是否有权执行此操作
    // public function authorize(): bool
    // {
    //     // 示例：只有管理员可以创建课程
    //     // return $this->user()->is_admin;
    //     return true;
    // }

    protected function prepareForValidation()
    {
        $this->merge([
            'description' => strip_tags($this->description),
        ]);
    }

    // 验证规则
    public function rules(): array
    {
        return [
            'title' => 'required|string|max:100', // 限制长度防止数据库溢出或拒绝服务攻击
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
