import React, { useState } from "react"
import { User } from "../types"

type EditUserProps = {
  user: User;
  onSave: (user: User) => void;
  onCancel: () => void;
}

export default function EditUser({ user, onSave, onCancel }: EditUserProps) {
  const [formData, setFormData] = useState<User>(user);
  const [errors, setErrors] = useState<{first_name?: string; last_name?: string; email?: string}>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    if (errors[name as keyof typeof errors]) {
      setErrors({ ...errors, [name]: undefined })
    }
  };

  const validateForm = (): boolean => {
    const newErrors: {first_name?: string; last_name?: string; email?: string} = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required";
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
      <h2>Edit User</h2>

      <label htmlFor="edit-user-first-name">
        First Name:
        <input
          id="edit-user-first-name"
          className="input"
          name="first_name"
          value={formData.first_name}
          onChange={handleChange}
          required
          aria-invalid={!!errors.first_name}
          aria-describedby={errors.first_name ? "edit-user-first-name-error" : undefined}
        />
        {errors.first_name && (
          <span id="edit-user-first-name-error" style={{ color: 'red', fontSize: '0.875rem' }}>
            {errors.first_name}
          </span>
        )}
      </label>

      <label htmlFor="edit-user-last-name">
        Last Name:
        <input
          id="edit-user-last-name"
          className="input"
          name="last_name"
          value={formData.last_name}
          onChange={handleChange}
          required
          aria-invalid={!!errors.last_name}
          aria-describedby={errors.last_name ? "edit-user-last-name-error" : undefined}
        />
        {errors.last_name && (
          <span id="edit-user-last-name-error" style={{ color: 'red', fontSize: '0.875rem' }}>
            {errors.last_name}
          </span>
        )}
      </label>

      <label htmlFor="edit-user-email">
        Email:
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
        />
        {errors.email && (
          <span id="edit-user-email-error" style={{ color: 'red', fontSize: '0.875rem' }}>
            {errors.email}
          </span>
        )}
      </label>

      <label htmlFor="edit-user-role">
        Role:
        <select
          id="edit-user-role"
          className="select"
          name="role"
          value={formData.role}
          onChange={handleChange}
          required
        >
          <option value="staff">Staff</option>
          <option value="registrar">Registrar</option>
          <option value="admin">Admin</option>
        </select>
      </label>

      <div style={{ marginTop: "1rem" }}>
        <button type="submit" className="btn primary">Save</button>
        <button type="button" className="btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}