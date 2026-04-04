<?php

namespace App\Http\Requests\Classes;

use Illuminate\Foundation\Http\FormRequest;

class StoreFitnessClassRequest extends FormRequest
{
    // 权限验证：确定当前用户是否有权执行此操作
    public function authorize(): bool
    {
        // 示例：只有管理员可以创建课程
        // return $this->user()->is_admin; 
        return true; 
    }

    // 验证规则
    public function rules(): array
    {
        return [
            'title' => 'required|string|max:100', // 限制长度防止数据库溢出或拒绝服务攻击
            'description' => 'nullable|string|max:1000',
            'duration_minutes' => 'sometimes|integer|min:15|max:480',
            'setup_mode'       => 'sometimes|in:simple,automated',
            'class_type'       => 'sometimes|in:Yoga,Spin,HIIT,General',
            
        ];
    }
    
    // 自定义错误消息（可选）
    public function messages(): array
    {
        return [
            'title.required' => '课程标题是必填的。',
            'duration_minutes.min' => '课程时长至少需要15分钟。',
        ];
    }
}