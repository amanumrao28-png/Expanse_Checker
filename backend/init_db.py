import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

conn = psycopg2.connect(host='localhost', port=5432, user='postgres', database='postgres')
conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
cur = conn.cursor()

# Set password for postgres user to postgres
cur.execute("ALTER USER postgres WITH PASSWORD 'postgres';")
print('Password set for user postgres')

# Check if student_expense_db exists
cur.execute("SELECT 1 FROM pg_database WHERE datname='student_expense_db';")
if not cur.fetchone():
    cur.execute("CREATE DATABASE student_expense_db;")
    print('Created database student_expense_db')
else:
    print('Database student_expense_db already exists')

conn.close()
print('PostgreSQL database initialization complete!')
