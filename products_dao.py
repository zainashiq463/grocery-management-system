# products_dao.py
from sql_connection import get_sql_connection

def get_all_products(connection):
    cursor = connection.cursor(dictionary=True)
    query = """
        SELECT p.product_id, p.product_name, p.price_per_unit, 
               p.uom_id, u.unit_name, u.unit_symbol
        FROM products p
        INNER JOIN units u ON p.uom_id = u.uom_id
        ORDER BY p.product_id DESC
    """
    cursor.execute(query)
    products = cursor.fetchall()
    cursor.close()
    
    # Convert decimal to float for JSON
    for product in products:
        product['price_per_unit'] = float(product['price_per_unit'])
    
    return products

def get_product_by_id(connection, product_id):
    cursor = connection.cursor(dictionary=True)
    query = """
        SELECT p.product_id, p.product_name, p.price_per_unit, 
               p.uom_id, u.unit_name, u.unit_symbol
        FROM products p
        INNER JOIN units u ON p.uom_id = u.uom_id
        WHERE p.product_id = %s
    """
    cursor.execute(query, (product_id,))
    product = cursor.fetchone()
    cursor.close()
    
    if product:
        product['price_per_unit'] = float(product['price_per_unit'])
    
    return product

def insert_new_product(connection, product):
    cursor = connection.cursor()
    query = "INSERT INTO products (product_name, uom_id, price_per_unit) VALUES (%s, %s, %s)"
    data = (product['product_name'], product['uom_id'], product['price_per_unit'])
    cursor.execute(query, data)
    connection.commit()
    product_id = cursor.lastrowid
    cursor.close()
    return product_id

def update_product(connection, product):
    cursor = connection.cursor()
    query = "UPDATE products SET product_name = %s, price_per_unit = %s, uom_id = %s WHERE product_id = %s"
    data = (product['product_name'], product['price_per_unit'], product['uom_id'], product['product_id'])
    cursor.execute(query, data)
    connection.commit()
    cursor.close()
    return product['product_id']

def delete_product(connection, product_id):
    cursor = connection.cursor()
    
    # First check if product exists in order_details
    check_query = "SELECT COUNT(*) as count FROM order_details WHERE product_id = %s"
    cursor.execute(check_query, (product_id,))
    result = cursor.fetchone()
    
    if result[0] > 0:
        cursor.close()
        raise Exception("Cannot delete product: it is used in existing orders")
    
    # Delete product
    delete_query = "DELETE FROM products WHERE product_id = %s"
    cursor.execute(delete_query, (product_id,))
    connection.commit()
    cursor.close()
    return product_id

if __name__ == '__main__':
    connection = get_sql_connection()
    products = get_all_products(connection)
    print(f"Found {len(products)} products")
    for p in products:
        print(p)