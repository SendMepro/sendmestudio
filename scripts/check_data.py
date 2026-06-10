import psycopg2
import json
import os

# Read DATABASE_URL from environment or construct from .env
db_url = "postgresql://postgres.peyujymnlntxqygrhqlw:v%3FUJk33yNLN4Vun@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Parse the URL manually
from urllib.parse import unquote
# postgresql://user:password@host:port/db?params
parts = db_url.replace("postgresql://", "").split("@")
user_pass = parts[0].split(":")
host_part = parts[1].split("?")[0].split("/")
host_port = host_part[0].split(":")

conn = psycopg2.connect(
    user=unquote(user_pass[0]),
    password=unquote(user_pass[1]),
    host=host_port[0],
    port=int(host_port[1]),
    dbname=host_part[1]
)

cur = conn.cursor()

# Query tenants
cur.execute("SELECT id::text, name, subdomain, phone FROM tenants")
tenants = [{"id": r[0], "name": r[1], "subdomain": r[2], "phone": r[3]} for r in cur.fetchall()]

# Query mappings
cur.execute("SELECT id::text, tenant_id::text, phone_number_id, business_phone, wa_business_id, is_active FROM whatsapp_tenant_mappings")
mappings = [{"id": r[0], "tenantId": r[1], "phoneNumberId": r[2], "businessPhone": r[3], "waBusinessId": r[4], "isActive": r[5]} for r in cur.fetchall()]

# Check tenants table structure for phone column
cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='tenants'")
tenant_cols = {r[0]: r[1] for r in cur.fetchall()}

result = {
    "tenants": tenants,
    "mappings": mappings,
    "tenantColumns": tenant_cols
}

print(json.dumps(result, indent=2, default=str))

cur.close()
conn.close()
