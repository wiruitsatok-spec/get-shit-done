import React from 'react';

export default function Cart({ cart, products, onUpdateCartQty, onRemove, onCheckout, onClose, checking }) {
  const cartItems = Object.entries(cart)
    .map(([id, qty]) => ({ product: products.find((p) => p.id === id), qty }))
    .filter((item) => item.product);

  const totalItems = cartItems.reduce((s, i) => s + i.qty, 0);
  const totalValue = cartItems.reduce((s, i) => s + i.product.price * i.qty, 0);

  return (
    <div className="cart-overlay">
      <div className="cart-backdrop" onClick={onClose} />
      <div className="cart-panel">
        <div className="cart-header">
          <h2>Your Cart</h2>
          <button className="cart-close-btn" onClick={onClose}>✕</button>
        </div>

        {cartItems.length === 0 ? (
          <div className="cart-empty">Your cart is empty.</div>
        ) : (
          <>
            <div className="cart-items">
              {cartItems.map(({ product, qty }) => {
                const maxQty = product.quantity;
                return (
                  <div key={product.id} className="cart-item">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="cart-item-img" />
                    ) : (
                      <div className="cart-item-img-placeholder">📦</div>
                    )}
                    <div className="cart-item-info">
                      <div className="cart-item-name">{product.name}</div>
                      <div className="cart-item-price">${Number(product.price).toFixed(2)} / pcs</div>
                    </div>
                    <div className="cart-item-controls">
                      <div className="qty-controls">
                        <button
                          className="qty-btn"
                          onClick={() => qty <= 1 ? onRemove(product.id) : onUpdateCartQty(product.id, qty - 1)}
                        >−</button>
                        <span className="qty-value">{qty}</span>
                        <button
                          className="qty-btn"
                          onClick={() => onUpdateCartQty(product.id, qty + 1)}
                          disabled={qty >= maxQty}
                        >+</button>
                      </div>
                      <div className="cart-item-total">
                        ${(product.price * qty).toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="cart-footer">
              <div className="cart-summary">
                <span>{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
                <span className="cart-total-value">${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <button
                className="btn btn-primary btn-checkout"
                onClick={onCheckout}
                disabled={checking}
              >
                {checking ? 'Processing...' : 'Checkout'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
