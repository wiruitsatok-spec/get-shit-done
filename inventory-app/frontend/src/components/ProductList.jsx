import React from 'react';
import ProductForm from './ProductForm.jsx';

export default function ProductList({
  products,
  editingProduct,
  onEdit,
  onDelete,
  onUpdateSubmit,
  onCancelEdit,
}) {
  if (products.length === 0) {
    return (
      <div className="empty-state">
        <p>No products yet. Click "+ Add Product" to get started.</p>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table className="product-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Description</th>
            <th className="text-right">Price</th>
            <th className="text-right">Qty</th>
            <th className="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) =>
            editingProduct && editingProduct.id === product.id ? (
              <tr key={product.id} className="editing-row">
                <td colSpan={6}>
                  <div className="inline-edit-panel">
                    <h3>Edit Product</h3>
                    <ProductForm
                      initialData={product}
                      onSubmit={(data) => onUpdateSubmit(product.id, data)}
                      onCancel={onCancelEdit}
                      submitLabel="Save Changes"
                    />
                  </div>
                </td>
              </tr>
            ) : (
              <tr key={product.id} className={editingProduct ? 'dimmed' : ''}>
                <td className="product-name" data-label="Name">{product.name}</td>
                <td data-label="Category">
                  {product.category ? (
                    <span className="badge">{product.category}</span>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
                <td className="description-cell" data-label="Description">
                  {product.description || <span className="muted">—</span>}
                </td>
                <td className="text-right price-cell" data-label="Price">
                  ${Number(product.price).toFixed(2)}
                </td>
                <td className={`text-right qty-cell ${product.quantity === 0 ? 'qty-zero' : product.quantity < 10 ? 'qty-low' : ''}`} data-label="Qty">
                  {product.quantity}
                </td>
                <td className="text-center actions-cell" data-label="Actions">
                  <button
                    className="btn btn-sm btn-edit"
                    onClick={() => onEdit(product)}
                    title="Edit product"
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-sm btn-delete"
                    onClick={() => onDelete(product.id)}
                    title="Delete product"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}
