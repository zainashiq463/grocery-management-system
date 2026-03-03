# sql_connection.py
import mysql.connector
from mysql.connector import Error

__cnx = None

def get_sql_connection():
    global __cnx
    if __cnx is None:
        try:
            __cnx = mysql.connector.connect(
                user='root',
                password='root',
                host='127.0.0.1',
                database='grocery_store',
                autocommit=True,
                buffered=True
            )
            print("✅ Database connected successfully")
        except Error as e:
            print(f"❌ Error connecting to MySQL: {e}")
            return None
    return __cnx

def close_connection():
    global __cnx
    if __cnx is not None and __cnx.is_connected():
        __cnx.close()
        __cnx = None
        print("🔌 Database connection closed")

if __name__ == '__main__':
    connection = get_sql_connection()
    if connection:
        print("Connection test successful!")
        close_connection()