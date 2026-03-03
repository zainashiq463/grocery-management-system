# orders_dao.py
from sql_connection import get_sql_connection
from datetime import datetime

def get_all_orders(connection):
    cursor = connection.cursor(dictionary=True)
    query = "SELECT * FROM orders ORDER BY order_datetime DESC"
    cursor.execute(query)
    orders = cursor.fetchall()
    cursor.close()
    
    # Convert datetime and decimal for JSON
    for order in orders:
        order['order_datetime'] = str(order['order_datetime'])
        order['total'] = float(order['total'])
    
    return orders

def get_order_details(connection, order_id):
    cursor = connection.cursor(dictionary=True)
    query = """
        SELECT od.*, p.product_name, u.unit_symbol
        FROM order_details od
        INNER JOIN products p ON od.product_id = p.product_id
        INNER JOIN units u ON p.uom_id = u.uom_id
        WHERE od.order_id = %s
    """
    cursor.execute(query, (order_id,))
    details = cursor.fetchall()
    cursor.close()
    
    for detail in details:
        detail['total_price'] = float(detail['total_price'])
        detail['quantity'] = float(detail['quantity'])
    
    return details

def insert_order(connection, order):
    cursor = connection.cursor()
    try:
        # Insert into orders
        order_query = "INSERT INTO orders (customer_name, total, order_datetime) VALUES (%s, %s, %s)"
        order_data = (order['customer_name'], order['grand_total'], datetime.now())
        cursor.execute(order_query, order_data)
        order_id = cursor.lastrowid
        
        # Insert order details
        detail_query = "INSERT INTO order_details (order_id, product_id, quantity, total_price) VALUES (%s, %s, %s, %s)"
        for item in order['order_details']:
            detail_data = (order_id, item['product_id'], item['quantity'], item['total_price'])
            cursor.execute(detail_query, detail_data)
        
        connection.commit()
        return order_id
        
    except Exception as e:
        connection.rollback()
        raise e
    finally:
        cursor.close()

def delete_order(connection, order_id):
    cursor = connection.cursor()
    query = "DELETE FROM orders WHERE order_id = %s"
    cursor.execute(query, (order_id,))
    connection.commit()
    rows_affected = cursor.rowcount
    cursor.close()
    return rows_affected

if __name__ == '__main__':
    connection = get_sql_connection()
    orders = get_all_orders(connection)
    print(f"Found {len(orders)} orders")
    for o in orders:
        print(o)