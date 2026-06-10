-- AlterTable: Add template fields to tenants
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "template_id" TEXT,
ADD COLUMN IF NOT EXISTS "template_version" TEXT;

-- CreateTable: vertical_templates
CREATE TABLE IF NOT EXISTS "vertical_templates" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'v1',
    "vertical" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT NOT NULL DEFAULT '',
    "config" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "vertical_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "vertical_templates_slug_key" ON "vertical_templates"("slug");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "vertical_templates_vertical_is_active_idx" ON "vertical_templates"("vertical", "is_active");

-- CreateTable: tenant_config_backups
CREATE TABLE IF NOT EXISTS "tenant_config_backups" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "template_id" UUID,
    "version" TEXT NOT NULL DEFAULT 'v1',
    "snapshot" JSONB NOT NULL DEFAULT '{}',
    "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tenant_config_backups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "tenant_config_backups_tenant_id_idx" ON "tenant_config_backups"("tenant_id");

-- AddForeignKey
ALTER TABLE "tenant_config_backups" ADD CONSTRAINT "tenant_config_backups_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_config_backups" ADD CONSTRAINT "tenant_config_backups_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "vertical_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
