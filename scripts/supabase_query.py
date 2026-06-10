import urllib.request, json

req = urllib.request.Request(
    "https://peyujymnlntxqygrhqlw.supabase.co/rest/v1/tenants?select=id,name,subdomain,phone&limit=10",
    headers={
        "apikey": "sb_publishable_pycB3gYCVS3bbRezQK4glg_cy_KlZZv",
        "Authorization": "Bearer sb_secret_ebELaC5W6rXNjC7Ot39Dcw_4X39zDaS"
    }
)
resp = urllib.request.urlopen(req)
data = json.loads(resp.read())
print("=== TENANTS ===")
print(json.dumps(data, indent=2))

# Also query whatsapp_tenant_mappings
req2 = urllib.request.Request(
    "https://peyujymnlntxqygrhqlw.supabase.co/rest/v1/whatsapp_tenant_mappings?select=*&limit=10",
    headers={
        "apikey": "sb_publishable_pycB3gYCVS3bbRezQK4glg_cy_KlZZv",
        "Authorization": "Bearer sb_secret_ebELaC5W6rXNjC7Ot39Dcw_4X39zDaS"
    }
)
resp2 = urllib.request.urlopen(req2)
mappings = json.loads(resp2.read())
print("\n=== WHATSAPP_TENANT_MAPPINGS ===")
print(json.dumps(mappings, indent=2))
