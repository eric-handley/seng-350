import React, { useState } from "react"
import { User } from "../types/models"

type EditUserProps = {
  user: User;
  onSave: (user: User) => void;
  onCancel: () => void;
}

export default function EditUser({ user, onSave, onCancel }: EditUserProps) {
  const [formData, setFormData] = useState<User>(user);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form className="panel" onSubmit={handleSubmit}>
      <h2>Edit User</h2>

      <label>
        Name:
        <input
          name="name"
          value={formData.name}
          onChange={handleChange}
        />
      </label>

      <label>
        Role:
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
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