const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// In-memory storage
let products = [
  {
    id: '1',
    name: 'Wireless Headphones',
    description: 'Over-ear noise cancelling headphones',
    price: 79.99,
    quantity: 42,
    category: 'Electronics',
  },
  {
    id: '2',
    name: 'Ergonomic Chair',
    description: 'Adjustable lumbar support office chair',
    price: 349.00,
    quantity: 15,
    category: 'Furniture',
  },
  {
    id: '3',
    name: 'Stainless Water Bottle',
    description: '32oz insulated bottle, keeps drinks cold 24h',
    price: 24.99,
    quantity: 120,
    category: 'Kitchen',
  },
];

let nextId = 4;

// GET /api/products - list all products
app.get('/api/products', (req, res) => {
  res.json(products);
});

// POST /api/products - create product
app.post('/api/products', (req, res) => {
  const { name, description, price, quantity, category, image } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Name is required' });
  }
  if (price === undefined || isNaN(Number(price)) || Number(price) < 0) {
    return res.status(400).json({ error: 'Price must be a non-negative number' });
  }
  if (quantity === undefined || isNaN(Number(quantity)) || Number(quantity) < 0) {
    return res.status(400).json({ error: 'Quantity must be a non-negative number' });
  }

  const product = {
    id: String(nextId++),
    name: name.trim(),
    description: (description || '').trim(),
    price: Number(Number(price).toFixed(2)),
    quantity: Math.floor(Number(quantity)),
    category: (category || '').trim(),
    image: image || null,
  };

  products.push(product);
  res.status(201).json(product);
});

// PUT /api/products/:id - update product
app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const index = products.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const { name, description, price, quantity, category, image } = req.body;

  if (name !== undefined && name.trim() === '') {
    return res.status(400).json({ error: 'Name cannot be empty' });
  }
  if (price !== undefined && (isNaN(Number(price)) || Number(price) < 0)) {
    return res.status(400).json({ error: 'Price must be a non-negative number' });
  }
  if (quantity !== undefined && (isNaN(Number(quantity)) || Number(quantity) < 0)) {
    return res.status(400).json({ error: 'Quantity must be a non-negative number' });
  }

  const existing = products[index];
  const updated = {
    ...existing,
    name: name !== undefined ? name.trim() : existing.name,
    description: description !== undefined ? description.trim() : existing.description,
    price: price !== undefined ? Number(Number(price).toFixed(2)) : existing.price,
    quantity: quantity !== undefined ? Math.floor(Number(quantity)) : existing.quantity,
    category: category !== undefined ? category.trim() : existing.category,
    image: image !== undefined ? image : existing.image,
  };

  products[index] = updated;
  res.json(updated);
});

// DELETE /api/products/:id - delete product
app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const index = products.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }

  products.splice(index, 1);
  res.status(204).send();
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Inventory API running at http://0.0.0.0:${PORT}`);
});
