@echo off
cd /d "D:\SENDMEPRO\PROYECTOS\SENDME STUDIO\Salon_Belleza"
if %errorlevel% neq 0 (
  echo ERROR: cd failed
  exit /b 1
)
node -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();(async()=>{const t=await p.tenant.findMany({select:{id:true,name:true,subdomain:true,phone:true}});const m=await p.whatsAppTenantMapping.findMany();process.stdout.write(JSON.stringify({tenants:t,mappings:m},null,2));await p.$disconnect()})()" 2>nul
