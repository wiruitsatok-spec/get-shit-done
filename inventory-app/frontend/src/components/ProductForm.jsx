import React, { useState } from 'react';

const EMPTY_FORM = {
  name: '',
  description: '',
  price: '',
  quantity: '',
  category: '',
};

export default function ProductForm({ initialData, onSubmit, onCancel, submitLabel = 'Save' }) {
  const [form, setForm] = useState(initialData ? {
    name: initialData.name || '',
    description: initialData.description || '',
    price: initialData.price !== undefined ? String(initialData.price) : '',
    quantity: initialData.quantity !== undefined ? String(initialData.quantity) : '',
    category: initialData.category || '',
  } : EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (form.price === '' || isNaN(Number(form.price)) || Number(form.price) < 0) {
      newErrors.price = 'Price must be a non-negative number';
    }
    if (form.quantity === '' || isNaN(Number(form.quantity)) || Number(form.quantity) < 0) {
      newErrors.quantity = 'Quantity must be a non-negative number';
    }
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit({
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        quantity: Math.floor(Number(form.quantity)),
        category: form.category.trim(),
      });
    } catch (err) {
      setSubmitError(err.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="product-form" onSubmit={handleSubmit} noValidate>
      {submitError && <div className="form-error-banner">{submitError}</div>}

      <div className="form-row">
        <div className={`form-group ${errors.name ? 'has-error' : ''}`}>
          <label htmlFor="name">Name *</label>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            placeholder="Product name"
            autoFocus
          />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="category">Category</label>
          <input
            id="category"
            name="category"
            type="text"
            value={form.category}
            onChange={handleChange}
            placeholder="e.g. Electronics"
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Optional description"
          rows={2}
        />
      </div>

      <div className="form-row">
        <div className={`form-group ${errors.price ? 'has-error' : ''}`}>
          <label htmlFor="price">Price ($) *</label>
          <input
            id="price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={handleChange}
            placeholder="0.00"
          />
          {errors.price && <span className="field-error">{errors.price}</span>}
        </div>

        <div className={`form-group ${errors.quantity ? 'has-error' : ''}`}>
          <label htmlFor="quantity">Quantity *</label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            min="0"
            step="1"
            value={form.quantity}
            onChange={handleChange}
            placeholder="0"
          />
          {errors.quantity && <span className="field-error">{errors.quantity}</span>}
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving...' : submitLabel}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
      </div>
    </form>
  );
}
