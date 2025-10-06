import React, { useState } from "react"
import { User } from "../types"

type EditUserProps = {
  user: User;
  onSave: (user: User) => void;
  onCancel: () => void;
}

export default function EditUser({ user, onSave, onCancel }: EditUserProps) {
  const [formData, setFormData] = useState<User & { password?: string }>(user);
  const [errors, setErrors] = useState<Partial<Record<'first_name' | 'last_name' | 'email' | 'password', string>>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (name === 'first_name' || name === 'last_name' || name === 'email' || name === 'password') {
      setFormData(prev => ({ ...prev, [name]: value }))
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<'first_name' | 'last_name' | 'email' | 'password', string>> = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required";
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = "Last name is required";
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = "Last name is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email must be valid";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  return (
    <form className="panel" onSubmit={handleSubmit}>
      <h2 style={{ marginBottom: '1rem' }}>Edit User</h2>

      <label htmlFor="edit-user-first_name" style={{ display: 'block', marginBottom: '1rem' }}>
        <div style={{ marginBottom: '0.5rem', fontWeight: 500 }}>First Name:</div>
        <input
          id="edit-user-first_name"
          className="input"
          name="first_name"
          value={formData.first_name}
          onChange={handleChange}
          required
          aria-invalid={!!errors.first_name}
          aria-describedby={errors.first_name ? "edit-user-first-error" : undefined}
          style={{ padding: '0.5rem', width: '100%', boxSizing: 'border-box' }}
        />
        {errors.first_name && (
          <span id="edit-user-first-error" style={{ color: 'red', fontSize: '0.875rem' }}>
            {errors.first_name}
          </span>
        )}
      </label>

      <label htmlFor="edit-user-last_name" style={{ display: 'block', marginBottom: '1rem' }}>
        <div style={{ marginBottom: '0.5rem', fontWeight: 500 }}>Last Name:</div>
        <input
          id="edit-user-last_name"
          className="input"
          name="last_name"
          value={formData.last_name}
          onChange={handleChange}
          required
          aria-invalid={!!errors.last_name}
          aria-describedby={errors.last_name ? "edit-user-last-error" : undefined}
          style={{ padding: '0.5rem', width: '100%', boxSizing: 'border-box' }}
        />
        {errors.last_name && (
          <span id="edit-user-last-error" style={{ color: 'red', fontSize: '0.875rem' }}>
            {errors.last_name}
          </span>
        )}
      </label>

      <label htmlFor="edit-user-email" style={{ display: 'block', marginBottom: '1rem' }}>
        <div style={{ marginBottom: '0.5rem', fontWeight: 500 }}>Email:</div>
        <input
          id="edit-user-email"
          className="input"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "edit-user-email-error" : undefined}
          style={{ padding: '0.5rem', width: '100%', boxSizing: 'border-box' }}
        />
        {errors.email && (
          <span id="edit-user-email-error" style={{ color: 'red', fontSize: '0.875rem' }}>
            {errors.email}
          </span>
        )}
      </label>

      <label htmlFor="edit-user-password" style={{ display: 'block', marginBottom: '1rem' }}>
        <div style={{ marginBottom: '0.5rem', fontWeight: 500 }}>Password (Optional):</div>
        <input
          id="edit-user-password"
          className="input"
          name="password"
          type="password"
          placeholder="Leave blank to keep current password"
          value={formData.password ?? ""}
          onChange={handleChange}
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "edit-user-password-error" : undefined}
          style={{ padding: '0.5rem', width: '100%', boxSizing: 'border-box' }}
        />
        {errors.password && (
          <span id="edit-user-password-error" style={{ color: 'red', fontSize: '0.875rem' }}>
            {errors.password}
          </span>
        )}
      </label>

      <div style={{ marginTop: "1rem", display: 'flex', gap: '0.5rem' }}>
        <button type="submit" className="btn primary">Save</button>
        <button type="button" className="btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
