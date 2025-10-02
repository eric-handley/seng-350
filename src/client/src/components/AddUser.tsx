import React, { useState } from "react"
import { User } from "../types/models"

type AddUserProps = {
  user: User;
  onSave: (user: User) => void;
  onCancel: () => void;
}

export default function AddUser({ user, onSave, onCancel }: AddUserProps) {
    const [formData, setFormData] = useState<User>(user)
    const [errors, setErrors] = useState<{name?: string; email?: string}>({});

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        // Clear error when user starts typing
        if (errors[name as keyof typeof errors]) {
          setErrors({ ...errors, [name]: undefined })
        }
    };

    const validateForm = (): boolean => {
        const newErrors: {name?: string; email?: string} = {};

        if (!formData.name.trim()) {
          newErrors.name = "Name is required";
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

            <label htmlFor="add-user-name">
                Name:
                <input
                    id="add-user-name"
                    className="input"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? "add-user-name-error" : undefined}
                />
                {errors.name && (
                  <span id="add-user-name-error" style={{ color: 'red', fontSize: '0.875rem' }}>
                    {errors.name}
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
          value={formData.email}
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
          <option value="admin">Admin</option>
          <option value="staff">Staff</option>
          <option value="registrar">Registrar</option>
        </select>
      </label>

      <div style={{ marginTop: "1rem" }}>
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