# units_dao.py
from sql_connection import get_sql_connection

def get_all_units(connection):
    cursor = connection.cursor(dictionary=True)
    query = "SELECT * FROM units ORDER BY uom_id"
    cursor.execute(query)
    units = cursor.fetchall()
    cursor.close()
    return units

if __name__ == '__main__':
    connection = get_sql_connection()
    units = get_all_units(connection)
    print(f"Found {len(units)} units")
    for u in units:
        print(u)