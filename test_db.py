import psycopg2

conn = psycopg2.connect(
    host="localhost",
    port=5432,
    database="cramhub",
    user="postgres",
    password="dh7(D59{nRgoW,m"
)

print("CONNECTED")

conn.close()