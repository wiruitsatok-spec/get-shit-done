import React from 'react';

export default function CustomerView({ products, cart, onAddToCart }) {
  const available = products.filter((p) => p.quantity > 0);

  if (available.length === 0) {
    return (
      <div className="empty-state">
        <p>No products available right now.</p>
      </div>
    );
  }

  return (
    <div className="shop-grid">
      {available.map((product) => {
        const inCart = cart[product.id] || 0;
        const remaining = product.quantity - inCart;
        return (
          <div key={product.id} className="shop-card">
            {product.image ? (
              <img src={product.image} alt={product.name} className="shop-card-img" />
            ) : (
              <div className="shop-card-img-placeholder">📦</div>
            )}
            <div className="shop-card-body">
              <div className="shop-card-name">{product.name}</div>
              {product.category && (
                <span className="badge">{product.category}</span>
              )}
              {product.description && (
                <div className="shop-card-desc">{product.description}</div>
              )}
              <div className="shop-card-price">${Number(product.price).toFixed(2)}</div>
              <div className="shop-card-stock">
                {remaining > 0 ? (
                  <span className={remaining < 5 ? 'stock-low' : 'stock-ok'}>
                    {remaining} in stock
                  </span>
                ) : (
                  <span className="stock-out">Out of stock</span>
                )}
              </div>
              <button
                className="btn btn-primary btn-add-cart"
                onClick={() => onAddToCart(product.id)}
                disabled={remaining <= 0}
              >
                {inCart > 0 ? `In cart: ${inCart} — Add more` : 'Add to Cart'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
