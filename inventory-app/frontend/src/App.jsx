import React, { useState, useEffect, useCallback } from 'react';
import ProductList from './components/ProductList.jsx';
import ProductForm from './components/ProductForm.jsx';

const API_BASE = import.meta.env.VITE_API_URL
  ? `https://${import.meta.env.VITE_API_URL}/api/products`
  : '/api/products';

async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch(API_BASE);
      setProducts(data);
    } catch (err) {
      setError('Failed to load products. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleCreate = async (formData) => {
    const product = await apiFetch(API_BASE, {
      method: 'POST',
      body: JSON.stringify(formData),
    });
    setProducts((prev) => [...prev, product]);
    setShowAddForm(false);
  };

  const handleUpdate = async (id, formData) => {
    const updated = await apiFetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(formData),
    });
    setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
    setEditingProduct(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    await apiFetch(`${API_BASE}/${id}`, { method: 'DELETE' });
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleEditClick = (product) => {
    setEditingProduct(product);
    setShowAddForm(false);
  };

  const handleAddClick = () => {
    setShowAddForm(true);
    setEditingProduct(null);
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>Inventory Manager</h1>
          <span className="product-count">{products.length} product{products.length !== 1 ? 's' : ''}</span>
        </div>
      </header>

      <main className="app-main">
        {error && (
          <div className="alert alert-error">
            {error}
            <button className="alert-close" onClick={() => setError(null)}>x</button>
          </div>
        )}

        <div className="toolbar">
          <button
            className="btn btn-primary"
            onClick={handleAddClick}
            disabled={showAddForm}
          >
            + Add Product
          </button>
        </div>

        {showAddForm && (
          <div className="form-panel">
            <h2>Add New Product</h2>
            <ProductForm
              onSubmit={handleCreate}
              onCancel={handleCancelAdd}
              submitLabel="Create Product"
            />
          </div>
        )}

        {loading ? (
          <div className="loading">Loading products...</div>
        ) : (
          <ProductList
            products={products}
            editingProduct={editingProduct}
            onEdit={handleEditClick}
            onDelete={handleDelete}
            onUpdateSubmit={handleUpdate}
            onCancelEdit={handleCancelEdit}
          />
        )}
      </main>
    </div>
  );
}
