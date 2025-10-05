import React, { useState, useEffect } from "react"
import { User, UserRole } from "../types"

type AddUserProps = {
  user: User;
  currentUser: User;
  onSave: (user: User) => void;
  onCancel: () => void;
}

export default function AddUser({ user, currentUser, onSave, onCancel }: AddUserProps) {
    const [formData, setFormData] = useState<User>(user)
    const [errors, setErrors] = useState<Partial<Record<'first_name' | 'last_name' | 'email', string>>>({});

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;

        if (name === 'role') {
          setFormData(prev => ({ ...prev, role: value as UserRole }));
        } else if (name === 'first_name' || name === 'last_name' || name === 'email') {
          setFormData(prev => ({ ...prev, [name]: value }));
          setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<Record<'first_name' | 'last_name' | 'email', string>> = {};

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
      <h2>Add User</h2>

      <label htmlFor="add-user-first-name">
        First Name:
        {/* Use empty string as a fallback for value to avoid uncontrolled component warning */}
        <input
          id="add-user-first-name"
          className="input"
          name="first_name"
          value={formData.first_name || ''}
          onChange={handleChange}
          required
          aria-invalid={!!errors.first_name}
          aria-describedby={errors.first_name ? "add-user-first-name-error" : undefined}
        />
        {errors.first_name && (
          <span id="add-user-first-name-error" style={{ color: 'red', fontSize: '0.875rem' }}>
            {errors.first_name}
          </span>
        )}
      </label>

      <label htmlFor="add-user-last-name">
        Last Name:
        <input
          id="add-user-last-name"
          className="input"
          name="last_name"
          value={formData.last_name || ''}
          onChange={handleChange}
          required
          aria-invalid={!!errors.last_name}
          aria-describedby={errors.last_name ? "add-user-last-name-error" : undefined}
        />
        {errors.last_name && (
          <span id="add-user-last-name-error" style={{ color: 'red', fontSize: '0.875rem' }}>
            {errors.last_name}
          </span>
        )}
      </label>
            <label htmlFor="add-user-first_name">
                First Name:
                <input
                    id="add-user-first_name"
                    className="input"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                    aria-invalid={!!errors.first_name}
                    aria-describedby={errors.first_name ? "add-user-first-error" : undefined}
                />
                {errors.first_name && (
                  <span id="add-user-first-error" style={{ color: 'red', fontSize: '0.875rem' }}>
                    {errors.first_name}
                  </span>
                )}
            </label>

            <label htmlFor="add-user-last_name">
                Last Name:
                <input
                    id="add-user-last_name"
                    className="input"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                    aria-invalid={!!errors.last_name}
                    aria-describedby={errors.last_name ? "add-user-last-error" : undefined}
                />
                {errors.last_name && (
                  <span id="add-user-last-error" style={{ color: 'red', fontSize: '0.875rem' }}>
                    {errors.last_name}
                  </span>
                )}
            </label>

      <label htmlFor="add-user-email">
        Email:
        <input
          id="add-user-email"
          className="input"
          name="email"
          type="email"
          value={formData.email || ''}
          onChange={handleChange}
          required
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "add-user-email-error" : undefined}
        />
        {errors.email && (
          <span id="add-user-email-error" style={{ color: 'red', fontSize: '0.875rem' }}>
            {errors.email}
          </span>
        )}
      </label>

      <label htmlFor="add-user-role">
        Role:
        <select
          id="add-user-role"
          className="select"
          name="role"
          value={formData.role}
          onChange={handleChange}
          required
        >
          <option value="Staff">Staff</option>
          {currentUser.role === "Admin" && (
            <>
              <option value="Registrar">Registrar</option>
              <option value="Admin">Admin</option>
            </>
          )}
        </select>
      </label>

      <div style={{ marginTop: "1rem" }}>
        <button type="submit" className="btn primary"
        style={{ marginRight: '10px' }}>
          Save
        </button>
        <button type="button" className="btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
