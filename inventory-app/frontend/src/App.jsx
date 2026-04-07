import React, { useState, useEffect, useCallback } from 'react';
import ProductList from './components/ProductList.jsx';
import ProductForm from './components/ProductForm.jsx';
import CustomerView from './components/CustomerView.jsx';
import Cart from './components/Cart.jsx';

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
  const [mode, setMode] = useState('manager'); // 'manager' | 'customer'

  // Manager state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Customer state
  const [cart, setCart] = useState({}); // { [productId]: qty }
  const [showCart, setShowCart] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

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

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // ── Manager handlers ──────────────────────────────────────
  const handleCreate = async (formData) => {
    const product = await apiFetch(API_BASE, { method: 'POST', body: JSON.stringify(formData) });
    setProducts((prev) => [...prev, product]);
    setShowAddForm(false);
  };

  const handleUpdate = async (id, formData) => {
    const updated = await apiFetch(`${API_BASE}/${id}`, { method: 'PUT', body: JSON.stringify(formData) });
    setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
    setEditingProduct(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    await apiFetch(`${API_BASE}/${id}`, { method: 'DELETE' });
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleQuantityChange = async (id, newQty) => {
    if (newQty < 0) return;
    const updated = await apiFetch(`${API_BASE}/${id}`, { method: 'PUT', body: JSON.stringify({ quantity: newQty }) });
    setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
  };

  // ── Customer / Cart handlers ──────────────────────────────
  const handleAddToCart = (productId) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    setCart((prev) => {
      const current = prev[productId] || 0;
      if (current >= product.quantity) return prev;
      return { ...prev, [productId]: current + 1 };
    });
  };

  const handleUpdateCartQty = (productId, qty) => {
    const product = products.find((p) => p.id === productId);
    if (!product || qty < 1 || qty > product.quantity) return;
    setCart((prev) => ({ ...prev, [productId]: qty }));
  };

  const handleRemoveFromCart = (productId) => {
    setCart((prev) => { const next = { ...prev }; delete next[productId]; return next; });
  };

  const handleCheckout = async () => {
    setChecking(true);
    try {
      const updates = Object.entries(cart).map(([id, qty]) => {
        const product = products.find((p) => p.id === id);
        return apiFetch(`${API_BASE}/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ quantity: product.quantity - qty }),
        });
      });
      const results = await Promise.all(updates);
      setProducts((prev) => prev.map((p) => {
        const updated = results.find((r) => r && r.id === p.id);
        return updated || p;
      }));
      setCart({});
      setShowCart(false);
      setCheckoutSuccess(true);
      setTimeout(() => setCheckoutSuccess(false), 3000);
    } catch (err) {
      setError('Checkout failed. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  const cartCount = Object.values(cart).reduce((s, q) => s + q, 0);
  const inventoryTotal = products.reduce((sum, p) => sum + p.price * p.quantity, 0);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          {mode === 'manager' ? (
            <>
              <h1>Inventory Manager</h1>
              <span className="product-count">{products.length} product{products.length !== 1 ? 's' : ''}</span>
              {!loading && (
                <span className="inventory-total">
                  Total: ${inventoryTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              )}
              <button className="btn btn-customer" onClick={() => { setMode('customer'); setCart({}); }}>
                🛍 Customer View
              </button>
            </>
          ) : (
            <>
              <h1>Shop</h1>
              <button className="btn btn-manager" onClick={() => setMode('manager')}>
                ⚙ Manager
              </button>
              <button className="btn btn-cart" onClick={() => setShowCart(true)}>
                🛒 Cart{cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </button>
            </>
          )}
        </div>
      </header>

      <main className="app-main">
        {error && (
          <div className="alert alert-error">
            {error}
            <button className="alert-close" onClick={() => setError(null)}>✕</button>
          </div>
        )}
        {checkoutSuccess && (
          <div className="alert alert-success">
            Purchase complete! Thank you.
          </div>
        )}

        {mode === 'manager' ? (
          <>
            <div className="toolbar">
              <button className="btn btn-primary" onClick={() => { setShowAddForm(true); setEditingProduct(null); }} disabled={showAddForm}>
                + Add Product
              </button>
            </div>

            {showAddForm && (
              <div className="form-panel">
                <h2>Add New Product</h2>
                <ProductForm onSubmit={handleCreate} onCancel={() => setShowAddForm(false)} submitLabel="Create Product" />
              </div>
            )}

            {loading ? (
              <div className="loading">Loading products...</div>
            ) : (
              <ProductList
                products={products}
                editingProduct={editingProduct}
                onEdit={(p) => { setEditingProduct(p); setShowAddForm(false); }}
                onDelete={handleDelete}
                onUpdateSubmit={handleUpdate}
                onCancelEdit={() => setEditingProduct(null)}
                onQuantityChange={handleQuantityChange}
              />
            )}
          </>
        ) : (
          loading ? (
            <div className="loading">Loading products...</div>
          ) : (
            <CustomerView
              products={products}
              cart={cart}
              onAddToCart={handleAddToCart}
              onUpdateCartQty={handleUpdateCartQty}
              onRemoveFromCart={handleRemoveFromCart}
            />
          )
        )}
      </main>

      {showCart && (
        <Cart
          cart={cart}
          products={products}
          onUpdateCartQty={handleUpdateCartQty}
          onRemove={handleRemoveFromCart}
          onCheckout={handleCheckout}
          onClose={() => setShowCart(false)}
          checking={checking}
        />
      )}
    </div>
  );
}
