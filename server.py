from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
import products_dao
import orders_dao
import units_dao
from sql_connection import get_sql_connection

app = Flask(__name__)
CORS(app)

connection = get_sql_connection()

@app.route('/')
def index():
    return render_template('index.html')

# Health check
@app.route('/health')
def health():
    return jsonify({"status": "running", "port": 5000})

# Product endpoints
@app.route('/get_all_products', methods=['GET'])
def get_all_products():
    try:
        products = products_dao.get_all_products(connection)
        return jsonify(products)
    except Exception as e:
        print("Error in get_all_products:", str(e))
        return jsonify({"error": str(e)}), 500

@app.route('/get_product/<int:product_id>', methods=['GET'])
def get_product(product_id):
    try:
        print(f"Fetching product with ID: {product_id}")
        product = products_dao.get_product_by_id(connection, product_id)
        if product:
            return jsonify(product)
        else:
            return jsonify({"error": "Product not found"}), 404
    except Exception as e:
        print("Error in get_product:", str(e))
        return jsonify({"error": str(e)}), 500

@app.route('/insert_product', methods=['POST'])
def insert_product():
    try:
        product = request.get_json()
        print("Inserting product:", product)
        product_id = products_dao.insert_new_product(connection, product)
        return jsonify({"product_id": product_id, "success": True})
    except Exception as e:
        print("Error in insert_product:", str(e))
        return jsonify({"error": str(e)}), 500

@app.route('/update_product', methods=['POST'])
def update_product():
    try:
        product = request.get_json()
        print("Updating product:", product)
        product_id = products_dao.update_product(connection, product)
        return jsonify({"success": True, "product_id": product_id})
    except Exception as e:
        print("Error in update_product:", str(e))
        return jsonify({"error": str(e)}), 500

@app.route('/delete_product', methods=['POST'])
def delete_product():
    try:
        data = request.get_json()
        print("Deleting product ID:", data['product_id'])
        products_dao.delete_product(connection, data['product_id'])
        return jsonify({"success": True})
    except Exception as e:
        print("Error in delete_product:", str(e))
        return jsonify({"error": str(e)}), 500

# Unit endpoints
@app.route('/get_all_units', methods=['GET'])
def get_all_units():
    try:
        units = units_dao.get_all_units(connection)
        return jsonify(units)
    except Exception as e:
        print("Error in get_all_units:", str(e))
        return jsonify({"error": str(e)}), 500

# Order endpoints
@app.route('/get_all_orders', methods=['GET'])
def get_all_orders():
    try:
        orders = orders_dao.get_all_orders(connection)
        return jsonify(orders)
    except Exception as e:
        print("Error in get_all_orders:", str(e))
        return jsonify({"error": str(e)}), 500

@app.route('/get_order_details', methods=['POST'])
def get_order_details():
    try:
        data = request.get_json()
        print("Fetching order details for ID:", data['order_id'])
        details = orders_dao.get_order_details(connection, data['order_id'])
        return jsonify(details)
    except Exception as e:
        print("Error in get_order_details:", str(e))
        return jsonify({"error": str(e)}), 500

@app.route('/insert_order', methods=['POST'])
def insert_order():
    try:
        order = request.get_json()
        print("Received order:", order)
        
        if not order:
            return jsonify({"error": "No order data"}), 400
            
        order_id = orders_dao.insert_order(connection, order)
        print(f"Order inserted with ID: {order_id}")
        
        return jsonify({
            "success": True,
            "order_id": order_id,
            "message": "Order placed successfully"
        })
    except Exception as e:
        print("Error in insert_order:", str(e))
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/delete_order', methods=['POST'])
def delete_order():
    try:
        data = request.get_json()
        print("Deleting order ID:", data['order_id'])
        orders_dao.delete_order(connection, data['order_id'])
        return jsonify({"success": True})
    except Exception as e:
        print("Error in delete_order:", str(e))
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🚀 GROCERY STORE MANAGEMENT SYSTEM")
    print("="*60)
    print("📍 Server: http://localhost:5000")
    print("📍 Health: http://localhost:5000/health")
    print("📍 Products: http://localhost:5000/get_all_products")
    print("📍 Units: http://localhost:5000/get_all_units")
    print("="*60 + "\n")
    app.run(port=5000, host="localhost", debug=True)