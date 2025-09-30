import React, { useState } from "react"
import { User } from "../types/models"

type AddUserProps = {
  user: User;
  onSave: (user: User) => void;
  onCancel: () => void;
}

export default function AddUser({ user, onSave, onCancel }: AddUserProps) {
    const [formData, setFormData] = useState<User>(user)
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form className="panel" onSubmit={handleSubmit}>
            <h2>Add User</h2>

            <label>
                Name:
                <input
                    className="input"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                />
            </label>

      <label>
        Email:
        <input
          className="input"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
        />
      </label>

      <label>
        Role:
        <select
          className="select"
          name="role"
          value={formData.role}
          onChange={handleChange}
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