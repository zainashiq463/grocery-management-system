// Global variables
let products = [];
let units = [];
let orderItems = [];

// Wait for page to load
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded and parsed");
    console.log("Current URL:", window.location.href);
    
    // Load all data
    loadUnits().then(() => {
        loadProducts();
        loadOrders();
    });
    
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    console.log("Setting up event listeners");
    
    // Add product form
    const productForm = document.getElementById('product-form');
    if (productForm) {
        productForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addProduct();
        });
    }
    
    // Edit product form
    const editProductForm = document.getElementById('edit-product-form');
    if (editProductForm) {
        editProductForm.addEventListener('submit', function(e) {
            e.preventDefault();
            updateProduct();
        });
    }
}

// Tab switching
function showTab(tabName) {
    console.log("Switching to tab:", tabName);
    
    // Get the clicked button
    const clickedBtn = event.target;
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    clickedBtn.classList.add('active');
    
    // Show selected tab
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(tabName + '-tab').classList.add('active');
    
    // Refresh data when switching tabs
    if (tabName === 'products') {
        loadProducts();
    } else if (tabName === 'orders') {
        loadOrders();
    } else if (tabName === 'new-order') {
        loadProductSelect();
    }
}

// Load units from database
function loadUnits() {
    console.log("Loading units...");
    return fetch('/get_all_units')
        .then(response => {
            if (!response.ok) throw new Error('Failed to load units');
            return response.json();
        })
        .then(data => {
            console.log("Units loaded:", data);
            units = data;
            return units;
        })
        .catch(error => {
            console.error('Error loading units:', error);
            // Fallback units
            units = [
                { uom_id: 1, unit_name: 'Each', unit_symbol: 'pc' },
                { uom_id: 2, unit_name: 'Kilogram', unit_symbol: 'kg' }
            ];
            return units;
        });
}

// Product functions
function loadProducts() {
    console.log("Loading products...");
    
    const tbody = document.getElementById('products-table-body');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Loading products...</td></tr>';
    }
    
    fetch('/get_all_products')
        .then(response => {
            if (!response.ok) throw new Error('Failed to load products');
            return response.json();
        })
        .then(data => {
            console.log("Products loaded:", data);
            products = data;
            displayProducts();
        })
        .catch(error => {
            console.error('Error loading products:', error);
            if (tbody) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red;">
                    Error loading products: ${error.message}
                </td></tr>`;
            }
        });
}

function displayProducts() {
    const tbody = document.getElementById('products-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!products || products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No products found. Add some products!</td></tr>';
        return;
    }
    
    products.forEach(product => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${product.product_id}</td>
            <td>${product.product_name}</td>
            <td>$${parseFloat(product.price_per_unit).toFixed(2)}</td>
            <td>${product.unit_name || 'N/A'}</td>
            <td>
                <button class="btn-info" onclick="editProduct(${product.product_id})">Edit</button>
                <button class="btn-danger" onclick="deleteProduct(${product.product_id})">Delete</button>
            </td>
        `;
    });
}

function showAddProductModal() {
    console.log("Showing add product modal");
    
    const select = document.getElementById('product-unit');
    select.innerHTML = '<option value="">Select Unit</option>';
    
    if (units && units.length > 0) {
        units.forEach(unit => {
            const option = document.createElement('option');
            option.value = unit.uom_id;
            option.textContent = `${unit.unit_name} (${unit.unit_symbol})`;
            select.appendChild(option);
        });
    }
    
    document.getElementById('product-modal').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function addProduct() {
    const productName = document.getElementById('product-name').value;
    const productPrice = document.getElementById('product-price').value;
    const productUnit = document.getElementById('product-unit').value;
    
    if (!productName || !productPrice || !productUnit) {
        alert('Please fill all fields');
        return;
    }
    
    const productData = {
        product_name: productName,
        price_per_unit: parseFloat(productPrice),
        uom_id: parseInt(productUnit)
    };
    
    console.log("Adding product:", productData);
    
    fetch('/insert_product', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
    })
    .then(response => {
        if (!response.ok) throw new Error('Server error');
        return response.json();
    })
    .then(data => {
        console.log("Product added:", data);
        closeModal('product-modal');
        loadProducts();
        document.getElementById('product-form').reset();
        alert('✅ Product added successfully!');
    })
    .catch(error => {
        console.error('Error adding product:', error);
        alert('❌ Error adding product: ' + error.message);
    });
}

// Edit product functions
function editProduct(productId) {
    console.log("Editing product:", productId);
    
    if (!productId) {
        alert('Invalid product ID');
        return;
    }
    
    // Show loading in modal
    const modal = document.getElementById('edit-product-modal');
    const select = document.getElementById('edit-product-unit');
    const nameInput = document.getElementById('edit-product-name');
    const priceInput = document.getElementById('edit-product-price');
    
    // Reset and show loading state
    nameInput.value = 'Loading...';
    priceInput.value = '';
    select.innerHTML = '<option value="">Loading units...</option>';
    modal.style.display = 'block';
    
    // Fetch product details
    fetch(`/get_product/${productId}`)
        .then(response => {
            console.log("Response status:", response.status);
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Product not found');
                } else {
                    throw new Error(`Server error: ${response.status}`);
                }
            }
            return response.json();
        })
        .then(product => {
            console.log("Product details received:", product);
            
            // Check if product has error
            if (product.error) {
                throw new Error(product.error);
            }
            
            // Fill the modal with product data
            document.getElementById('edit-product-id').value = product.product_id;
            document.getElementById('edit-product-name').value = product.product_name;
            document.getElementById('edit-product-price').value = product.price_per_unit;
            
            // Load units and select the correct one
            loadEditUnitSelect(product.uom_id);
        })
        .catch(error => {
            console.error('Error loading product:', error);
            alert('❌ Error loading product details: ' + error.message);
            modal.style.display = 'none';
        });
}

function loadEditUnitSelect(selectedUomId) {
    console.log("Loading units for edit, selected UOM:", selectedUomId);
    
    const select = document.getElementById('edit-product-unit');
    select.innerHTML = '';
    
    // Function to populate select with units
    function populateSelectWithUnits(unitsList) {
        if (!unitsList || unitsList.length === 0) {
            select.innerHTML = '<option value="">No units available</option>';
            return;
        }
        
        unitsList.forEach(unit => {
            const option = document.createElement('option');
            option.value = unit.uom_id;
            option.textContent = `${unit.unit_name} (${unit.unit_symbol})`;
            if (unit.uom_id === selectedUomId) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    }
    
    // If units are already loaded globally, use them
    if (units && units.length > 0) {
        console.log("Using cached units:", units);
        populateSelectWithUnits(units);
        return;
    }
    
    // Otherwise fetch units
    console.log("Fetching units from server...");
    select.innerHTML = '<option value="">Loading units...</option>';
    
    fetch('/get_all_units')
        .then(response => {
            if (!response.ok) throw new Error('Failed to load units');
            return response.json();
        })
        .then(data => {
            console.log("Units fetched:", data);
            units = data; // Store globally
            populateSelectWithUnits(units);
        })
        .catch(error => {
            console.error('Error loading units:', error);
            select.innerHTML = '<option value="">Error loading units</option>';
        });
}

function updateProduct() {
    const productId = document.getElementById('edit-product-id').value;
    const productName = document.getElementById('edit-product-name').value;
    const productPrice = document.getElementById('edit-product-price').value;
    const productUnit = document.getElementById('edit-product-unit').value;
    
    if (!productName || !productPrice || !productUnit) {
        alert('Please fill all fields');
        return;
    }
    
    const productData = {
        product_id: parseInt(productId),
        product_name: productName,
        price_per_unit: parseFloat(productPrice),
        uom_id: parseInt(productUnit)
    };
    
    console.log("Updating product:", productData);
    
    fetch('/update_product', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
    })
    .then(response => {
        if (!response.ok) throw new Error('Server error');
        return response.json();
    })
    .then(data => {
        console.log("Product updated:", data);
        closeModal('edit-product-modal');
        loadProducts();
        alert('✅ Product updated successfully!');
    })
    .catch(error => {
        console.error('Error updating product:', error);
        alert('❌ Error updating product: ' + error.message);
    });
}

function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        fetch('/delete_product', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ product_id: productId })
        })
        .then(response => {
            if (!response.ok) throw new Error('Server error');
            return response.json();
        })
        .then(data => {
            console.log("Product deleted:", data);
            loadProducts();
            alert('✅ Product deleted successfully!');
        })
        .catch(error => {
            console.error('Error deleting product:', error);
            alert('❌ Error deleting product: ' + error.message);
        });
    }
}

// Order functions
function loadOrders() {
    console.log("Loading orders...");
    
    const tbody = document.getElementById('orders-table-body');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Loading orders...</td></tr>';
    }
    
    fetch('/get_all_orders')
        .then(response => {
            if (!response.ok) throw new Error('Failed to load orders');
            return response.json();
        })
        .then(data => {
            console.log("Orders loaded:", data);
            displayOrders(data);
        })
        .catch(error => {
            console.error('Error loading orders:', error);
            if (tbody) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red;">
                    Error loading orders: ${error.message}
                </td></tr>`;
            }
        });
}

function displayOrders(orders) {
    const tbody = document.getElementById('orders-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!orders || orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No orders found</td></tr>';
        return;
    }
    
    orders.forEach(order => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${order.order_id}</td>
            <td>${order.customer_name}</td>
            <td>$${parseFloat(order.total).toFixed(2)}</td>
            <td>${order.order_datetime}</td>
            <td>
                <button class="btn-info" onclick="viewOrderDetails(${order.order_id})">View</button>
                <button class="btn-danger" onclick="deleteOrder(${order.order_id})">Delete</button>
            </td>
        `;
    });
}

function viewOrderDetails(orderId) {
    fetch('/get_order_details', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ order_id: orderId })
    })
    .then(response => response.json())
    .then(data => {
        console.log("Order details:", data);
        displayOrderDetails(data);
    })
    .catch(error => {
        console.error('Error loading order details:', error);
        alert('Error loading order details');
    });
}

function displayOrderDetails(details) {
    const content = document.getElementById('order-details-content');
    let html = `
        <table>
            <thead>
                <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Unit</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    if (!details || details.length === 0) {
        html += '<tr><td colspan="4" style="text-align: center;">No details found</td></tr>';
    } else {
        details.forEach(item => {
            html += `
                <tr>
                    <td>${item.product_name}</td>
                    <td>${item.quantity}</td>
                    <td>${item.unit_symbol || 'pc'}</td>
                    <td>$${parseFloat(item.total_price).toFixed(2)}</td>
                </tr>
            `;
        });
    }
    
    html += '</tbody></table>';
    content.innerHTML = html;
    document.getElementById('order-details-modal').style.display = 'block';
}

function deleteOrder(orderId) {
    if (confirm('Are you sure you want to delete this order?')) {
        fetch('/delete_order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ order_id: orderId })
        })
        .then(response => response.json())
        .then(data => {
            console.log("Order deleted:", data);
            loadOrders();
            alert('✅ Order deleted successfully!');
        })
        .catch(error => {
            console.error('Error deleting order:', error);
            alert('❌ Error deleting order: ' + error.message);
        });
    }
}

// New Order functions
function loadProductSelect() {
    const select = document.getElementById('product-select');
    if (!select) return;
    
    select.innerHTML = '<option value="">Select Product</option>';
    
    if (!products || products.length === 0) {
        console.log("No products loaded yet");
        return;
    }
    
    products.forEach(product => {
        const option = document.createElement('option');
        option.value = product.product_id;
        option.setAttribute('data-price', product.price_per_unit);
        option.setAttribute('data-uom', product.unit_name || '');
        
        const unit = units.find(u => u.uom_id === product.uom_id);
        const unitSymbol = unit ? unit.unit_symbol : (product.unit_symbol || 'pc');
        
        option.textContent = `${product.product_name} - $${parseFloat(product.price_per_unit).toFixed(2)}/${unitSymbol}`;
        select.appendChild(option);
    });
}

function addOrderItem() {
    const productSelect = document.getElementById('product-select');
    const quantity = parseFloat(document.getElementById('quantity').value);
    
    if (!productSelect.value) {
        alert('Please select a product');
        return;
    }
    
    if (!quantity || quantity <= 0) {
        alert('Please enter a valid quantity');
        return;
    }
    
    const selectedOption = productSelect.options[productSelect.selectedIndex];
    const productId = parseInt(productSelect.value);
    const productName = selectedOption.textContent.split(' - ')[0];
    const price = parseFloat(selectedOption.getAttribute('data-price'));
    const uom = selectedOption.getAttribute('data-uom');
    const total = price * quantity;
    
    orderItems.push({
        product_id: productId,
        product_name: productName,
        price_per_unit: price,
        quantity: quantity,
        uom_name: uom,
        total_price: total
    });
    
    displayOrderItems();
    updateGrandTotal();
    
    document.getElementById('quantity').value = '';
}

function displayOrderItems() {
    const tbody = document.getElementById('order-items-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (orderItems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No items added</td></tr>';
        return;
    }
    
    orderItems.forEach((item, index) => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${item.product_name}</td>
            <td>$${item.price_per_unit.toFixed(2)}</td>
            <td>${item.quantity}</td>
            <td>${item.uom_name}</td>
            <td>$${item.total_price.toFixed(2)}</td>
            <td>
                <button class="btn-danger" onclick="removeOrderItem(${index})">Remove</button>
            </td>
        `;
    });
}

function removeOrderItem(index) {
    orderItems.splice(index, 1);
    displayOrderItems();
    updateGrandTotal();
}

function updateGrandTotal() {
    const total = orderItems.reduce((sum, item) => sum + item.total_price, 0);
    const grandTotal = document.getElementById('grand-total');
    if (grandTotal) {
        grandTotal.textContent = `$${total.toFixed(2)}`;
    }
}

function placeOrder() {
    const customerName = document.getElementById('customer-name').value;
    
    if (!customerName) {
        alert('Please enter customer name');
        return;
    }
    
    if (orderItems.length === 0) {
        alert('Please add items to the order');
        return;
    }
    
    const orderData = {
        customer_name: customerName,
        grand_total: parseFloat(document.getElementById('grand-total').textContent.replace('$', '')),
        order_details: orderItems
    };
    
    console.log("Placing order:", orderData);
    
    // Disable button to prevent double submission
    const placeOrderBtn = event.target;
    const originalText = placeOrderBtn.textContent;
    placeOrderBtn.textContent = 'Placing order...';
    placeOrderBtn.disabled = true;
    
    fetch('/insert_order', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw new Error(err.error || 'Server error'); });
        }
        return response.json();
    })
    .then(data => {
        console.log("✅ Order placed:", data);
        alert('✅ Order placed successfully! Order ID: ' + data.order_id);
        clearOrderForm();
        loadOrders();
        showTab('orders');
    })
    .catch(error => {
        console.error('❌ Error placing order:', error);
        alert('❌ Error placing order: ' + error.message);
    })
    .finally(() => {
        placeOrderBtn.textContent = originalText;
        placeOrderBtn.disabled = false;
    });
}

function clearOrderForm() {
    document.getElementById('customer-name').value = '';
    orderItems = [];
    displayOrderItems();
    updateGrandTotal();
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}