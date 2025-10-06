import React, { useState, useEffect } from "react"
import { User, UserRole } from "../types"

type AddUserProps = {
  user: User;
  currentUser: User;
  onSave: (user: User & { password: string }) => void;
  onCancel: () => void;
}

export default function AddUser({ user, currentUser, onSave, onCancel }: AddUserProps) {
  const [formData, setFormData] = useState<User & { password?: string }>(user)
  const [errors, setErrors] = useState<Partial<Record<'first_name' | 'last_name' | 'email' | 'password', string>>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === 'role') {
      setFormData(prev => ({ ...prev, role: value as UserRole }));
    } else if (
      name === 'first_name' ||
      name === 'last_name' ||
      name === 'email' ||
      name === 'password'
    ) {
      setFormData(prev => ({ ...prev, [name]: value }));
      setErrors(prev => ({ ...prev, [name]: undefined }));
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

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email must be valid";
    }

    if (!formData.password || typeof formData.password !== 'string' || formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Remove id if present before sending
      const { id, ...userData } = formData;
      onSave(userData as User & { password: string });
    }
  };

  return (
    <form className="panel" onSubmit={handleSubmit}>
      <h2 style={{ marginBottom: '1rem' }}>Add User</h2>

      <label htmlFor="add-user-first-name" style={{ display: 'block', marginBottom: '1rem' }}>
        <div style={{ marginBottom: '0.5rem', fontWeight: 500 }}>First Name:</div>
        <input
          id="add-user-first-name"
          className="input"
          name="first_name"
          value={formData.first_name || ''}
          onChange={handleChange}
          required
          aria-invalid={!!errors.first_name}
          aria-describedby={errors.first_name ? "add-user-first-name-error" : undefined}
          style={{ padding: '0.5rem', width: '100%', boxSizing: 'border-box' }}
        />
        {errors.first_name && (
          <span id="add-user-first-name-error" style={{ color: 'red', fontSize: '0.875rem' }}>
            {errors.first_name}
          </span>
        )}
      </label>

      <label htmlFor="add-user-last-name" style={{ display: 'block', marginBottom: '1rem' }}>
        <div style={{ marginBottom: '0.5rem', fontWeight: 500 }}>Last Name:</div>
        <input
          id="add-user-last-name"
          className="input"
          name="last_name"
          value={formData.last_name || ''}
          onChange={handleChange}
          required
          aria-invalid={!!errors.last_name}
          aria-describedby={errors.last_name ? "add-user-last-name-error" : undefined}
          style={{ padding: '0.5rem', width: '100%', boxSizing: 'border-box' }}
        />
        {errors.last_name && (
          <span id="add-user-last-name-error" style={{ color: 'red', fontSize: '0.875rem' }}>
            {errors.last_name}
          </span>
        )}
      </label>
      <label htmlFor="add-user-email" style={{ display: 'block', marginBottom: '1rem' }}>
        <div style={{ marginBottom: '0.5rem', fontWeight: 500 }}>Email:</div>
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
          style={{ padding: '0.5rem', width: '100%', boxSizing: 'border-box' }}
        />
        {errors.email && (
          <span id="add-user-email-error" style={{ color: 'red', fontSize: '0.875rem' }}>
            {errors.email}
          </span>
        )}
      </label>

      <label htmlFor="add-user-role" style={{ display: 'block', marginBottom: '1rem' }}>
        <div style={{ marginBottom: '0.5rem', fontWeight: 500 }}>Role:</div>
        <select
          id="add-user-role"
          className="select"
          name="role"
          value={formData.role}
          onChange={handleChange}
          required
          style={{ padding: '0.5rem', width: '100%', boxSizing: 'border-box' }}
        >
          <option value={UserRole.STAFF}>Staff</option>
          {currentUser.role === "Admin" && (
            <>
              <option value={UserRole.REGISTRAR}>Registrar</option>
              <option value={UserRole.ADMIN}>Admin</option>
            </>
          )}
        </select>
      </label>

      <label htmlFor="add-user-password" style={{ display: 'block', marginBottom: '1rem' }}>
        <div style={{ marginBottom: '0.5rem', fontWeight: 500 }}>Password:</div>
        <input
          id="add-user-password"
          className="input"
          name="password"
          type="password"
          value={formData.password || ''}
          onChange={handleChange}
          required
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "add-user-password-error" : undefined}
          style={{ padding: '0.5rem', width: '100%', boxSizing: 'border-box' }}
        />
        {errors.password && (
          <span id="add-user-password-error" style={{ color: 'red', fontSize: '0.875rem' }}>
            {errors.password}
          </span>
        )}
      </label>

      <div style={{ marginTop: "1rem", display: 'flex', gap: '0.5rem' }}>
        <button type="submit" className="btn primary">
          Save
        </button>
        <button type="button" className="btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
